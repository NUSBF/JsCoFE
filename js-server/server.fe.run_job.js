
/*
 *  ==========================================================================
 *
 *    19.06.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.run_job.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Job Run Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  ==========================================================================
 *
 */


//  load system modules
var path      = require('path');
var crypto    = require('crypto');
var request   = require('request');

//  load application modules
var utils     = require('./server.utils');
var user      = require('./server.fe.user');
var prj       = require('./server.fe.projects');
var conf      = require('./server.configuration');
var send_dir  = require('./server.send_dir');
var ration    = require('./server.fe.ration');
var class_map = require('./server.class_map');
var task_t    = require('../js-common/tasks/common.tasks.template');
var cmd       = require('../js-common/common.commands');
var com_utils = require('../js-common/common.utils');
var knlg      = require('../js-common/common.knowledge');

//  prepare log
var log = require('./server.log').newLog(8);


// ===========================================================================

var feJobStatFile     = 'fe_job_stats.log';
var feJobRegisterFile = 'fe_job_register.meta';

function FEJobRegister()  {
  this.job_map   = {};
  this.token_map = {};
  this.n_jobs    = 0;   // serial counter for total number of jobs
}

FEJobRegister.prototype.addJob = function (
                                   job_token,nc_number,login,project,jobId )  {
  this.job_map[job_token] = {
    nc_number  : nc_number,
    nc_type    : 'ordinary',
    job_token  : job_token,  // job_token issued by NC
    login      : login,
    project    : project,
    jobId      : jobId,
    start_time : Date.now()
  };
  var index = login + ':' + project + ':' + jobId;
  this.token_map[index] = job_token;
}

FEJobRegister.prototype.getJobEntry = function ( login,project,jobId )  {
var index = login + ':' + project + ':' + jobId;
  if (index in this.token_map)  {
    return this.job_map[this.token_map[index]];
  } else {
    return null;
  }
}

FEJobRegister.prototype.getJobEntryByToken = function ( job_token )  {
  if (job_token in this.job_map)  {
    return this.job_map[job_token];
  } else {
    return null;
  }
}

FEJobRegister.prototype.removeJob = function ( job_token )  {
  if (job_token in this.job_map)  {
    var index = this.job_map[job_token].login   + ':' +
                this.job_map[job_token].project + ':' +
                this.job_map[job_token].jobId;
    this.token_map = com_utils.mapExcludeKey ( this.token_map,index     );
    this.job_map   = com_utils.mapExcludeKey ( this.job_map  ,job_token );
  }
}

var feJobRegister = null;

function readFEJobRegister()  {

  if (!feJobRegister)  {
    var fpath     = path.join ( conf.getFEConfig().projectsPath,feJobRegisterFile );
    feJobRegister = new FEJobRegister();
    obj           = utils.readObject ( fpath );
    if (obj)  {
      for (key in obj)
        feJobRegister[key] = obj[key];
    } else
      writeFEJobRegister();
  }

}

function writeFEJobRegister()  {
var fpath = path.join ( conf.getFEConfig().projectsPath,feJobRegisterFile );

  if (!feJobRegister)
    feJobRegister = new FEJobRegister();

  utils.writeObject ( fpath,feJobRegister );

}

function getEFJobEntry ( login,project,jobId )  {
  return feJobRegister.getJobEntry ( login,project,jobId );
}


// ===========================================================================

var last_number_cruncher = -1;

