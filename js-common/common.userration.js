
/*
 *  ==========================================================================
 *
 *    23.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.userration.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ration Data Classes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  ==========================================================================
 *
 */

'use strict';

var utils = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  utils = require('../js-server/server.utils');


function RationJobDesc ( job_meta )  {
  this.project    = job_meta.project;
  this.jobId      = job_meta.id;
  this.nc_type    = job_meta.nc_type;
  this.chargeTime = 0.0;  // time point for time booking
  this.cpu_hours  = 0.0;  // cpu hours to be booked
  this.cloudrun   = false;
  this.status     = 0;    // processing status
}

function RationJobDesc_toString ( ration_job_desc )  {
  return 'prj='         + ration_job_desc.project    +
         ' jobId='      + ration_job_desc.jobId      +
         ' nc_type='    + ration_job_desc.nc_type    +
         ' chargeTime=' + ration_job_desc.chargeTime +
         ' cpu_hours='  + ration_job_desc.cpu_hours  +
         ' status='     + ration_job_desc.status;
}


function UserRation ( cfg_ration=null )  {

  this._type = 'UserRation';

  // limits
  this.storage      = 0.0;  // committed MBytes (0: unlimited)
  this.storage_max  = 0.0;  // maximum allocatable MBytes (0: unlimited)
  this.cpu_day      = 0.0;  // hours  (0: unlimited)
  this.cpu_month    = 0.0;  // hours  (0: unlimited)
  this.cloudrun_day = 100;  // cloudruns (0: unlimited)
  this.archive_year = 2;    // maximum number of project archived (0: unlimited)
  if (cfg_ration)  {
    this.storage      = cfg_ration.storage;
    this.storage_max  = cfg_ration.storage_max;
    this.cpu_day      = cfg_ration.cpu_day;
    this.cpu_month    = cfg_ration.cpu_month;
    this.cloudrun_day = cfg_ration.cloudrun_day;
    this.archive_year = cfg_ration.archive_year;
  }

  this.jobs     = [];
  this.archives = [];

  // usage
  this.storage_used      = 0.0;  // MBytes, actually used
  this.cpu_day_used      = 0.0;  // hours, actually used
  this.cpu_month_used    = 0.0;  // hours, actually used
  this.cpu_total_used    = 0.0;  // hours, actually used
  this.cloudrun_day_used = 0;    // total number of scripts submitted
  this.jobs_total        = 0;    // total number of jobs done

}

UserRation.prototype.clearJobs = function()  {
  this.jobs = [];
  return this;
}


UserRation.prototype.jobIndex = function ( job_meta )  {
let k = -1;
  for (let i=0;(i<this.jobs.length) && (k<0);i++)
    if ((this.jobs[i].project==job_meta.project) &&
        (this.jobs[i].jobId==job_meta.id))
      k = i;
  return k;
}


UserRation.prototype.maskProject = function ( projectName )  {
// When a project is deleted, its jobs should not be removed from the ration
// index because they are still used for calculating current time quotas.
// However, they should be masked such that they are ignored if user immediately
// re-creates project with same name
  for (let i=0;(i<this.jobs.length);i++)
    if (this.jobs[i].project==projectName)
      this.jobs[i].project = '""" ' + projectName + ' """';  // impossible project name
}


UserRation.prototype.calculateTimeRation = function()  {
let t     = new Date().getTime()/3600000.0;  // hours from beginning
let tmd   = t - 24.0;   // current day threshold
let tmm   = t - 720.0;  // current month threshold
let jobs1 = [];
let cpu_day_used      = this.cpu_day_used;
let cpu_month_used    = this.cpu_month_used;
let cloudrun_day_used = this.cloudrun_day_used;
let njobs             = this.jobs.length;

  this.cpu_day_used      = 0.0;  // hours, actually used
  this.cpu_month_used    = 0.0;  // hours, actually used
  this.cloudrun_day_used = 0;    // jobs, actually used

  for (let i=0;i<njobs;i++)  {
    if (this.jobs[i].nc_type!='client')  {
      if (this.jobs[i].chargeTime>=tmd)
        this.cpu_day_used   += this.jobs[i].cpu_hours;
      if (this.jobs[i].chargeTime>=tmm)  {
        this.cpu_month_used += this.jobs[i].cpu_hours;
        jobs1.push ( this.jobs[i] );
      }
    }
    if ((this.jobs[i].chargeTime>=tmd) && ('cloudrun' in this.jobs[i]) &&
        this.jobs[i].cloudrun)
      this.cloudrun_day_used += 1;
  }

  this.jobs = jobs1;  // leave only month-old jobs in the list

  // returns true if UserRation structure was changed
  return (cpu_day_used     !=this.cpu_day_used)      ||
         (cpu_month_used   !=this.cpu_month_used)    ||
         (cloudrun_day_used!=this.cloudrun_day_used) ||
         (njobs            !=this.jobs.length);

}


UserRation.prototype.bookJob = function ( job_class,cloudrun_bool )  {

  if (!job_class)
    return false;  //  ration book has not changed

  if (this.jobIndex(job_class)>=0)  // the job was already booked to the ration
    return false;

  let t = new Date().getTime()/3600000.0;  // hours from beginning
  // One day (24 hours) is 86400000 milliseconds.
  // One hour is 3600000 milliseconds

  let rjdesc = new RationJobDesc(job_class);
  rjdesc.cpu_hours  = job_class.cpu_time;  // put the actual reading
  rjdesc.chargeTime = t;   // record the moment of reading
  rjdesc.cloudrun   = cloudrun_bool;
  this.jobs.push ( rjdesc );

  this.storage_used   += job_class.disk_space;
  this.cpu_total_used += job_class.cpu_time;

  this.jobs_total++;

  this.calculateTimeRation();

  return true;

}


const _ms_in_year = 31536000000;

UserRation.prototype.checkArchiveQuota = function()  {
  if (this.archive_year>0)  {
    let t0 = Date.now() - _ms_in_year;
    if ((this.archives.length>0) && (t0<this.archives[0])) {
      let a1 = this.archives;
      this.archives = [];
      for (let i=0;i<a1.length;i++)
        if (a1[i]>=t0)
          this.archives.push ( a1[i] );
    }
    return (this.archives.length<this.archive_year);
  } else  {
    this.archives = [];
    return true;
  }
}

UserRation.prototype.bookArchive = function()  {
  this.checkArchiveQuota();
  if (this.archive_year>0)
    this.archives.push ( Date.now() );
}

// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.UserRation = UserRation;
}
