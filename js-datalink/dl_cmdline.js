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

    this.action_map = {
      search: this.datalink.searchSourceCatalogs,
      fetch: this.datalink.fetchData,
      remove: this.datalink.removeData,
      update: this.datalink.updateData,
      status: this.datalink.getDataStatus,
      status_all: this.datalink.getDataStatus,
      sources: this.datalink.getSource,
      sources_all: this.datalink.getAllSources,
      catalog: this.datalink.getSourceCatalog,
      catalog_all: this.datalink.getAllSourceCatalogs,
      catalog_update: this.datalink.updateSourceCatalog,
      catalog_update_all: this.datalink.updateAllSourceCatalogs,
      stats: this.datalink.getDataStats
    }

    this.arg_info.user.def = '@local';
  }

  async doCall(action, ...args) {
    let func = this.action_map[action];

    await this.waitForCatalogs();

    // need to use call and assign this.datalink as the given this
    let res = func.call(this.datalink, ...args);
    return res;
  }

  async waitForCatalogs() {
    for (const s in this.datalink.ds) {
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
      status_c = 0;
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
        percent = (size / size_s) * 100
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

  async sendFile(entry, dir, file) {
    const in_stream = fs.createReadStream(file);

    in_stream.on('error', (err) => {
      log.error(err);
      console.error(err.message);
    });

    in_stream.on('data', (data) => {
      this.size_uploaded += data.length;
      this.outputProgress(file);
    });

    try {
      await this.datalink.uploadData(entry, in_stream, file, (err) => {
      });
    } catch (err) {
        log.error(err);
        console.error(err.message);
    }
  }

  async upload(user, source, id) {
    // check username
    if (! tools.validUserName(user)) {
      return tools.errorMsg(`Invalid user name ${req.params.user}`, 400);
    }

    let check = tools.validSourceId(source, id);
    if (check !== true) {
      return check;
    }

    await this.waitForCatalogs();

    const entry = this.datalink.addEntryFromSource(user, source, id);
    if (! entry) {
      return tools.errorMsg(`Unable to add catalog entry for ${entry.dir}`, 500);
    }

    for (const [i, file] of this.opts.files.entries()) {
      try {
        await this.fileCallback(file, async (f) => {
          try {
            await this.sendFile(entry, file, f);
          } catch (err) {
            return true;
          }
          return true;
        });
      } catch (err) {
        console.log(err);
      }
    }

    this.datalink.dataComplete(entry);
    process.stdout.write('\x1b[K');
    return tools.successMsg(`Added files to ${entry.dir}`);
  }
}

const appclient = new appClient();
appclient.run();
