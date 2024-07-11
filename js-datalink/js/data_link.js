'use strict';

const fs = require('fs');
const path = require('path');

const data_catalog = require('./data_catalog.js');
const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');
const rcsb = require('./rcsb.js');

const SOURCES_DIR = path.join(__dirname, 'sources');

const DATA_SOURCES = [
  'pdbj',
  'sbgrid',
  'irrmc'
]

const GB = 1000000000;
const MB = 1000000;

class dataLink {

  constructor(server_mode = true) {
    this.server_mode = server_mode;
    this.ds = {};
    this.jobs = {};

    this.catalog = new data_catalog(tools.getDataDir(), config.get('storage.catalogs_with_data'));

    // data pruning config
    this.data_free_gb = config.get('storage.data_free_gb');
    this.data_max_days = config.get('storage.data_max_days');

    // load data source classes
    for (let name of DATA_SOURCES) {
      if (config.get('data_sources.' + name + '.enabled')) {
        let source = require(path.join(SOURCES_DIR, name));
        this.jobs[name] = {};
        this.ds[name] = new source(tools.getDataDir(), tools.getCatalogDir(), this.jobs[name]);
      }
    }

    this.loadAllUserCatalogs();

    this.loadSourceCatalogs();

    // if we are running in server mode set up the data pruning jobs
    if (this.server_mode) {
      this.dataPruneInit(config.get('storage.data_prune_mins'))
    }

    process.on('error', (err) => {
      log.error(err);
      log.error(err.stack);
    });
  }

  abortAllJobs() {
    for (const job_ids of Object.values(this.jobs)) {
      for (const job of Object.values(job_ids)) {
        job.controller.abort();
      }
    }
  }

  loadAllUserCatalogs() {
    log.info(`Loading local catalogs`);
    const users = tools.getSubDirs(tools.getDataDir());
    if (! users) {
      return;
    }
    const catalog = this.catalog.getCatalog();
    for (const user of users) {
      if (! this.catalog.loadUserCatalog(user)) {
        this.rebuildLocalCatalog(user);
      }
    }
  }

  // rebuilds a user catalog file
  async rebuildLocalCatalog(user) {
    let data_dir = path.join(tools.getDataDir(), user);
    let sources = tools.getSubDirs(data_dir);

    for (const source of sources) {
      if (! this.ds[source]) {
        continue;
      }
      log.info(`Rebuilding catalog for ${user}/${source}`);
      while (! this.ds[source].catalog) {
        await new Promise(r => setTimeout(r, 2000));
      }
      let ids = tools.getSubDirs(path.join(data_dir, source));
      for (let j in ids) {
        let entry = this.addEntryFromSource(user, source, ids[j], status.completed);
        if (entry !== false) {
          this.catalog.updateEntrySize(entry);
          log.info(`Added ${user}/${source}/${ids[j]} to the catalog`);
        } else {
          log.error(`rebuildLocalCatalog - Unable to rebuild catalog for ${user}/${source}/${ids[j]}`);
        }
      }
    }
  }

  loadSourceCatalogs() {
    for (let name in this.ds) {
      this.ds[name].loadCatalog();
    }
  }

  dataPruneInit(mins) {
    // prune manage and unmanaged datalink data
    if (mins > 0) {
      log.info(`Configured to prune data older than ${this.data_max_days} day(s) every ${mins} min(s) and when free space is less than ${this.data_free_gb}GB`);
      setInterval(this.catalog.pruneData.bind(this.catalog), mins * 1000 * 60, this.data_free_gb, this.data_max_days);
      // run inital data prune
      this.catalog.pruneData(this.data_free_gb, this.data_max_days);
    } else {
      log.info(`Configured to not prune old data`);
    }
  }

  getAllSources() {
    const sources = {};
    for (const name of Object.keys(this.ds)) {
      sources[name] = this.getSource(name);
    }
    return sources;
  }

