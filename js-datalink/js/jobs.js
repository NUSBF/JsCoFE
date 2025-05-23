'use strict';

/** Milliseconds in one day. */
const DAY_TO_MS = 24 * 60 * 60 * 1000;
/** Milliseconds in one minute. */
const MIN_TO_MS = 60 * 1000;

/**
 * Class for managing asynchronous jobs and periodic timers.
 */
class jobs {

  /**
   * Initializes a new jobs manager.
   */
  constructor() {
    this.jobs = {};
    this.timers = { days: [], mins: [] };
    this.day = null;
    this.min = null;
  }

  /**
   * Gets the current list of jobs.
   * @returns {Object} Jobs map.
   */
  getJobs() {
    return this.jobs;
  }

  /**
   * Generates a unique key for a job entry.
   * @param {Object} entry - Job entry with `source`, `user`, and `id`.
   * @returns {string} Unique key.
   */
  getKey(entry) {
    return entry.source + '/' + entry.user + '/' + entry.id;
  }

  /**
   * Retrieves a job object by entry.
   * @param {Object} entry - Job entry.
   * @returns {Object|undefined} Job object or undefined if not found.
   */
  get(entry) {
    return this.jobs[this.getKey(entry)];
  }

  /**
   * Adds a job to the job list.
   * @param {Object} entry - Job entry.
   * @param {AbortController} controller - Controller for aborting the job.
   * @param {string} status - Status message or description.
   * @returns {string} Key of the job.
   */
  add(entry, controller, status) {
    const key = this.getKey(entry);
    this.jobs[key] = { controller: controller, status: status }
    return key;
  }

  /**
   * Removes a job from the job list and aborts it if active.
   * @param {Object} entry - Job entry to remove.
   */
  remove(entry) {
    this.abort(entry);
    const key = this.getKey(entry);
    if (this.jobs[key]) {
      delete this.jobs[key];
    }
  }

  /**
   * Aborts a job using its AbortController.
   * @param {Object} entry - Job entry to abort.
   */
  abort(entry) {
    const job = this.get(entry);
    if (job && job.controller) {
      job.controller.abort();
    }
  }

  /**
   * Adds a repeating timer that executes a callback every N minutes.
   * @param {Function} callback - Function to execute.
   * @param {number} mins - Number of minutes between executions.
   * @param {boolean} [immediate=false] - Whether to call the callback immediately.
   */
  addMinTimer(callback, mins, immediate = false) {
    this._addTimer(this.timers.mins, callback, mins, immediate);
    if (! this.min) {
      this.min = setInterval(this._ticker.bind(this, this.timers.mins), MIN_TO_MS);
    }
  }

  /**
   * Adds a repeating timer that executes a callback every N days.
   * @param {Function} callback - Function to execute.
   * @param {number} days - Number of days between executions.
   * @param {boolean} [immediate=false] - Whether to call the callback immediately.
   */
  addDayTimer(callback, days, immediate = false) {
    this._addTimer(this.timers.days, callback, days, immediate);
    if (! this.day) {
      this.day = setInterval(this._ticker.bind(this, this.timers.days), DAY_TO_MS);
    }
  }

  /**
   * Internal method to add a timer to a given list.
   * @param {Array<Object>} timer - Timer list to modify.
   * @param {Function} callback - Callback to execute.
   * @param {number} value - Interval count (in mins or days).
   * @param {boolean} immediate - Whether to invoke the callback immediately.
   * @private
   */
  _addTimer(timer, callback, value, immediate) {
    // if no time value set then don't set a timer
    if (value == 0) {
      return;
    }
    // if immediate is set, run the callback right away
    if (immediate) {
      callback();
    }
    timer.push({ value: value, count: value, callback: callback });
  }

  /**
   * Internal method to handle countdown and execution of timers.
   * @param {Array<Object>} array - Array of timer objects to tick.
   * @private
   */
  _ticker(array) {
    // loop through timers
    array.forEach(item => {
      item.count--;
      // if we have reached the number of days, execute the callback and reset timer
      if (item.count == 0) {
        item.callback();
        item.count = item.value;
      }
    });
  }

}

module.exports = jobs;