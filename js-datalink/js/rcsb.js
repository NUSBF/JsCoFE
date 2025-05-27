const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');

const URL_ENTRY = 'https://data.rcsb.org/rest/v1/core/entry';
const CACHE_DIR = path.join(config.get('storage.catalog_dir'), 'rcsb');

// 28 days cache time in milliseconds
const CACHE_TIME_MS = 1000 * 60 * 60 * 24 * 28;

/**
 * Class for retrieving and caching structural biology entries from the RCSB Protein Data Bank.
 */
class rcsb {

  /**
   * Retrieves a PDB entry from the cache or fetches it from the RCSB server.
   * Caches the result for 28 days.
   *
   * @param {string} pdb - The 4-character PDB ID (e.g. "1abc").
   * @returns {Promise<Object|null>} The parsed JSON entry if found, otherwise `null`.
   */
  static async getEntry(pdb) {
    try {
      let json;
      // use a subfolder under CACHE_DIR based on the 2nd and 3rd characters of the pdb ID
      let dir = path.join(CACHE_DIR, pdb.substr(1, 2));
      fs.mkdirSync(dir, { recursive: true });

      let file = path.join(dir, pdb + '.txt');

      // try to retrieve from cache
      json = tools.getFileCache(file, CACHE_TIME_MS);

      // if not cached or expired, fetch from the RCSB API
      if (json === false) {
        json = await tools.httpRequest(URL_ENTRY + '/' + pdb);
        if (json !== undefined ) {
          fs.writeFileSync(file, json);
        } else {
          return null;
        }
      }

      // Parse and return the JSON entry
      let info = JSON.parse(json);
      return info;

    } catch (err) {
      log.error(`rcsb.getEntry - ${err}`);
    }

    return null;
  }

}

module.exports = rcsb;