  getSource(id) {
    let result = this.hasSource(id);
    if (result !== true) {
      return result;
    }

    const source = this.ds[id];
    return {
      'description': source.description,
      'url': source.url,
      'catalog_size': source.catalog_size,
      'catalog_status': source.catalog_status
    };
  }

  getSourceCatalog(id) {
    let result = this.hasSource(id);
    if (result !== true) {
      return result;
    }

    if (this.ds[id].catalog) {
      return this.ds[id].catalog;
    }

    return tools.errorMsg('No catalog available', 404);
  }

  getAllSourceCatalogs() {
    const catalogs = {};
    for (const [name, source] of Object.entries(this.ds)) {
      catalogs[source.name] = source.catalog;
    }
    return catalogs;
  }

  addEntryFromSource(user, source, id, st = status.inProgress) {
    const f = {};
    if (this.ds[source]) {
      const ds = this.ds[source].getEntry(id);
      // add a catalog entry for the user setting the status to in_progress
      f.pdb = ds.pdb;
      f.name = ds.name;
      f.doi = ds.doi;
      f.size_s = ds.size;
    }
    f.status = st;
    return this.catalog.addEntry(user, source, id, f);
  }

  async searchSourceCatalogs(field, search) {
    if (search === undefined || search === '') {
      return tools.errorMsg(`Empty or invalid search string`, 400);
    }

    let pdb = null;

    // default search field to pdb if not set
    if (field === undefined || field === '') {
      field = 'pdb';
    }

    switch(field) {
      case 'pdb':
        search = search.toLowerCase();
        // check if id matches pdb indentifier format (4 alphanumberic characters)
        if (! search.match(/^[a-z0-9]{4}$/)) {
          return tools.errorMsg(`Invalid PDB identifier`, 400);
        }
        pdb = search;
        break;
      case 'doi':
        break;
      default:
        return tools.errorMsg(`Unknown search field ${field}`, 400);
    }

    let results = [];
    // loop through data sources
    for (const source of Object.values(this.ds)) {
      // if the source has a catalog
      if (source.catalog) {
        // loop through catalog entries
        for (const [id, e] of Object.entries(source.catalog)) {
          if (e[field] && e[field] == search ) {
            results.push({ source: source.name, id: id, doi: e.doi, name: e.name, pdb: e.pdb });
          }
        }
      }
    }

    let obj = {}, pdb_info;
    obj.results = results;

    // add rcsb results if enabled in config
    if (config.get('other.rcsb_results')) {
      // if we don't have a pdb identifier (when not searching for pdb identifier), try and get it from the results
      if (! pdb && results.length > 0 && results[0].pdb) {
        pdb = results[0].pdb;
      }

      // if there is a pdb identifier do the rcsb API call
      if (pdb) {
        pdb_info = await rcsb.getEntry(pdb);
        obj.pdb = pdb_info;
      }

    }
    return obj;
  }

  updateSourceCatalog(name) {
    let result = this.hasSource(name);
    if (result !== true) {
      return result;
    }

    this.ds[name].updateCatalog();

    return tools.successMsg(`${name} - Updating catalog`);
  }

  updateAllSourceCatalogs() {
    let sources = [];
    for (const [name, source] of Object.entries(this.ds)) {
      source.updateCatalog();
      sources.push(name);
    }
    return tools.successMsg(`Updating catalog(s): ${sources.join(', ')}`);
  }

  hasSource(source) {
    if (! this.ds[source]) {
      return tools.errorMsg(`${source} data source not found`, 404);
    }
    return true;
  }

