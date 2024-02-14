#!/usr/bin/env node

'use strict';

const https = require('https');
const http = require('http');

class Client {

  opts = {};
  arg_info = {};
  action_map = {};

  constructor(app_client = false) {
    this.app_client = app_client;

    if (! this.app_client) {
      // list of valid parameters
      Object.assign(this.arg_info, {
        url: {
          form: 'url', 
          help: 'URL of the Data Link API including port eg http://localhost:9100/api'
        },
        cloudrun_id: {
          form: 'id', 
          help: 'CCP4 Cloud cloudrun_id for <user> used to authenticate'
        },
        admin_key: {
          form: 'key', 
          help: 'Data Link admin_key used to authenticate'
        }
      });

      Object.assign(this.action_map, {
        search: {
          path: 'search/@0',
          method: 'GET'
        },
        fetch: {
          path: 'data/@0/@1/@2',
          method: 'PUT',
          auth: 'user'
        },
        remove: {
          path: 'data/@0/@1/@2',
          method: 'DELETE',
          auth: 'user'
        },
        update: {
          path: 'data/@0/@1/@2',
          method: 'PATCH',
          auth: 'user'
        },
        status: {
          path: 'data/@0/@1/@2',
          method: 'GET',
          auth: 'user'
        },
        status_all: {
          path: 'data',
          method: 'GET',
          auth: 'admin'
        },
        catalog: {
          path: 'sources/@0/catalog',
          method: 'GET',
        },
        catalog_all: {
          path: 'sources/*/catalog',
          method: 'GET',
        }
      });
    }

    Object.assign(this.arg_info, {
      user: {
        form: 'user',
        help: 'User to manage data for'
      },
      source: {
        form: 'source',
        help: 'Data Source to use'
      },
      id: {
        form: 'id',
        help: 'id of entries'
      },
      pdb: {
        form: 'id', 
        help: 'PDB identifier'
      },
      field: {
        form: 'key=value',
        help: 'Used for action <update> to update data catalog entry value (eg., in_use=true)'
      }
    });

  }

  async doCall(action, ...args) {
    // client mode - talk to http server
    let params = this.action_map[action];

    let res;
    let path = params.path;

    // replace /@0, /@1 etc with args
    for (const i in args) {
      let r = args[i];
      if (r) {
        r = '/' + args[i];
      } else {
        r = '';
      }
      path = path.replace('/@' + i, r);
    }

    // request method
    let method = params.method;

    // http request options
    let options = {};

    // add authentication headers
    if (params.auth === 'user') {
      // if the argument requires user authentication and cloudrun_id is set, use it
      if (this.opts.cloudrun_id) {
        options.headers = { cloudrun_id: this.opts.cloudrun_id };
      // otherwise use the admin_key if it's set
      } else {
        options.headers = { admin_key: this.opts.admin_key };
      }
    }

    // if the argument requires admin authentication add the admin_key if it's set
    if (params.auth === 'admin' && this.opts.admin_key) {
      options.headers = { admin_key: this.opts.admin_key };
    }

    // make the request
    try {
      res = await this.httpRequest(this.opts.url + '/' + path, method, options);
      return JSON.parse(res.body);
    } catch (err) {
      return { error: true, msg: err };
    }
  }

  async fetch(user, source, id) {
    const res = await this.doCall('fetch', user, source, id);

    if (res.error) {
      this.displayResult(res);
    }

    this.fetchMultiple(user, [ { source: source, id: id } ] );
  }

  async search(pdb) {
    const res = await this.doCall('search', this.opts.pdb);
    if (res.results && res.results.length == 0) {
      return { error: true, msg: `No data sources found for ${this.opts.pdb}` };
    }
    return res;
  }

  async fetchPDB(user, pdb) {
    const res = await this.search(pdb);

    if (res.error) {
      this.displayResult(res);
      return;
    }

    this.fetchMultiple(user, res.results);
  }

  async fetchMultiple(user, results) {
    for (const r of results) {
      let res = await this.doCall('fetch', user, r.source, r.id);
      if (res.success) {
        let res = await this.doCall('status', user, r.source, r.id);
        if (res.status === 'completed') {
          console.log(`Already fetched ${r.source}/${r.id}\nName: ${res.name}`);
        } else {
          console.log(`Fetching ${r.source}/${r.id}\nName: ${res.name}`);
        }
      }
      return res;
    }
  }

  async status(user, source, id) {
    let res;
    if (! (user && source && id)) {
      res = await this.doCall('status_all', user, source, id);
    } else {
      res = await this.doCall('status', user, source, id);
    }
    return res;
  }

  async update(user, source, id, field, value) {
    const obj = {};
    obj[field] = value;
    return await this.doCall('update', user, source, id, obj);
    return this.datalink.updateData(user, source, id, obj);
  }

