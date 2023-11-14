'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('pino')();
const rsync = require('rsync2');

const { tools, status } = require('./tools.js');
const config = require('./config.js');

const CATALOG_DIR = config.get('storage.catalog_dir');

class dataSource {

  name = this.constructor.name;
  description = '';
  url = '';
  has_catalog = true;

  constructor() {
    this.catalog_file = path.join(CATALOG_DIR, this.name + '.json');
    this.catalog = null;
    this.catalog_size = 0;
    this.status = status.unavailable;
    this.jobs = {};
  }

  hasCatalog() {
    return this.has_catalog;
  }

  hasCatalogId(id) {
    // check if the source supports a catalog
    if (! this.hasCatalog())
      return true;

    // if there is no catalog allow any id
    if (! this.catalog) {
      return true;
    }

    if (this.catalog[id]) {
      return true;
    }

    return false;
  }

  addCatalog(files) {
    this.catalog = files;
    this.catalog_size = Object.keys(files).length;
    this.status = status.completed;
    logger.info(`${this.name} - Added catalog ${this.catalog_file}: ${this.catalog_size} entries`);
  }

  saveCatalog(files) {
    logger.info(`${this.name} - Saving catalog to ${this.catalog_file}`);
    this.addCatalog(files);
    let json = JSON.stringify(files);
    try {
      fs.mkdirSync(CATALOG_DIR, { recursive: true });
    } catch (err) {
      logger.info(`${this.name} - Unable to create ${CATALOG_DIR} - ${err}`);
    }
    let file = fs.writeFile(this.catalog_file, json, (err) => {
      if (err) {
        logger.error(`${this.name} - Unable to save ${this.catalog_file} - ${err}`);
      } else {
        this.status = status.completed;
      }
    });
  }

  loadCatalog() {
    if (! this.hasCatalog()) return false;
    if (fs.existsSync(this.catalog_file)) {
      fs.readFile(this.catalog_file, (err, data) => {
        if (err) {
          logger.error(`${this.name} - Unable to load ${this.catalog_file} - ${err}`);
        } else {
          // TODO Error checking
          this.addCatalog(JSON.parse(data));
        }
      });
    } else {
      this.updateCatalog();
    }
  }

  updateCatalog() {
    if (this.hasCatalog()) {
      logger.info(`${this.name} - Updating Catalog`);
      this.status = status.inProgress;
      this.getCatalog();
    } else {
      return false;
    }

    return true;
  }

  aquire(user, id, catalog) {
    // add a catalog entry for the user setting the status to in_progress
    if (catalog.addCatalogEntry(user, this.name, id, status.inProgress)) {
      logger.info(`${this.name} - Aquiring ${user}/${this.name}/${id} - size ${this.getCatalogIdSize(id)}`);
      try {
        fs.mkdirSync(tools.getDataDest(user, this.name, id), { recursive: true });
        this.getData(user, id, catalog);
      } catch (err) {
        logger.error(`${this.name} - ${err}`);
        return false;
      }
    } else {
      return false;
    }

    return true;
  }

  remove(user, id, catalog) {
    let dest = tools.getDataDest(user, this.name, id);
    try {
      fs.rmSync(dest, { recursive: true, force: true });
    } catch (err) {
      logger.error(`${this.name} - Unable to remove ${dest}: ${err}`);
      return false;
    }
    return true;
  }

  getCatalogIdSize(id) {
    if (this.catalog && this.catalog[id] && this.catalog[id].size) {
      return this.catalog[id].size;
    }
    return 0;
  }

  dataComplete(user, id, catalog) {
    let fields = {
      'status': status.completed,
      'size': catalog.getLocalDataSize(user, this.name, id)
    }
    if (! catalog.updateCatalogEntry(user, this.name, id, fields)) {
      logger.error(`${this.name} - Unable to update catalog entry for ${user}/${this.name}/${id}`);
    }

    logger.info(`${this.name} - Downloaded ${user}/${this.name}/${id} - size ${this.getCatalogIdSize(id)}`);
  }

  dataError(user, id, catalog, error) {
    logger.error(`${this.name} - Unable to download data: ${error}`);
    catalog.addCatalogEntry(user, this.name, id, status.failed)
  }

  catalogError(error) {
    logger.error(`${this.name} - Unable to retrieve catalog: ${error}`);
    return false;
  }

  rsyncGetCatalog(url) {
    const cmd = rsync()
      .setFlags('rz')
      .source(url);

    let out = '';
    let entries = {};

    cmd.execute({
      stdoutHandler: (stdoutHandle) => {
        out += stdoutHandle.toString();
      },
      sterrHandler: (sterrHandle) => {
        console.log(sterrHandle.toString());
      }})
      .then(() => {
        let lines = out.split("\n");
        this.rsyncParseLines(entries, lines);
        this.saveCatalog(entries);
      })
      .catch(err => {
        console.log(err);
        this.catalogError(err);
      });
  }

  rsyncGetData(url, user, id, catalog) {
    let dest = tools.getDataDest(user, this.name);

    // rsync -rzv --include 'ID/***' --exclude '*' data.pdbjbk1.pdbj.org::rsync/xrda/
    const cmd = rsync()
      .setFlags('rzq')
      //.set('delay-updates')
      .include(id + '/***')
      .exclude('*')
      .source(url)
      .destination(dest);

    this.jobs[user + '/' + id] = cmd.execute({
      stdoutHandler: (stdoutHandle) => {
        out += stdoutHandle.toString();
      }
      })
      .then(() => {
        this.dataComplete(user, id, catalog);
      })
      .catch(error => {
        this.dataError(user, id, catalog, error);
      });

  }

  //let out = fs.readFileSync('rsync.txt');
  // parse rsync listing
  // -rw-r--r--    178,407,270 2022/10/28 11:50:05 100/diffractions/Camera Ceta 1903 670 mm 0001.emd
  //let lines = out.toString().split("\n");

  // parse rsync listing
  // -rw-r--r--    178,407,270 2022/10/28 11:50:05 100/diffractions/Camera Ceta 1903 670 mm 0001.emd
  rsyncParseLines(entries, lines) {
    let last_id = null;
    let id_size = 0;
    for (let i in lines) {
      // split by one or more spaces
      let f = lines[i].split(/\s+/);

      // get the first character to determine if it's a folder/file
      let st = f[0].slice(0,1);

      // if it's not a directory/file entry then skip to the next line
      if (st != 'd' && st != '-') {
        continue;
      }

      // extract the first directory to use as the catalog id
      let id = f[4].split(/\//)[0];

      // extract the full file path
      let pth = f.slice(4).join(' ')

      let date = Date.parse(f[2] + ' ' + f[3]);

      // if it's a top level directory, add it to the entries object
      if (st == 'd' && id == pth) {
        entries[id] = {};
        entries[id].date = date;
        // if we have a previous entry, then update it with the size
        if (last_id) {
          entries[last_id].size = id_size;
          id_size = 0;
        }
        // entries[id].files = [];
        // save the last id, to add the accumilated file sizes
        last_id = id;
      // only consider lines that contain files (starting with -)
      } else if (f[0].slice(0,1) == '-') {
        // extract the size as an integer
        let size = parseInt(f[1].replaceAll(',', ''));
        // extract fields
        let e = {
          // add the path without the id
          'path': pth.slice(pth.indexOf("/", 1) +1),
          'date': date,
          'size': size
        };
        id_size += size;
      }
      //entries[id].files.push(e);
    }
  }



}

module.exports = dataSource;