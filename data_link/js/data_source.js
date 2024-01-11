'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');

const CATALOG_DIR = config.get('storage.catalog_dir', 'catalog');

class dataSource {

  name = this.constructor.name;
  description = '';
  url = '';

  constructor() {
    this.catalog_file = path.join(CATALOG_DIR, this.name + '.json');
    this.catalog = null;
    this.catalog_size = 0;
    this.status = null;
    this.jobs = {};
  }

  addCatalog(files) {
    this.catalog = files;
    this.catalog_size = Object.keys(files).length;
    this.status = status.completed;
    log.info(`${this.name} - Added catalog ${this.catalog_file}: ${this.catalog_size} entries`);
  }

  saveCatalog(files) {
    log.info(`${this.name} - Saving catalog to ${this.catalog_file}`);
    this.addCatalog(files);
    let json = JSON.stringify(files);
    try {
      fs.mkdirSync(CATALOG_DIR, { recursive: true });
    } catch (err) {
      log.info(`${this.name} - Unable to create ${CATALOG_DIR} - ${err}`);
    }
    let file = fs.writeFile(this.catalog_file, json, (err) => {
      if (err) {
        log.error(`${this.name} - Unable to save ${this.catalog_file} - ${err.message}`);
      } else {
        this.status = status.completed;
      }
    });
  }

  loadCatalog() {
    if (fs.existsSync(this.catalog_file)) {
      fs.readFile(this.catalog_file, (err, data) => {
        if (err) {
          log.error(`${this.name} - Unable to load ${this.catalog_file} - ${err.message}`);
        } else {
          try {
            const obj = JSON.parse(data);
            this.addCatalog(obj);
          } catch (err) {
            log.error(`${this.name} - Unable to parse ${this.catalog_file} - ${err.message}`);
          }
        }
      });
    } else {
      this.updateCatalog();
    }
  }

  updateCatalog() {
    log.info(`${this.name} - Updating Catalog`);
    this.status = status.inProgress;
    this.getCatalog();
    return true;
  }

  getJobId(user, id) {
    return user + '/' + id;
  }

  addJob(user, id, pid) {
    let jid = this.getJobId(user, id);
    this.jobs[jid] = pid;
  }

  getJob(user, id) {
    let jid = this.getJobId(user, id);
    return this.jobs[jid];
  }

  deleteJob(user, id) {
    let jid = this.getJobId(user, id);
    if (this.jobs[jid]) {
      delete this.jobs[jid];
    }
  }

  acquire(user, id, catalog) {
    try {
      fs.mkdirSync(tools.getDataDest(user, this.name, id), { recursive: true });
      this.getData(user, id, catalog);
    } catch (err) {
      log.error(`${this.name} - ${err.message}`);
      return false;
    }

    return true;
  }

  getEntrySize(id) {
    if (this.catalog && this.catalog[id] && this.catalog[id].size) {
      return this.catalog[id].size;
    }
    return 0;
  }

  dataComplete(user, id, catalog) {
    let fields = {
      'status': status.completed,
      'size': catalog.getStorageSize(user, this.name, id)
    }
    if (! catalog.updateEntry(user, this.name, id, fields)) {
      log.error(`${this.name} - Unable to update catalog entry for ${user}/${this.name}/${id}`);
    }

    this.deleteJob(user, id);
    log.info(`${this.name} - Acquired ${user}/${this.name}/${id} - size ${fields.size}`);
  }

  dataError(user, id, catalog, error) {
    log.error(`dataError - Failed to acquire ${user}/${this.name}/${id} - ${error}`);
    // check if we have an entry (eg. in case the acquire was aborted due to a catalog deletion)
    if (catalog.hasEntry(user, this.name, id)) {
      catalog.updateEntry(user, this.name, id, { status: status.failed });
    }
    this.deleteJob(user, id);
  }

  catalogError(error) {
    log.error(`${this.name} - Unable to retrieve catalog: ${error}`);
    return false;
  }

