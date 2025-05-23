'use strict';

const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');

/**
 * Abstract base class for data sources that manage catalog fetching, data retrieval,
 * and unpacking of datasets via HTTP or rsync.
 */
class dataSource {

  /**
   * Name of the data source (class name).
   * @type {string}
   */
  name = this.constructor.name;

  /**
   * Description of the data source.
   * @type {string}
   */
  description = '';

  /**
   * URL of the data source.
   * @type {string}
   */
  url = '';

  /**
   * Catalog object containing entries.
   * @type {?Object}
   */
  catalog = null;

  /**
   * Number of entries in the catalog.
   * @type {number}
   */
  catalog_size = 0;

  /**
   * Current status of the catalog.
   * @type {?string}
   */
  catalog_status = null;

  /**
   * Create a new dataSource instance.
   * @param {string} data_dir - Directory to save downloaded data.
   * @param {string} catalog_dir - Directory to store catalog files.
   * @param {Object} jobs - Job manager for tracking active jobs.
   */
  constructor(data_dir, catalog_dir, jobs) {
    this.data_dir = data_dir;
    this.jobs = jobs;
    this.catalog_file = path.join(catalog_dir, this.name + '.json');;
  }

  /**
   * Get a catalog entry by ID.
   * @param {string} id - Entry ID.
   * @returns {Object} Catalog entry.
   */
  getEntry(id) {
    return this.catalog[id];
  }

  /**
   * Adds a catalog object to the instance and logs the number of entries.
   * @param {Object} catalog - Catalog object keyed by entry IDs.
   */
  addCatalog(catalog) {
    this.catalog = catalog;
    this.catalog_size = Object.keys(catalog).length;
    this.catalog_status = status.completed;
    log.info(`${this.name} - Added catalog: ${this.catalog_size} entries`);
  }

  /**
   * Saves the catalog to disk as a JSON file.
   * @param {Object} catalog - Catalog object to save.
   */
  saveCatalog(catalog) {
    log.info(`${this.name} - Saving catalog to ${this.catalog_file}`);
    this.addCatalog(catalog);
    let json = JSON.stringify(catalog);
    try {
      fs.mkdirSync(path.dirname(this.catalog_file), { recursive: true });
    } catch (err) {
      log.info(`${this.name} - Unable to create ${tools.getCatalogDir()} - ${err}`);
    }
    let file = fs.writeFile(this.catalog_file, json, (err) => {
      if (err) {
        log.error(`${this.name} - Unable to save ${this.catalog_file} - ${err.message}`);
      }
    });
  }

  /**
   * Loads the catalog from disk, or fetches a new one if missing.
   */
  loadCatalog() {
    if (! fs.existsSync(this.catalog_file)) {
      this.updateCatalog(this.catalog_file);
      return;
    }

    fs.readFile(this.catalog_file, (err, data) => {
      if (err) {
        log.error(`${this.name} - Unable to load ${this.catalog_file} - ${err.message}`);
      } else {
        try {
          log.info(`${this.name} - Loading catalog ${this.catalog_file}`);
          const catalog = JSON.parse(data);
          this.addCatalog(catalog);
        } catch (err) {
          log.error(`${this.name} - Unable to parse ${this.catalog_file} - ${err.message}`);
        }
      }
    });
  }

  /**
   * Fetches and updates the catalog, saving it to disk.
   * If the fetch fails, marks catalog as failed if empty.
   */
  async updateCatalog() {
    if (this.catalog_status === status.inProgress) {
      log.info(`${this.name} - Fetch already in progress`);
      return;
    }
    this.catalog_status = status.inProgress
    log.info(`${this.name} - Fetching Catalog`);
    const catalog = await this.fetchCatalog();
    if (catalog) {
      this.saveCatalog(catalog);
    } else {
      // if there is no current catalog and the fetch mark the current catalog as failed
      if (this.catalog_size == 0) {
        this.catalog_status = status.failed;
      }
      log.error(`${this.name} - Error fetching catalog`);
    }
  }

  /**
   * Sets the callback function to invoke on data error.
   * @param {Function} callback - Function to call on error.
   */
  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  /**
   * Sets the callback function to invoke when data is successfully fetched.
   * @param {Function} callback - Function to call on success.
   */
  setCompleteCallback(callback) {
    this.completeCallback = callback;
  }

  /**
   * Handles errors in data fetching.
   * @param {Object} entry - Data entry.
   * @param {Error|string} err - Error object or message.
   */
  dataError(entry, err) {
    this.jobs.remove(entry);
    this.errorCallback(entry, err);
  }

  /**
   * Mark a data entry as completed.
   * @param {Object} entry - Data entry object.
   */
  dataComplete(entry) {
    this.jobs.remove(entry);
    this.completeCallback(entry);
  }

