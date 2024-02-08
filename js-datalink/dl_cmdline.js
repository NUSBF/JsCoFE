#!/usr/bin/env node

'use strict';

const log = require('./js/log.js');
log.newLog(`${process.cwd()}/app.log`);

const { tools, status } = require('./js/tools.js');
const datalink = require('./js/data_link.js');
const config = require('./js/config.js');


const { program } = require('commander');

class client {

  constructor() {
    this.datalink = new datalink(false);
    this.setupSignals();
  }

  setupSignals() {
    let called = false;
    process.on('SIGINT', async () => {
      if (! called) {
        called = true;
        console.log("\nCaught interrupt signal");
        this.abortAllJobs();
        await tools.sleep(500);
        process.exit(1);
      }
    });
  }

  abortAllJobs() {
    for (const s of Object.values(this.datalink.source)) {
      for (const j of Object.values(s.jobs)) {
        j.abort();
      }
    }
  }

  async waitForCatalogs() {
    for (const s in this.datalink.source) {
      await this.datalink.waitForCatalog(s);
    }
  }

  async searchPDB(pdb) {
    let res = await this.datalink.searchSourceCatalog(pdb);

    this.displayResult(res);
  }

  fetch(user, source, id) {
    let res = this.datalink.fetchData(user, source, id, true);

    if (res.error) {
      this.displayResult(res);
    }

    this.fetchMultiple(user, [ { source: source, id: id } ] );
  }

  async fetchPDB(user, pdb) {
    const res = await this.datalink.searchSourceCatalog(pdb);

    if (res.error) {
      this.displayResult(res);
      return;
    }

    this.fetchMultiple(user, res.results);
  }

  async fetchMultiple(user, results) {
    for (const r of results) {
      let st = this.datalink.fetchData(user, r.source, r.id, true);
      if (st.success) {
        let s = this.datalink.getDataStatus(user, r.source, r.id);
        console.log(`Fetching ${r.source}/${r.id}\nName: ${s.name}`);
      } else {
        return;
      }
    }

    let status_c = 0;
    while (status_c < Object.keys(results).length) {
      let size = 0;
      let size_s = 0;
      let percent = 0;
      for (const r of results) {
        let s = this.datalink.getDataStatus(user, r.source, r.id);
        if (s.status == status.completed) {
          status_c += 1;
        }

        // calculate percentage
        size += s.size;
        size_s += s.size_s;
      }
      if (size_s > 0) {
        percent = size / size_s * 100
        if (percent >= 100) {
            percent = 100
        }
      }
      process.stdout.write(`${size}/${size_s} (${percent.toFixed(2)}%)\r`);
      await tools.sleep(1000);
    }

    for (const r of results) {
      console.log(`Fetched ${r.source}/${r.id}\nData is available at ${tools.getDataDir(user)}/${r.source}/${r.id}`);
    }

  }

  status(user, source, id) {
    return this.datalink.getDataStatus(user, source, id);
  }

  update(user, source, id, field, value) {
    let obj = {};
    obj[field] = value;
    return this.datalink.updateData(user, source, id, obj);
  }

  remove(user, source, id) {
    return this.datalink.removeData(user, source, id)
  }

  displayResult(res) {
    if (! res) {
      return;
    }
    if (res.error) {
      console.error(res.msg);
      process.exitCode = 1;
    } else if (res.success) {
      console.log(res.msg);
    } else {
      try {
        console.log(JSON.stringify(res, null, 2));
      } catch {
        console.log(res);
      }
    }
  }

  processArgs() {
    program
      .argument('<action>', 'catalog/catalogue, search, fetch, status, update or remove')
      .description('Data Link: ')
      .option('--user <user>', `Data will be stored in ${tools.getDataDir()}/<user>`, '@local')
      .option('--source <source>', 'folder to filter by')
      .option('--id <id>', 'id of entries')
      .option('--pdb <id>', 'PDB identifier')
      .option('--field <key=value>', 'Used for action <update> to update data catalog entry value (eg., in_use=true)')
      .action(async (name, options, command) => {
        await this.waitForCatalogs();
        let res = null;

        // parameter check
        switch(name) {
          case 'update':
            if (! options.field) {
              res = { error: true, msg: 'You need to include a --field key=value parameter' };
            }
          case 'fetch':
          case 'remove':
            if (! (options.user && options.source && options.id)) {
              res = { error: true, msg: `You need to provide a <user>, <source> and an <id> of the data to ${name}`};
            }
            break;
        }
        if (res) {
          this.displayResult(res);
          return;
        }

        // process actions
        switch(name) {
          case 'catalog':
          case 'catalogue':
            if (options.source) {
              res = this.datalink.getSourceCatalog(options.source);
            } else {
              res = this.datalink.getAllSourceCatalogs();
            }
            break;
          case 'search':
            this.searchPDB(options.pdb);
            break;
          case 'fetch':
            if (options.pdb) {
              this.fetchPDB(options.user, options.pdb);
            } else {
              this.fetch(options.user, options.source, options.id);
            }
            break;
          case 'status':
            res = this.status(options.user, options.source, options.id);
            break;
          case 'update':
            let spl = options.field.split('=');
            if (spl[0] && spl[1]) {
              res = this.update(options.user, options.source, options.id, spl[0], spl[1]);
            } else {
              res = { error: true, msg: `Invalid field format. Please use --field key=value`};
            }
            break;
          case 'remove':
            res = this.remove(options.user, options.source, options.id);
            break;
          default:
            console.log(`No such action <${name}>`);
            process.exitCode = 1;
        }
        this.displayResult(res);
      });

    program.parse();
  }

}

client = new client();
client.processArgs();
