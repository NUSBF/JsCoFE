// pdbj data source

'use strict';

const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');

const dataSource = require('../data_source.js');
const { tools, status } = require('../tools.js');
const log = require('../log.js');

const URL_CAT = 'https://proteindiffraction.org/browse/';
const URL_DATA = 'https://data.proteindiffraction.org/';

const PAGE_SIZE = 100;

const RE_PDB = /structureId=([^\"]+)/;
const RE_PROJ = /project\/([^\"\/]+)/;
const RE_DATA = /data\.proteindiffraction\.org\/([^\"]+)/;
const RE_DOI = /doi\.org\/([^\"]+)/;

class irrmc extends dataSource {

  description = 'Integrated Resource for Reproducibility in Macromolecular Crystallography';
  url = 'https://proteindiffraction.org'
  type = 'http'

  async fetchCatalog() {
    let entries = {};
    let pages = 1, page = 1;
    log.debug(`${this.name} - Scraping entries...`);
    while (page <= pages) {
      let url = URL_CAT + '?show=' + PAGE_SIZE + '&page=' + page;

      let pdbid = [];
      let data = [];

      let html = await tools.httpRequest(url);
      let dom = cheerio.load(html);

      if (page == 1) {
        // extract the page number and break out if we are on the last page
        pages = dom('.pager').html().match(/Page \d+ of (\d+)/)[1];
      }

      // loop through each entry
      let group = dom('.panel-group');

      group.each((i, elem) => {
        let found, id, pdb, path, doi;

        // get entry name/description
        let name = dom(elem).find('.panel-heading small').text();

        // find the links
        let links = dom(elem).find('.panel-body .col-md-4 a');
        for (let j = 0; j < links.length; j++) {
          let link = links[j].attribs.href;

          // extract the project id
          found = link.match(RE_PROJ);
          if (found) {
            id = found[1].toLowerCase();
          }

          // extract the PDB id
          found = link.match(RE_PDB);
          if (found) {
            pdb = found[1].toLowerCase();
          }

          // extract download path
          found = link.match(RE_DATA);
          if (found) {
            path = found[1];
          }

          // extract doi id
          found = link.match(RE_DOI);
          if (found) {
            doi = found[1];
          }

        }

        const e = {};
        e.pdb = pdb;
        e.path = path;
        e.name = name;
        e.doi = doi;

        entries[id] = e;
      });

      if (page < pages) {
        // 2 second delay before next request
        await tools.sleep(2000);
      }

      page ++;
    }
    this.saveCatalog(entries);
  }

  async fetchData(user, id, catalog) {
    let url = path.join(URL_DATA, this.catalog[id].path);
    this.fetchDataHttp(url, user, id, catalog);
  }

}

module.exports = irrmc;