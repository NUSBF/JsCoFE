// pdbj data source

'use strict';

const spawn = require('child_process').spawn;
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

  async getCatalog() {
    let entries = {};
    let pages, page = 1;
    log.debug(`${this.name} - Scraping entries...`);
    while (true) {
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

        // get entry description
        let desc = dom(elem).find('.panel-heading small').text();

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
        e.desc = desc;
        e.doi = doi;

        entries[id] = e;
      });

      if (page == pages) {
        break;
      }

      page ++;
      // 2 second delay before next request
      await tools.sleep(2000);
    }
    this.saveCatalog(entries);
  }

  async getData(user, id, catalog) {
    let entry = catalog.catalog[user][this.name][id];
    let url_path = this.catalog[id].path;
    let dest_dir = tools.getDataDest(user, this.name, id);
    let dest_file = path.join(dest_dir, path.basename(url_path));
    let url = path.join(URL_DATA, url_path);

    await tools.httpRequest(url, dest_file, entry);

    log.info(`${this.name} - Unpacking ${user}/${this.name}/${id}/${path.basename(url_path)}`);
    let sp = spawn('tar', [ '-x', '-C', dest_dir, '-f', dest_file, '--strip-components', 1]);
    sp.on('spawn', () => {
      log.debug(`${this.name}/getData - PID: ${sp.pid} = ${sp.spawnargs.join(' ')}`);
      this.addJob(user, id, sp.pid);
    });
    sp.stderr.on('data', (data) => {
      log.error(`${this.name}/getData - ${data}`);
    });
    sp.on('close', (code) => {
      if (code !== 0) {
        log.error(`${this.name}/getData - ${sp.spawnargs.join(' ')} exited with code ${code}`);
      } else {
        try {
          fs.rmSync(dest_file, { force: true });
          this.dataComplete(user, id, catalog);
        } catch (err) {
          log.error(`${this.name}/getData - ${err.message}`);
          entry.status = status.failed;
        }
      }
    });

  }

}

module.exports = irrmc;