function selectNumberCruncher ( task )  {
var nc_servers = conf.getNCConfigs();
var nc_number  = -1;
var n          = last_number_cruncher;
var maxcap0    = Number.MIN_SAFE_INTEGER;
var n0         = -1;

  if (task.nc_type!='ordinary')
    return 0;  // this will not be used for client job, just make a valid return

  if (task.fasttrack)  { // request for fast track
    var maxcap1 = Number.MIN_SAFE_INTEGER;
    var n1      = -1;

    // first, look for servers dedicated to fast tracking, and choose first
    // free or the least busy one

    for (var i=0;(i<nc_servers.length) && (nc_number<0);i++)  {

      n++;
      if (n>=nc_servers.length)  n = 0;

      if (nc_servers[n].in_use && (nc_servers[n].exeType!='CLIENT') &&
          (nc_servers[n].exclude_tasks.indexOf(task._type)<0))  {

        if ((nc_servers[n].fasttrack==2) && (nc_servers[n].current_capacity>0))  {
          nc_number = n;
        } else if (nc_servers[n].fasttrack==1)  {
          if (nc_servers[n].current_capacity>0)  {
            maxcap0 = Number.MAX_SAFE_INTEGER;
            n0      = n;
          } else if (nc_servers[n].current_capacity>maxcap0)  {
            maxcap0 = nc_servers[n].current_capacity;
            n0      = n;
          }
        }

        if (nc_servers[n].exeType=='SHELL')  {
          if (nc_servers[n].current_capacity>0)  {
            maxcap1 = Number.MAX_SAFE_INTEGER;
            n1      = n;
          } else if (nc_servers[n].current_capacity>maxcap1)  {
            maxcap1 = nc_servers[n].current_capacity;
            n1      = n;
          }
        }

      }

    }

    if (nc_number>=0)  return nc_number;  // first free dedicated
    if (maxcap0>0)     return n0;         // first free accepting
    if (maxcap1>-2)    return n1;         // first free of SHELL type

    // if no suitable servers found, choose one as for a not fast-track request
    // below

  }

  // look for next free server, starting from the last used one
  for (var i=0;(i<nc_servers.length) && (nc_number<0);i++)  {
    n++;
    if (n>=nc_servers.length)  n = 0;
    if (nc_servers[n].in_use && (nc_servers[n].exeType!='CLIENT') &&
        (nc_servers[n].exclude_tasks.indexOf(task._type)<0))  {
      if (nc_servers[n].current_capacity>0)  {
        nc_number = n;
      } else if (nc_servers[n].current_capacity>maxcap0)  {
        maxcap0 = nc_servers[n].current_capacity;
        n0      = n;
      }
    }
  }

  if (nc_number<0)
    nc_number = n0;

  if (nc_number>=0)
    last_number_cruncher = nc_number

  return nc_number;

}


// ===========================================================================

