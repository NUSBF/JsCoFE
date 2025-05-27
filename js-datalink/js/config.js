const fs = require('fs');
const path = require('path');
const log = require('./log.js');

/**
 * Default configuration fallback if no config file is found or values are missing.
 * @type {Object}
 */
const def_config = {
  "server": {
    "host": "localhost",
    "port": 8100,
    "ssl": false,
    "ssl_key": "",
    "ssl_cert": "",
    "request_timeout_secs": 1800
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

/**
 * Configuration manager for loading and accessing system configuration values.
 */
class config {

  /**
   * Initializes the configuration by loading from disk
   */
  constructor() {
    this.load();
  }

  /**
   * Loads the main configuration from the `config.json` file.
   * Exits the process if the file cannot be read or parsed.
   */
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

  /**
   * Loads a JSON file from disk, removing `//` style comments before parsing.
   *
   * @param {string} file - Path to the JSON config file.
   * @returns {Object|false} The parsed JSON object, or `false` on failure.
   */
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

  /**
   * Retrieves a configuration value using a dot-separated key path.
   * Falls back to default config if not found in loaded config.
   *
   * @param {string} config_path - Dot-separated path to the config value (e.g. "server.port").
   * @returns {*} The configuration value, or `undefined` if not found in both sources.
   */
  get(config_path) {
    let config = this.getRecurse(config_path, this.config);
    if (config === undefined) {
      config = this.getRecurse(config_path, def_config);
    }
    return config;
  }

  /**
   * Recursively retrieves a value from a nested object using a dot-separated key path.
   *
   * @param {string} config_path - Dot-separated key string.
   * @param {Object} [obj=this.config] - The object to search within.
   * @returns {*} The value found, or `undefined` if not present.
   */
  getRecurse(config_path, obj = this.config) {
    let keys = config_path.split('.');
    if (keys.length > 1 && obj[keys[0]]) {
      return this.getRecurse(keys.slice(1).join('.'), obj[keys[0]])
    }
    return obj[keys[0]];
  }
}

module.exports = new config();