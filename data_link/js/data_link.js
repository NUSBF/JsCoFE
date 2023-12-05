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
      if (config.get('data_sources.' + name + '.enabled')) {
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
          log.error(`Unable to rebuild catalog for ${user}/${source}/${ids[j]}`);
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
    let pdb_info = await rcsb.getEntry(pdb);
    return { results: results, pdb: pdb_info };
  }

  updateSourceCatalog(name) {
    let result = this.hasSource(name);
    if (result !== true) {
      return result;
    }

    if (this.source[name].status === status.inProgress) {
      return tools.successMsg(`${name} - Catalog download already in progress`);
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
    for (let user in this.catalog.getCatalog()) {
      for (let source in this.catalog.getCatalog()[user]) {
        while (! this.source[source].catalog) {
          await new Promise(r => setTimeout(r, 2000));
        }
        for (let id in this.catalog.getCatalog()[user][source]) {
          let entry = this.catalog.getCatalog()[user][source][id];
          if (entry.status == status.inProgress) {
            this.source[source].acquire(user, id, this.catalog, true);
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

    let st = this.catalog.getStatus(user, source, id);
    // check if in progress
    if (st == status.inProgress) {
      return tools.successMsg(`${source} - Data download for ${user}/${source}/${id} already in progress`);
    }

    // check if already downloaded
    if (! force && st === status.completed && fs.existsSync(tools.getDataDest(user, source, id))) {
      log.info(`${source} - ${user}/${source}/${id} already exists`);
      return tools.successMsg(`${source}: ${user}/${source}/${id} already exists`);
    }

    // prune old data if required
    this.dataPrune(config.get('storage.data_free_gb'));

    // add a catalog entry for the user setting the status to in_progress
    const fields = {
      source_size: this.source[source].getEntrySize(id),
      status: status.inProgress
    }
    if (this.catalog.addEntry(user, source, id, fields)) {
      log.info(`${source} - Acquiring ${user}/${source}/${id} - size ${this.source[source].getEntrySize(id)}`);
      // acquire the data from the data source
      if (this.source[source].acquire(user, id, this.catalog, force)) {
        return tools.successMsg(`${source}: Acquiring ${user}/${source}/${id}`);
      }
    }

    return tools.errorMsg(`${source}: Error initialising download`, 500);
  }

  dataStatus(user = '', source = '', id = '') {
    let catalog = this.catalog.getCatalog();

    // Check if user, source and id are set and valid and return correct part of local data catalog
    if (user) {
      if (this.catalog.getCatalog()[user]) {
        catalog = catalog[user];
        if (source) {
          if (catalog[source]) {
            catalog = catalog[source];
          } else {
            catalog = null;
          }
          if (id) {
            if (catalog[id]) {
              catalog = catalog[id];
            } else {
              catalog = null;
            }
          }
        }
      } else {
        catalog = null;
      }
    }

    if (catalog) {
      return catalog;
    }

    return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
  }

  dataRemove(user, source, id) {
    let result = this.catalog.hasEntry(user, source, id);
    if (this.catalog.hasEntry(user, source, id) !== true) {
      return result;
    }

    let st = this.catalog.getStatus(user, source, id);
    if (st === status.inProgress) {
      return tools.errorMsg(`${source}: Can't remove as download for ${user}/${source}/${id} is in progress`);
    }

    if (this.source[source].remove(user, id, this.catalog.getCatalog())) {
        this.catalog.removeEntry(user, source, id);
        return tools.successMsg(`${source}: Removed ${id} for ${user}`);
    }

    return tools.errorMsg(`${source}: Unable to remove ${id} for ${user}`, 405);
  }

  async dataPrune(min_free_gb) {
    let free_gb = tools.getFreeSpace(tools.getDataDir(), '1G');
    if (free_gb === false) {
      return;
    }

    if (free_gb > min_free_gb) {
      return;
    }

    let size_to_free = min_free_gb - free_gb;

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
      this.dataRemove(e.user, e.source, e.id);
      size += Math.floor(e.size / (1024 * 1024 * 1024));
      if (size >= size_to_free) {
        break;
      }
    }
    log.info(`dataPrune - Removed ${size} of required ${size_to_free}`);
  }

  dataUpdate(user, source, id, obj) {
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