function runJob ( login,data, callback_func )  {

  //var task = data.meta;
  var task = class_map.makeClass ( data.meta );
  if (!task)  {
    log.error ( 7,'Cannot make job class' );
    callback_func ( new cmd.Response(cmd.fe_retcode.corruptJobMeta,
                    '[00201] Corrupt job metadata',{}) );
    return;
  }

  // modify user knowledge
  var userKnowledgePath = prj.getUserKnowledgePath ( login );
  var knowledge = {};
  if (utils.fileExists(userKnowledgePath))
    knowledge = utils.readObject ( userKnowledgePath );
  knlg.addWfKnowledgeByTypes ( knowledge,task._type,data.ancestors );
  if (!utils.writeObject(userKnowledgePath,knowledge))
    log.error ( 1,'Cannot write user knowledge at ' + userKnowledgePath );

  // run job

  var jobDataPath = prj.getJobDataPath ( login,task.project,task.id );
  task.state = task_t.job_code.running;

  // write task data because it may have latest changes
  if (utils.writeObject(jobDataPath,task))  {

    var jobDir = prj.getJobDirPath ( login,task.project,task.id );

    var nc_number = 0;
    if (task.nc_type=='ordinary')  {

      nc_number = selectNumberCruncher ( task );

      if (nc_number<0)  {
        utils.writeJobReportMessage ( jobDir,
          '<h1>Task cannot be proccessed</h1>' +
          'No computational server has agreed to accept the task. This may ' +
          'be due to the lack of available servers for given task type, or ' +
          'because of the high number of tasks queued. Please try submitting ' +
          'this task later on.',false );
        task.state = task_t.job_code.failed;
        utils.writeObject ( jobDataPath,task );
        return;
      }

      log.standard ( 1,'sending job ' + task.id + ' to ' +
                       conf.getNCConfig(nc_number).name );

    } else
      log.standard ( 1,'sending job ' + task.id + ' to client service' );

    utils.writeJobReportMessage ( jobDir,'<h1>Preparing ...</h1>',true );

    // prepare input data
    task.makeInputData ( jobDir );

    if (task.nc_type=='client')  {
      // job for client NC, just pack the job directory and inform client

      send_dir.packDir ( jobDir,'*', function(code){

        if (code==0)  {

          utils.writeJobReportMessage ( jobDir,'<h1>Running on client ...</h1>' +
                      'Job is running on client machine. Full report will ' +
                      'become available after job finishes.',true );

          var job_token = crypto.randomBytes(20).toString('hex');
          feJobRegister.addJob ( job_token,nc_number,login,
                                 task.project,task.id );
          feJobRegister.getJobEntryByToken(job_token).nc_type = task.nc_type;
          writeFEJobRegister();

          // update the user ration state
          ration.updateUserRation_bookJob ( login,task );

          rdata = {};
          rdata.job_token   = job_token;
          rdata.tarballName = send_dir.tarballName;
          callback_func ( new cmd.Response(cmd.fe_retcode.ok,{},rdata) );

        } else  {
          callback_func ( new cmd.Response(cmd.fe_retcode.jobballError,
                          '[00001] Jobball creation errors',{}) );
        }

      });

      // NOTE: we do not count client jobs against user rations (quotas)

    } else  {

      // job for ordinary NC, pack and send all job directory to number cruncher
      var nc_url = conf.getNCConfig(nc_number).externalURL;
      send_dir.sendDir ( jobDir,'*',nc_url,cmd.nc_command.runJob,{},

        function ( rdata ){  // send successful

          // The number cruncher will start dealing with the job automatically.
          // On FE end, register job as engaged for further communication with
          // NC and client.
          feJobRegister.addJob ( rdata.job_token,nc_number,login,
                                 task.project,task.id );
          writeFEJobRegister();

          // update the user ration state
          ration.updateUserRation_bookJob ( login,task );

        },function(stageNo,code){  // send failed

          switch (stageNo)  {

            case 1: utils.writeJobReportMessage ( jobDir,
                    '<h1>[00002] Failed: data preparation error (' + code + ').</h1>',
                    false );
                  break;

            case 2: utils.writeJobReportMessage ( jobDir,
                    '<h1>[00003] Failed: data transmission errors.</h1>' +
                    '<p><i>Return: ' + code + '</i>',false );
                    log.error ( 2,'[00003] Cannot send data to NC at ' + nc_url );
                  break;

            default: utils.writeJobReportMessage ( jobDir,
                     '<h1>[00004] Failed: number cruncher errors.</h1>' +
                     '<p><i>Return: ' + code.message + '</i>',false );

          }

          task.state = task_t.job_code.failed;
          utils.writeObject ( jobDataPath,task );

        });

      callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',{}) );

    }

  } else  {

    callback_func ( new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00005] Job metadata cannot be written.',{} ) );

  }

}


// ===========================================================================

