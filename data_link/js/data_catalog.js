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
    return tools.errorMsg(`${user}/${source}/${id} not found`, 404);
  }

  getStatus(user, source, id) {
    if (this.hasEntry(user, source, id) !== true) {
      return false;
    }
    return this.catalog[user][source][id].status;
  }

  updateEntry(user, source, id, fields) {
    let result = this.hasEntry(user, source, id);
    if (this.hasEntry(user, source, id) !== true) {
      return result;
    }

    let entry = this.catalog[user][source][id];

    Object.assign(entry, fields);

    entry.last_access = new Date().toISOString();
    return this.saveUserCatalog(user, this.catalog[user]);
  }

  removeEntry(user, source, id) {
    let result = this.hasEntry(user, source, id);
    if (this.hasEntry(user, source, id) !== true) {
      return result;
    }

    delete this.catalog[user][source][id];
    this.saveUserCatalog(user, this.catalog[user]);
    return true;
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