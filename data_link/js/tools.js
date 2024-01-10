'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const process = require('child_process');

const config = require('./config.js');
const log = require('./log.js');

const USER_DIR = config.get('storage.user_dir', 'users');
const DATA_DIR = config.get('storage.data_dir', 'data');

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

  static getDataDest(user, source = '', id = '') {
    return path.join(this.getDataDir(), user, source, id);
  }

  static getCatalogFile() {
    return path.join(this.getDataDir(), 'catalog.json')
  }

  static getUserPath(user) {
    return path.join(USER_DIR, user + '.user');
  }

  static getUserDataDir(user) {
    return path.join(DATA_DIR, user);
  }

  static getUserCatalogFile(user) {
    return path.join(this.getUserDataDir(user), 'catalog.json');
  }

  static getUserCloudRunId(user) {
    let file = this.getUserPath(user);
    try {
      if (! fs.existsSync(file)) {
        return false;
      }
      let data = fs.readFileSync(file);
      let json = JSON.parse(data);
      if (json['cloudrun_id']) {
        return json['cloudrun_id'];
      } else {
        return false;
      }
      return false;
    } catch (err) {
        log.error(`getUserCloudId: ${err}`);
      return false;
    }
  }

  static validCloudRunId(user, id) {
    let cloudrun_id = this.getUserCloudRunId(user);
    if (cloudrun_id && id === cloudrun_id) {
      return true;
    }
    return false;
  }

  static validAdminKey(key) {
    if (key === config.get('server.admin_key')) {
      return true;
    }
    return false;
  }

  static doRsync(args, stdoutFunc = null, stderrFunc = null, spawnFunc = null) {
    let options = {};

    // if no stdout callback, then ignore all stdio
    if (! stdoutFunc) {
      options.stdio = 'ignore'
    }

    const cmd = 'rsync';
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
        if (spawnFunc) {
          spawnFunc(rsync)
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

  static httpRequest(url, options = {}, dest = null) {
    if (! options.method) {
      options.method = 'GET';
    }
    log.debug(`httpRequest - requesting ${url}`);
    return new Promise ((resolve, reject) => {
      let req = https.request(url, options, (res) => {
        if (! [200, 206].includes(res.statusCode)) {
          res.resume();
          reject(`httpRequest - unsupported statusCode ${res.statusCode}`);
          return;
        }

        if (dest) {
          let flags = 'w';
          // if we have a range set, add the append flag
          if (options.headers && options.headers.range) {
            flags = 'a';
          }
          const file = fs.createWriteStream(dest, { 'flags': flags });
          res.pipe(file);
          res.on('close', () => {
            file.close();
            resolve();
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
        log.error(`httpRequest - ${err.message}`);
      });
      req.end();
    });
  }

  static unpack(file, dest, spawnFunc) {
    log.info(`${this.name} - Unpacking ${file} to ${dest}`);

    let ext = path.extname(file);
    let cmd, args;

    return new Promise((resolve, reject) => {
      switch(ext) {
        case '.tar':
        case '.gz':
        case '.bz2':
        case '.xz':
          cmd = 'tar';
          args = [ '-x', '-C', dest, '-f', file, '--strip-components', 1];
          break;
        default:
          reject(`Unsupported archive format ${ext}`);
          return;
      }

      let sp = process.spawn(cmd, args);

      sp.on('spawn', () => {
        log.debug(`unpack - PID: ${sp.pid} = ${args.join(' ')}`);
        if (spawnFunc) {
          spawnFunc(sp);
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
          reject(`unpack - - ${args.join(' ')} exited with code ${code}`);
        }
      });
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

}

module.exports = {
  tools,
  status
}