  /**
   * Fetch data for an entry using HTTP.
   * @param {string|Array<Object>} urls - Single URL or list of objects {url, file}.
   * @param {Object} entry - Data entry object.
   */
  async fetchDataHttp(urls, entry) {
    if (typeof urls == 'string') {
      urls = [ { 'url': urls, 'file': path.basename(urls) } ];
    }

    // clear existing entry size for when we are resuming.
    entry.size = 0

    let update_size = true
    // if the data source has a size set, don't update the size in _fetchDataHttp
    if (entry.size_s > 0) {
      update_size = false;
    }

    for (const url of urls) {
      // return on failure or abort/remove
      if (entry.status === status.failed) {
        return;
      }
      try {
        await this._fetchDataHttp(url.url, url.file, entry, update_size);
      } catch (err) {
        this.dataError(entry, `${this.name}/fetchDataHttp - ${err}`);
        return;
      }
    }
    this.dataComplete(entry)
  }

  /**
   * Internal method to fetch a single file via HTTP and unpack if necessary.
   * @param {string} url - URL of the file.
   * @param {string} file - File name.
   * @param {Object} entry - Data entry object.
   * @param {boolean} [update_size=true] - Whether to update the size.
   */
  async _fetchDataHttp(url, file, entry, update_size = true) {
    // get content-size from http headers
    let headers = await tools.httpGetHeaders(url);
    let remote_size = 0;
    if (headers['content-length']) {
      remote_size = parseInt(headers['content-length'], 10);
      if (update_size) {
        entry.size_s += remote_size;
      }
    }

    let data_dest = path.join(this.data_dir, entry.dir);
    let dest_file = path.join(data_dest, file);

    let options = {};
    let file_size = 0;

    try {
      // if the file already exists and is not complete, try and continue
      if (fs.existsSync(dest_file)) {
        file_size = fs.statSync(dest_file).size;
        entry.size += file_size;

        if (file_size < remote_size && headers['accept-ranges'] === 'bytes') {
          options.headers = { 'range': `bytes=${file_size}-${entry.size_s}`}
        }
      }
    } catch (err) {
      throw err;
    }

    if (file_size < remote_size) {
      try {
        await tools.httpRequest(url, options, dest_file,
        (controller) => {
          this.jobs.add(entry, controller, `Fetching ${url} to ${entry.dir}`);
        },
        (data) => {
          entry.size += data.length;
        });
      } catch (err) {
        throw err;
      };
    }

    const {cmd, args} = tools.getUnpackCmd(dest_file, data_dest);
    // if the file is an archive, unpack it
    if (cmd) {
      try {
        const msg = `${this.name}/fetchDataHttp - Unpacking ${file} to ${entry.dir}`
        log.info(msg);
        await tools.unpack(dest_file, data_dest, null, null, (controller) => {
          this.jobs.add(entry, controller, msg);
        });

        await this.unpackDirectory(entry, data_dest);
      } catch (err) {
        throw err;
      }
    }
  }

  /**
   * Unpacks nested compressed files in a directory.
   * @param {Object} entry - Data entry object.
   * @param {string} dest_dir - Destination directory to unpack to.
   * @returns {Promise<void>}
   */
  async unpackDirectory(entry, dest_dir) {
    // go through the contents of the archive and unpack any additional files
    // this is required as some data source images are gzipped/bzipped individually
    return await tools.fileCallback(dest_dir, async (file) => {
      const {cmd, args} = tools.getUnpackCmd(file, dest_dir);
      if (cmd) {
        try {
          const msg = `unpackDirectory - Unpacking ${file}`;
          log.info(msg);
          await tools.unpack(file, dest_dir, cmd, args, (controller) => {
            this.jobs.add(entry, controller, msg);
          });
        } catch (err) {
          // if an abort signal was received return false, so we can stop the file traversal in fileCallback
          if (err.code == 'ABORT_ERR') {
            throw err;
          } else {
            // log the error and continue
            log.error(`unpackDirectory - ${err}`);
          }
        }
      }
      return true;
    });
  }

  /**
   * Fetches data source catalog size via rsync and updates catalog.
   * @param {string} url - Rsync source URL.
   * @param {Object} catalog - Catalog object to populate.
   */
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

  /**
   * Fetches a dataset via rsync and unpacks it if needed.
   * @param {string} url - Rsync base URL.
   * @param {Object} entry - Data entry object.
   */
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
          this.jobs.add(entry, controller, `Fetching (rsync) ${url}/${entry.id} to ${entry.dir}`);
        });

      await this.unpackDirectory(entry, data_dest);
    } catch (err) {
      this.dataError(entry, err);
      return;
    }

    this.dataComplete(entry);
  }

  /**
   * Parses rsync listing output lines and updates the catalog object.
   * @param {Object} catalog - Catalog object.
   * @param {string[]} lines - Output lines from rsync listing.
   */
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