  async waitForCatalog(source) {
    while (! this.ds[source].catalog) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  async resumeData () {
    const catalog = this.catalog.getCatalog();
    for (const user in catalog) {
      for (const source in catalog[user]) {
        // skip if the data source is not available
        if (! this.ds[source]) {
          continue;
        }
        await this.waitForCatalog(source);
        // check if any entries are in progress, and refetch/continue
        for (const [id, entry] of Object.entries(catalog[user][source])) {
          if (entry.status === status.inProgress) {
            this.fetchData(user, source, id, true);
          }
        }
      }
    }
  }

  fetchData(user, source, id, force = ! this.server_mode) {
    if (! tools.validUserName(user) && ! this.server_mode) {
      return tools.errorMsg(`Invalid user name`, 400);
    }

    // make sure the id is lowercase
    id = id.toLowerCase();

    // check if the source exists
    const has_source = this.hasSource(source);
    if (has_source !== true) {
      return has_source;
    }

    // check if the source catalog is ready
    if (! this.ds[source].catalog) {
      return tools.errorMsg(`${source} - data source catalog not ready`, 503);
    }

    // check if the source catalog entry exists
    if (! this.ds[source].getEntry(id)) {
      return tools.errorMsg(`${source} - ${id} not found in catalog`, 404);
    }

    let entry = this.catalog.getEntry(user, source, id);
    // if we have an entry, check on the status
    if (entry && ! force) {
      // check if already fetched
      if (entry.status === status.completed && fs.existsSync(this.catalog.getDataDest(user, source, id))) {
        return tools.successMsg(`${source} - ${user}/${source}/${id} already exists`);
      }

      // check if in progress
      if (entry.status === status.inProgress) {
        return tools.successMsg(`${source} - Data fetch for ${user}/${source}/${id} already in progress`);
      }
    }

    // add a new or replace user catalog entry
    entry = this.addEntryFromSource(user, source, id);
    if (entry === false) {
      return tools.errorMsg(`${source} - Error fetching ${user}/${source}/${id}`, 500);
    }

    this.ds[source].setErrorCallback((entry, err) => {
      this.dataError(entry);
      log.error(`${source} - Failed to fetch ${user}/${source}/${id} - ${err}`);
    });

    this.ds[source].setCompleteCallback((entry) => {
      this.dataComplete(entry);
      log.info(`${source} - Fetched ${user}/${source}/${id} - size ${entry.size}`);
    });

    // fetch the data from the data source
    this.ds[source].fetchData(entry);

    return tools.successMsg(`${source} - Fetching ${user}/${source}/${id}`);
  }

  dataComplete(entry) {
    const fields = {
      status: status.completed,
      size: this.catalog.getStorageSize(entry)
    };
    this.catalog.updateEntry(entry, fields);
  }

  dataError(entry) {
    // check if we have an entry (eg. in case the fetch was aborted due to a catalog deletion)
    if (entry) {
      this.catalog.updateEntry(entry, { status: status.failed });
    }
  }

  uploadData(entry, in_s, file) {
    return new Promise((resolve, reject) => {
      // make sure there is a filename set
      if (file === undefined) {
        this.dataError(entry);
        reject(tools.errorMsg(`No filename supplied in upload data`, 400));
      }

      // make sure the file (which can include a path), is valid and not an absolute path
      file = tools.sanitizeFilename(file);

      // add the data destination path
      const dest_file = path.join(tools.getDataDir(), entry.dir, file);
      const dest_dir = path.dirname(dest_file);

      // make the directory if needed
      try {
        fs.mkdirSync(dest_dir, { recursive: true });
      } catch (err) {
        reject();
      }

      // create output stream
      const out_s = fs.createWriteStream(dest_file);

      let limit_mb = config.get('data_sources.upload.limit_mb');
      let limit = limit_mb * MB;

      in_s.on('data', (data) => {
        entry.size += data.length;
        if (entry.size >= limit) {
          reject(tools.errorMsg(`Upload for ${entry.dir} has reached maximum of ${limit_mb} MB`, 400));
        }
      });

      out_s.on('finish', () => {
        log.debug(`uploadData - Added ${file} to ${entry.dir}`);
        this.uploadDataUnpack(entry, file);
        resolve();
      });

      out_s.on('error', (err) => {
        reject(tools.errorMsg(`Error adding to ${entry.dir}`, 500));
      });

      // pipe input stream to output stream
      in_s.pipe(out_s);
    });
  }

  async uploadDataUnpack(entry, file) {
    const file_path = path.join(tools.getDataDir(), entry.dir, file);
    const dest_dir = path.dirname(file_path);

    // check if the file is packed and unpack if needed
    const {cmd, args} = tools.getUnpackCmd(file_path, dest_dir);
    if (cmd) {
      log.info(`uploadData - Unpacking ${file}`);
      try {
        await tools.unpack(file_path, dest_dir, cmd, args);
        log.info(`uploadData - Unpacked ${file}`);
      } catch(err) {
        log.error(`uploadData - ${err}`);
      }
    }
  }

  getDataStatus(user, source, id) {
    let catalog = this.catalog.getCatalog();

    // Check if user, source and id are set and valid and return correct part of local data catalog
    if (user) {
      if (this.catalog.getCatalog()[user]) {
        catalog = catalog[user];
        if (source) {
          if (catalog[source]) {
            catalog = catalog[source];
          } else {
            return tools.errorMsg(`User data ${user}/${source} not found`, 404);
          }
          if (id) {
            if (catalog[id]) {
              catalog = catalog[id];
            } else {
              return tools.errorMsg(`User data ${user}/${source}/${id} not found`, 404);
            }
          }
        }
      } else {
        return tools.errorMsg(`User data ${user} not found`, 404);
      }
    }

    return catalog;
  }

  removeData(user, source, id) {
    const entry = this.catalog.getEntry(user, source, id);
    if (! entry) {
      return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
    }

    let st = entry.status;
    if (st === status.inProgress) {
      log.info(`removeData - Aborting ${user}/${source}/${id}`);
      // if the data source has jobs then abort/remove all jobs
      if (this.ds[source]) {
        this.ds[source].removeJob(entry);
        this.catalog.updateEntry(entry, { status: status.failed });
      }
    }

    if (this.catalog.removeEntry(user, source, id)) {
      return tools.successMsg(`${source} - Removed ${id} for ${user}`);
    }

    return tools.errorMsg(`${source} - Unable to remove ${id} for ${user}`, 405);
  }

  updateData(user, source, id, obj) {
    const entry = this.catalog.getEntry(user, source, id);
    if (! entry) {
      return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
    }

    if (entry.status !== status.completed) {
      return tools.errorMsg(`${user}/${source}/${id} is not completed so cannot update`, 405);
    }

    let valid = {};
    for (let [key, value] of Object.entries(obj)) {
      switch(key) {
        case 'in_use':
          if (typeof value === 'string') {
            value = value.toLowerCase();
            if (value === 'true' || value === '1') {
              value = true;
            }
            if (value === 'false' || value === '0') {
              value = false;
            }
          }
          if (typeof value !== 'boolean') {
            return tools.errorMsg(`${key} should be set to true or false`, 400);
          }
          break;
        default:
          return tools.errorMsg(`${key} is not a valid field`, 400);
          break;
      }
      valid[key] = value;
    }

    if (Object.keys(valid).length === 0) {
      return tools.errorMsg(`No valid fields found to update`, 400);
    }

    if (! this.catalog.updateEntry(entry, valid)) {
      return tools.errorMsg(`Unable to update entry ${user}/${source}/${id}`, 500);
    }

    return tools.successMsg(`Updated fields ${Object.keys(valid).join(',')}`);
  }

  getDataStats() {
    let data_stats = this.catalog.getStats();
    data_stats.size_gb = (data_stats.size / GB).toFixed(2);

    let free = tools.getFreeSpace(tools.getDataDir(), '1');
    let data_free = this.data_free_gb * GB;

    // get free disk space
    data_stats.free_space = free;
    data_stats.free_space_gb = (data_stats.free_space / GB).toFixed(2);

    // get free disk space minus amount to leave free from config
    data_stats.usable_space = free - data_free;
    data_stats.usable_space_gb = (data_stats.usable_space / GB).toFixed(2);

    return {
      data_stats: data_stats
    }
  }

}

module.exports = dataLink;
