#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

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
    this.catalog = {};
    this.loadLocalCatalogs();
    this.loadSourceCatalogs();
    this.dataResume();
  }

  loadLocalCatalogs() {
    log.info(`Loading local catalogs`);
    let data_dir = tools.getDataDir();
    let users = tools.getSubDirs(data_dir);

    for (let i in users) {
      let user = users[i];
      try {
        let json = fs.readFileSync(tools.getUserCatalogFile(user));
        this.catalog[user] = JSON.parse(json);
      } catch (err) {
        // if the file isn't found then regenerate it as best we can
        if (err.code == "ENOENT") {
          this.rebuildLocalCatalog(user);
        } else {
          log.error(err);
        }
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
        if (this.source[source] && this.addCatalogEntry(user, source, ids[j], status.completed)) {
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
      return tools.successMsg(`Updating catalog: ${name}`);
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
    for (let user in this.catalog) {
      for (let source in this.catalog[user]) {
        while (! this.source[source].catalog) {
          await new Promise(r => setTimeout(r, 2000));
        }
        for (let id in this.catalog[user][source]) {
          let entry = this.catalog[user][source][id];
          if (entry.status == status.inProgress) {
            this.source[source].aquire(user, id, this, true);
          }
        }
      }
    }
  }

  dataAquire(user, source, id, force = false) {
    id = id.toLowerCase();
    let result = this.hasSourceEntry(source, id);
    if (result !== true) {
      return result;
    }

    let st = this.getCatalogStatus(user, source, id);
    // check if in progress
    if (st == status.inProgress) {
      return tools.successMsg(`${source} - Data download for ${user}/${source}/${id} already in progress`);
    }

    // check if already downloaded
    if (! force && st === status.completed && fs.existsSync(tools.getDataDest(user, source, id))) {
      log.info(`${source} - ${user}/${source}/${id} is already downloaded`);
      return tools.successMsg(`${source}: ${user}/${source}/${id} is already downloaded`);
    }

    // prune old data if required
    this.dataPrune(config.get('storage.data_free_gb'));

    // aquire the data from the data source
    if (this.source[source].aquire(user, id, this, force)) {
      return tools.successMsg(`${source}: Downloading ${user}/${source}/${id}`);
    }

    return tools.errorMsg(`${source}: Error initialising download`, 500);
  }

  dataStatus(user = '', source = '', id = '') {
    let catalog = this.catalog;

    // Check if user, source and id are set and valid and return correct part of local data catalog
    if (user) {
      if (this.catalog[user]) {
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
    let result = this.hasCatalogEntry(user, source, id);
    if (this.hasCatalogEntry(user, source, id) !== true) {
      return result;
    }

    let st = this.getCatalogStatus(user, source, id);
    if (st === status.inProgress) {
      return tools.errorMsg(`${source}: Can't remove as download for ${user}/${source}/${id} is in progress`);
    }

    if (this.source[source].remove(user, id, this.catalog)) {
        this.removeCatalogEntry(user, source, id);
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
    // build up list of data that is not in use by age
    for (const user in this.catalog) {
      for (const source in this.catalog[user]) {
        for (const id in this.catalog[user][source]) {
          let e = this.catalog[user][source][id];
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

  getCatalogStatus(user, source, id) {
    if (this.hasCatalogEntry(user, source, id) !== true) {
      return false;
    }
    return this.catalog[user][source][id].status;
  }

  createUserEntry(user, source) {
    // if there is no catalog for the user, create one
    if (!this.catalog[user]) {
      this.catalog[user] = {};
    }

    // if source doesn't exist for the user, create it
    if (!this.catalog[user][source]) {
      this.catalog[user][source] = {};
    }
  }

  addCatalogEntry(user, source, id, status) {
    this.createUserEntry(user, source);

    let entry = {
      'last_access': new Date().toISOString(),
      'size': this.getLocalDataSize(user, source, id),
      'source_size': this.source[source].getCatalogIdSize(id),
      'status': status,
      'in_use': false
    }

    // add the catalog entry
    this.catalog[user][source][id] = entry;

    return tools.saveUserCatalog(user, this.catalog[user]);
  }

  hasCatalogEntry(user, source, id) {
    if (this.catalog[user] && this.catalog[user][source] && this.catalog[user][source][id]) {
      return true;
    }
    return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
  }

  updateCatalogEntry(user, source, id, fields) {
    let result = this.hasCatalogEntry(user, source, id);
    if (this.hasCatalogEntry(user, source, id) !== true) {
      return result;
    }

    let entry = this.catalog[user][source][id];
    for (let [key, value] of Object.entries(fields)) {
      entry[key] = value;
    }
    entry.last_access = new Date().toISOString();
    return tools.saveUserCatalog(user, this.catalog[user]);
  }

  removeCatalogEntry(user, source, id) {
    let result = this.hasCatalogEntry(user, source, id);
    if (this.hasCatalogEntry(user, source, id) !== true) {
      return result;
    }

    delete this.catalog[user][source][id];
    tools.saveUserCatalog(user, this.catalog[user]);
    return true;
  }

  getLocalDataSize(user, source, id) {
    let dir = path.join(tools.getDataDir(), user, source, id);
    try {
      if (fs.existsSync(dir)) {
        return tools.getDirSize(dir);
      } else {
        return 0;
      }
    } catch (err) {
      log.error(err);
      return 0;
    }
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

    let result = this.updateCatalogEntry(user, source, id, valid)
    if (result !== true) {
      return result;
    }

    const fields = Object.keys(valid).join(',');
    return tools.successMsg(`Updated fields ${fields}`);
  }

}

module.exports = dataLink;

