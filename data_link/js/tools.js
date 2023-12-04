'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const process = require('child_process');

const config = require('./config.js');
const log = require('./log.js');

const USER_DIR = config.get('storage.user_dir');
const DATA_DIR = config.get('storage.data_dir');

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

  static jsonMessage(data) {
    return JSON.stringify(data);
  }

  static jsonError(error) {
    return this.jsonMessage({ error: true, message: error });
  }

  static getUserPath(user) {
    return path.join(USER_DIR, user + '.user');
  }

  static getUserCatalogFile(user) {
    return path.join(DATA_DIR, user, 'catalog.json');
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

  static httpRequest(url, dest = '', entry = null) {
    log.debug(`httpRequest - requesting ${url}`);
    return new Promise ((resolve, reject) => {
      let request = https.get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(`${url} statusCode: ${res.statusCode}`);
          return;
        }

        if (dest && entry) {
          entry.source_size = parseInt(res.headers['content-length'], 10);

          if (fs.existsSync(dest)) {
            if (fs.statSync(dest).size == entry.source_size) {
              resolve();
              return;
            }
          }

          const file = fs.createWriteStream(dest);
          res.pipe(file);

          res.on('close', () => {
            file.close();
            resolve();
            return;
          });
        } else {
          let out = '';

          res.on('data', (data) => {
            out += data;
          });

          res.on('close', () => {
            resolve(out);
            return;
          });
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