  httpRequest(url, method, options = {}) {
    if (method) {
      options.method = method;
    }

    if (! options.method) {
      options.method = 'GET';
    }

    return new Promise ((resolve, reject) => {
      let req = this.proto.request(url, options, (res) => {
        res.resume();

        let out = '';

        res.on('data', (data) => {
          out += data;
        });

        res.on('close', () => {
          resolve( { code: res.statusCode, body: out } );
        });
      });

      req.on('error', (err) => {
        reject(`${err.message}`);
      });

      req.end();
    });
  }

  showHelp() {
    const pad = 25;
    const cmd = process.argv[1].split('/').pop();
    console.log(`Usage: ${cmd} [options] <action>`);
    console.log();
    console.log('Arguments:');
    console.log('  action'.padEnd(pad) + 'catalog/catalogue, search, fetch, status, update or remove');
    console.log('\nOptions:');
 
    for (const [n, o] of Object.entries(this.arg_info)) {
      let out = `  --${n} <${o.form}>`.padEnd(pad) + o.help;
      // if we have a default for the argument
      if (o.def) {
        out += ` (default: ${o.def})`;
      }
      console.log(out);
    }
    console.log('  -h, --help'.padEnd(pad) + 'display help for command\n');
  }

  async run() {
    const res = await this.processArgs();
    if (res) {
      this.displayResult(res);
    }
  }

  async processArgs() {
    const argv = process.argv;

    // get additional parameters
    let params = argv.slice(2);

    // set any default options
    for (const [o, arg] of Object.entries(this.arg_info)) {
      if (arg.def) {
        this.opts[o] = arg.def;
      }
    }

    // process parameters until empty
    while (params.length) {
      let key = params.shift();
      let value;
      // handle --help/-h
      if (['--help', '-h'].includes(key)) {
        this.showHelp();
        return;
      }
      // if it is an option starting with --
      if (key.startsWith('--')) {
        // extract the option and value
        let option = key.substring(2);
        // validate the option against arg_info, and set it in our options object
        if (this.arg_info[option]) {
          this.opts[option] = params.shift();
        } else {
          return { error: true, msg: `error: unknown option '${key}'`};
        }
      } else {
        this.action = key;
      }
    }

    // check if we have an action
    if (! this.action) {
      this.showHelp();
      return;
    }

    // set this.proto to http or https depending on url
    if (this.opts.url) {
      if (this.opts.url.startsWith('https')) {
        this.proto = https;
      } else {
        this.proto = http;
      }
    }

    let res;
    // parameter check
    switch(this.action) {
      case 'search':
        if (! this.opts.pdb) {
          res = { error: true, msg: 'You need to include a --pdb to search for' };
        }
        break;
      case 'update':
        if (! this.opts.field) {
          res = { error: true, msg: 'You need to include a --field key=value parameter' };
        } else if (this.opts.field.split('=').length !== 2) {
          res = { error: true, msg: `Invalid field format. Please use --field key=value`};
        }
      case 'fetch':
      case 'remove':
        if (! this.opts.user) {
          res = { error: true, msg: `You need to provide a <user> for ${this.action}`};
        } else if (! this.opts.pdb && ! (this.opts.source && this.opts.id)) {
          res = { error: true, msg: `You need to provide a data <source> and <id> or a pdb <id> of the data to ${this.action}`};
        }
        break;
    }

    if (res) {
      return res;
    }

    // process actions
    switch(this.action) {
      case 'catalog':
      case 'catalogue':
        if (this.opts.source) {
          res = await this.doCall('catalog', this.opts.source);
        } else {
          res = await this.doCall('catalog_all', this.opts.source);
        }
        break;
      case 'search':
        res = this.search(this.opts.pdb);
        break;
      case 'fetch':
        if (this.opts.pdb) {
          this.fetchPDB(this.opts.user, this.opts.pdb);
        } else {
          this.fetch(this.opts.user, this.opts.source, this.opts.id);
        }
        break;
      case 'status':
        res = await this.status(this.opts.user, this.opts.source, this.opts.id);
        break;
      case 'update':
        let spl = this.opts.field.split('=');
        res = await this.update(this.opts.user, this.opts.source, this.opts.id, spl[0], spl[1]);
        break;
      case 'remove':
        res = await this.doCall('remove', this.opts.user, this.opts.source, this.opts.id);
        break;
      default:
        res = { error: true, msg: `No such action <${this.action}>` };
    }
    return res;
  }

  displayResult(res) {
    if (! res) {
      return;
    }

    if (res.err) {
      process.exitCode = 1;
    }

    try {
      console.log(JSON.stringify(res, null, 2));
    } catch {
      console.log(res);
    }
  }

}

if (require.main === module) {
  const client = new Client();
  client.run();
}

module.exports = Client;
