// zenodo data source

'use strict';

const fs = require('fs');
const path = require('path');

const dataSource = require('../data_source.js');
const { tools, status } = require('../tools.js');
const config = require('../config.js');
const log = require('../log.js');

// URL to download archives from
const URL_FILES = 'https://zenodo.org/records'

// match all records that contain 'PDB' and have a dataset (100 records per page)
const URL_API = 'https://zenodo.org/api/records?q=pdb&type=dataset&size=100';
const PAGE_SIZE = 100;

const CACHE_DIR = path.join(config.get('storage.catalog_dir'), 'zenodo');
const CACHE_FILE = path.join(CACHE_DIR, 'pdbs.json');

// 28 days cache time
const CACHE_TIME_MS = 1000 * 60 * 60 * 24 * 28;

// detect PDB identifier
const PDB_RE = /\s([0-9][A-Za-z0-9]{3})[^A-Za-z0-9]/;

class zenodo extends dataSource {

  description = 'Zenodo';
  url = 'https://zenodo.org/';
  type = 'http';

  async getAllPDBs() {
    const CACHE_FILE_GZ = CACHE_FILE + '.gz';
    let json, pdb_ids;

    try {
      json = tools.getFileCache(CACHE_FILE, CACHE_TIME_MS);
      if (json === false) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        await tools.httpRequest('https://files.wwpdb.org/pub/pdb/holdings/released_structures_last_modified_dates.json.gz', {}, CACHE_FILE_GZ);
        const {cmd, args} = tools.getUnpackCmd(CACHE_FILE_GZ, CACHE_DIR);
        if (cmd) {
          await tools.unpack(CACHE_FILE_GZ, CACHE_DIR, cmd, args);
        }
        json = fs.readFileSync(CACHE_FILE);
      }
      pdb_ids = JSON.parse(json);
    } catch (err) {
      log.error(`${this.name}/getAllPDBs - ${err}`);
      return false;
    }

    return pdb_ids;
  }

  async fetchCatalog() {
    const PDB_IDS = await this.getAllPDBs();

    let catalog = {};

    let url = URL_API;
    while (url) {
      let json;
      try {
        json = await tools.httpRequest(url);
      } catch (err) {
        log.error(`${this.name}/fetchCatalog - ${err}`)
        return false;
      }
      let obj = JSON.parse(json);

      for (const r of obj.hits.hits) {
        const e = {};
        let id = r.id;

        let pdb = '';

        // try and extract a PDB identifier from title or description
        for (const field of [r.metadata.title, r.metadata.description]) {
          if (! field) {
            continue;
          }
          const match = field.match(PDB_RE);
          if (match) {
            let pdb_temp = match[1];
            if (pdb_temp.match(/[0-9]/)) {
              if (PDB_IDS && PDB_IDS[pdb_temp.toUpperCase()]) {
                pdb = pdb_temp;
                break;
              }
            }
          }
        }

        // if no PDB identifier is found, skip to the next record
        if (pdb == '') {
          continue;
        }

        let files = [];
        let size = 0;
        for (const file of r.files) {
          files.push(file.key);
          size += file.size;
        }

        let creators = [];
        for (const creator of r.metadata.creators) {
          creators.push(creator.name);
        }

        e.pdb = pdb.toLowerCase();
        e.doi = r.doi;
        e.name = r.title;
        e.path = files;
        e.auth = creators;
        e.size = size;

        catalog[id] = e;
      }

      // get next page
      url = obj.links.next;

      if (url) {
        // 2 second delay before next request
        await tools.sleep(2000);
      }

    }

    return catalog;
  }

  async fetchData(entry) {
    const url_base = `${URL_FILES}/${entry.id}/files`;
    let urls = [];
    for (const file of this.catalog[entry.id].path) {
      urls.push({ 'url': `${url_base}/${file}`, 'file': file });
    }
    this.fetchDataHttp(urls, entry);
  }

}

module.exports = zenodo;
