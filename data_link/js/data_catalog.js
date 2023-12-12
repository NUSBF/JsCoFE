'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const log = require('./log.js');

class dataCatalog {

  constructor(data_dir) {
    this.data_dir = data_dir;
    this.catalog = {};
  }

  getCatalog() {
    return this.catalog;
  }

  loadUserCatalog(user, file) {
    try {
      let json = fs.readFileSync(file);
      this.catalog[user] = JSON.parse(json);
    } catch (err) {
      log.error(err);
      return false
    }
    return true;
  }

  saveUserCatalog(user, catalog) {
    let json = JSON.stringify(catalog);
    let user_data_dir = tools.getDataDest(user);
    try {
      if (! fs.existsSync(user_data_dir)) {
        fs.mkdirSync(user_data_dir, { recursive: true });
      }
      fs.writeFileSync(tools.getUserCatalogFile(user), json);
    } catch (err) {
      log.error(`Error saving user catalog ${err}`);
      return false;
    }
    return true;
  }

  removeUserCatalog(user) {
    let file = tools.getUserCatalogFile(user);
    try {
      fs.rmSync(file);
    } catch (err) {
      log.error(`Error removing catalog file for ${user} - ${err}`);
      return false;
    }
    return true;
  }

  removeUserData(user, source, id) {
    let dir = path.join(tools.getUserDataDir(user), source, id);
    try {
      fs.rmSync(dir, { recursive: true });
    } catch (err) {
      log.error(`Error removing ${user}/${source}/${id} - ${err}`)
      return false;
    }
    return true;
  }

  removeUserSource(user, source) {
    let dir = path.join(tools.getUserDataDir(user), source);
    try {
      fs.rmdirSync(dir);
    } catch (err) {
      log.error(`Error removing ${user}/${source} - ${err}`)
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
      log.error(`Error removing ${user} - ${err}`);
      return false;
    }
    return true;
  }

  addEntry(user, source, id, fields) {
    // if there is no catalog for the user, create one
    if (!this.catalog[user]) {
      this.catalog[user] = {};
    }

    // if source doesn't exist for the user, create it
    if (!this.catalog[user][source]) {
      this.catalog[user][source] = {};
    }

    let entry = {
      'last_access': new Date().toISOString(),
      'size': 0,
      'in_use': false
    }

    Object.assign(entry, fields);

    // add the catalog entry
    this.catalog[user][source][id] = entry;
    return this.saveUserCatalog(user, this.catalog[user]);
  }

  hasEntry(user, source, id) {
    if (this.catalog[user] && this.catalog[user][source] && this.catalog[user][source][id]) {
      return true;
    }
    return false;
  }

  getStatus(user, source, id) {
    return this.catalog[user][source][id].status;
  }

  updateEntry(user, source, id, fields) {
    let entry = this.catalog[user][source][id];

    Object.assign(entry, fields);

    entry.last_access = new Date().toISOString();
    return this.saveUserCatalog(user, this.catalog[user]);
  }

  removeEntry(user, source, id) {
    // remove the user data
    if (! this.removeUserData(user, source, id)) {
      return false;
    }

    // remove the user data from the catalog
    delete this.catalog[user][source][id];

    // if the user has no more entries for the source, remove the source entry and directory
    if (Object.keys(this.catalog[user][source]).length == 0) {
      delete this.catalog[user][source];
      if (! this.removeUserSource(user, source)) {
        return false;
      }
    }

    // if the user has no other sources, remove the user entry and directory
    if (Object.keys(this.catalog[user]).length == 0) {
      delete this.catalog[user];
      if (! this.removeUser(user)) {
        return false;
      }
      return true;
    }

    // save the catalog
    return this.saveUserCatalog(user, this.catalog[user]);
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
      log.error(err);
      return 0;
    }
  }

}

module.exports = dataCatalog;