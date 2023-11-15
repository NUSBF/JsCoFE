const fs = require('fs');
const path = require('path');

const config = require('./config.js');
const { tools, status } = require('./tools.js');

const URL_ENTRY = 'https://data.rcsb.org/rest/v1/core/entry';
const CACHE_DIR = path.join(config.get('storage.catalog_dir'), 'rcsb');

class rcsb {

  static async getEntry(pdb) {
    try {
      let json = await tools.httpRequest(URL_ENTRY + '/' + pdb);
      let info = JSON.parse(json);
      return info;
    } catch (err) {
      return '';
    }
  }

}

module.exports = rcsb;