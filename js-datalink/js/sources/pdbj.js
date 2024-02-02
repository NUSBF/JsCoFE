// pdbj data source

'use strict';

const fs = require('fs');

const dataSource = require('../data_source.js');
const { tools } = require('../tools.js');
const log = require('../log.js');

const URL_JSON = 'https://xrda.pdbj.org/rest/public/entries/search'
const URL_RSYNC = 'data.pdbjbk1.pdbj.org::rsync/xrda/';

/* example result array
[
  30,
  "5ws4",
  "Crystal structure of tripartite-type ABC transporter MacB from Acinetobacter baumannii",
  "Murakami, S., Okada, U., Yamashita, E.",
  "10.1038/s41467-017-01399-2",
  1626307200,
  1626307200,
  3.4,
  "/MacB-1/mbs671b_000001.jpg"
]
*/

const res = {
  id:    0,
  pdb:   1,
  name:  2,
  auth:  3,
  doi:   4
}

class pdbj extends dataSource {

  description = 'PDBj (Protein Data Bank Japan): The Xtal Raw Data Archive (XRDA)';
  url = 'https://xrda.pdbjbk1.pdbj.org/';
  type = 'rsync'

  async getCatalog() {
    let catalog = {};
    let json = await tools.httpRequest(URL_JSON);
    let obj = JSON.parse(json);
    for (const r of obj.results) {
      let id = r[res.pdb];

      // if there is no pdb entry, use the id
      if (! id) {
        id = r[res.id];
      }

      const e = {};
      e.path = id.toString();
      e.pdb = r[res.pdb];
      e.doi = r[res.doi];
      e.name = r[res.name];
      e.auth = r[res.auth];

      catalog[id] = e;
    }
    await this.fetchCatalogRsync(URL_RSYNC, catalog)
    this.saveCatalog(catalog);
  }

  getData(user, id, catalog) {
    this.fetchDataRsync(URL_RSYNC, user, id, catalog);
  }

}

module.exports = pdbj;