function stopJob ( login,data )  {
// Request to stop a running job. 'data' must contain a 'meta' field, which
// must be the Task class of job to be terminated.
var response = null;

  var task     = data.meta;
  var jobEntry = getEFJobEntry ( login,task.project,task.id );

  if (jobEntry)  {

    // send stop request to number cruncher
    var nc_url = conf.getNCConfig(jobEntry.nc_number).externalURL;
    log.standard ( 3,'request to stop job ' + task.id + ' at ' + nc_url );

    request({
      uri     : cmd.nc_command.stopJob,
      baseUrl : nc_url,
      method  : 'POST',
      body    : {job_token:jobEntry.job_token},
      json    : true
    },function(error,response,body){
        if (!error && (response.statusCode==200)) {
          log.standard ( 4,body.message );
        }
      }
    );

    response = new cmd.Response ( cmd.fe_retcode.ok,'',task );

  } else  {  // repair job metadata

    var jobDir      = prj  .getJobDirPath    ( login,task.project,task.id );
    var jobDataPath = prj  .getJobDataPath   ( login,task.project,task.id );
    var code        = utils.getJobSignalCode ( jobDir      );
    var jobData     = utils.readObject       ( jobDataPath );

    console.log ( ' **** REPAIR JOB METADATA' );
    console.log ( ' jobDir      = ' + jobDir );
    console.log ( ' jobDataPath = ' + jobDataPath );
    console.log ( ' code        = ' + code );

    if (!jobData)
      jobData = task;

    if (code==0)  jobData.state = task_t.job_code.finished;
            else  jobData.state = task_t.job_code.failed;

    utils.writeObject ( jobDataPath,jobData );

    response = new cmd.Response ( cmd.fe_retcode.ok,
                                  '[00006] Job was not running',jobData );

  }

  return response;

}


// ===========================================================================

var _day  = 86400000;
var _hour = 3600000;
var _min  = 60000;
var _sec  = 1000;

function writeJobStats ( jobEntry )  {

  /*
  var userFilePath = user.getUserDataFName ( jobEntry.login );
  var nJobs        = 0;
  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      if (!('nJobs' in uData))
            uData.nJobs = 1;
      else  uData.nJobs++;
      nJobs = uData.nJobs;
      if (!utils.writeObject(userFilePath,uData))
        log.error ( 3,'User file: ' + userFilePath + ' cannot be written' );
    } else
      log.error ( 4,'User file: ' + userFilePath + ' cannot be read' );
  } else
    log.error ( 5,'User file: ' + userFilePath + ' is not found' );
  */

  var t  = Date.now();
  var dt = t - jobEntry.start_time;
  var dd = Math.trunc(dt/_day);   dt -= dd*_day;
  var dh = Math.trunc(dt/_hour);  dt -= dh*_hour;
  var dm = Math.trunc(dt/_min);   dt -= dm*_min;
  var ds = Math.trunc(dt/_sec);

  var jobDataPath = prj  .getJobDataPath ( jobEntry.login,jobEntry.project,jobEntry.jobId );
  var jobClass    = utils.readClass      ( jobDataPath );

  if (jobClass)  {

    var userRation = ration.updateUserRation_bookJob ( jobEntry.login,jobClass );

    var S = '';
    if (Math.trunc(feJobRegister.n_jobs/20)*20==feJobRegister.n_jobs)
      S = '------------------------------------------------------------------' +
          '------------------------------------------------------------------' +
          '--------------------------------\n' +
          ' ###          Date Finished                   Date Started'  +
          '             DDD-HH:MM:SS NC#  State   User (jobs)        '  +
          '  Title\n' +
          '------------------------------------------------------------------' +
          '------------------------------------------------------------------' +
          '--------------------------------\n';

    S += com_utils.padDigits ( feJobRegister.n_jobs+1,6 ) + ' ' +

         '['   + new Date(t).toUTCString() +
         '] [' + new Date(jobEntry.start_time).toUTCString() +
         '] '  +

         com_utils.padDigits ( dd,3 ) + '-' +
         com_utils.padDigits ( dh,2 ) + ':' +
         com_utils.padDigits ( dm,2 ) + '.' +
         com_utils.padDigits ( ds,2 ) + ' ' +

         com_utils.padDigits ( jobEntry.nc_number.toString(),3 ) + ' ' +
         com_utils.padStringRight ( jobClass.state,' ',8 )       + ' ' +

//         com_utils.padStringRight ( jobEntry.login+' ('+nJobs+')',' ',20 ) + ' ' +
//            jobClass.title + '\n';
         com_utils.padStringRight ( jobEntry.login +
                ' (' + userRation.jobs_total + ')',' ',20 ) +
                    ' ' + jobClass.title + '\n';

    var fpath = path.join ( conf.getFEConfig().projectsPath,feJobStatFile );
    utils.appendString ( fpath,S );

  } else  {

    log.error ( 6,'No job metadata found at path ' + jobDataPath );

  }

  return jobClass;

}

