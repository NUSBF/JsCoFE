
/*
 *  =================================================================
 *
 *    30.08.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.user.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- User Support Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

//  load system modules
var path          = require('path');
var child_process = require('child_process');
//var diskusage     = require('diskusage');

//  load application modules
var cmd    = require('../js-common/common.commands');
var cutils = require('../js-common/common.utils');
var conf   = require('./server.configuration');
var utils  = require('./server.utils');
var task_t = require('../js-common/tasks/common.tasks.template');


//  prepare log
var log = require('./server.log').newLog(20);


// ===========================================================================

var statsDirName  = 'usage_stats';
var statsFileName = 'stats.json';

// ===========================================================================

var day_ms = 86400000;  // milliseconds in a day

function UsageStats()  {
  this._type       = 'UsageStats';
  this.startDate   = cutils.round ( Date.now()/day_ms-0.50001,0 ) * day_ms;
  this.startDateS  = new Date(this.startDate).toUTCString();
  this.currentDate = this.startDate;  // current date
  this.njobs       = [0];  // njobs[n] is number of jobs passed in nth day since start
  this.cpu         = [0];  // cpu[n] is number of cpu hours booked in nth day since start
  this.disk_free_projects  = [0.0];
  this.disk_free_users     = [0.0];
  this.disk_total_projects = 0.0;
  this.disk_total_users    = 0.0;
  this.tasks       = {};   // task[TaskTitle].icon       is path to task's icon
                           // task[TaskTitle]._type      is task's type
                           // task[TaskTitle].nuses      is number of uses since start
                           // task[TaskTitle].nfails     is number of failures since start
                           // task[TaskTitle].nterms     is number of terminations since start
                           // task[TaskTitle].cpu_time   is average cpu consumption since start
                           // task[TaskTitle].disk_space is average disk space consumption since start
}

UsageStats.prototype.registerJob = function ( job_class )  {
// returns true if 24-hour period was counted

  var currDate = Date.now();
  var n0 = this.njobs.length;
  while (currDate-this.currentDate>day_ms)  {
    this.currentDate += day_ms;
    this.njobs.push(0);
    this.cpu  .push(0);
    this.disk_free_projects.push ( this.disk_free_projects[n0-1] );
    this.disk_free_users   .push ( this.disk_free_users   [n0-1] );
  }
  var n1 = this.njobs.length-1;
  this.njobs[n1]++;
  this.cpu  [n1] += job_class.cpu_time;

  if (!this.tasks.hasOwnProperty(job_class.title))
    this.tasks[job_class.title] = {
      'icon'       : cmd.image_path(job_class.icon()),
      '_type'      : job_class._type, //title.split('(')[0],
      'nuses'      : 0,
      'nfails'     : 0,
      'nterms'     : 0,
      'cpu_time'   : 0,
      'disk_space' : 0
    };
  var ts = this.tasks[job_class.title];
  ts.nuses++;
  if (job_class.state==task_t.job_code.failed)
    ts.nfails++;
  if (job_class.state==task_t.job_code.stopped)
    ts.nterms++;

  var rf = (ts.nuses-1.0)/ts.nuses;
  ts.cpu_time   = ts.cpu_time*rf   + job_class.cpu_time/ts.nuses;
  ts.disk_space = ts.disk_space*rf + job_class.disk_space/ts.nuses;

  //return true;
  return (n1>=n0);

}

// ---------------------------------------------------------------------------

function getUsageReportURL()  {
  return [cmd.special_url_tag,statsDirName,'index.html'].join('/');
}

function getUsageReportFilePath ( fname )  {
  return path.join ( conf.getFEConfig().storage,statsDirName,fname );
}

// ---------------------------------------------------------------------------

var usageStats = null;

function registerJob ( job_class )  {
var fe_config       = conf.getFEConfig();
var statsDirPath    = path.join ( fe_config.storage,statsDirName );
var statsFilePath   = path.join ( statsDirPath,statsFileName );
var generate_report = false;

  if (!usageStats)  {
    usageStats = utils.readClass ( statsFilePath );
    if (!usageStats)  {
      log.standard ( 1,'usage stats initialised' );
      if (!utils.dirExists(statsDirPath))
        utils.mkDir ( statsDirPath );
      usageStats = new UsageStats();
      generate_report = true;
    }
  }

  if (usageStats.registerJob(job_class))
    generate_report = true;

  utils.writeObject ( statsFilePath,usageStats );

  if (generate_report)  {
    log.standard ( 2,'generate usage stats report ...' );
    var cmd = [ '-m', 'pycofe.proc.usagestats',
                fe_config.storage,
                fe_config.userDataPath,
                statsFilePath,
                statsDirPath
              ];
    var job = utils.spawn ( conf.pythonName(),cmd,{} );
    // make stdout and stderr catchers for debugging purposes
    var stdout = '';
    var stderr = '';
    job.stdout.on('data',function(buf){
      stdout += buf;
    });
    job.stderr.on('data',function(buf){
      stderr += buf;
    });
    job.on ( 'close',function(code){
      if (code!=0)  {
        log.standard ( 3,'failed to generate usage report, code=' + code +
                         '\n    stdout=\n' + stdout );
        log.error    ( 3,'failed to generate usage report, code=' + code +
                         '\n    stderr=\n' + stderr );
      } else
        usageStats = utils.readClass ( statsFilePath );
    });
  }

}


// ==========================================================================
// export for use in node
module.exports.UsageStats             = UsageStats;
module.exports.registerJob            = registerJob;
module.exports.statsDirName           = statsDirName;
module.exports.getUsageReportURL      = getUsageReportURL;
module.exports.getUsageReportFilePath = getUsageReportFilePath;
