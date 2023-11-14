// pdbj data source

'use strict';

const fs = require('fs');
const cheerio = require('cheerio');

const dataSource = require('../data_source.js');
const { tools } = require('../tools.js');
const log = require('../log.js');

const URL_CAT = 'https://data.sbgrid.org/data/';
const URL_RSYNC = 'data.sbgrid.org::10.15785/SBGRID/';

const RE_PDB = /structureId=([^\"]+)/;
const RE_PROJ = /dataset\/([^\"\/]+)/;

class sbgrid extends dataSource {

  description = 'The SBGrid Data Bank';
  url = 'https://data.sbgrid.org'

  async getCatalog() {
    let entries = {};
    let pages, page = 1;
    log.debug(`${this.name} - Scraping entries...`);
    while (true) {
      let url = URL_CAT + '?page=' + page;
      log.debug(url);

      let pdbid = [];
      let data = [];

      let html = await tools.httpRequest(url);
      let dom = cheerio.load(html);

      // get number of pages
      if (page == 1) {
        pages = dom('ul.paginator li a.page').last().text();
      }

      // loop through each entry
      let group = dom('.media-body');

      group.each((i, elem) => {
        let found, proj, pdb, doi;

        // get entry description
        let desc = dom(elem).find('h3').text();

        // find the links
        let links = dom(elem).find('a');
        for (let j = 0; j < links.length; j++) {
          let href = links[j].attribs.href;

          // extract the project id
          found = href.match(RE_PROJ);
          if (found) {
            proj = found[1].toLowerCase();
            doi = links[j].children[0].data;
          }

          // extract the PDB id
          found = href.match(RE_PDB);
          if (found) {
            pdb = found[1].toLowerCase();
          }

          // if there is no pdb id found, use the project id
          if (! pdb) {
            pdb = proj;
          }

        }

        entries[proj] = {};
        entries[proj].path = proj;
        entries[proj].pdb = pdb;
        entries[proj].desc = desc;
        entries[proj].doi = doi;

      });

      if (page == pages) {
        break;
      }

      page ++;
    }
    this.saveCatalog(entries);
  }

  getCatalogOld() {
    this.rsyncGetCatalog(URL_RSYNC);
  }

  getData(user, id, catalog) {
    this.rsyncGetData(URL_RSYNC, user, id, catalog);
  }

}

module.exports = sbgrid;