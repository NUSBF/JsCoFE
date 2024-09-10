'use strict';

const fs = require('fs');
const pfs = fs.promises;

const path = require('path');
const https = require('https');
const process = require('child_process');

const config = require('./config.js');
const log = require('./log.js');

const USER_DIR = config.get('storage.user_dir');
const DATA_DIR = config.get('storage.data_dir');
const CATALOG_DIR = config.get('storage.catalog_dir');

// maximum number of http redirects
const HTTP_REDIRECTS = 5;

const status = {
  completed: 'completed',
  inProgress: 'in_progress',
  failed: 'failed'
};

class tools {

  static errorMsg(msg, code = 200) {
    log.error(msg);
    return { error: true, code: code, msg: msg };
  }

  static successMsg(msg, code = 200) {
    log.info(msg);
    return { success: true, code: code, msg: msg };
  }

  static getDataDir() {
    return DATA_DIR;
  }

  static getSubDirs(dir) {
    if (fs.existsSync(dir)) {
      return fs.readdirSync(dir).filter(file => {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
    }
    return false;
  }

  static getDirSize(dir, size = 0) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach((file) => {
        // ignore hidden files
        if (! file.name.startsWith('.')) {
          file.isDirectory() ? size = this.getDirSize(`${dir}/${file.name}`, size) : size += (fs.statSync(`${dir}/${file.name}`).size);
        }
      }
    );
    return size;
}

  // for files the callback should return true on success and false on failure (to abort).
  static async fileCallback(dir, callback) {
    let files;
    try {
      files = await pfs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      log.error(`fileCallback - ${err}`);
      return true;
    }
    for (const file of files) {
      if (file.isDirectory() && ! file.isSymbolicLink() ) {
        if (! await this.fileCallback(`${dir}/${file.name}`, callback)) {
          return false;
        }
      } else {
        if (! await callback(`${dir}/${file.name}`)) {
          return false;
        }
      }
    }
    return true;
  }

  static async removeEmptySubDirs(dir, depth = 0) {
    const msg = 'removeEmptySubDirs';

    try {
      const stat = await pfs.lstat(dir);
      if (! stat.isDirectory()) {
        return;
      }
    } catch (err) {
      log.error(`${msg} - ${err}`);
      return;
    }

    let files = await pfs.readdir(dir);
    if (files.length > 0) {
      const map = files.map(
        (file) => this.removeEmptySubDirs(path.join(dir, file), depth + 1)
      );
      // wait on all promises to complete
      await Promise.all(map);

      // re-check after deleting subdir as parent may be empty
      files = await pfs.readdir(dir);
    }

    if (depth > 0 && files.length == 0) {
      try {
        await pfs.rmdir(dir);
      } catch (err) {
        log.error(`${msg} - ${err}`);
      }
    }
  }

  static getCatalogDir() {
    return CATALOG_DIR;
  }

  static getUserPath(user) {
    return path.join(USER_DIR, user + '.user');
  }

  static getUserCloudRunId(user) {
    if (! tools.validUserName(user)) {
      log.error(`Invalid user name ${user}`);
      return false;
    }

    let file = this.getUserPath(user);
    try {
      if (! fs.existsSync(file)) {
        log.error(`User config ${file} does not exist`);
        return false;
      }
      let data = fs.readFileSync(file);
      let json = JSON.parse(data);
      if (json['cloudrun_id']) {
        return json['cloudrun_id'];
      } else {
        log.error(`No cloudrun_id field found for user ${user}`);
      }
    } catch (err) {
      log.error(`${err}`);
    }
    return false;
  }

  static validUserName(user) {
    if (/^[a-zA-Z][a-zA-Z0-9\.\-_]+$/.test(user)) {
      return true;
    }
    return false;
  }

  static validCloudRunId(user, id) {
    let cloudrun_id = this.getUserCloudRunId(user);
    if (cloudrun_id && id === cloudrun_id) {
      return true;
    }
    return false;
  }

  static validAdminKey(key) {
    const admin_key = config.get('server.admin_key');
    if (admin_key && key === admin_key) {
      return true;
    }
    return false;
  }

  static validSourceId(source, id) {
    if (/[^a-z]/.test(source) || source.length < 3) {
      return this.errorMsg('Data source name must contain only lowercase characters (with a minimum length of 3)', 400);
    }
    if (/[^\w]/.test(id) || id.length < 3) {
      return this.errorMsg('Data ID name must contain only alphanumeric characters (with a minimum length of 3)', 400);
    }
    return true;
  }

  static doRsync(args, stdoutFunc = null, stderrFunc = null, spawnFunc = null) {
    const options = {};

    // if no stdout callback, then ignore all stdio
    if (! stdoutFunc) {
      options.stdio = 'ignore'
    }

    const cmd = 'rsync';

    // add an abortController signal so we can abort the process
    const controller = new AbortController();
    options.signal = controller.signal;

    return new Promise((resolve, reject) => {
      const rsync = process.spawn(cmd, args, options);

      if (stderrFunc) {
        rsync.stderr.on('data', stderrFunc);
      }

      if (stdoutFunc) {
        rsync.stdout.on('data', stdoutFunc);
      }

      rsync.on('spawn', () => {
        log.debug(`doRsync - PID: ${rsync.pid} = ${rsync.spawnargs.join(' ')}`);
        // if we have a callback function, pass the abortController to it
        if (spawnFunc) {
          spawnFunc(controller)
        }
      });

      rsync.on('error', reject);

      rsync.on('close', code => {
        if (code) {
          const err = new Error(`${cmd} exited with code ${code}`);
          err.code = code;
          return reject(err);
        }
        resolve(code);
      });
    });
  };

  static httpGetHeaders(url) {
    log.debug(`httpGetHeaders - requesting ${url}`);
    return new Promise ((resolve, reject) => {
      let req = https.request(url, { method: 'HEAD' }, (res) => {
        resolve(res.headers);
      });
      req.end();
    });
  }

  static httpRequest(url, options = {}, dest = null, signalCallback = null, writeCallback = null) {
    if (! options.method) {
      options.method = 'GET';
    }

    log.debug(`httpRequest - requesting ${url}`);
    return new Promise ((resolve, reject) => {
      // add an abortController signal so we can abort requests
      const controller = new AbortController();
      options.signal = controller.signal;
      let req = https.request(url, options, (res) => {

        let err_msg;
        switch (res.statusCode) {
          // http redirect
          case 301:
          case 302:
            // if no redirect counter set, set it in options
            if (! options.dl_redirects) {
              options.dl_redirects = 0;
            }
            if (options.dl_redirects < HTTP_REDIRECTS && res.headers.location) {
              options.dl_redirects += 1;
              log.debug(`httpRequest - redirecting to ${res.headers.location} (try ${options.dl_redirects})`);
              return this.httpRequest(res.headers.location, options, dest, signalCallback, writeCallback)
              .then((ret) => {
                resolve(ret);
              })
              .catch((err) => {
                reject(err);
              });
            } else {
              err_msg = `httpRequest - Too many redirects for ${url}`;
              return;
            }
            break;
          case 200:
          case 206:
            break;
          case 404:
            err_msg = `httpRequest - 404 not found: ${url}`;
            break;
          default:
            err_msg = `httpRequest - unsupported statusCode ${res.statusCode}`;
            break;
        }

        if (err_msg) {
          res.resume();
          reject(err_msg);
          return;
        }

        // if we have a callback function, pass the abortController to it
        if (signalCallback) {
          signalCallback(controller);
        }

        if (dest) {
          let flags = 'w';
          // if we have a range set, add the append flag
          if (options.headers && options.headers.range) {
            flags = 'a';
          }
          const file = fs.createWriteStream(dest, { 'flags': flags });

          res.on('data', (data) => {
            // workaround for node v16 lacking AbortController support for http(s) requests
            // if the AbortController was aborted, destroy the request and trigger an error
            if (options.signal.aborted) {
              req.destroy(new Error('AbortError: The operation was aborted (compat)'));
              return;
            }

            file.write(data);
            if (writeCallback) {
              writeCallback(data);
            }
          });

          // end the stream if the response is finished
          res.on('close', () => {
            file.end();
          });

          // resolve when the write stream has closed
          // on node v18+ it's enough to resolve after file.end above, but this works on older node
          file.on('close', () => {
            resolve();
          });

          file.on('error', (err) => {
            reject(err);
          });

        } else {
          let out = '';

          res.on('data', (data) => {
            out += data;
          });

          res.on('close', () => {
            resolve(out);
          });
        }
      });
      req.on('error', (err) => {
        reject(err);
      });
      req.end();
    });
  }

  static getUnpackCmd(file, dest) {
    let is_tar = false;
    let cmd, args;
    // check for double extensions for tar archives
    if (file.endsWith('.tar.gz') || file.endsWith('.tar.bz2') || file.endsWith('.tar.xz')) {
      is_tar = true;
    } else {
      let ext = path.extname(file);
      switch(ext) {
        // check for other possible tar archive naming
        case '.tar':
        case '.tz':
        case '.tgz':
          is_tar = true;
          break;
        case '.zip':
          cmd = 'unzip'
          // overwrite without prompting
          args = [ '-qq', '-o', '-d', dest, file ]
          break;
        // single file compression methods
        case '.gz':
          cmd = 'gzip';
          args = [ '-fd', file ];
          break;
        case '.bz2':
          cmd = 'bzip2';
          args = [ '-fd', file ];
          break;
        case '.xz':
          cmd = 'xz';
          args = [ '-fd', file ];
          break;
      }
    }

    // is a tar archive
    if (is_tar) {
      cmd = 'tar';
      args = [ '-x', '-C', dest, '-f', file, '--strip-components', 1 ];
    }

    return {cmd, args}
  }

  static unpack(file, dest, cmd = null, args = null, spawnFunc = null) {
    if (! cmd) {
      var {cmd, args, is_archive} = tools.getUnpackCmd(file, dest);
    }
    return new Promise((resolve, reject) => {
      if (! cmd) {
        reject(`unpack - Unsupported archive format ${file}`);
        return;
      }

      // add an abortController signal so we can abort the process
      const controller = new AbortController();

      let sp = process.spawn(cmd, args, { 'signal': controller.signal } );

      sp.on('spawn', () => {
        log.debug(`unpack - PID: ${sp.pid} = ${cmd} ${args.join(' ')}`);

        // if we have a callback function, pass the abortController to it
        if (spawnFunc) {
          spawnFunc(controller);
        }
      });

      sp.stderr.on('data', (data) => {
        log.error(`unpack - ${file} - ${data}`);
      });

      sp.on('close', (code) => {
        if (code === 0) {
          try {
            fs.rmSync(file, { force: true });
            resolve();
          } catch (err) {
            reject(`unpack - ${err.message}`);
          }
        } else {
          reject(`unpack - ${cmd} ${args.join(' ')} exited with code ${code}`);
        }
      });

      sp.on('error', reject);

    });
  }

  static getFileCache(file, age) {
    try {
      if (fs.existsSync(file)) {
        let file_date = new Date(fs.statSync(file).mtime);
        if (file_date > (Date.now() - age)) {
          return fs.readFileSync(file);
        }
      }
    } catch (err) {
      if (e.code !== 'ENOENT') {
        log.error(`getFileCache - ${err}`);
      }
    }
    return false;
  }

  static getFreeSpace(dir, size) {
    let res;
    try {
      res = process.execSync(`df --block-size ${size} --output=avail ${dir} | tail -n1`).toString().trim();
    } catch (err) {
      log.error(`tools.getFreeSpace - ${err}`)
      return false;
    }
    return res;
  }

  static sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  static sanitizeFilename(file) {
    // resolve any ../ ./ in path
    file = path.normalize(file);
    let p = path.parse(file);
    // get the path relative to root (this will ensure any root prefix is removed)
    file = path.relative(p.root, file);
    // limit allowed characters for file
    return file.replace(/[^\w\-_=\+\.,()'!~@\/\\ \[\]]/g,'');
  }
}

module.exports = {
  tools,
  status
}