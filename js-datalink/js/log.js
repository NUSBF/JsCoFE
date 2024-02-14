const pino = require('pino');

class log {

  file = null;
  log = null;

  constructor() {
    this.newLog();
  }

  newLog(file = null) {
    let pino_dest = null;
    if (file) {
      this.file = file;
      pino_dest = pino.destination( { dest: file, sync: true } )
    }
    const log = pino(
      {
        level: process.env.LOG_LEVEL || 'info'
      },
      pino_dest
    );
    this.log = log;
  }

  trace(...args) {
    this.log.trace(...args);
  }

  debug(...args) {
    this.log.debug(...args);
  }

  info(...args) {
    this.log.info(...args);
  }

  warn(...args) {
    this.log.warn(...args);
  }

  error(...args) {
    this.log.error(...args);
  }

  fatal(...args) {
    this.log.fatal(...args);
  }

  silent() {
    this.log.silent(...args);
  }

}

module.exports = new log();