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

  constructor(data_dir) {
    this.data_dir = data_dir;
    this.catalog = {};
  }

  getCatalog() {
    return this.catalog;
  }

  loadUserCatalog(user) {
    const catalog = this.getCatalog();
    const file = tools.getUserCatalogFile(user);
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
    let json = JSON.stringify(catalog);
    try {
      const user_data_dir = tools.getDataDest(user);
      if (! fs.existsSync(user_data_dir)) {
        fs.mkdirSync(user_data_dir, { recursive: true });
      }
      const user_catalog_file = tools.getUserCatalogFile(user);
      const user_catalog_dir = path.dirname(user_catalog_file);
      if (! fs.existsSync(user_catalog_dir)) {
        fs.mkdirSync(user_catalog_dir, { recursive: true });
      }
      fs.writeFileSync(tools.getUserCatalogFile(user), json);
    } catch (err) {
      log.error(`saveUserCatalog (${user}) - ${err.message}`);
      return false;
    }
    return true;
  }

  removeUserCatalog(user) {
    let file = tools.getUserCatalogFile(user);
    try {
      fs.rmSync(file);
    } catch (err) {
      log.error(`removeUserCatalog (${user}) - ${err.message}`);
      return false;
    }
    return true;
  }

  removeUserData(user, source, id) {
    let dir = path.join(tools.getUserDataDir(user), source, id);
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
    let dir = path.join(tools.getUserDataDir(user), source);
    try {
      fs.rmdirSync(dir);
    } catch (err) {
      log.error(`removeUserSource (${user}/${source}) - ${err.message}`)
      return false;
    }
    return true;
  }

  removeUser(user) {
    let dir = tools.getUserDataDir(user);
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
    return catalog[user][source][id];
  }

  addEntry(user, source, id, fields) {
    // create directory for the data
    try {
      fs.mkdirSync(tools.getDataDest(user, source, id), { recursive: true });
    } catch (err) {
      return false;
    }

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
    return this.saveUserCatalog(user);
  }

  hasEntry(user, source, id) {
    const catalog = this.getCatalog();
    if (catalog[user] && catalog[user][source] && catalog[user][source][id]) {
      return true;
    }
    return false;
  }

  getStatus(user, source, id) {
    return this.getEntry(user, source, id).status;
  }

  updateEntry(user, source, id, fields) {
    const entry = this.getEntry(user, source, id);

    Object.assign(entry, fields);

    entry.updated = new Date().toISOString();
    return this.saveUserCatalog(user);
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

  getStorageSize(user, source, id) {
    let dir = path.join(this.data_dir, user, source, id);
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