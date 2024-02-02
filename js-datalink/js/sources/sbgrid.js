// pdbj data source

'use strict';

const fs = require('fs');
const cheerio = require('cheerio');

const dataSource = require('../data_source.js');
const { tools } = require('../tools.js');
const log = require('../log.js');

const URL_CAT = 'https://data.sbgrid.org/data/';
// primary server = data.sbgrid.org::10.15785/SBGRID/
const URL_RSYNC = 'sbgrid.icm.uu.se::10.15785/SBGRID/';

const RE_PDB = /structureId=([^\"]+)/;
const RE_PROJ = /dataset\/([^\"\/]+)/;

class sbgrid extends dataSource {

  description = 'The SBGrid Data Bank';
  url = 'https://data.sbgrid.org'
  type = 'rsync'

  async getCatalog() {
    let catalog = {};
    let pages = 1, page = 1;
    log.debug(`${this.name} - Scraping catalog...`);
    while (page <= pages) {
      let url = URL_CAT + '?page=' + page;

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

        // get entry name/description
        let name = dom(elem).find('h3').text();

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

        const e = {};
        e.path = proj;
        e.pdb = pdb;
        e.name = name;
        e.doi = doi;

        catalog[proj] = e;
      });

      if (page < pages) {
        // 2 second delay before next request
        await tools.sleep(2000);
      }

      page ++;
    }
    await this.rsyncGetCatalog(URL_RSYNC, catalog)
    this.saveCatalog(catalog);
  }

  getData(user, id, catalog) {
    this.rsyncGetData(URL_RSYNC, user, id, catalog);
  }

}

module.exports = sbgrid;