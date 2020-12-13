
/*
 *  ==========================================================================
 *
 *    20.06.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  ==========================================================================
 *
 */

var utils = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  utils = require('../js-server/server.utils');


function RationJobDesc ( job_meta )  {
  this.project    = job_meta.project;
  this.jobId      = job_meta.id;
  this.nc_type    = job_meta.nc_type;
  this.chargeTime = 0.0;  // time point for time booking
  this.cpu_hours  = 0.0;  // cpu hours to be booked
  this.status     = 0;    // processing status
}

RationJobDesc_toString = function ( ration_job_desc )  {
  return 'prj='         + ration_job_desc.project    +
         ' jobId='      + ration_job_desc.jobId      +
         ' nc_type='    + ration_job_desc.nc_type    +
         ' chargeTime=' + ration_job_desc.chargeTime +
         ' cpu_hours='  + ration_job_desc.cpu_hours  +
         ' status='     + ration_job_desc.status;
}



function UserRation ( cfg_ration )  {

  this._type     = 'UserRation';

  // limits
  this.storage   = 0.0;  // MBytes (0: unlimited)
  this.cpu_day   = 0.0;  // hours  (0: unlimited)
  this.cpu_month = 0.0;  // hours  (0: unlimited)
  if (cfg_ration)  {
    this.storage   = cfg_ration.storage;
    this.cpu_day   = cfg_ration.cpu_day;
    this.cpu_month = cfg_ration.cpu_month;
  }

  this.jobs = [];

  // usage
  this.storage_used   = 0.0;  // MBytes, actually used
  this.cpu_day_used   = 0.0;  // hours, actually used
  this.cpu_month_used = 0.0;  // hours, actually used
  this.cpu_total_used = 0.0;  // hours, actually used
  this.jobs_total     = 0;    // total number of jobs done

}

UserRation.prototype.clearJobs = function()  {
  this.jobs = [];
  return this;
}


UserRation.prototype.jobIndex = function ( job_meta )  {
var k = -1;
  for (var i=0;(i<this.jobs.length) && (k<0);i++)
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
  for (var i=0;(i<this.jobs.length);i++)
    if (this.jobs[i].project==projectName)
      this.jobs[i].project = '""" ' + projectName + ' """';  // impossible project name
}


/*
UserRation.prototype.bookJob = function ( job_class )  {
var index = this.jobIndex ( job_class );
var t     = new Date().getTime()/3600000.0;  // hours from beginning

// One day (24 hours) is 86400000 milliseconds.
// One hour is 3600000 milliseconds

  //console.log ( 'index=' + index );
  //console.log ( this );
  if (index<0)  {  // new job
    index = this.jobs.length;
    this.jobs.push ( new RationJobDesc(job_class) );
  }

  if (job_class.isComplete() && (this.jobs[index].status<2))  {
    if (this.jobs[index].status==0)
      this.cpu_total_used += job_class.cpu_time;
    else   // subtract initial credit
      this.cpu_total_used += job_class.cpu_time - this.jobs[index].cpu_hours;
    this.jobs[index].cpu_hours  = job_class.cpu_time;  // put the actual reading
    this.jobs[index].chargeTime = t;   // record the moment of reading
    this.storage_used = Math.max ( 0,this.storage_used+job_class.disk_space );
    this.jobs_total++;
    this.jobs[index].status     = 2;   // prevents of multiple counts
    if (utils)
      utils.appendString ( 'ration.log',
        '\ncomplete ' + RationJobDesc_toString(this.jobs[index]) +
        ' jobs_total='   + this.jobs_total   +
        ' storage_used=' + this.storage_used
      );
  } else if (this.jobs[index].status==0)  {  // running jobs not to be processed twice
    // pre-book job stats
    var charge = job_class.cpu_credit();
    if (job_class.nc_type!='client')
          this.jobs[index].cpu_hours = charge;
    else  this.jobs[index].cpu_hours = 0.0;
    this.cpu_total_used        += charge;
    this.jobs[index].chargeTime = t;  // record the moment of pre-booking
    this.jobs[index].status     = 1;  // to prevent of multiple counting
    if (utils)
      utils.appendString ( 'ration.log',
        '\nrunning  ' + RationJobDesc_toString(this.jobs[index]) );
  }

  this.calculateTimeRation();

}
*/


UserRation.prototype.calculateTimeRation = function()  {
var t              = new Date().getTime()/3600000.0;  // hours from beginning
var tmd            = t - 24.0;   // current day threshold
var tmm            = t - 720.0;  // current month threshold
var jobs1          = [];
var cpu_day_used   = this.cpu_day_used;
var cpu_month_used = this.cpu_month_used;
var njobs          = this.jobs.length;

  this.cpu_day_used   = 0.0;  // hours, actually used
  this.cpu_month_used = 0.0;  // hours, actually used

  for (var i=0;i<njobs;i++)
    if (this.jobs[i].nc_type!='client')  {
      if (this.jobs[i].chargeTime>=tmd)
        this.cpu_day_used   += this.jobs[i].cpu_hours;
      if (this.jobs[i].chargeTime>=tmm)  {
        this.cpu_month_used += this.jobs[i].cpu_hours;
        jobs1.push ( this.jobs[i] );
      }
    }

  this.jobs = jobs1;  // leave only month-old jobs in the list

  // returns true if UserRation structure was changed
  return (cpu_day_used  !=this.cpu_day_used)   ||
         (cpu_month_used!=this.cpu_month_used) ||
         (njobs         !=this.jobs.length);

}


UserRation.prototype.bookJob = function ( job_class )  {

  if (!job_class)
    return false;  //  ration book has not changed

  if (this.jobIndex(job_class)>=0)  // the job was already booked to the ration
    return false;

  var t = new Date().getTime()/3600000.0;  // hours from beginning
  // One day (24 hours) is 86400000 milliseconds.
  // One hour is 3600000 milliseconds

  var rjdesc = new RationJobDesc(job_class)
  rjdesc.cpu_hours  = job_class.cpu_time;  // put the actual reading
  rjdesc.chargeTime = t;   // record the moment of reading
  this.jobs.push ( rjdesc );

  this.storage_used   += job_class.disk_space;
  this.cpu_total_used += job_class.cpu_time;

  this.jobs_total++;

  this.calculateTimeRation();

  return true;

}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.UserRation = UserRation;
}
