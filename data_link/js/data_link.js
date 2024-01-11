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

class dataLink {

  constructor() {
    this.source = {};
    for (let name of DATA_SOURCES) {
      if (config.get('data_sources.' + name + '.enabled', true)) {
        let source = new (require(path.join(SOURCES_DIR, name)));
        this.source[source.name] = source;
      }
    }
    this.catalog = new data_catalog(tools.getDataDir());
    this.loadAllUserCatalogs();

    this.loadSourceCatalogs();
    this.dataResume();
  }

  loadAllUserCatalogs() {
    log.info(`Loading local catalogs`);
    let users = tools.getSubDirs(tools.getDataDir());
    const catalog = this.catalog.getCatalog();
    for (const user of users) {
      catalog[user] = {};
      if (! this.catalog.loadUserCatalog(user, tools.getUserCatalogFile(user))) {
        this.rebuildLocalCatalog(user);
      }
    }
  }

  // rebuilds a user catalog file
  async rebuildLocalCatalog(user) {
    let data_dir = path.join(tools.getDataDir(), user);
    let sources = tools.getSubDirs(data_dir);

    for (let i in sources) {
      let source = sources[i];
      while (! this.source[source].catalog) {
        await new Promise(r => setTimeout(r, 2000));
      }
      let ids = tools.getSubDirs(path.join(data_dir, source));
      for (let j in ids) {
        const fields = {
          source_size: this.source[source].getEntrySize(id),
          status: status.completed
        };
        if (this.source[source] && this.catalog.addEntry(user, source, ids[j], fields)) {
          log.info(`Added ${user}/${source}/${ids[j]} to the catalog`);
        } else {
          log.error(`rebuildLocalCatalog - Unable to rebuild catalog for ${user}/${source}/${ids[j]}`);
        }
      }
    }
  }

  loadSourceCatalogs() {
    for (let i in this.source) {
      let name = this.source[i].name;
      this.source[i].loadCatalog();
    }
  }

  getAllSources() {
    let sources = {};
    for (const source of Object.keys(this.source)) {
      sources[source] = this.getSource(source);
    }
    return sources;
  }

  getSource(id) {
    let result = this.hasSource(id);
    if (result !== true) {
      return result;
    }

    const source = this.source[id];
    return {
      'description': source.description,
      'url': source.url,
      'catalog_size': source.catalog_size,
      'status': source.status
    };
  }

  getSourceCatalog(id) {
    let result = this.hasSource(id);
    if (result !== true) {
      return result;
    }

    if (this.source[id].catalog) {
      return this.source[id].catalog;
    }

    return tools.errorMsg('No catalog available', 404);
  }

  getAllSourceCatalogs() {
    let catalogs = {};
    for (const [name, source] of Object.entries(this.source)) {
      catalogs[source.name] = source.catalog;
    }
    return catalogs;
  }

  async searchSourceCatalog(pdb) {
    // check if id matches pdb indentifier format (4 alphanumberic characters)
    if (! pdb.match(/^[a-z0-9]{4}$/)) {
      return tools.errorMsg(`Invalid PDB identifier`, 400);
    }

    let results = [];
    for (const [, source] of Object.entries(this.source)) {
      for (const [id, e] of Object.entries(source.catalog)) {
        if (e.pdb == pdb ) {
          results.push({ source: source.name, id: id, doi: e.doi, desc: e.desc });
        }
      }
    }
    let obj = {}, pdb_info;
    obj.results = results;
    if (config.get('other.rcsb_results', true)) {
      pdb_info = await rcsb.getEntry(pdb);
      obj.pdb = pdb_info;
    }
    return obj;
  }

  updateSourceCatalog(name) {
    let result = this.hasSource(name);
    if (result !== true) {
      return result;
    }

    if (this.source[name].status === status.inProgress) {
      return tools.successMsg(`${name} - Catalog update already in progress`);
    }

    if (this.source[name].updateCatalog()) {
      return tools.successMsg(`${name} - Updating catalog`);
    }

    return tools.errorMsg(`${name}: Error updating catalog`, 500);
  }

  updateAllSourceCatalogs() {
    let sources = [];
    for (const [name, source] of Object.entries(this.source)) {
      if (source.status !== status.inProgress) {
        if (source.updateCatalog()) {
          sources.push(name);
        }
      }
    }
    return tools.successMsg(`Updating catalog(s): ${sources.join(', ')}`);
  }

  hasSource(source) {
    if (! this.source[source]) {
      return tools.errorMsg(`${source} data source not found`, 404);
    }
    return true;
  }

  hasSourceEntry(source, id) {
    // check if the source exists
    let result = this.hasSource(source);
    if (result !== true) {
      return result;
    }
    // check if the source catalog entry exists
    if (! this.source[source].catalog[id]) {
      return tools.errorMsg(`${source} - ${id} not found in catalog`, 404);
    }
    return true;
  }

