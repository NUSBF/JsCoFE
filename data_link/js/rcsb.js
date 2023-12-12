const fs = require('fs');
const path = require('path');

const { tools, status } = require('./tools.js');
const config = require('./config.js');
const log = require('./log.js');

const URL_ENTRY = 'https://data.rcsb.org/rest/v1/core/entry';
const CACHE_DIR = path.join(config.get('storage.catalog_dir', 'catalogs'), 'rcsb');

// 28 days cache time
const CACHE_TIME_MS = 1000 * 60 * 60 * 24 * 28;

class rcsb {

  static async getEntry(pdb) {
    try {
      let json;
      // use a subfolder under CACHE_DIR based on 2nd and 3rd pdb characters
      let dir = path.join(CACHE_DIR, pdb.substr(1, 2));
      fs.mkdirSync(dir, { recursive: true });
      let file = path.join(dir, pdb + '.txt');
      json = tools.getFileCache(file, CACHE_TIME_MS);
      if (json === false) {
        json = await tools.httpRequest(URL_ENTRY + '/' + pdb);
        if (json !== undefined ) {
          fs.writeFileSync(file, json);
        } else {
          return null;
        }
      }
      let info = JSON.parse(json);
      return info;
    } catch (err) {
      log.error(`rcsb.getEntry - ${err}`);
    }
    return null;
  }

}

module.exports = rcsb;