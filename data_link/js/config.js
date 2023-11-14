const fs = require('fs');
const path = require('path');
const logger = require('pino')();

class config {

  constructor() {
    this.load();
  }

  load() {
    logger.info('Loading config');
    let config = path.join(process.cwd(), 'config.json');
    config = config.replace(/\s*\/\//,'');
    this.config = this.loadJSON(config);
    if (! this.config) {
      logger.error(`Unable to load config ${config}`);
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
      logger.error(err);
      return false;
    }
  }

  get(config_path, obj = this.config) {
    let keys = config_path.split('.');
    if (keys.length > 1 && obj[keys[0]]) {
      return this.get(keys.slice(1).join('.'), obj[keys[0]])
    }
    return obj[keys[0]];
  }
}

module.exports = new config();