  async dataResume () {
    const catalog = this.catalog.getCatalog();
    for (const user in catalog) {
      for (const source in catalog[user]) {
        // skip if the data source is not available
        if (! this.source[source]) {
          continue;
        }
        // wait for the data source catalog to become available
        while (! this.source[source].catalog) {
          await new Promise(r => setTimeout(r, 2000));
        }
        // check if any entries are in progress, and reacquire/continue
        for (const [id, entry] of Object.entries(catalog[user][source])) {
          if (entry.status === status.inProgress) {
            this.dataAcquire(user, source, id, true);
          }
        }
      }
    }
  }

  dataAcquire(user, source, id, force = false) {
    id = id.toLowerCase();
    let result = this.hasSourceEntry(source, id);
    if (result !== true) {
      return result;
    }

    if (this.catalog.hasEntry(user, source, id) && ! force) {
      let st = this.catalog.getStatus(user, source, id);
      // check if in progress
      if (st === status.inProgress) {
        return tools.successMsg(`${source} - Data acquire for ${user}/${source}/${id} already in progress`);
      }

      // check if already acquired
      if (st === status.completed && fs.existsSync(tools.getDataDest(user, source, id))) {
        log.info(`${source} - ${user}/${source}/${id} already exists`);
        return tools.successMsg(`${source}: ${user}/${source}/${id} already exists`);
      }
    }

    // prune old data if required
    this.dataPrune(config.get('storage.data_free_gb', 100));

    // add a catalog entry for the user setting the status to in_progress
    const fields = {
      source_size: this.source[source].getEntrySize(id),
      status: status.inProgress
    }
    if (this.catalog.addEntry(user, source, id, fields)) {
      log.info(`${source} - Acquiring ${user}/${source}/${id} - size ${this.source[source].getEntrySize(id)}`);
      // acquire the data from the data source
      if (this.source[source].acquire(user, id, this.catalog, force)) {
        this.dataSizeProgress(user, source, id);
        return tools.successMsg(`${source}: Acquiring ${user}/${source}/${id}`);
      }
    }

    return tools.errorMsg(`${source}: Error acquiring ${user}/${source}/${id}`, 500);
  }

  dataStatus(user, source, id) {
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

  dataRemove(user, source, id) {
    if (! this.catalog.hasEntry(user, source, id)) {
      return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
    }

    let st = this.catalog.getStatus(user, source, id);
    if (st === status.inProgress) {
      log.info(`dataRemove - Aborting ${user}/${source}/${id}`);
      let job = this.source[source].getJob(user, id);
      if (job) {
        this.catalog.updateEntry(user, source, id, { status: status.failed });
        job.abort();
      }
    }

    if (this.catalog.removeEntry(user, source, id)) {
      return tools.successMsg(`${source}: Removed ${id} for ${user}`);
    }

    return tools.errorMsg(`${source}: Unable to remove ${id} for ${user}`, 405);
  }

  async dataSizeProgress(user, source, id) {
    const catalog = this.catalog;
    while (catalog.hasEntry(user, source, id) && catalog.getStatus(user, source, id) === status.inProgress) {
      this.catalog.updateEntry(user, source, id, {
        size: this.catalog.getStorageSize(user, source, id)
      });
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  async dataPrune(min_free_gb) {
    const GB = 1000000000;
    const MB = 1000000;
    const min_free = min_free_gb * GB;
    const free = tools.getFreeSpace(tools.getDataDir(), '1');

    if (free === false) {
      return;
    }

    if (free >= min_free) {
      return;
    }

    const size_to_free = min_free - free;

    let entries = [];
    const catalog = this.catalog.getCatalog();
    // build up list of data that is not in use by age
    for (const user in catalog) {
      for (const source in catalog[user]) {
        for (const id in catalog[user][source]) {
          const e = catalog[user][source][id];
          if (! e.in_use && e.status === status.completed) {
            entries.push( {
              date: e.last_access,
              user: user,
              source: source,
              id: id,
              size: e.size
            });
          }
        }
      }
    }

    entries.sort(function(a,b) {
      return new Date(a.date) - new Date(b.date);
    });

    let size = 0;
    for (const e of entries) {
      if (this.catalog.removeEntry(e.user, e.source, e.id)) {
        log.info(`dataPrune - removed ${e.user}/${e.source}/${e.id} - size ${e.size}`);
        size += e.size;
        if (size >= size_to_free) {
          break;
        }
      }
    }
    const size_mb = Math.ceil(size / MB);
    const size_to_free_mb = Math.ceil(size_to_free / MB);
    if (size > 0) {
      log.info(`dataPrune - Removed ${size_mb} MB of required ${size_to_free_mb} MB`);
    }
  }

  dataUpdate(user, source, id, obj) {
    if (! this.catalog.hasEntry(user, source, id)) {
      return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
    }

    const entry = this.catalog.getEntry(user, source, id);
    if (entry.status !== status.completed) {
      return tools.errorMsg(`${user}/${source}/${id} is not completed so cannot update`, 405);
    }

    let valid = {};
    for (const [key, value] of Object.entries(obj)) {
      switch(key) {
        case 'in_use':
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

    let result = this.catalog.updateEntry(user, source, id, valid)
    if (result !== true) {
      return result;
    }

    const fields = Object.keys(valid).join(',');
    return tools.successMsg(`Updated fields ${fields}`);
  }

}

module.exports = dataLink;

