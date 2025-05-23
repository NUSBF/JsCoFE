const pino = require('pino');

/**
 * Logging utility class based on the Pino logger.
 * Provides a singleton-style interface for structured logging to console or file.
 */
class log {

  /**
   * The log file path, if any.
   * @type {string|null}
   */
  file = null;

  /**
   * The underlying Pino logger instance.
   * @type {Object}
   * @see https://github.com/pinojs/pino/blob/main/docs/api.md#logger
   */
  log = null;

  /**
   * Constructs a new logger instance.
   * Defaults to using console unless a file is specified via `newLog()`.
   */
  constructor() {
    this.newLog();
  }

  /**
   * Creates a new logger, optionally writing to a specified file.
   *
   * @param {string|null} [file=null] - Optional file path to write logs to.
   */
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

  /**
   * Logs a trace-level message.
   * @param {...any} args - Arguments to log.
   */
  trace(...args) {
    this.log.trace(...args);
  }

  /**
   * Logs a debug-level message.
   * @param {...any} args - Arguments to log.
   */
  debug(...args) {
    this.log.debug(...args);
  }

  /**
   * Logs an info-level message.
   * @param {...any} args - Arguments to log.
   */
  info(...args) {
    this.log.info(...args);
  }

  /**
   * Logs a warning-level message.
   * @param {...any} args - Arguments to log.
   */
  warn(...args) {
    this.log.warn(...args);
  }

  /**
   * Logs an error-level message.
   * @param {...any} args - Arguments to log.
   */
  error(...args) {
    this.log.error(...args);
  }

  /**
   * Logs a fatal-level message.
   * @param {...any} args - Arguments to log.
   */
  fatal(...args) {
    this.log.fatal(...args);
  }

  /**
   * Logs a silent-level message. This may not produce any output depending on configuration.
   * @param {...any} args - Arguments to log.
   */
  silent(...args) {
    this.log.silent(...args);
  }

}

module.exports = new log();