#!/usr/bin/env node

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class Client {

  opts = {};
  arg_info = {};
  action_map = {};
  boundary = null;
  size_total = 0;
  size_uploaded = 0;

  constructor(app_client = false) {
    this.app_client = app_client;

    if (! this.app_client) {
      // list of valid parameters
      Object.assign(this.arg_info, {
        url: {
          form: 'url', 
          help: 'URL of the Data Link API including port eg http://localhost:8100/api'
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
          path: 'search/?f=@0&q=@1',
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
        upload: {
          path: 'data/@0/@1/@2/upload',
          method: 'POST',
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
        sources: {
          path: 'sources/@0',
          method: 'GET',
        },
        sources_all: {
          path: 'sources/*',
          method: 'GET',
        },
        catalog: {
          path: 'sources/@0/catalog',
          method: 'GET',
        },
        catalog_all: {
          path: 'sources/*/catalog',
          method: 'GET',
        },
        catalog_update: {
          path: 'sources/@0/update',
          method: 'PUT',
          auth: 'admin'
        },
        catalog_update_all: {
          path: 'sources/*/update',
          method: 'PUT',
          auth: 'admin'
        },
        stats: {
          path: 'stats',
          method: 'GET'
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
      field: {
        form: 'field',
        help: 'Used for actions <search> and <update> to select field to search or update'
      },
      value: {
        form: 'value',
        help: 'Used for action <search> and <update> for value to search for or set field to'
      },
      no_progress: {
        type: 'boolean',
        help: 'Don\'t output progress during upload'
      }
    });

  }

  getBoundary() {
    if (! this.boundary) {
      this.boundary = this.generateBoundary();
    }
    return this.boundary;
  }

  async doCall(action, ...args) {
    // client mode - talk to http server
    let params = this.action_map[action];

    let url_path = params.path;

    // replace /@0, /@1 etc with args
    for (let [i, arg] of args.entries()) {
      if (! arg) {
        arg = '';
      }
      arg = encodeURIComponent(arg);
      url_path = url_path.replace('@' + i, arg);
    }

    // replace any double '//' leftover when empty arguments are included (eg. for status)
    url_path = url_path.replace(/\/\//g,'/');

    // request method
    let method = params.method;

    // http request options
    let options = {};

    // add authentication headers
    // if the action requires authentication and the admin_key is set, add to headers.
    // otherwise, if the action requires user auth and cloudrun_id is set, use that.
    if (params.auth && this.opts.admin_key) {
      options.headers = { admin_key: this.opts.admin_key };
    } else if (params.auth === 'user' && this.opts.cloudrun_id) {
      options.headers = { cloudrun_id: this.opts.cloudrun_id };
    }

    // handle file uploads
    let files = null;
    if (action == 'upload') {
      files = this.opts.files;
      options.headers['Content-Type'] = `multipart/form-data; boundary=${this.getBoundary()}`;
    }

    // if we are updating a field, get the last argument to use as the body
    let body = null;
    if (action == 'update') {
      body = args.pop();
      // if the argument is an object, then convert to json
      if (typeof body == 'object') {
        body = JSON.stringify(body);
      }
      options.headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    // make the request
    try {
      const url = this.opts.url + url_path;
      const res = await this.httpRequest(url, method, options, body, files);
      return JSON.parse(res.body);
    } catch (err) {
      return { error: true, msg: err };
    }
  }

  async fetch(user, source, id) {
    return await this.doCall('fetch', user, source, id);
  }

  async search(field, value) {
    if (field === undefined || field === '') {
      field = 'pdb';
    }

    const res = await this.doCall('search', field, value);
    if (res.results && res.results.length == 0) {
      return { error: true, msg: `No data sources found with ${field} of ${value}` };
    }
    return res;
  }

  async fetchSearch(user, field, value) {
    const res = await this.search(field, value);

    if (res.error) {
      return res;
    }

    this.fetchMultiple(user, res.results);
  }

  async fetchMultiple(user, results) {
    for (const r of results) {
      let res = await this.fetch(user, r.source, r.id);
      this.displayResult(res);
    }
  }

  async upload(user, source, id) {
    return await this.doCall('upload', this.opts.user, this.opts.source, this.opts.id);
  }

  async status(user, source, id) {
    let res;
    if (user) {
      res = await this.doCall('status', user, source, id);
    } else {
      res = await this.doCall('status_all', user, source, id);
    }
    return res;
  }

  async update(user, source, id, field, value) {
    const obj = {};
    obj[field] = value;
    return await this.doCall('update', user, source, id, obj);
  }

  generateBoundary() {
    let b = 'DataLink-';
    for (let i = 0; i < 3; i++) {
      b += Math.random().toString(36).substring(2);
    }
    return b;
  }

  httpRequest(url, method, options = {}, body = null, files = null) {
    if (method) {
      options.method = method;
    }

    if (! options.method) {
      options.method = 'GET';
    }

    return new Promise (async (resolve, reject) => {
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
        req.end();
        reject(`${err.message}`);
      });

      if (body) {
        req.write(body);
      }

      if (files) {
        req.write(`--${this.getBoundary()}\r\n`);
        for (let [i, file] of files.entries()) {
          try {
            await this.fileCallback(file, async (f) => {
              try {
                await this.sendFile(req, file, f);
              } catch (err) {
                reject(err.message);
                return false;
              }
              return true;
            });
          } catch (err) {
            req.end();
            reject(err.message);
            return false;
          }
        }
        req.write(`--${this.getBoundary()}--\r\n`);
      }

      req.end();

    });
  }

  getDirectorySize(paths) {
    let size = 0;
    for (let [i, file] of paths.entries()) {
      let stat;
      try {
        stat = fs.statSync(file);
      } catch (err) {
        throw err;
        return false;
      }
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        size += this.getDirSize(file);
      }
    }
    return size;
  }

  getDirSize(dir, size = 0) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach((file) => {
        if (! file.isSymbolicLink()) {
          file.isDirectory() ? size = this.getDirSize(`${dir}/${file.name}`, size) : size += (fs.statSync(`${dir}/${file.name}`).size);
        }
      });
    } catch (err) {
      return 0;
    }

    return size;
  }

  async fileCallback(dir, callback) {
    // check if dir is a file
    try {
      if (fs.statSync(dir).isFile()) {
        return await callback(dir);
      }
    } catch (err) {
      throw err;
      return false;
    }

    let files;
    try {
      files = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      throw err;
      return false;
    }
    for (const file of files) {
      if (file.isSymbolicLink() || file.isCharacterDevice()) {
        continue;
      }
      if (file.isDirectory()) {
        if (! await this.fileCallback(path.join(dir, file.name), callback)) {
          return false;
        }
      } else {
        if (! await callback(path.join(dir, file.name))) {
          return false;
        }
      }
    }
    return true;
  }

  async sendFile(req, rel_dir, file) {
    // if relative dir is the same as file (when we are processing just a file)
    if (rel_dir === file) {
      rel_dir = path.dirname(file);
    }

    return new Promise((resolve, reject) => {

      // if the request has been destroyed then exit
      if (req.destroyed) {
        reject(err);
        return;
      }

      const in_s = fs.createReadStream(file);

      const filename = path.relative(rel_dir, file);

      in_s.on('data', (data) => {
        if (req.destroyed) {
          in_s.close();
          reject();
        }
        if (! this.opts.no_progress) {
          this.size_uploaded += data.length;
          this.outputProgress(file);
        }
        req.write(data);
      });

      in_s.on('open', () => {
        // compose the multipart/form-data body
        req.write(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`);
        req.write('Content-Type: application/octet-stream\r\n\r\n');
      });

      in_s.on('end', () => {
        req.write(`\r\n--${this.getBoundary()}\r\n`);
        resolve();
      });

      in_s.on('error', (err) => {
        reject(err);
      });

    });
  }

  outputProgress(file) {
    let percent = (this.size_uploaded / this.size_total) * 100;
    this.outputBlankLine();
    let line = `Uploading (${percent.toFixed(2)}%) - `;
    let width = process.stdout.columns - line.length;
    if (width < file.length) {
      file = '... ' + file.slice(-width + 4);
    }
    line += file + '\r';
    process.stdout.write(line);
  }

  outputBlankLine() {
    process.stdout.write('\x1b[K');
  }

  showHelp() {
    const pad = 25;
    const cmd = process.argv[1].split('/').pop();
    console.log(`Usage: ${cmd} [options] <action> -- [...list of files/directories]`);
    console.log();
    console.log('Arguments:');
    console.log('  action'.padEnd(pad) + 'sources, catalog, catalog_update, search, fetch, status, update, remove, upload, stats');
    console.log('\nOptions:');

    let out;
    for (const [n, o] of Object.entries(this.arg_info)) {
      out = `  --${n}`;
      if (o.type !== 'boolean') {
        out += ` <${o.form}>`;
      }
      out = out.padEnd(pad) + o.help;

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
    // initialise file array
    this.opts.files = [];

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

        // extract the option name
        let option = key.substring(2);

        // if option is blank (--) the following arguments are files/directories
        if (option === '') {
          while (params.length) {
            this.opts.files.push(params.shift());
          }
          break;
        }

        // validate the option against arg_info, and set it in our options object
        if (this.arg_info[option]) {
          // if the argument type is set to boolean, don't expect a value
          if (this.arg_info[option].type === 'boolean') {
            this.opts[option] = true;
          } else {
            // get the value
            this.opts[option] = params.shift();
          }
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

    if (this.app_client == false) {
      // set this.proto to http or https depending on url or return an error
      if (this.opts.url) {
        if (this.opts.url.startsWith('http://')) {
          this.proto = http;
        } else if (this.opts.url.startsWith('https://')) {
          this.proto = https;
        } else {
          return { error: true, msg: 'Invalid API URL - it must start with http:// or https://' };
        }

        // ensure the URL has a single trailing slash
        this.opts.url = this.opts.url.replace(/(\/?)*$/, '/');

      } else {
        return { error: true, msg: 'You need to include an API URL' };
      }
    }

    // check if the correct parameters are supplied
    let res, err_msg;

    // check if value is set for search
    if (this.action == 'search' && ! this.opts.value) {
      return { error: true, msg: 'You need to include a <value> to search for' };
    }

    // check that fetch, remove, update and upload have a user set
    if (['fetch', 'remove', 'update', 'upload'].includes(this.action)) {

      if (! this.opts.user) {
        return { error: true, msg: `You need to provide a <user> for ${this.action}`};
      }

      if (this.action == 'fetch') {
        if (! this.opts.value && ! (this.opts.source && this.opts.id)) {
          return { error: true, msg: `You need to provide a data <source> and <id> or a search value <search> for the data to ${this.action}`};
        }
      }

      if (['remove', 'update', 'upload'].includes(this.action)) {
        if (! (this.opts.source && this.opts.id)) {
          return { error: true, msg: `You need to provide a <source> and <id> for the data to ${this.action}`};
        }
      }

      if (this.action == 'upload') {
        if (this.opts.files.length == 0) {
          return { error: true, msg: `You need to provide at least one file to ${this.action}`};
        }
      }
    }

    // process actions
    switch(this.action) {
      case 'sources':
        if (this.opts.source) {
          res = await this.doCall('sources', this.opts.source);
        } else {
          res = await this.doCall('sources_all', this.opts.source);
        }
        break;
      case 'catalog':
      case 'catalogue':
        if (this.opts.source) {
          res = await this.doCall('catalog', this.opts.source);
        } else {
          res = await this.doCall('catalog_all', this.opts.source);
        }
        break;
      case 'catalog_update':
      case 'catalogue_update':
        if (this.opts.source) {
          res = await this.doCall('catalog_update', this.opts.source);
        } else {
          res = await this.doCall('catalog_update_all', this.opts.source);
        }
        break;
      case 'search':
        res = this.search(this.opts.field, this.opts.value);
        break;
      case 'fetch':
        if (this.opts.value) {
          res = this.fetchSearch(this.opts.user, this.opts.field, this.opts.value);
        } else {
          res = this.fetch(this.opts.user, this.opts.source, this.opts.id);
        }
        break;
      case 'status':
        res = await this.status(this.opts.user, this.opts.source, this.opts.id);
        break;
      case 'update':
        res = await this.update(this.opts.user, this.opts.source, this.opts.id, this.opts.field, this.opts.value);
        break;
      case 'remove':
        res = await this.doCall('remove', this.opts.user, this.opts.source, this.opts.id);
        break;
      case 'upload':
        try {
          this.size_total = this.getDirectorySize(this.opts.files);
        } catch (err) {
          res = { error: true, msg: err.message };
          break;
        }
        res = this.upload(this.opts.user, this.opts.source, this.opts.id);
        break;
      case 'stats':
        res = await this.doCall('stats');
        break;
      default:
        res = { error: true, msg: `No such action <${this.action}>` };
    }
    return res;
  }

  displayResult(res) {
    if (! this.opts.no_progress) {
      this.outputBlankLine();
    }

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
