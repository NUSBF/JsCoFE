'use strict';

const DAY_TO_MS = 24 * 60 * 60 * 1000;
const MIN_TO_MS = 60 * 1000;

class jobs {

  constructor() {
    this.jobs = {};
    this.timers = { days: [], mins: [] };
    this.day = null;
    this.min = null;
  }

  getJobs() {
    return this.jobs;
  }

  getKey(entry) {
    return entry.source + '/' + entry.user + '/' + entry.id;
  }

  get(entry) {
    return this.jobs[this.getKey(entry)];
  }

  add(entry, controller, status) {
    const key = this.getKey(entry);
    this.jobs[key] = { controller: controller, status: status }
    return key;
  }

  remove(entry) {
    this.abort(entry);
    const key = this.getKey(entry);
    if (this.jobs[key]) {
      delete this.jobs[key];
    }
  }

  abort(entry) {
    const job = this.get(entry);
    if (job && job.controller) {
      job.controller.abort();
    }
  }

  addMinTimer(callback, mins, immediate = false) {
    this._addTimer(this.timers.mins, callback, mins, immediate);
    if (! this.min) {
      this.min = setInterval(this._ticker.bind(this, this.timers.mins), MIN_TO_MS);
    }
  }

  addDayTimer(callback, days, immediate = false) {
    this._addTimer(this.timers.days, callback, days, immediate);
    if (! this.day) {
      this.day = setInterval(this._ticker.bind(this, this.timers.days), DAY_TO_MS);
    }
  }

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