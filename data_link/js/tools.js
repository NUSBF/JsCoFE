'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

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

  static errorMsg(msg) {
    log.error(msg);
    return { error: true, msg: msg };
  }

  static infoMsg(msg) {
    return { info: true, msg: msg };
  }

  static successMsg(msg) {
    return { success: true, msg: msg };
  }

  static errorMsgNoSource() {
    return this.errorMsg('No such data source');
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

  static saveUserCatalog(user, catalog) {
    let json = JSON.stringify(catalog);
    let user_data_dir = tools.getDataDest(user);
    try {
      if (! fs.existsSync(user_data_dir)) {
        fs.mkdirSync(user_data_dir, { recursive: true });
      }
      fs.writeFileSync(tools.getUserCatalogFile(user), json);
    } catch (err) {
      log.error(`Error saving user catalog ${err}`);
      return false;
    }
    return true;
  }

  static getUserCloudId(user) {
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

  static validCloudId(user, id) {
    let cloud_id = this.getUserCloudId(user);
    if (cloud_id && id === cloud_id) {
      return true;
    }
    return false;
  }

  static httpRequest(url, dest = '', entry = null) {
    return new Promise ((resolve, reject) => {
      let request = https.get(url, (res) => {
        if (res.statusCode !== 200) {
          console.error(`Error: ${res.statusCode}`);
          res.resume();
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
    });
  }
}

module.exports = {
  tools,
  status
}