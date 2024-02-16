#!/usr/bin/env node

'use strict';

const log = require('./js/log.js');
log.newLog(`${process.cwd()}/dl_cmdline.log`);

const fs = require('fs');
const stream = require('stream');

const { tools, status } = require('./js/tools.js');
const datalink = require('./js/data_link.js');
const config = require('./js/config.js');

const client = require('./dl_client.js');

class appClient extends client {

  constructor() {
    super(true);
    this.datalink = new datalink(false);
    this.datalink.standalone = true;

    this.action_map = {
      search: this.datalink.searchSourceCatalog,
      fetch: this.datalink.fetchData,
      remove: this.datalink.removeData,
      update: this.datalink.updateData,
      status: this.datalink.getDataStatus,
      status_all: this.datalink.getDataStatus,
      catalog: this.datalink.getSourceCatalog,
      catalog_all: this.datalink.getAllSourceCatalogs
    }

    this.arg_info.user.def = '@local';

    this.setupSignals();
  }

  async doCall(action, ...args) {
    let func = this.action_map[action];

    await this.waitForCatalogs();

    // need to use call and assign this.datalink as the given this
    let res = func.call(this.datalink, ...args);
    return res;
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

  async fetchMultiple(user, results) {
    await super.fetchMultiple(user, results);

    let status_c = 0;
    while (status_c < Object.keys(results).length) {
      let size = 0;
      let size_s = 0;
      let percent = 0;
      for (const r of results) {
        let s = await this.doCall('status', user, r.source, r.id);
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
      console.log(`\nFetched ${r.source}/${r.id}\nData is available at ${tools.getDataDir(user)}/${r.source}/${r.id}`);
    }

  }

  async upload(user, source, id) {
    let check = tools.validSourceId(source, id);
    if (check !== true) {
      return check;
    }

    const in_s = fs.createReadStream(this.opts.file);
    const out_file = tools.sanitizeFilename(this.opts.file);

    in_s.on('error', (err) => {
      this.displayResult(tools.errorMsg(`${err}`, 500));
    });

    let out_s = await this.datalink.uploadData(user, source, id, out_file, in_s);

    if (out_s) {
      if (out_s instanceof stream.Writable) {
        out_s.on('finish', async () => {
          await this.datalink.uploadDataComplete(user, source, id, out_file);
          this.displayResult(tools.successMsg(`Added ${out_file} to ${user}/${source}/${id}`));
        });

        out_s.on('error', (err) => {
          this.displayResult(tools.errorMsg(`Error adding to ${user}/${source}/${id}`, 500));
        });
      }

      if (out_s.error) {
        return tools.errorMsg(`${r.message}`, 500);
      }
    }

  }

}

const appclient = new appClient();
appclient.run();
