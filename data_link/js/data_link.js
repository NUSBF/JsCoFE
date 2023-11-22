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
      while (this.source[source].hasCatalog && ! this.source[source].catalog) {
        await new Promise(r => setTimeout(r, 2000));
      }
      let ids = tools.getSubDirs(path.join(data_dir, source));
      for (let j in ids) {
        if (this.source[source] && this.addCatalogEntry(user, source, ids[j], 'ready', catalog)) {
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

  getSources() {
    let sources = {};
    for (let i in this.source) {
      let has_catalog = 0;
      sources[this.source[i].name] = {
        'description': this.source[i].description,
        'url': this.source[i].url,
        'has_catalog': this.source[i].hasCatalog(),
        'catalog_size': this.source[i].catalog_size,
        'status': this.source[i].status
      };
    }
    return sources;
  }

  getSourceCatalog(name) {
    if (this.source[name]) {
      if (this.source[name].catalog) {
        return this.source[name].catalog;
      } else {
        return tools.infoMsg('No catalog available');
      }
    } else {
      return tools.errorMsgNoSource();
    }
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
      return tools.errorMsg(`Invalid PDB identifier`);
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
    if (! this.source[name]) {
      return tools.errorMsgNoSource();
    }

    if (this.source[name].status === status.inProgress) {
      return tools.successMsg(`${name} - Catalog download already in progress`);
    }

    if (! this.source[name].hasCatalog()) {
      return tools.errorMsg(`No catalog available`);
    }

    if (this.source[name].updateCatalog()) {
      return tools.successMsg(`Updating catalog: ${name}`);
    } else {
      return tools.errorMsg(`${name}: Error updating catalog`);
    }

  }

  updateAllSourceCatalogs() {
    let sources = [];
    for (const [name, source] of Object.entries(this.source)) {
      if (source.hasCatalog() && source.status !== status.inProgress) {
        if (source.updateCatalog()) {
          sources.push(name);
        }
      }
    }
    return tools.successMsg(`Updating catalog(s): ${sources.join(', ')}`);
  }

  isValidRequest(user, source, id) {
    if (! this.source[source].hasCatalogId(id)) {
      return tools.errorMsg(`${source} - ${id} not found in catalog`);
    }
    return true;
  }

  async dataResume () {
    for (let user in this.catalog) {
      for (let source in this.catalog[user]) {
        while (this.source[source].hasCatalog() && ! this.source[source].catalog) {
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
    let result = this.isValidRequest(user, source, id);
    if (result === true) {
      let st = this.getCatalogStatus(user, source, id);
      // check if in progress
      if (st == status.inProgress) {
        return tools.errorMsg(`${source} - Data download for ${user}/${source}/${id} already in progress`);
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
      } else {
        return tools.errorMsg(`${source}: Error initialising download`);
      }
    } else {
      return result;
    }
  }

  dataStatus(user, source, id) {
    let result = this.isValidRequest(user, source, id);
    if (result === true) {
      if (this.hasCatalogEntry(user, source, id)) {
        let entry = this.catalog[user][source][id];
        if (entry.size < entry.source_size) {
          let size = this.getLocalDataSize(user, source, id);
          this.updateCatalogEntry(user, source, id, { 'size': size });
        }
        return entry;
      }
    } else {
      return result;
    }
  }

  dataRemove(user, source, id) {
    let result = this.isValidRequest(user, source, id);
    if (result === true) {
      let st = this.getCatalogStatus(user, source, id);
      if (st === status.inProgress) {
        return tools.errorMsg(`${source}: Can't remove as download for ${user}/${source}/${id} is in progress`);
      }
      if (this.source[source].remove(user, id, this.catalog)) {
          this.removeCatalogEntry(user, source, id);
          return tools.successMsg(`${source}: Removed ${id} for ${user}`);
      } else {
          return tools.errorMsg(`${source}: Unable to remove ${id} for ${user}`);
      }
    } else {
      return result;
    }
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
    if (this.hasCatalogEntry(user, source, id)) {
      return this.catalog[user][source][id].status;
    } else {
      return false;
    }
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
    } else {
      return false;
    }
  }

  updateCatalogEntry(user, source, id, fields) {
    if (this.hasCatalogEntry(user, source, id)) {
      let entry = this.catalog[user][source][id];
      for (let [key, value] of Object.entries(fields)) {
        entry[key] = value;
      }
      entry.last_access = new Date().toISOString();
      return tools.saveUserCatalog(user, this.catalog[user]);
    }
    return false;
  }

  removeCatalogEntry(user, source, id) {
    if (this.hasCatalogEntry(user, source, id)) {
      delete this.catalog[user][source][id];
      tools.saveUserCatalog(user, this.catalog[user]);
      return true;
    }
    return false;
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

  dataInUse(user, source, id, value) {
    let bool = ( value === 'true' );
    if (this.updateCatalogEntry(user, source, id, { 'in_use': bool })) {
      return this.dataStatus(user, source, id);
    } else {
      return tools.errorMsg(`Unable to update catalog entry for ${user}/${source}/$id`);
    }
  }

}

module.exports = dataLink;

