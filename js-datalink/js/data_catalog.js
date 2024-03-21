'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const log = require('./log.js');

class dataEntry {

  constructor(fields = {}) {
    this.updated = new Date().toISOString();
    this.size = 0;
    this.size_s = 0;
    this.in_use = false;
    this.status = status.inProgress;

    Object.assign(this, fields);
  }

}

class dataCatalog {

  constructor(data_dir, keep_with_data = false) {
    this.data_dir = data_dir;
    this.keep_with_data = keep_with_data;
    this.catalog = {};
  }

  getCatalog() {
    return this.catalog;
  }

  // get the relative data directory for an entry
  getRelDataDest(user, source, id) {
    return path.join(user, source, id);
  }

  // get the absolute data directory for an entry
  getDataDest(user = '', source = '', id = '') {
    return path.join(this.data_dir, this.getRelDataDest(user, source, id));
  }

  getUserCatalogFile(user) {
    let dir;
    if (this.keep_with_data) {
      dir = this.getDataDest(user, 'catalog.json');
    } else {
      dir = path.join(tools.getCatalogDir(), 'users', user + '.json');
    }
    return dir;
  }

  loadUserCatalog(user) {
    const catalog = this.getCatalog();
    const file = this.getUserCatalogFile(user);
    try {
      let json = fs.readFileSync(file);
      catalog[user] = JSON.parse(json);
    } catch (err) {
      log.error(`loadUserCatalog (${user}) - ${err.message}`);
      return false
    }
    return true;
  }

  saveUserCatalog(user) {
    const catalog = this.getCatalog()[user];

    // if the users catalog has already been deleted then return
    // this can happen when the catalog is removed during fetching
    if (! catalog) {
      return true;
    }

    let json = JSON.stringify(catalog);
    try {
      const user_catalog_file = this.getUserCatalogFile(user);
      const user_catalog_dir = path.dirname(user_catalog_file);
      if (! fs.existsSync(user_catalog_dir)) {
        fs.mkdirSync(user_catalog_dir, { recursive: true });
      }
      fs.writeFileSync(this.getUserCatalogFile(user), json);
    } catch (err) {
      log.error(`saveUserCatalog (${user}) - ${err}`);
      return false;
    }
    return true;
  }

  removeUserCatalog(user) {
    let file = this.getUserCatalogFile(user);
    try {
      fs.rmSync(file);
    } catch (err) {
      log.error(`removeUserCatalog (${user}) - ${err.message}`);
      return false;
    }
    return true;
  }

  removeUserData(user, source, id) {
    let dir = this.getDataDest(user, source, id);
    try {
      fs.rmSync(dir, { recursive: true });
    } catch (err) {
      log.error(`removeUserData (${user}/${source}/${id}) - ${err.message}`)
      // fail on any error except if the data wasn't found
      if (err.code !== 'ENOENT') {
        return false;
      }
    }
    return true;
  }

  removeUserSource(user, source) {
    let dir = this.getDataDest(user, source);
    try {
      fs.rmdirSync(dir);
    } catch (err) {
      log.error(`removeUserSource (${user}/${source}) - ${err.message}`)
      return false;
    }
    return true;
  }

  removeUser(user) {
    let dir = this.getDataDest(user);
    if (! this.removeUserCatalog(user)) {
      return false;
    }
    try {
      fs.rmdirSync(dir);
    } catch (err) {
      log.error(`removeUser (${user}) - ${err.message}`);
      return false;
    }
    return true;
  }

  getEntry(user, source, id) {
    const catalog = this.getCatalog();
    if (catalog[user] && catalog[user][source] && catalog[user][source][id]) {
      return catalog[user][source][id];
    }
    return null;
  }

  addEntry(user, source, id, fields = {}) {
    // create directory for the data
    try {
      fs.mkdirSync(this.getDataDest(user, source, id), { recursive: true });
    } catch (err) {
      log.error(`addEntry ${user}/${source}/${id} - ${err}`);
      return false;
    }

    // add user, source and id to entry - so this information is available directly from the entry
    fields.user = user;
    fields.source = source;
    fields.id = id;

    // set the default status to in_progress
    if (! fields.status) {
      fields.status = status.inProgress;
    }

    // add data directory to entry
    fields.dir = path.join(user, source, id);

    const catalog = this.getCatalog();
    // if there is no catalog for the user, create one
    if (! catalog[user]) {
      catalog[user] = {};
    }

    // if source doesn't exist for the user, create it
    if (! catalog[user][source]) {
      catalog[user][source] = {};
    }

    // add the catalog entry
    catalog[user][source][id] = new dataEntry(fields);
    if (! this.saveUserCatalog(user)) {
      return false;
    }

    return catalog[user][source][id];
  }

  updateEntry(entry, fields) {
    Object.assign(entry, fields);

    entry.updated = new Date().toISOString();

    if (! this.saveUserCatalog(entry.user)) {
      log.error(`${this.name} - Unable to save catalog entry for ${entry.user}/${entry.source}/${entry.id}`);
    }
  }

  removeEntry(user, source, id) {
    const catalog = this.getCatalog();

    // remove the user data
    if (! this.removeUserData(user, source, id)) {
      return false;
    }

    // remove the user data from the catalog
    delete catalog[user][source][id];

    // if the user has no more entries for the source, remove the source entry and directory
    if (Object.keys(catalog[user][source]).length == 0) {
      delete catalog[user][source];
      if (! this.removeUserSource(user, source)) {
        return false;
      }
    }

    // if the user has no other sources, remove the user entry and directory
    if (Object.keys(catalog[user]).length == 0) {
      delete catalog[user];
      if (! this.removeUser(user)) {
        return false;
      }
      return true;
    }

    // save the catalog
    return this.saveUserCatalog(user);
  }

  updateEntrySize(entry) {
    const size = this.getStorageSize(entry);
    this.updateEntry(entry, { size: size });
  }

  getStorageSize(entry) {
    const dir = path.join(this.getDataDest(), entry.dir);
    try {
      if (fs.existsSync(dir)) {
        return tools.getDirSize(dir);
      } else {
        return 0;
      }
    } catch (err) {
      log.error(`getStorageSize (${user}/${source}/${id}) - ${err.message}`);
      return 0;
    }
  }

  getStats() {
    let users = 0;
    let entries = 0;
    let size = 0;
    for (const user of Object.values(this.getCatalog())) {
      users += 1;
      for (const source of Object.values(user)) {
        for (const entry of Object.values(source)) {
          entries += 1;
          size += entry.size;
        }
      }
    }
    return {
      users: users,
      entries: entries,
      size: size
    }
  }

}

module.exports = dataCatalog;