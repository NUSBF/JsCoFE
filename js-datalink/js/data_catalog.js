'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const log = require('./log.js');

const GB = 1000000000;
const MB = 1000000;

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

  // get the current date minus num_days
  getPruneDate(num_days) {
    let check_date = new Date();
    check_date.setDate(check_date.getDate() - num_days);
    return check_date;
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
      if (err.code == 'ENOENT') {
        log.info(`loadUserCatalog (${user}) - skipping no datalink catalog`);
      } else {
        log.error(`loadUserCatalog (${user}) - ${err.message}`);
      }
      return false;
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

    return this.saveUserCatalog(entry.user);
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

  async pruneData(data_free_gb, data_max_days) {
    await this.pruneManagedData(data_free_gb, data_max_days);
    if (data_max_days > 0) {
      await this.pruneExternalData(data_max_days);
    }
  }

  async pruneManagedData(data_free_gb, data_max_days) {
    log.info(`pruneManagedData - pruning managed data older than ${data_max_days} day(s)`);
    const min_free = data_free_gb * GB;

    let entries = [];
    const catalog = this.getCatalog();
    // loop through all data entries
    for (const user of Object.values(catalog)) {
      for (const source of Object.values(user)) {
        for (const entry of Object.values(source)) {
          // skip data that is in progress
          if (entry.status === status.inProgress) {
            continue;
          }
          // if entry is not in use, prune data older than data_max_days
          if (! entry.in_use && data_max_days > 0) {
            let check_date = this.getPruneDate(data_max_days);
            if (new Date(entry.updated) < check_date) {
              if (this.removeEntry(entry.user, entry.source, entry.id)) {
                log.info(`pruneData - Removed ${entry.dir} - size ${entry.size}`);
              } else {
                log.error(`pruneData - Error removing ${entry.dir} - size ${entry.size}`);
              }
              continue;
            }
          }
          // add to entries list for pruning
          entries.push(entry);
        }
      }
    }

    const free = tools.getFreeSpace(tools.getDataDir(), '1');

    if (free === false) {
      log.error(`pruneManagedData - Unable to get free space`);
      return;
    }

    if (free >= min_free) {
      return;
    }

    log.info(`pruneManagedData - Free space is less than ${data_free_gb}GB - pruning oldest data`);

    entries.sort(function(a,b) {
      return new Date(a.date) - new Date(b.date);
    });

    const size_to_free = min_free - free;

    let size = 0;
    for (const entry of entries) {
      if (this.removeEntry(entry.user, entry.source, entry.id)) {
        log.info(`pruneData - Removed ${entry.dir} - size ${entry.size}`);
        size += entry.size;
        if (size >= size_to_free) {
          break;
        }
      }
    }
    const size_mb = Math.ceil(size / MB);
    const size_to_free_mb = Math.ceil(size_to_free / MB);
    if (size > 0) {
      log.info(`pruneData - Removed ${size_mb} MB of required ${size_to_free_mb} MB`);
    }
  }

  async pruneExternalData(data_max_days) {
    log.info(`pruneExternalData - pruning external data older than ${data_max_days} day(s)`);
    let users;
    try {
      users = tools.getSubDirs(tools.getDataDir());
    } catch (err) {
      log.error(`pruneExternalData - Unable to read user directories - ${err}`)
      return;
    }

    if (! users) {
      return;
    }

    // get the current date minus data_max_days
    let check_date = this.getPruneDate(data_max_days);

    const catalog = this.getCatalog();
    for (const user of users) {
      let sources = tools.getSubDirs(this.getDataDest(user));
      for (const source of sources) {
        // if we have a data entry for user + source then skip
        if (catalog[user] && catalog[user][source]) {
          continue;
        }

        await tools.fileCallback(this.getDataDest(user, source), true, async (file) => {
          try {
            let file_date = fs.statSync(file).mtime;
            // if the file or directory is older than check_date then remove
            if (file_date < check_date) {
              fs.rmSync(file, { recursive: true });
            }
          } catch (err) {
            log.error(`pruneExternalData - ${err}`);
          }
          return true;
        });
      }
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