  async httpGetData(url, user, id, catalog) {
    let entry = catalog.getEntry(user, this.name, id);

    // get content-size from http headers
    let headers = await tools.httpGetHeaders(url);
    if (headers['content-length']) {
      entry.source_size = parseInt(headers['content-length'], 10);
    }

    let dest_dir = tools.getDataDest(user, this.name, id);
    let dest_file = path.join(dest_dir, path.basename(url));

    let options = {};
    let file_size = 0;

    try {
      if (fs.existsSync(dest_file)) {
        file_size = fs.statSync(dest_file).size;
        if (file_size < entry.source_size && headers['accept-ranges'] === 'bytes') {
          options.headers = { 'range': `bytes=${file_size}-${entry.source_size}`}
        }
      }
    } catch (err) {
      this.dataError(user, id, catalog, `${this.name}/httpGetData - ${err.message}`);
      return;
    }

    if (file_size < entry.source_size) {
      try {
        await tools.httpRequest(url, options, dest_file, (controller) => {
        this.addJob(user, id, controller);
      });
      } catch (err) {
        this.dataError(user, id, catalog, `${this.name}/httpGetData - ${err}`);
        return;
      };
    }

    // unpack the archive
    tools.unpack(dest_file, dest_dir,
      (controller) => {
        this.addJob(user, id, controller);
      }
    ).then(() => {
      this.dataComplete(user, id, catalog);
    }).catch(err => {
      this.dataError(user, id, catalog, err);
    });

  }

  async rsyncGetCatalog(url, catalog) {
    if (! config.get('data_sources.' + this.name + '.rsync_size', true)) {
      return;
    }

    let out = '';

    await tools.doRsync(
      ['-rz', url],
      (stdout) => {
        out += stdout.toString();
      },
      (stderr) => {
        log.error(stderr.toString());
      }
    ).then(() => {
      let lines = out.split("\n");
      this.rsyncParseLines(catalog, lines);
    }).catch(err => {
      log.error(`rsyncGetCatalog - Error: ${err.message}`);
    });
  }

  rsyncGetData(url, user, id, catalog) {
    let dest = tools.getDataDest(user, this.name);

    // rsync -rzv --include 'ID/***' --exclude '*' data.pdbjbk1.pdbj.org::rsync/xrda/
    tools.doRsync(
      ['-rzq', '--include', id + '/***', '--exclude', '*', url, dest],
      (stdout) => {
        out += stdout.toString();
      },
      (stderr) => {
        log.error(stderr.toString());
      },
      (controller) => {
        this.addJob(user, id, controller);
      }
    ).then(() => {
      this.dataComplete(user, id, catalog);
    }).catch(err => {
      this.dataError(user, id, catalog, err);
    });

  }

  // parse rsync listing
  // -rw-r--r--    178,407,270 2022/10/28 11:50:05 100/diffractions/Camera Ceta 1903 670 mm 0001.emd
  rsyncParseLines(catalog, lines) {
    let last_id = null;
    let id_size = 0;
    for (const line of lines) {
      // split by one or more spaces
      let f = line.split(/\s+/);

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

      // if it's a top level directory, add it to the catalog object
      if (st == 'd' && id == pth) {
        if (catalog[id]) {
          catalog[id].date = new Date(date).toISOString();
        }
        // if we have a previous entry, then update it with the size
        if (last_id && catalog[last_id]) {
          catalog[last_id].size = id_size;
          id_size = 0;
        }
        // save the last id, to add the accumilated file sizes
        last_id = id;
      // only consider lines that contain files (starting with -)
      } else if (f[0].slice(0,1) == '-') {
        // extract the size as an integer
        let size = parseInt(f[1].replaceAll(',', ''));
        id_size += size;
      }
    }
    if (last_id && catalog[last_id]) {
      catalog[last_id].size = id_size;
    }
  }

}

module.exports = dataSource;