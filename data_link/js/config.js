const fs = require('fs');
const path = require('path');
const log = require('./log.js');

class config {

  constructor() {
    this.load();
  }

  load() {
    let config = path.join(process.cwd(), 'config.json');
    log.info(`Loading config ${config}`);
    config = config.replace(/\s*\/\//,'');
    this.config = this.loadJSON(config);
    if (! this.config) {
      log.error(`Unable to load config ${config}`);
      process.exit(1);
    }
  }

  loadJSON(file) {
    try {
      let json = fs.readFileSync(file);
      // remove comments
      json = json.toString().replace(/\s*\/\/.*/g,'');
      return JSON.parse(json);
    } catch (err) {
      log.error(err);
      return false;
    }
  }

  get(config_path, def) {
    let config = this.getRecurse(config_path, this.config);
    if (config === undefined) {
      config = def;
    }
    return config;
  }

  getRecurse(config_path, obj = this.config) {
    let keys = config_path.split('.');
    if (keys.length > 1 && obj[keys[0]]) {
      return this.getRecurse(keys.slice(1).join('.'), obj[keys[0]])
    }
    return obj[keys[0]];
  }
}

module.exports = new config();