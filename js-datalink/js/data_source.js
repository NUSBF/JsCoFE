'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');

class dataSource {

  name = this.constructor.name;
  description = '';
  url = '';
  catalog = null;
  catalog_size = 0;
  catalog_status = null;

  constructor(data_dir, jobs) {
    this.data_dir = data_dir;
    this.jobs = jobs;
  }

  getEntry(id) {
    return this.catalog[id];
  }

  addCatalog(catalog) {
    this.catalog = catalog;
    this.catalog_size = Object.keys(catalog).length;
    this.catalog_status = status.completed;
    log.info(`${this.name} - Added catalog: ${this.catalog_size} entries`);
  }

  saveCatalog(catalog_file, catalog) {
    log.info(`${this.name} - Saving catalog to ${catalog_file}`);
    this.addCatalog(catalog);
    let json = JSON.stringify(catalog);
    try {
      fs.mkdirSync(path.dirname(catalog_file), { recursive: true });
    } catch (err) {
      log.info(`${this.name} - Unable to create ${tools.getCatalogDir()} - ${err}`);
    }
    let file = fs.writeFile(catalog_file, json, (err) => {
      if (err) {
        log.error(`${this.name} - Unable to save ${catalog_file} - ${err.message}`);
      } else {
        this.catalog_status = status.completed;
      }
    });
  }

  async loadCatalog(catalog_file) {
    if (! fs.existsSync(catalog_file)) {
      log.info(`${this.name} - Fetching Catalog`);
      const catalog = await this.fetchCatalog();
      this.saveCatalog(catalog_file, catalog);
      return;
    }

    fs.readFile(catalog_file, (err, data) => {
      if (err) {
        log.error(`${this.name} - Unable to load ${catalog_file} - ${err.message}`);
      } else {
        try {
          log.info(`${this.name} - Loading catalog ${catalog_file}`);
          const catalog = JSON.parse(data);
          this.addCatalog(catalog);
        } catch (err) {
          log.error(`${this.name} - Unable to parse ${catalog_file} - ${err.message}`);
        }
      }
    });
  }

  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  setCompleteCallback(callback) {
    this.completeCallback = callback;
  }

  dataError(entry, err) {
    this.removeJob(entry);
    this.errorCallback(entry, err);
  }

  dataComplete(entry) {
    this.removeJob(entry);
    this.completeCallback(entry);
  }

  getJobKey(entry) {
    return entry.user + '/' + entry.id;
  }

  getJob(entry) {
    return this.jobs[this.getJobKey(entry)];
  }

  addJob(entry, controller, status) {
    const key = this.getJobKey(entry);
    this.jobs[key] = { controller: controller, status: status }
  }

  removeJob(entry) {
    this.abortJob(entry);
    const key = this.getJobKey(entry);
    if (this.jobs[key]) {
      delete this.jobs[key];
    }
  }

  abortJob(entry) {
    const job = this.getJob(entry);
    if (job && job.controller) {
      job.controller.abort();
    }
  }

  async fetchDataHttp(url, entry) {
    // get content-size from http headers
    let headers = await tools.httpGetHeaders(url);
    if (headers['content-length']) {
      entry.size_s = parseInt(headers['content-length'], 10);
    }

    let file = path.basename(url);
    let data_dest = path.join(this.data_dir, entry.dir);
    let dest_file = path.join(data_dest, file);

    let options = {};
    let file_size = 0;

    try {
      if (fs.existsSync(dest_file)) {
        file_size = fs.statSync(dest_file).size;
        entry.size = file_size;
        if (file_size < entry.size_s && headers['accept-ranges'] === 'bytes') {
          options.headers = { 'range': `bytes=${file_size}-${entry.size_s}`}
        }
      }
    } catch (err) {
      this.dataError(entry, `${this.name}/fetchDataHttp - ${err.message}`);
      return;
    }

    if (file_size < entry.size_s) {
      try {
        await tools.httpRequest(url, options, dest_file,
        (controller) => {
          this.addJob(entry, controller, `Fetching ${url} to ${entry.dir}`);
        },
        (data) => {
          entry.size += data.length;
        });
      } catch (err) {
        this.dataError(entry, `${this.name}/fetchDataHttp - ${err}`);
        return;
      };
    }

    // unpack the archive
    try {
      const msg = `${this.name}/fetchDataHttp - Unpacking ${file} to ${entry.dir}`
      log.info(msg);
      await tools.unpack(dest_file, data_dest, null, null, (controller) => {
        this.addJob(entry, controller, msg);
      });
    } catch (err) {
      this.dataError(entry, err);
      return;
    }

    let ret = await this.unpackDirectory(entry, data_dest);

    if (! ret) {
      this.dataError(entry);
      return;
    }
    this.dataComplete(entry);
  }

  async unpackDirectory(entry, dest_dir) {
    // go through the contents of the archive and unpack any additional files
    // this is required as some data source images are gzipped/bzipped individually
    return await tools.fileCallback(dest_dir, false, async (file) => {
      const {cmd, args} = tools.getUnpackCmd(file, dest_dir);
      if (cmd) {
        try {
          const msg = `unpackDirectory - Unpacking ${file}`;
          log.info(msg);
          await tools.unpack(file, dest_dir, cmd, args, (controller) => {
            this.addJob(entry, controller, msg);
          });
        } catch (err) {
          log.error(`unpackDirectory - ${err}`);
          // if an abort signal was received return false, so we can stop the file traversal in fileCallback
          if (err.code == 'ABORT_ERR') {
            this.dataError(entry, `unpackDirectory - The operation was aborted`);
            return 0;
          }
        }
      }
      return 1;
    });
  }

  async fetchCatalogRsync(url, catalog) {
    if (! config.get('data_sources.' + this.name + '.rsync_size')) {
      return;
    }

    let out = '';

    try {
      await tools.doRsync(['-rz', '--no-motd', url],
        (stdout) => {
          out += stdout.toString();
        },
        (stderr) => {
          log.error(`${this.name}/fetchCatalogRsync - Error: ${stderr.toString()}`);
        });
    } catch (err) {
      log.error(`${this.name}/fetchCatalogRsync - Error: ${err.message}`);
      return;
    }

    let lines = out.split("\n");
    this.rsyncParseLines(catalog, lines);
  }

  async fetchDataRsync(url, entry) {
    let job_id;

    const data_dest = path.join(this.data_dir, entry.dir);
    // rsync -rz --no-motd --info=progress2 --partial data.pdbjbk1.pdbj.org::rsync/xrda/ID/ DEST/
    try {
      await tools.doRsync(['-rz', '--no-motd', '--info=progress2', '--partial', url + entry.id + '/', data_dest],
        (stdout) => {
          // extract transferred amount
          let fields = stdout.toString().split(/\s+/);
          if (fields[1]) {
            entry.size = parseInt(fields[1].replaceAll(',', ''), 10);
          }
        },
        (stderr) => {
          log.error(stderr.toString());
        },
        (controller) => {
          this.addJob(entry, controller, `Fetching (rsync) ${url}/${entry.id} to ${entry.dir}`);
        });
    } catch (err) {
      this.dataError(entry, err);
      return;
    }

    let ret = await this.unpackDirectory(entry, data_dest);

    if (! ret) {
      this.dataError(entry);
      return;
    }

    this.dataComplete(entry);
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