function readJobStats()  {
  var stats = utils.readString ( path.join(conf.getFEConfig().projectsPath,feJobStatFile) );
  if (!stats)
    stats = 'Job stats are not available.';
  return stats;
}


// ===========================================================================

function getJobResults ( job_token,server_request,server_response )  {

  var jobEntry = feJobRegister.getJobEntryByToken ( job_token );

  if (jobEntry)  {

    var jobDir = prj.getJobDirPath ( jobEntry.login,jobEntry.project,
                                     jobEntry.jobId );

    send_dir.receiveDir ( jobDir,conf.getFETmpDir(),server_request,
      function(code,errs,meta){
        if (code==0)  {
          // print usage stats and update the user ration state
          //ration.updateUserRation_bookJob ( jobEntry.login,writeJobStats(jobEntry) );
          //var jobClass = writeJobStats    ( jobEntry );
          writeJobStats    ( jobEntry );
          cmd.sendResponse ( server_response, cmd.nc_retcode.ok,'','' );
          feJobRegister.removeJob ( job_token );
          feJobRegister.n_jobs++;
          writeFEJobRegister();
        } else if (code=='err_rename')  { // file renaming errors
          cmd.sendResponse ( server_response, cmd.nc_retcode.fileErrors,
                            '[00007] File rename errors' );
        } else if (code=='err_dirnoexist')  { // work directory deleted
          cmd.sendResponse ( server_response, cmd.nc_retcode.fileErrors,
                            '[00008] Recepient directory does not exist (job deleted?)' );
        } else if (code=='err_transmission')  {  // data transmission errors
          cmd.sendResponse ( server_response, cmd.nc_retcode.uploadErrors,
                            '[00009] Data transmission errors: ' + errs );
        } else  {
          cmd.sendResponse ( server_response, cmd.nc_retcode.unpackErrors,
                           '[00010] Tarball unpack errors' );
        }
      });

  } else   // job token not recognised, return Ok
    cmd.sendResponse ( server_response, cmd.fe_retcode.ok,'','' );

}


// ===========================================================================

function checkJobs ( login,data )  {

  var projectName = data.project;
  var run_map     = data.run_map;

  var completed_map = {};
  var empty = true;

  for (key in run_map)  {
    var jobDataPath = prj.getJobDataPath ( login,projectName,key );
    var jobData     = utils.readObject   ( jobDataPath );
    if (jobData)  {
      if ((jobData.state!=task_t.job_code.running) &&
          (jobData.state!=task_t.job_code.exiting))  {
        completed_map[key] = jobData;
        empty = false;
      }
    }
  }

  var rdata = {};
  rdata.completed_map = completed_map;

  if (!empty)  {  // save on reading files if nothing changes
    rdata.ration = ration.getUserRation(login).clearJobs();
    var p = utils.readObject ( prj.getProjectDataPath(login,projectName) );
    if (p)
      rdata.pdesc = p.desc;
  }

  return  new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

}


// ==========================================================================
// export for use in node
module.exports.readFEJobRegister  = readFEJobRegister;
module.exports.writeFEJobRegister = writeFEJobRegister;
module.exports.getEFJobEntry      = getEFJobEntry;
module.exports.runJob             = runJob;
module.exports.readJobStats       = readJobStats;
module.exports.stopJob            = stopJob;
module.exports.getJobResults      = getJobResults;
module.exports.checkJobs          = checkJobs;
