
/*
 *  =================================================================
 *
 *    04.10.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.usagestats.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- User Support Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2020
 *
 *  =================================================================
 *
 */

//  load system modules
var path          = require('path');
var child_process = require('child_process');
//var diskusage     = require('diskusage');

//  load application modules
var cmd     = require('../js-common/common.commands');
var cutils  = require('../js-common/common.utils');
var conf    = require('./server.configuration');
var user    = require('./server.fe.user');
var emailer = require('./server.emailer');
var utils   = require('./server.utils');
var task_t  = require('../js-common/tasks/common.tasks.template');
var ud      = require('../js-common/common.data_user');

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
  this.volumes     = {};
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

  if ('disk_free_projects' in this)  {
    // reshape object
    this.volumes = {
      '***'       : { 'free'      : this.disk_free_projects,
                      'total'     : this.disk_total_projects,
                      'committed' : Array(this.disk_free_projects.length).fill(0)
                    },
      'user_data' : { 'free'      : this.disk_free_users,
                      'total'     : this.disk_total_users,
                      'committed' : Array(this.disk_free_users.length).fill(0)
                    }
    };
    delete this.disk_free_projects;
    delete this.disk_total_projects;
    delete this.disk_free_users;
    delete this.disk_total_users;
  }

  var currDate = Date.now();
  var n0 = this.njobs.length;
  while (currDate-this.currentDate>day_ms)  {
    this.currentDate += day_ms;
    this.njobs.push(0);
    this.cpu  .push(0);
    for (var vname in this.volumes)  {
      if (!('committed' in this.volumes[vname]))
        this.volumes[vname].committed = Array(this.volumes[vname].free.length).fill(0)
      this.volumes[vname].free.push ( this.volumes[vname].free[n0-1] );
      this.volumes[vname].committed.push ( this.volumes[vname].committed[n0-1] );
    }
  }
  var n1 = this.njobs.length-1;
  this.njobs[n1]++;

  if (job_class)  {

    this.cpu[n1] += job_class.cpu_time;

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

  }

  //return true;
  return (n1>=n0);

}

// ---------------------------------------------------------------------------

function getUsageReportURL()  {
  return [cmd.__special_url_tag,statsDirName,'index.html'].join('/');
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

  if (generate_report)  {

    for (var vname in usageStats.volumes)  {
      var committed = usageStats.volumes[vname].committed;
      committed[committed.length-1] = 0.0;
    }

    var users = user.readUsersData().userList;
    for (var i=0;i<users.length;i++)  {
      var c = 0;
      if (users[i].dormant)  c = users[i].ration.storage_used;
                       else  c = users[i].ration.storage;
      if (users[i].volume in usageStats.volumes)  {
        var committed = usageStats.volumes[users[i].volume].committed;
        committed[committed.length-1] += c/1024.0;  // from MB to GB
      }
    }
  }

  utils.writeObject ( statsFilePath,usageStats );

  if (process.env.hasOwnProperty('CCP4'))  {
    utils.spawn ( path.join(process.env.CCP4,'libexec','ccp4um-bin'),
                  ['-check-silent'] )
         .on('exit', function(code){
           var emailer_conf = conf.getEmailerConfig();
           var userData = null;
           if (emailer_conf.type!='desktop')  {
             userData = new ud.UserData();
             userData.name  = cmd.appName() + ' Mainteiner';
             userData.email = emailer_conf.maintainerEmail;
           }
           code = 2;
           if (code==254)  {
             log.standard ( 20,'New CCP4 series released, please upgrade' );
             if (userData)
               emailer.sendTemplateMessage ( userData,
                     cmd.appName() + ': New CCP4 Series','ccp4_release',{} );
           } else if ((0<code) && (code<254))  {
             log.standard ( 21,code + ' CCP4 updates available, please apply' );
             if (userData)  {
               var txt = 'CCP4 Update is ';
               if (code>1)
                 txt = code + ' CCP4 Updates are '
               emailer.sendTemplateMessage ( userData,
                     cmd.appName() + ': CCP4 Update','ccp4_update',{
                       'text' : txt
                     } );
             }
           } else if (code)  {
             log.error ( 22,'checking for CCP4 updates failed, code='+code );
             if (userData)
               emailer.sendTemplateMessage ( userData,
                     cmd.appName() + ': Update Check Errors','ccp4_check_errors',{} );
           }
         });
  } else
    log.standard ( 23,'cannot check CCP4 updates, no CCP4 path in the environment' );

  if (generate_report)  {
    log.standard ( 2,'generate usage stats report ...' );
    var cmd_params = [ '-m', 'pycofe.proc.usagestats',
                       statsFilePath,
                       statsDirPath,
                       'user_data', fe_config.userDataPath,
                       'storage',   fe_config.storage
                     ];
    for (var fsname in fe_config.projectsPath)  {
      cmd_params.push ( fsname );
      cmd_params.push ( fe_config.projectsPath[fsname].path );
    }

    //console.log ( conf.pythonName() + ' ' + cmd_params.join(' ') );

    var job = utils.spawn ( conf.pythonName(),cmd_params,{} );
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
//      if (code!=0)  {
      if (code)  {
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
