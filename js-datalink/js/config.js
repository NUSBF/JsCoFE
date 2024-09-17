const fs = require('fs');
const path = require('path');
const log = require('./log.js');

const def_config = {
  "server": {
    "host": "localhost",
    "port": 8100
  },
  "storage": {
    "data_dir": "data",
    "user_dir": "users",
    "catalog_dir": "catalogs",
    "meta_dir": "meta",
    "catalogs_with_data": false,
    "data_free_gb": 100,
    "data_max_days": 60,
    "data_prune_mins": 30,
    "catalog_update_days": 10
  },
  "data_sources": {
    "pdbj": {
      "enabled": true,
      "rsync_size": true
    },
    "sbgrid": {
      "enabled": true,
      "rsync_size": true
    },
    "irrmc": {
      "enabled": true
    },
    "zenodo": {
      "enabled": true
    },
    "upload": {
      "enabled": true,
      "limit_mb": 20000
    }
  },
  "other": {
    "rcsb_results": false
  }
}

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
      log.error(err.message);
      return false;
    }
  }

  get(config_path) {
    let config = this.getRecurse(config_path, this.config);
    if (config === undefined) {
      config = this.getRecurse(config_path, def_config);
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