
/*
 *  =================================================================
 *
 *    04.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.nc.job_manager.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Number Cruncher Server -- Job Manager
 *       ~~~~~~~~~
 *
 *    function ncGetJobsDir()
 *    function ncGetJobDir ( jobNo )
 *    class  NCJobRegister
 *    function readNCJobRegister ( readKey )
 *    function writeNCJobRegister()
 *    function removeJobDelayed  ( job_token,jobStatus )
 *    function cleanNC           ( cleanDeadJobs_bool )
 *    function writeJobDriverFailureMessage ( code,stdout,stderr,jobDir )
 *    function checkJobsOnTimer  ()
 *    function startJobCheckTimer()
 *    function stopJobCheckTimer ()
 *    function ncSendFile        ( url,server_response,url_search )
 *    function calcCapacity      ( onFinish_func )
 *    function copyToSafe        ( task,jobEntry )
 *    function ncJobFinished     ( job_token,code )
 *    function ncRunJob          ( job_token,meta )
 *    function ncMakeJob         ( server_request,server_response )
 *    function _stop_job         ( jobEntry )
 *    function ncStopJob         ( post_data_obj,callback_func )
 *    function ncWakeZombieJobs  ( post_data_obj,callback_func )
 *    function make_local_job    ( files,base_url,destDir,job_token,callback_func )
 *    function ncRunRVAPIApp     ( post_data_obj,callback_func )
 *    function ncSendJobResults  ( post_data_obj,callback_func )
 *    function ncRunClientJob1   ( post_data_obj,callback_func,attemptNo )
 *    function ncRunClientJob    ( post_data_obj,callback_func )
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const path          = require('path');
const child_process = require('child_process');
const crypto        = require('crypto');
const fs            = require('fs-extra');
const psTree        = require('ps-tree');
const request       = require('request');

//  load application modules
const conf          = require('./server.configuration');
const send_dir      = require('./server.send_dir');
const utils         = require('./server.utils');
const task_t        = require('../js-common/tasks/common.tasks.template');
const data_t        = require('../js-common/dtypes/common.dtypes.template');
const task_rvapiapp = require('../js-common/tasks/common.tasks.rvapiapp');
const cmd           = require('../js-common/common.commands');
const ud            = require('../js-common/common.data_user');
const comut         = require('../js-common/common.utils');

//  prepare log
const log = require('./server.log').newLog(11);

// ===========================================================================

// for debugging
//let __use_fake_fe_url = false;

// ===========================================================================

const jobsDir       = 'jobs';  // area in nc-storage to host all job directories
const registerFName = 'job_register.meta';  // file name to keep job register

const __day_ms      = 86400000;

// ===========================================================================

function ncGetJobsDir() {
  return path.join ( conf.getServerConfig().storage,jobsDir );
}

function ncGetJobDir ( jobNo ) {
  return path.join ( conf.getServerConfig().storage,jobsDir,'job_' + jobNo );
}

// ===========================================================================

function NCJobRegister()  {
  this.launch_count = 0;
  this.job_map      = {};
  this.timer        = null; // job check timer
  this.logflow      = {};
  this.logflow.logno = 0;
  this.logflow.njob0 = 0;
}


NCJobRegister.prototype.addJob = function ( jobDir )  {
let job_token     = crypto.randomBytes(20).toString('hex');
let maxSendTrials = conf.getServerConfig().maxSendTrials;
let crTime        = Date.now();
  this.job_map[job_token] = {
    feURL         : '',
    jobDir        : jobDir,
    jobStatus     : task_t.job_code.new,
    return_data   : true,
    sendTrials    : maxSendTrials,
    startTime     : crTime,
    startTime_iso : new Date(crTime).toISOString(),
    endTime       : null,
    progress      : 0,      // progress measure
    lastAlive     : crTime, // last time when job was alive
    exeType       : '',     // SHELL, SGE or SCRIPT
    pid           : 0       // job pid is added separately
  };
  return job_token;
}


NCJobRegister.prototype.addJob1 = function ( jobDir,job_token )  {
let maxSendTrials = conf.getServerConfig().maxSendTrials;
let crTime        = Date.now();
  this.job_map[job_token] = {
    feURL         : '',
    jobDir        : jobDir,
    jobStatus     : task_t.job_code.new,
    return_data   : true,
    sendTrials    : maxSendTrials,
    startTime     : crTime,
    startTime_iso : new Date(crTime).toISOString(),
    endTime       : null,
    progress      : 0,      // progress measure
    lastAlive     : crTime, // last time when job was alive
    exeType       : '',     // SHELL or SGE
    pid           : 0       // job pid is added separately
  };
  return job_token;
}


NCJobRegister.prototype.getJobEntry = function ( job_token )  {
  if (job_token in this.job_map)
        return this.job_map[job_token];
  else  return null;
}

NCJobRegister.prototype.wakeZombi = function ( job_token )  {
  if (job_token in this.job_map)  {
    let jobEntry = this.job_map[job_token];
    let crTime   = Date.now();
    // console.log ( ' >> awaken ' + JSON.stringify(jobEntry) );
    // if (jobEntry && jobEntry.endTime &&
    //      ((jobEntry.jobStatus==task_t.job_code.exiting) ||
    //       (([task_t.job_code.finished,task_t.job_code.failed,task_t.job_code.stopped]
    //         .indexOf(jobEntry.jobStatus)>=0) &&
    //        ((crTime-jobEntry.endTime)>86400)
    //       )
    //      )
    //    )  {
    if (jobEntry && jobEntry.endTime &&
         ((jobEntry.jobStatus==task_t.job_code.exiting) || 
          (crTime-jobEntry.endTime>__day_ms)))  {
      // (jobEntry.sendTrials<=0))  {
      jobEntry.jobStatus  = task_t.job_code.running;
      jobEntry.sendTrials = conf.getServerConfig().maxSendTrials;
      jobEntry.awakening  = true;
      return true;
    }
  }
  return false;
}

NCJobRegister.prototype.removeJob = function ( job_token )  {
  if (job_token in this.job_map)  {
    (function(jobDir,jobRemoveTimeout){
      setTimeout ( function(){
        utils.removePath(jobDir);
      },jobRemoveTimeout );
    }(this.job_map[job_token].jobDir,
      conf.getServerConfig().jobRemoveTimeout));
    this.job_map = comut.mapExcludeKey ( this.job_map,job_token );
  }
}

NCJobRegister.prototype.getListOfTokens = function()  {
  let tlist = '';
  for (let job_token in this.job_map)  {
    if (tlist)  tlist += ',';
    tlist += job_token;
  }
  return tlist;
}


/*
NCJobRegister.prototype.checkJobTokens = function ( token_list )  {
// returns a list of non-existing tokens
let tlist = [];
  for (let i=0;i<token_list.length;i++)
    if (!(token_list[i] in this.job_map))
      tlist.push ( token_list[i] );
  return tlist;
}
*/

let ncJobRegister = null;

function readNCJobRegister ( readKey )  {

  if (!ncJobRegister)  {

    let fpath = path.join ( conf.getServerConfig().storage,registerFName );
    let saveRegister = true;

    ncJobRegister = new NCJobRegister();
    let obj       = utils.readObject ( fpath );

    if (obj)  {

      saveRegister = false;

      for (let key in obj)
        ncJobRegister[key] = obj[key];

      if (readKey==0)  {
        // set all finished but not sent jobs for sending
        let maxSendTrials = conf.getServerConfig().maxSendTrials;
        for (let job_token in ncJobRegister.job_map)
          if (ncJobRegister.job_map.hasOwnProperty(job_token))  {
            if (ncJobRegister.job_map[job_token].jobStatus==task_t.job_code.exiting) {
              ncJobRegister.job_map[job_token].jobStatus  = task_t.job_code.running;
              ncJobRegister.job_map[job_token].sendTrials = maxSendTrials;
              let saveRegister = true;
            }
            if (!ncJobRegister.job_map[job_token].hasOwnProperty('endTime'))
              ncJobRegister.job_map[job_token].endTime = null;
            if (!ncJobRegister.job_map[job_token].hasOwnProperty('progress'))  {
              ncJobRegister.job_map[job_token].progress  = 0;
              ncJobRegister.job_map[job_token].lastAlive = null;
            }
          }
      }

    }

    if (saveRegister)
      writeNCJobRegister();

    startJobCheckTimer();

  }

  return ncJobRegister;

}

function writeNCJobRegister()  {
let fpath = path.join ( conf.getServerConfig().storage,registerFName );

  if (!ncJobRegister)
    ncJobRegister = new NCJobRegister();

  // Job register is a very light object, therefore, it is read/written in
  // synchronous mode. Therefore, we do not need to suspend job checking
  // loop here -- but take care not to write the timer object
  // (ncJobRegister.timer) in the file!

  let timer = ncJobRegister.timer;
  ncJobRegister.timer = null;

  utils.writeObject ( fpath,ncJobRegister );

  ncJobRegister.timer = timer;

}


function removeJobDelayed ( job_token,jobStatus )  {
  if (ncJobRegister)  {
    let jobEntry = ncJobRegister.getJobEntry ( job_token );
    if (jobEntry)  {
      jobEntry.jobStatus = jobStatus;
      writeNCJobRegister();
      setTimeout ( function(){
        ncJobRegister.removeJob ( job_token );
        writeNCJobRegister();
      },
      conf.getServerConfig().jobCheckPeriod );
    }
  }
}

function cleanNC ( cleanDeadJobs_bool )  {

  readNCJobRegister ( 1 );
  stopJobCheckTimer ();

  // 1. Check for and remove runaway registry entries

  let mask = {};
  let n    = 0;
  for (let job_token in ncJobRegister.job_map)
    if (utils.dirExists(ncJobRegister.job_map[job_token].jobDir))  {
      // job directory exists; mask token against deletion
      mask[job_token] = true;
    } else  {
      n++;
      log.standard ( 30,'removed unassigned job token: ' + job_token );
    }
  // delete job registry entries with tokens that were not masked
  ncJobRegister.job_map = comut.mapMaskIn ( ncJobRegister.job_map,mask );
  log.standard ( 31,'total unassigned job tokens removed: ' + n );

  // 2. Check for and remove runaway job directories

  let jobsDir = ncGetJobsDir();
  n = 0;
  fs.readdirSync(jobsDir).forEach(function(file,index){
    let curPath = path.join ( jobsDir,file );
    let lstat   = fs.lstatSync(curPath);
    if (lstat.isDirectory()) {
      // check if the directory is found in job registry
      let dir_found = false;
      for (let job_token in ncJobRegister.job_map)
        if (ncJobRegister.job_map[job_token].jobDir==curPath)
          dir_found = true;
      if (!dir_found)  {
        // job registry does not contain references to the directory, so delete it
        utils.removePath ( curPath );
        n++;
        log.standard ( 32,'removed abandoned job directory: ' + file );
      }
    }
  });
  log.standard ( 33,'total abandoned job directories removed: ' + n );

  // 3. Check for and remove directories and registry entries for dead jobs

  if (cleanDeadJobs_bool)  {
    // let _day = __day_ms; // 86400000.0;
    let srvConfig = conf.getServerConfig();
    let _false_start = srvConfig.jobFalseStart;   // days; should come from config
    let _timeout     = srvConfig.jobTimeout;      // days; should come from config
    let _zombie_life = srvConfig.zombieLifeTime;  // days
    let t = Date.now()/__day_ms;
    let n = 0;
    let nzombies = 0;
    for (let job_token in ncJobRegister.job_map)  {
      let jobEntry = ncJobRegister.job_map[job_token];
      let endTime  = ncJobRegister.job_map[job_token].endTime;
      if (endTime)  {
        endTime /= __day_ms;
        nzombies++;
      }
      let startTime = t;
      if ('startTime' in jobEntry)
            startTime = jobEntry.startTime/__day_ms;
      else  jobEntry.startTime = t*__day_ms;
      if ((jobEntry.pid<=0) && (t-startTime>_false_start))  {  // did not manage to start
        // process not found, schedule job for deletion
        n++;
        log.standard ( 34,'dead job scheduled for deletion, token:' + job_token );
        _stop_job ( jobEntry );
      } else if (endTime && (t-endTime>_zombie_life))  { // old zombie
        n++;
        log.standard ( 35,'zombie job scheduled for deletion, token:' + job_token );
        _stop_job ( jobEntry );
      } else if ((!endTime) && (t-startTime>_timeout))  { // timeout
        n++;
        try {
          process.kill ( jobEntry.pid,0 );
        } catch (e) {
          // process not found, schedule job for deletion
          log.standard ( 36,'long job scheduled for timeout, token:' + job_token );
          _stop_job ( jobEntry );
        }
      }
    }
    log.standard ( 37,'total dead/zombie/timeout jobs scheduled for deletion: ' + n );
    log.standard ( 38,'total zombie jobs: ' + nzombies );
  }

  // start job check loop

  writeNCJobRegister();
  startJobCheckTimer();

}


// ===========================================================================

function writeJobDriverFailureMessage ( code,stdout,stderr,jobDir )  {

let msg = '<h1><i>Job Driver Failure</i></h1>' + 'Failure code: ' + code;

  if (stdout)
    msg += '<p>Catched stdout:<pre>' + stdout + '</pre>';
  if (stderr)
    msg += '<p>Catched stderr:<pre>' + stderr + '</pre>';

  msg += '<p>This is an internal error, which may be caused by various ' +
         'sort of hardware and network malfunction, but most probably due ' +
         'to a bug or not anticipated properties of input data.' +
         '<p>You may contribute to the improvement of ' + cmd.appName() + ' by sending this ' +
         'message <b>together with</b> input data <b>and task description</b> ' +
         'to ' + conf.getEmailerConfig().maintainerEmail;

  utils.writeJobReportMessage ( jobDir,msg,false );

}


// ===========================================================================

function checkJobsOnTimer()  {
// This function checks status of all jobs in job registry. If job is marked
// as running, the existance of signal file in job directory is checked. If
// signal was thrown (which means that signal file was written), then the job
// is considered as finished and is then forwarded for wrap-up procedures
// (decoding status, updating registry, packin and sending back to FE).
// *** IN FUTURE: provide parallel checking on running processes in both
// SHELL and SGE modes to deal with situations when job crashed without
// writing a signal file.
// *** IN FUTURE: assume that there may be jobs stack in 'exiting' state for
// unreasonably long time, deal with them.

  ncJobRegister.timer = null;  // indicate that job check loop is suspended
                               // (this is paranoid)
  let crTime = Date.now();
  let zombieLifeTime = __day_ms*conf.getServerConfig().zombieLifeTime;
  let pulseLifeTime  = __day_ms*conf.getServerConfig().pulseLifeTime;

  // loop over all entries in job registry
  for (let job_token in ncJobRegister.job_map)  {

    let jobEntry = ncJobRegister.job_map[job_token];

    if (jobEntry.endTime && (crTime-jobEntry.endTime>zombieLifeTime))  {
      // job was not sent to FE for long time -- delete it now

      removeJobDelayed ( job_token,task_t.job_code.finished );
      log.error ( 60,'zombi job deleted, token:' + job_token );

    } else if ([task_t.job_code.running,task_t.job_code.stopped]
                                           .indexOf(jobEntry.jobStatus)>=0)  {
      // Here, look only at jobs that are marked as 'running' or 'stopped'.
      // Other job markings mean that the job is either in the queue or in
      // process of being sent to FE.

      // check that signal file exists: it may be put in by task or job manager
      let is_signal = utils.jobSignalExists ( jobEntry.jobDir );

      if ((!is_signal) && (jobEntry.exeType=='SGE'))  {
        // check if job failed on sge level
        let sge_err_path = path.join(jobEntry.jobDir,'_job.stde');
        if (utils.fileSize(sge_err_path)>0)  {
          writeJobDriverFailureMessage ( 301,
                      utils.readString(path.join(jobEntry.jobDir,'_job.stdo')),
                      utils.readString(sge_err_path),jobEntry.jobDir );
          utils.writeJobSignal ( jobEntry.jobDir,'fail_job','job driver failure',
                                 202 );
          is_signal = true;
        }
      }

      if (is_signal)  {
        // the signal was thrown one way or another
        /*
        jobEntry.jobStatus = task_t.job_code.exiting;
        if (!jobEntry.endTime)
          jobEntry.endTime = crTime;
        // we do not save changed registry here -- this will be done in
        // ncJobFinished() before asynchronous send to FE
        */
        let code = utils.getJobSignalCode ( jobEntry.jobDir );
        // whichever the code is, wrap-up the job
        ncJobFinished ( job_token,code );
      } else if (crTime-jobEntry.startTime>pulseLifeTime)  {
        // check pulse
        let progress = utils.fileSize ( path.join(jobEntry.jobDir,'_stdout.log') );
        if (progress>jobEntry.progress)  {
          jobEntry.progress  = progress;
          jobEntry.lastAlive = crTime;
        } else if (crTime-jobEntry.lastAlive>pulseLifeTime)  {
          // job looks dead -- kill it now
          log.error ( 61,'attempt to kill silent job ' + job_token + ' pid=' + jobEntry.pid );
          _stop_job ( jobEntry );
        }
      }

    }

  }

  startJobCheckTimer();

}


function startJobCheckTimer()  {
  if (!ncJobRegister.timer)  {
    let areJobs = false;
    for (let job_token in ncJobRegister.job_map)
      if (ncJobRegister.job_map.hasOwnProperty(job_token))  {
        if (ncJobRegister.job_map[job_token].jobStatus==task_t.job_code.running) {
          areJobs = true;
          break;
        }
      }
    if (areJobs)
      ncJobRegister.timer = setTimeout ( function(){ checkJobsOnTimer(); },
                                         conf.getServerConfig().jobCheckPeriod );
  }
}


function stopJobCheckTimer()  {
  if (ncJobRegister.timer)  {
    clearTimeout ( ncJobRegister.timer );
    ncJobRegister.timer = null;
  }
}


// ===========================================================================

function ncSendFile ( url,server_response,url_search )  {
// function to send a file from running job directory on NC in response to
// request from a client through FE.
let fname = null;
let cap   = false;

  if (url_search)
    cap = (url_search.indexOf('?capsize')>=0);

  let ix = url.indexOf('jsrview');
  if (ix>=0)  {  // request for jsrview library file, load it from js-lib
                 // REGARDLESS the actual path requested

    fname = path.join ( 'js-lib',url.substr(ix) );

  } else  {

    let rtag = cmd.__special_url_tag + '-fe/';
    ix = url.lastIndexOf(rtag);
    if (ix>=0)  {

      fname = url.substr(ix+rtag.length);
      log.debug2 ( 4,"calculated path " + fname );
      //log.standard ( 4,"calculated path " + fname );

    } else  {

  //console.log ( ' NC: url=' + url );
      let plist    = url.split('/');
      let jobEntry = ncJobRegister.getJobEntry( plist[1] );

      if (jobEntry)  {  // job token is valid

        // calculate path within job directory
        fname = jobEntry.jobDir;
        for (let i=2;i<plist.length;i++)
          fname = path.join ( fname,plist[i] );

  //console.log ( ' jobEntry found, fname=' + fname );

      } else  {

  //console.log ( ' jobEntry NOT found, url=' + url );

        log.error ( 2,'Unrecognised job token in url ' + url );
        if (url.endsWith('.html'))  {
          // assume that this is due to a delay in job launching
          server_response.writeHead ( 200,
                                      {'Content-Type': 'text/html;charset=UTF-8'} );
          server_response.end (
            '<!DOCTYPE html>\n<html><head>' +
              '<title>Job is not prepared yet</title>' +
              '<meta http-equiv="refresh" content="2" />' +
            '</head><body class="main-page">' +
              '<h2>Waiting for Job to start ....</h2><i>Issuing job token ...</i>' +
            '</body></html>'
          );
        } else  {
          server_response.writeHead ( 404,
                                      {'Content-Type': 'text/html;charset=UTF-8'} );
          server_response.end ( '<p><b>UNRECOGNISED JOB TOKEN</b></p>' );
        }
        return;

      }

    }

  }

  // Read the requested file content from file system
  if (fname)  {
    let capSize = 0;
    let server_cfg = conf.getServerConfig();
    if (cap)
      capSize = server_cfg.fileCapSize;
    if (server_cfg.isFilePathAllowed(fname))
      utils.send_file ( fname,server_response,utils.getMIMEType(fname),false,
                        capSize,20,null );
    else  {
      server_response.writeHead ( 404,
                                      {'Content-Type': 'text/html;charset=UTF-8'} );
      server_response.end ( '<p><b>ACCESS DENIED</b></p>' );
    }
  }

}


// ===========================================================================

function calcCapacity ( onFinish_func )  {
//
//   Calculates residual capacity and calls onFinish_func(capacity).
//
//   For CLIENT and SHELL, this function returns NC assigned capacity (i.e. 
// capacity specified in NC's configiuration) minus the number of currently 
// running jobs. 
//
//   For queuing systems, the return is the same unless there are waiting jobs 
// in the queue, in which case this function returns minus the number of 
// waiting jobs.
//
//   Negative capacity means that NC is overloaded and is deprioritised for 
// sending jobs to it. The job despatch mechanism sends jobs evenly to NCs 
// with positive capacity, or to NC with least negative capacity if all NCs 
// are overloaded.
//
let ncConfig = conf.getServerConfig();
let capacity = ncConfig.capacity;  // total number of jobs the number cruncher
                                   // can accept without stretching
let nRegJobs = 0;  // number of jobs listed as active in registry

  for (let item in ncJobRegister.job_map)
    // if (!ncJobRegister.job_map[item].endTime)
    if (ncJobRegister.job_map[item].jobStatus==task_t.job_code.running)
      nRegJobs++;

  switch (ncConfig.exeType)  {

    default       :
    case 'CLIENT' :
    case 'SHELL'  : //capacity -= Math.max(Object.keys(ncJobRegister.job_map).length-1,0);
                    capacity -= nRegJobs;
                    onFinish_func ( capacity );
               break;

    case 'SGE'    : let sge_job = utils.spawn ( 'qstat',['-u',process.env.USER],{} );
                    let qstat_output = '';
                    sge_job.stdout.on('data', function(data) {
                      qstat_output += data.toString();
                    });
                    sge_job.on ( 'close', function(code) {
                      let regExp = new RegExp('  qw  ','gi');
                      let n = (qstat_output.match(regExp) || []).length;
                      if (n>0)  capacity  = -n;
                          else  capacity -= nRegJobs;
                      //    else  capacity -= Object.keys(ncJobRegister.job_map).length;
                      onFinish_func ( capacity );
                    });
                break;

    case 'SLURM' :  let slurm_job = utils.spawn ( 'squeue',['-u',process.env.USER],{} );
                    let slurm_output = '';
                    slurm_job.stdout.on ( 'data', function(data) {
                      slurm_output += data.toString();
                    });
                    slurm_job.on ( 'close', function(code) {
                      // should return just the number but escape just in case
                      let n = 0;
                      try {
                        let lines = slurm_output.trim().split(/\s*[\r\n]+\s*/g);
                        // count lines indicating waiting jobs
                        for (let i=1;i<lines.length;i++)  {
                          let llist = lines[i].match(/[^ ]+/g);
                          if ((llist.length>5) && (comut.isInteger(llist[0])) &&
                                                  (llist[4].toLowerCase()!='r'))
                            n++;
                        }
                      } catch(err)  {
                        n = 0;
                        log.error ( 31,'error parsing NC capacity: "' +
                                       slurm_output + '"' );
                      }
                      if (n>0)  capacity  = -n; // negative capacity if jobs are waiting
                          else  capacity -= nRegJobs;
                      onFinish_func ( capacity );
                    });
                break;


    case 'SCRIPT' : let script_job = utils.spawn ( ncConfig.exeData,
                                            ['check_waiting',process.env.USER],{} );
                    let job_output = '';
                    script_job.stdout.on ( 'data', function(data) {
                      job_output += data.toString();
                    });
                    script_job.on ( 'close', function(code) {
                      // should return just the number but escape just in case
                      let n = 0;
                      try {
                        n = parseInt(job_output);
                      } catch(err)  {
                        n = 0;
                        log.error ( 31,'error parsing NC capacity: "' +
                                       job_output + '"' );
                      }
                      if (n>0)  capacity  = -n;
                          else  capacity -= nRegJobs;
                      onFinish_func ( capacity );
                    });
                break;

  }

}


// ===========================================================================

function copyToSafe ( task,jobEntry )  {

  if ([ud.feedback_code.agree1,ud.feedback_code.agree2].indexOf(jobEntry.feedback)>=0)  {

    let jobsSafe    = conf.getServerConfig().getJobsSafe();
    let safeDirPath = path.join ( jobsSafe.path,task._type );

    try {

      if (!utils.fileExists(safeDirPath))  {

        if (!utils.mkDir(safeDirPath))  {
          log.error ( 40,'cannot create jobs safe area at ' + safeDirPath );
          return;
        }
        log.standard ( 40,'created jobs safe area at ' + safeDirPath );

      } else  {
        // check that the safe is not full

        let files  = fs.readdirSync ( safeDirPath );
        let dpaths = [];
        for (let i=0;i<files.length;i++)  {
          let fpath = path.join ( safeDirPath,files[i] );
          let stat  = fs.statSync ( fpath );
          if (stat && stat.isDirectory())
            dpaths.push ( fpath );
        }

        if (dpaths.length>=jobsSafe.capacity)  {
          // safe is full, remove old entries
          for (let i=0;i<dpaths.length;i++)
            for (let j=i+1;j<dpaths.length;j++)
              if (dpaths[j]>dpaths[i])  {
                let dname = dpaths[j];
                dpaths[j] = dpaths[i];
                dpaths[i] = dname;
              }
          for (let i=Math.max(0,jobsSafe.capacity-1);i<dpaths.length;i++)
            utils.removePath ( dpaths[i] );
        }

      }

      safeDirPath = path.join ( safeDirPath,'job_' + Date.now() );
      utils.removeSymLinks ( jobEntry.jobDir );
      fs.copySync ( jobEntry.jobDir,safeDirPath,{
        dereference : true
      });

      if (jobEntry.feedback==ud.feedback_code.agree2)
        utils.writeString ( path.join(safeDirPath,'__user_info.txt'),
          'Name:  '   + jobEntry.user_name +
          '\nEmail: ' + jobEntry.email     + '\n'
        );
      log.standard ( 50,'failed job stored in safe at ' + safeDirPath );

    } catch (e)  {
      log.error ( 50,'cannot put failed job in safe at ' + safeDirPath );
    }

  }

}

// ===========================================================================


function ncJobFinished ( job_token,code )  {
let cfg = conf.getServerConfig();

  log.debug2 ( 100,'term code=' + code );

  // acquire the corresponding job entry
  let jobEntry = ncJobRegister.getJobEntry ( job_token );

  if (!jobEntry)  {
    log.error ( 51,'job token ' + job_token + 'not found in registry upon job end' );
    return;  // job token is not valid
  }

  // This function will finalise a finished job and send all data back to FE
  // asynchronously. However, we DO NOT stop the job checking loop here.
  // If this function is called from the job check function, then the loop
  // is already suspended, and job is marked as 'exiting', which prevents
  // other functions to work with the job's registry entry. This function
  // may be called also from itself if sending to FE has failed for any reason.
  // In such case, the job registry entry is already marked as 'exiting', so
  // that nothing else should interefere with the job.

  jobEntry.jobStatus = task_t.job_code.exiting;  // this works when ncJobFinished()
                                                 // is called directly from
                                                 // job listener in SHELL mode
// *** for debugging
//if (!jobEntry.endTime)  __use_fake_fe_url = true;
  if (!jobEntry.endTime)  {
    jobEntry.endTime     = Date.now();
    jobEntry.endTime_iso = new Date(jobEntry.endTime).toISOString();
  }

  if (!('logflow' in ncJobRegister))  {
    ncJobRegister.logflow = {};
    ncJobRegister.logflow.logno = 0;
    ncJobRegister.logflow.njob0 = 0;
  }

  if (conf.getServerConfig().checkLogChunks(
                      ncJobRegister.launch_count-ncJobRegister.logflow.njob0,
                      ncJobRegister.logflow.logno))  {
    ncJobRegister.logflow.logno++;
    ncJobRegister.logflow.njob0 = ncJobRegister.launch_count;
  }

  writeNCJobRegister();  // this is redundant at repeat sends, but harmless

  let taskDataPath = path.join ( jobEntry.jobDir,task_t.jobDataFName );
  let task         = utils.readClass ( taskDataPath );

  if (!task)  {
    log.error ( 52,'cannot read job metadata at ' + taskDataPath );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    return;  // recovery not possible
  }

  task.job_dialog_data.viewed = false;

  if ((!task.informFE) || (!jobEntry.return_data))  {
    // FE need not to be informed of job status (RVAPI application or kill),
    // just remove the job and quit
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    return;
  }

  // deal with cleanup here, before every trial send; this is redundant in
  // all most cases apart from rare situations where NC crashes or is taken
  // down in the middle of operation; unless cleaned properly, jobball zipping
  // may fail
  task.cleanJobDir ( jobEntry.jobDir );

  if (jobEntry.sendTrials==cfg.maxSendTrials) {

    log.debug2 ( 101,'put status' );

    // task instance is Ok, put status code in
    //if (code==0)  {
    if (!code)  {
      log.debug2 ( 102,'status finished' );
      if (task.state!=task_t.job_code.remdoc)
        task.state = task_t.job_code.finished;
    } else if (code==1001)  {
      task.state = task_t.job_code.stopped;
    } else if (code==204)  {
      task.state = task_t.job_code.noresults;
    } else if (code==205)  {
      task.state = task_t.job_code.hiddenresults;
    } else  {
      task.state = task_t.job_code.failed;
      if (code==200)
        utils.writeJobReportMessage ( jobEntry.jobDir,
                                  '<h1>Python import(s) failure</h1>',false );
      copyToSafe ( task,jobEntry );
    }

    // deal with output data here -- in future
    task.makeOutputData ( jobEntry.jobDir );

    // // deal with cleanup here -- in future
    // task.cleanJobDir ( jobEntry.jobDir );

    // note residual disk space (in MB)
    // *** now done on FE after unpacking ***
    //task.disk_space = utils.getDirectorySize ( jobEntry.jobDir ) / 1024.0 / 1024.0;

    // write job metadata back to job directory
    utils.writeObject ( taskDataPath,task );

  }

  // Send directory back to FE. This operation is asynchronous but we DO NOT
  // stop the job checking loop for it. The job is marked as 'exiting' in job
  // registry entry, which prevents interference with the job check loop.

  //   Results are being sent together with the remaining capcity estimations,
  // which are calculated differently in SHELL and SGE modes

  calcCapacity ( function(current_capacity){

    log.standard ( 104,'NC current capacity: ' + current_capacity );

    // get original front-end url
    let feURL = jobEntry.feURL;

    // but, if FE is configured, take it from configuration
    let fe_config = conf.getFEConfig();
    if (fe_config && fe_config.localSetup)
      feURL = fe_config.externalURL;

    if (feURL.endsWith('/'))
      feURL = feURL.substr(0,feURL.length-1);

// *** for debugging
//if (__use_fake_fe_url) feURL = 'http://localhost:54321';

    // if (code==1001)  {
    if (code)  {
      log.standard ( 101,'removing symlinks after stopped task, job_token=' + job_token );
      utils.removeSymLinks ( jobEntry.jobDir );
    }

    send_dir.sendDir ( jobEntry.jobDir,'*',
                       feURL,
                       cmd.fe_command.jobFinished + job_token, {
                          'capacity'         : cfg.capacity,
                          'current_capacity' : current_capacity,
                          'tokens'           : ncJobRegister.getListOfTokens()
                       },

      function(rdata)  {  // send was successful

        // just remove the job; do it in a separate thread and delayed,
        // which is useful for debugging etc.

        log.standard ( 103,'task ' + task.id + ' sent back to FE, token:' +
                           job_token );
        removeJobDelayed ( job_token,task_t.job_code.finished );

      },function(stageNo,errcode)  {  // send failed

        if (((stageNo>=2) && (jobEntry.sendTrials>0)) ||
            ((stageNo==1) && (jobEntry.sendTrials==cfg.maxSendTrials)))  {  // try to send again

          if (stageNo==1)  {
            // hypothesize that the failure is because of symlinks and try 
            // replace them with files
            log.standard ( 102,'removing symlinks after packing errors, job_token=' + job_token );
            utils.removeSymLinks ( jobEntry.jobDir );
          }

          jobEntry.sendTrials--;
          log.warning ( 4,'repeat (' + jobEntry.sendTrials + ') sending job ' +
                          job_token + ' back to FE due to FE/transmission errors (stage' +
                          stageNo + ', code [' + JSON.stringify(errcode) + '])' );
          setTimeout ( function(){ ncJobFinished(job_token,code); },
                       conf.getServerConfig().sendDataWaitTime );

        } else if (comut.isObject(errcode) &&
                   ((errcode.status==cmd.fe_retcode.wrongJobToken) ||
                    (errcode.status==cmd.nc_retcode.fileErrors)))  {
          // the job cannot be accepted by FE, e.g., if task was deleted by user.

          removeJobDelayed ( job_token,task_t.job_code.finished );
          log.error ( 4,'cannot send job ' + job_token + ' back to FE (' + errcode.status + 
                        '). TASK DELETED.' );

        } else  {

          log.error ( 5,'job ' + task.id + ' is put in zombi state, token:' +
                         job_token );

        }
        writeNCJobRegister();

      });

  });

}


// ===========================================================================

function ncRunJob ( job_token,meta )  {
// This function must not contain asynchronous code.

  // acquire the corresponding job entry
  let jobEntry = ncJobRegister.getJobEntry ( job_token );
  jobEntry.feURL     = meta.sender;
  jobEntry.feedback  = meta.feedback;
  jobEntry.user_name = meta.user_name;
  jobEntry.email     = meta.email;
  writeNCJobRegister();

  // get number cruncher configuration object
  let ncConfig = conf.getServerConfig();

  // clear/initiate report directory
  utils.clearRVAPIreport ( jobEntry.jobDir,'task.tsk' );

  // put a new message in the report page indicating that the job is already
  // on number cruncher and is going to start; this write is synchronous
  utils.writeJobReportMessage ( jobEntry.jobDir,'<h1>Starting on &lt;' +
                                ncConfig.name + '&gt; ...</h1>',true );

  // Now start the job.
  // Firstly, acquire the corresponding task class.
  let taskDataPath = path.join ( jobEntry.jobDir,task_t.jobDataFName );
  let jobDir       = path.dirname ( taskDataPath );
  let task         = utils.readClass ( taskDataPath );

  function getJobName()  {
    //return 'cofe_' + ncJobRegister.launch_count;
    let jname = 'ccp4cloud-' + ncJobRegister.launch_count;
    if (meta.user_id)   jname += '.' + meta.user_id + '.' + task.project + '.' + task.id;
    if (meta.setup_id)  jname += '.' + meta.setup_id;
    return jname;
  }

//console.log ( getJobName() );

  if (task)  { // the task is instantiated, start the job

    let nproc  = ncConfig.getMaxNProc();
    let ncores = task.getNCores ( nproc );
    utils.writeObject ( path.join(jobEntry.jobDir,'__despatch.meta'),{
      'sender'   : meta.sender,
      'setup_id' : meta.setup_id,
      'nc_name'  : meta.nc_name
    });

    utils.removeJobSignal ( jobDir );

    jobEntry.exeType = ncConfig.exeType;
    if (task.fasttrack)
      jobEntry.exeType = 'SHELL';

    let jobName = getJobName();

    let command = task.getCommandLine ( ncConfig.jobManager,jobDir );
    // command.push ( '"jscofe_version=' + cmd.appVersion() + '"' );
    command.push ( 'jscofe_version=' + cmd.appVersion() );
    command.push ( 'end_signal=' + cmd.endJobFName );

    switch (jobEntry.exeType)  {

      default      :
      case 'CLIENT':
      case 'SHELL' :  log.standard ( 5,'starting... ' );
                      command.push ( 'nproc=' + nproc.toString() );
                      let job = utils.spawn ( command[0],command.slice(1),{} );
                      jobEntry.pid = job.pid;

                      log.standard ( 5,'task ' + task.id + ' started, pid=' +
                                       jobEntry.pid + ', token:' + job_token );

                      // make stdout and stderr catchers for debugging purposes
                      let stdout = '';
                      let stderr = '';
                      job.stdout.on('data', function(buf) {
                        stdout += buf;
                      });
                      job.stderr.on('data', function(buf) {
                        stderr += buf;
                      });

                      // in SHELL mode, put job end listener for efficient
                      // interruption of job completion but also for debugging
                      // output. The former is, however, duplicated by job
                      // checking loop, which checks signal files in job
                      // directories. The rational for this duplication is
                      // that we want to be able to identify job completions
                      // in situations when NC's Node was taken down (or
                      // crashed) and then resumed.
                      job.on ( 'close',function(returncode){

                        let code = utils.getJobSignalCode ( jobEntry.jobDir );

                        if (code)
                          log.debug ( 103,'[' + comut.padDigits(task.id,4) +
                                          '] code=' + code );
                        if (stdout)
                          log.debug ( 104,'[' + comut.padDigits(task.id,4) +
                                          '] stdout=' + stdout );
                        if (stderr)
                          log.debug ( 105,'[' + comut.padDigits(task.id,4) +
                                          '] stderr=' + stderr );

                        if (jobEntry.jobStatus!=task_t.job_code.stopped)  {
//                          if ((code!=0) && (code!=203) && (code!=204))
                          if (code && (code!=203) && (code!=204) && (code!=205))
                            writeJobDriverFailureMessage ( code,stdout,stderr,jobDir );
                          if (jobEntry.jobStatus!=task_t.job_code.exiting)
                            ncJobFinished ( job_token,code );
                        }

                      });
                  break;

      case 'SGE'   :  command.push ( 'queue=' + ncConfig.getQueueName() );
                      //command.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      command.push ( 'nproc=' + nproc.toString() );
                      let qsub_params = ncConfig.exeData.concat ([
                        '-o',path.join(jobDir,'_job.stdo'),  // qsub stdout
                        '-e',path.join(jobDir,'_job.stde'),  // qsub stderr
                        '-N',jobName
                      ]);
                      let sge_job = utils.spawn ( 'qsub',qsub_params.concat(command),{} );
                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just SGE job scheduler, which
                      // quits nearly immediately; however, we use listeners to
                      // get the standard output and infer job id from there
                      let qsub_output = '';
                      sge_job.stdout.on('data', function(data) {
                        qsub_output += data.toString();
                      });
                      sge_job.on('close', function(code) {
                        let w = qsub_output.split(/\s+/);
                        jobEntry.pid = 0;
                        if (w.length>=3)  {
                          if ((w[0]=='Your') && (w[1]=='job'))
                            jobEntry.pid = parseInt(w[2]);
                        }
                        log.standard ( 6,'task '  + task.id + ' qsubbed, '  +
                                         'name='  + jobName +
                                         ', pid=' + jobEntry.pid +
                                         ', token:' + job_token );
                      });

                      // indicate queuing to please the user
                      utils.writeJobReportMessage ( jobDir,
                                '<h1>Queuing up on &lt;' + ncConfig.name +
                                '&gt;, please wait ...</h1>', true );

                  break;


      case 'SLURM' :  command.push ( 'queue=' + ncConfig.getQueueName() );
                      //command.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      command.push ( 'nproc=' + nproc.toString() );

                      let sbatch_params = ncConfig.exeData.concat ([
                        '--export=ALL',
                        '-o',path.join(jobDir,'_job.stdo'),  // qsub stdout
                        '-e',path.join(jobDir,'_job.stde'),  // qsub stderr
                        '-J',jobName,
                        '-c',ncores
                      ]);
                      let sbatch_cmd = sbatch_params.concat(command);
                      // console.log ( ' >>> sbatch ' + sbatch_cmd.join(' ') );
                      // console.log ( ' >>> environ =\n' + JSON.stringify(process.env,null,2) );
                      let slurm_job  = utils.spawn ( 'sbatch',sbatch_cmd );

                      /*
                      let script_params = [
                        '--export=ALL',
                        '-o',path.join(jobDir,'_job.stdo'),  // qsub stdout
                        '-e',path.join(jobDir,'_job.stde'),  // qsub stderr
                        '-J',jobName,
                        '-c',ncores
                      ];
                      let sbatch_cmd = script_params.concat(command);
                      let job = utils.spawn ( 'sbatch',sbatch_cmd );
                      */
                      // let job = utils.spawn ( 'sbatch',script_params.concat(command),{} );
                      // sbatch --export=ALL -o "$2" -e "$3" -J "$4" -c "$5" "${@:6}" | cut -d " " -f 4

                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just the launcher script, which
                      // quits nearly immediately; however, we use listeners to
                      // get the standard output and infer job id from there
                      let slurm_output = '';
                      slurm_job.stdout.on('data', function(data) {
                        slurm_output += data.toString();
                      });
                      slurm_job.on('close', function(code) {
                        // the script is supposed to retun only jobID, but
                        // escape just in case
                        try {
                          let slurm_output_split = slurm_output.split(' ');
                          jobEntry.pid = -1;
                          for (let i=0;(i<slurm_output_split.length) && (jobEntry.pid<0);i++)
                            if (comut.isInteger(slurm_output_split[i]))
                              jobEntry.pid = parseInt ( slurm_output_split[i] );
                          log.standard ( 7,'task '    + task.id + ' submitted, ' +
                                           'name='    + jobName +
                                           ', pid='   + jobEntry.pid +
                                           ', token:' + job_token );
                        }
                        catch(err) {
                          jobEntry.pid = 0;
                          log.error ( 30,'task ' + task.id + 'jobID parse log: "' +
                                         slurm_output + '"' );
                        }
                      });

                      // indicate queuing to please the user
                      utils.writeJobReportMessage ( jobDir,
                                '<h1>Queuing up on &lt;' + ncConfig.name +
                                '&gt;, please wait ...</h1>', true );
                  break;


      case 'SCRIPT' : command.push ( 'queue=' + ncConfig.getQueueName() );
                      //command.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      command.push ( 'nproc=' + nproc.toString() );
                      let script_params = [
                        'start',
                        path.join(jobDir,'_job.stdo'),  // qsub stdout
                        path.join(jobDir,'_job.stde'),  // qsub stderr
                        jobName,
                        ncores
                      ];
                      let script_job = utils.spawn ( ncConfig.exeData,script_params.concat(command),{} );
                                              // { env : process.env });
                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just the launcher script, which
                      // quits nearly immediately; however, we use listeners to
                      // get the standard output and infer job id from there
                      let job_output = '';
                      script_job.stdout.on('data', function(data) {
                        job_output += data.toString();
                      });
                      script_job.on('close', function(code) {
                        // the script is supposed to retun only jobID, but
                        // escape just in case
                        try {
                          jobEntry.pid = parseInt(job_output);
                          log.standard ( 7,'task '  + task.id + ' submitted, ' +
                                           'name='  + jobName +
                                           ', pid=' + jobEntry.pid +
                                           ', token:' + job_token );
                        }
                        catch(err) {
                          jobEntry.pid = 0;
                          log.error ( 30,'task ' + task.id + 'jobID parse log: "' +
                                         job_output + '"' );
                        }
                      });

                      // indicate queuing to please the user
                      utils.writeJobReportMessage ( jobDir,
                                '<h1>Queuing up on &lt;' + ncConfig.name +
                                '&gt;, please wait ...</h1>', true );

    }

    // put a mark in joon entry
    jobEntry.jobStatus = task_t.job_code.running;

    writeNCJobRegister();

  } else  { // something wrong's happened, just put an error message in job report.

    log.error ( 7,'no task received when expected at ' + taskDataPath );
    utils.writeJobReportMessage ( jobDir,
                   '<h1>[00102] Error: cannot find task metadata</h1>',false );

  }

  // By starting the job checking loop here, we gurantee that the loop will be
  // engaged whatever happened above. Note that duplicate timers are blocked
  // inside this function.
  startJobCheckTimer ();

}


// ===========================================================================

function ncMakeJob ( server_request,server_response )  {
// This function creates a new job and job directory, receives jobball from FE,
// unpacks it and starts the job. Although the jobball is received in
// asynchronous mode, we DO NOT suspend the job checking loop here, because
// it looks only at 'running' jobs, while the new one is marked as 'new'.

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister ( 1 );
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  let jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  let job_token = ncJobRegister.addJob ( jobDir ); // assigns 'new' status
  writeNCJobRegister();

  if (!utils.mkDir(jobDir))  {
    log.error ( 8,'job directory "' + jobDir + '" cannot be created.' );
    cmd.sendResponse ( server_response,cmd.nc_retcode.mkDirError,
                       '[00103] Cannot create job directory on NC server #' +
                       conf.getServerConfig().serNo,'' );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    return null;
  }

  log.detailed ( 9,'prepare new job, jobDir=' + jobDir );

  // 2. Download files

  function sendErrResponse ( code,message )  {
    cmd.sendResponse        ( server_response,code,message,'' );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
  }

  // Files are received asynchronously, but we DO NOT suspend the job checking
  // loop because it looks only at jobs marked as 'running', while the new one
  // is marked as 'new'.

  send_dir.receiveDir ( jobDir,conf.getNCTmpDir(),server_request,
    function(code,errs,meta){
      //if (code==0)  {
      if (!code)  {
        ncRunJob ( job_token,meta );
        cmd.sendResponse ( server_response, cmd.nc_retcode.ok,
                           '[00104] Job started', {
                             job_token     : job_token
                           });
      } else if (code=='err_rename')  { // file renaming errors
        sendErrResponse ( cmd.nc_retcode.fileErrors,
                          '[00105] File rename errors' );
      } else if (code=='err_dirnoexist')  { // work directory deleted
        sendErrResponse ( cmd.nc_retcode.fileErrors,
                          '[00106] Recepient directory does not exist (job deleted?)'
                        );
      } else if (code=='err_transmission')  {  // data transmission errors
        sendErrResponse ( cmd.nc_retcode.uploadErrors,
                          '[00107] Data transmission errors: ' + errs );
      } else  {
        sendErrResponse ( cmd.nc_retcode.unpackErrors,
                         '[00108] Tarball unpack errors' );
      }
    });

  return null;

}


// ===========================================================================

function _stop_job ( jobEntry )  {
  let pids, subjobs;

  // write the respective signal in job directory

  if (!utils.jobSignalExists(jobEntry.jobDir))
    utils.writeJobSignal ( jobEntry.jobDir,'terminated_job','',1001 );

  // now this signal should be picked by checkJobs() at some point _after_
  // the current function quits.

  // put 'stopped' code in job registry, this prevents job's on-close
  // listener to call ncJobFinished(); instead, ncJobFinished() will be
  // invoked by checkJobsOnTimer(), which is universal for all exeTypes.
  jobEntry.jobStatus = task_t.job_code.stopped;

  if (jobEntry.pid)  {

    // now kill the job itself; different approaches are taken for Unix
    // and Windows platforms, as well as for SHELL and SGE execution types
    switch (jobEntry.exeType)  {

      default       :
      case 'CLIENT' :
      case 'SHELL'  : //let isWindows = /^win/.test(process.platform);
                      if(!conf.isWindows()) {
                        psTree ( jobEntry.pid, function (err,children){
                          let wpids = ['-9',jobEntry.pid].concat (
                                  children.map(function(p){ return p.PID; }));
                          child_process.spawn ( 'kill',wpids );
                        });
                      } else {
                        child_process.exec ( 'taskkill /PID ' + jobEntry.pid +
                                    ' /T /F',function(error,stdout,stderr){});
                      }
                break;

      case 'SGE'    : pids = [jobEntry.pid];
                      subjobs = utils.readString (
                                      path.join(jobEntry.jobDir,'subjobs'));
                      if (subjobs)
                        pids = pids.concat ( subjobs
                                       .replace(/(\r\n|\n|\r)/gm,' ')
                                       .replace(/\s\s+/g,' ').split(' ') );
                      utils.spawn ( 'qdel',pids,{} );
                break;

      case 'SLURM'  : pids = ['kill',jobEntry.pid];
                      subjobs = utils.readString (
                                      path.join(jobEntry.jobDir,'subjobs'));
                      if (subjobs)
                        pids = pids.concat ( subjobs
                                       .replace(/(\r\n|\n|\r)/gm,' ')
                                       .replace(/\s\s+/g,' ').split(' ') );
                      utils.spawn ( 'scancel',pids,{} );
                break;

      case 'SCRIPT' : pids = ['kill',jobEntry.pid];
                      subjobs = utils.readString (
                                      path.join(jobEntry.jobDir,'subjobs'));
                      if (subjobs)
                        pids = pids.concat ( subjobs
                                       .replace(/(\r\n|\n|\r)/gm,' ')
                                       .replace(/\s\s+/g,' ').split(' ') );
                      utils.spawn ( conf.getServerConfig().exeData,pids,{} );

    }

  }

}


function ncStopJob ( post_data_obj,callback_func )  {
let response = null;

  log.detailed ( 10,'stop object ' + JSON.stringify(post_data_obj) );

  //console.log ( ' ################# ' + JSON.stringify(post_data_obj) );

  if (post_data_obj.hasOwnProperty('job_token'))  {

    let jobEntry = ncJobRegister.getJobEntry ( post_data_obj.job_token );

    if (jobEntry)  {

      if (post_data_obj.hasOwnProperty('return_data') && (!post_data_obj.return_data))  {
        jobEntry.return_data = post_data_obj.return_data;
        writeNCJobRegister();
      }

      if (post_data_obj.gracefully)  {

        log.standard ( 60,'attempt to gracefully end the job ' +
                          post_data_obj.job_token + ' pid=' + jobEntry.pid );
        utils.writeString (  path.join(jobEntry.jobDir,cmd.endJobFName),'end' );
        utils.writeString (  path.join(jobEntry.jobDir,'report',cmd.endJobFName1),'end' );
        response = new cmd.Response ( cmd.nc_retcode.ok,
          '[00109] Job scheduled for graceful stop, token=' + post_data_obj.job_token,
          {} );

      } else  {

        if (jobEntry.pid>0)  {

          if (jobEntry.return_data)  {
            log.standard ( 61,'attempt to stop job ' +
                               post_data_obj.job_token + ' pid=' + jobEntry.pid );
            response = new cmd.Response ( cmd.nc_retcode.ok,
                '[00110] Job scheduled for stopping, token=' + post_data_obj.job_token,
                {} );
          } else  {
            log.standard ( 62,'attempt to kill job ' +
                               post_data_obj.job_token + ' pid=' + jobEntry.pid );
            response = new cmd.Response ( cmd.nc_retcode.ok,
                '[00111] Job scheduled for stopping, token=' + post_data_obj.job_token,
                {} );
          }
          _stop_job ( jobEntry );

        } else  {
          log.detailed ( 12,'attempt to kill a process without a pid' );
          response = new cmd.Response ( cmd.nc_retcode.pidNotFound,
              '[00112] Job\'s PID not found; just stopped? token=' + post_data_obj.job_token,
              {} );
        }

      }

    } else  {
      log.error ( 13,'attempt to kill/end failed no token found: ' +
                     post_data_obj.job_token );
      response = new cmd.Response ( cmd.nc_retcode.jobNotFound,
          '[00113] Job not found; just stopped? token=' + post_data_obj.job_token,
          {} );
    }

  } else  {
    log.error ( 14,'wrong request to kill/end post_data="' +
                         JSON.stringify(post_data_obj) + '"' );
    response = new cmd.Response ( cmd.nc_retcode.wrongRequest,
        '[00114] Wrong request data, token=' + post_data_obj.job_token,
        {} );
  }

  callback_func ( response );

}

// function ncWakeAllZombiJobs()  {
//   let nzombies = 0;
//   for (let token in ncJobRegister.job_map)
//     if (ncJobRegister.wakeZombi(token))
//       nzombies++;
//   return nzombies;
// }

function ncWakeZombieJobs ( post_data_obj,callback_func )  {
let job_tokens = post_data_obj.job_tokens;

// *** for debugging
//__use_fake_fe_url = false;

  let nzombies = 0;
  if (job_tokens[0]=='*')  {  // take all
    // nzombies = ncWakeAllZombiJobs();
    for (let token in ncJobRegister.job_map)
      if (ncJobRegister.wakeZombi(token))
        nzombies++;
  } else  {  // take from the list given
    for (let i=0;i<job_tokens.length;i++)
      if (ncJobRegister.wakeZombi(job_tokens[i]))
        nzombies++;
  }

  log.standard ( 30,nzombies + ' zombi job(s) awaken on request' );

  if (nzombies>0)  {
    writeNCJobRegister();
    startJobCheckTimer();
  }

  callback_func ( new cmd.Response ( cmd.nc_retcode.ok,
                           '[00130] ' + nzombies + ' zombi job(s) awaken',
                           {nzombies:nzombies} ) );

}


// ===========================================================================

function make_local_job ( files,base_url,destDir,job_token,callback_func )  {

  function prepare_job ( ix )  {

    if (ix<files.length)  {  // process ixth argument

    // compute full download url
    let url   = base_url + '/' + files[ix];
    // compute full local path to accept the download
    let fpath = path.join ( destDir,url.substring(url.lastIndexOf('/')+1) );

    let get_options = {
      url                : url,
      rejectUnauthorized : conf.getServerConfig().rejectUnauthorized
    };

    request  // issue the download request
      .get ( get_options )
      .on('error', function(err) {
        log.error ( 17,'Download errors from ' + url );
        log.error ( 17,'Error: ' + err );
        // remove job
        if (job_token)  {
          ncJobRegister.removeJob ( job_token );
          writeNCJobRegister      ();
        }
        callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                '[00115] Download errors: ' + err,{} ) );
      })
      // .pipe(fs.createWriteStream(path.join(jobDir,fpath)))
      .pipe(fs.createWriteStream(fpath))
      .on('error', function(err) {
        log.error ( 22,'Download errors from ' + url );
        log.error ( 22,'Error: ' + err );
        // remove job
        if (job_token)  {
          ncJobRegister.removeJob ( job_token );
          writeNCJobRegister      ();
        }
        callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                '[00120] Download errors: ' + err,{} ) );
      })
      .on('close',function(){   // finish,end,
        // successful download, note file path and move to next argument
        files[ix] = fpath;
        prepare_job ( ix+1 );
      });

    } else  {
      // all argument list is processed, data files downloaded in subdirectory
      // 'input' of the job directory; prepare job metadata and start the
      // job
      callback_func ( null );
    }

  }

  // invoke preparation recursion
  prepare_job ( 0 );

}


/*
function make_local_job ( args,exts,base_url,jobDir,job_token,callback_func )  {

  function prepare_job ( ix )  {

    if (ix<args.length)  {  // process ixth argument

      let ip = args[ix].lastIndexOf('.');  // is there a file extension?

      if (ip>=0)  {

        let ext = args[ix].substring(ip).toLowerCase();

        if (exts.indexOf(ext)>=0)  {  // file extension is recognised

          // compute full download url
          let url   = base_url + '/' + args[ix];
          // compute full local path to accept the download
          let fpath = path.join ( 'input',url.substring(url.lastIndexOf('/')+1) );

          let get_options = {
            url                : url,
            rejectUnauthorized : conf.getServerConfig().rejectUnauthorized
          };

          request  // issue the download request
            .get ( get_options )
            .on('error', function(err) {
              log.error ( 17,'Download errors from ' + url );
              log.error ( 17,'Error: ' + err );
              // remove job
              if (job_token)  {
                ncJobRegister.removeJob ( job_token );
                writeNCJobRegister      ();
              }
              callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                     '[00115] Download errors: ' + err,{} ) );
            })
            .pipe(fs.createWriteStream(path.join(jobDir,fpath)))
            .on('error', function(err) {
              log.error ( 22,'Download errors from ' + url );
              log.error ( 22,'Error: ' + err );
              // remove job
              if (job_token)  {
                ncJobRegister.removeJob ( job_token );
                writeNCJobRegister      ();
              }
              callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                     '[00120] Download errors: ' + err,{} ) );
            })
            .on('close',function(){   // finish,end,
              // successful download, note file path and move to next argument
              args[ix] = fpath;
              prepare_job ( ix+1 );
            });

        } else  // extension is not recognised, just move to next argument
          prepare_job ( ix+1 );

      } else // no extension, just move to next argument
        prepare_job ( ix+1 );

    } else  {
      // all argument list is processed, data files downloaded in subdirectory
      // 'input' of the job directory; prepare job metadata and start the
      // job
      callback_func();
    }

  }

  // invoke preparation recursion
  prepare_job ( 0 );

}
*/

function ncRunRVAPIApp ( post_data_obj,callback_func )  {

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister ( 1 );
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  let jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  let job_token = ncJobRegister.addJob ( jobDir ); // assigns 'new' status
  writeNCJobRegister();

  let ok = utils.mkDir(jobDir) && utils.mkDir(path.join(jobDir,'input')) &&
                                  utils.mkDir(path.join(jobDir,'report'));
  if (!ok)  {
    log.error ( 15,'job directory "' + jobDir + '" cannot be created.' );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    callback_func ( new cmd.Response ( cmd.nc_retcode.mkDirError,
                    '[00115] Cannot create job directory on NC-CLIENT server #' +
                    conf.getServerConfig().serNo,{} ) );
    return;
  }

  log.detailed ( 16,'prepare new job, jobDir=' + jobDir );

  // 2. Download files

  let exts  = ['.pdb','.cif','.mtz','.map'];  // recognised file extensions for download
  let args  = post_data_obj.data.split('*');  // argument list for RVAPI application
  let files = [];
  for (let i=0;i<args.length;i++)  {
    let ip = args[i].lastIndexOf('.');  // is there a file extension?
    if (ip>=0)  {
        let ext = args[i].substring(ip).toLowerCase();
        if (exts.indexOf(ext)>=0)  // file extension is recognised
          files.push ( args[i] );
    }
  }

  let destDir = path.join(jobDir,'input');
  make_local_job ( files,post_data_obj.base_url,destDir,job_token,
    function(response){

      if (response)  {  // errors

        callback_func ( response );
      
      } else  {
  
        let taskRVAPIApp = new task_rvapiapp.TaskRVAPIApp();
        taskRVAPIApp.id            = ncJobRegister.launch_count;
        taskRVAPIApp.rvapi_command = post_data_obj.command;
        taskRVAPIApp.rvapi_args    = [];
        for (let i=0;i<files.length;i++)
          taskRVAPIApp.rvapi_args.push ( files[i].replace(destDir,'input') );
        utils.writeObject ( path.join(jobDir,task_t.jobDataFName),taskRVAPIApp );

        ncRunJob ( job_token,{
          'sender'   : '',
          'setup_id' : '',
          'nc_name'  : 'client-rvapi',
          'user_id'  : ''
        });

        // signal 'ok' to client
        callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00115] Ok',{} ) );

      }
  
  });


  /*
  function prepare_job ( ix )  {

    if (ix<args.length)  {  // process ixth argument

      let ip = args[ix].lastIndexOf('.');  // is there a file extension?

      if (ip>=0)  {

        let ext = args[ix].substring(ip).toLowerCase();

        if (exts.indexOf(ext)>=0)  {  // file extension is recognised

          // compute full download url
          let url   = post_data_obj.base_url + '/' + args[ix];
          // compute full local path to accept the download
          let fpath = path.join ( 'input',url.substring(url.lastIndexOf('/')+1) );

          let get_options = {
            url: url,
            rejectUnauthorized : conf.getServerConfig().rejectUnauthorized
          };

          request  // issue the download request
            .get ( get_options )
            .on('error', function(err) {
              log.error ( 17,'Download errors from ' + url );
              log.error ( 17,'Error: ' + err );
              // remove job
              ncJobRegister.removeJob ( job_token );
              writeNCJobRegister      ();
              callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                     '[00115] Download errors: ' + err,{} ) );
            })
            .pipe(fs.createWriteStream(path.join(jobDir,fpath)))
            .on('error', function(err) {
              log.error ( 22,'Download errors from ' + url );
              log.error ( 22,'Error: ' + err );
              // remove job
              ncJobRegister.removeJob ( job_token );
              writeNCJobRegister      ();
              callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                     '[00120] Download errors: ' + err,{} ) );
            })
            .on('close',function(){   // finish,end,
              // successful download, note file path and move to next argument
              args[ix] = fpath;
              prepare_job ( ix+1 );
            });

        } else  // extension is not recognised, just move to next argument
          prepare_job ( ix+1 );

      } else // no extension, just move to next argument
        prepare_job ( ix+1 );

    } else  {
      // all argument list is processed, data files downloaded in subdirectory
      // 'input' of the job directory; prepare job metadata and start the
      // job

      let taskRVAPIApp = new task_rvapiapp.TaskRVAPIApp();
      taskRVAPIApp.id            = ncJobRegister.launch_count;
      taskRVAPIApp.rvapi_command = post_data_obj.command;
      taskRVAPIApp.rvapi_args    = args;
      utils.writeObject ( path.join(jobDir,task_t.jobDataFName),taskRVAPIApp );

      ncRunJob ( job_token,{
        'sender'   : '',
        'setup_id' : '',
        'nc_name'  : 'client-rvapi',
        'user_id'  : ''
      });

      // signal 'ok' to client
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00115] Ok',{} ) );

    }

  }

  // invoke preparation recursion
  prepare_job ( 0 );

  */

}


// ===========================================================================


const send_file_key = [
  data_t.file_key.xyz,
  data_t.file_key.mmcif,
  data_t.file_key.mtz,
  data_t.file_key.lib,
  data_t.file_key.seq
];

function ncSendJobResults ( post_data_obj,callback_func )  {
// writes out job results into exchange directory (pseudo-clipboard) from where
// it can be picked by 3rd party applications such as Doppio
let crTask      = post_data_obj.meta;
let output_data = crTask.output_data.data;
let destDir     = conf.getServerConfig().getExchangeDirectory();
let data_obj    = [];

  if ('DataRevision' in output_data)
    data_obj.push ( output_data.DataRevision[0].Structure );
  else if ('DataStructure' in output_data)
    data_obj = data_obj.concat ( оutput_data.DataStructure );
  if ('DataModel' in output_data)
    data_obj = data_obj.concat ( output_data.DataModel );
  if ('DataXYZ' in output_data)
    data_obj = data_obj.concat ( output_data.DataXYZ );
  if ('DataHKL' in output_data)
    data_obj = data_obj.concat ( output_data.DataHKL );
  if ('DataSequence' in output_data)
    data_obj = data_obj.concat ( output_data.DataSequence );
  if ('DataLigand' in output_data)
    data_obj = data_obj.concat ( output_data.DataLigand );

  let ndata = 0;
  for (let i=0;i<data_obj.length;i++)
    if (data_obj[i])
      ndata++;
  if (ndata<=0)  {
    callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00122] No data',{
        code    : 1,
        message : 'Found no data to send'
      })
    );
    return;
  }

  let meta = {
    creator : cmd.appName() + ' ' + cmd.appVersion(),
    date    : new Date().toISOString(),
    task    : crTask._type,
    user    : post_data_obj.login,
    project : crTask.project,
    jobId   : crTask.id,
    data    : {
      // hkl    : [],
      // xyz    : [],
      // lib    : [],
      // seq    : []
    }
  };

  let files = [];
  for (let i=0;i<data_obj.length;i++)
    for (let key in data_obj[i].files)  {
      let fpath = path.join ( 'output',data_obj[i].files[key] )
      if (send_file_key.includes(key) && (!files.includes(fpath)) )  {
        if (!(key in meta.data))
          meta.data[key] = [];
        meta.data[key].push ( data_obj[i].files[key] );
        files.push ( fpath );
      }
    }

  if (utils.dirExists(destDir))  utils.cleanDir ( destDir );
                           else  utils.mkPath   ( destDir );

  make_local_job ( files,post_data_obj.base_url,destDir,null,
    function(response){
  
      if (response)  {  // errors

        callback_func ( response );
    
      } else  {

        utils.writeObject ( path.join(destDir,'meta.json'),meta );

        // signal 'ok' to client
        callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00122] Ok',{
            code    : 0,
            message : destDir
          })
        );

      }  
  
    });

}


// ===========================================================================

function ncRunClientJob1 ( post_data_obj,callback_func,attemptNo )  {
// This function creates a new job and job directory, receives jobball from FE,
// unpacks it and starts the job. Although the jobball is received in
// asynchronous mode, we DO NOT suspend the job checking loop here, because
// it looks only at 'running' jobs, while the new one is marked as 'new'.

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister ( 1 );
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  let jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  let job_token = ncJobRegister.addJob1 ( jobDir,post_data_obj.job_token );

  writeNCJobRegister();

  let ok = utils.mkDir(jobDir) && utils.mkDir(path.join(jobDir,'input'))  &&
                                  utils.mkDir(path.join(jobDir,'output')) &&
                                  utils.mkDir(path.join(jobDir,'report'));
  if (!ok)  {
    log.error ( 18,'job directory "' + jobDir + '" cannot be created.' );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    callback_func ( new cmd.Response ( cmd.nc_retcode.mkDirError,
                    '[00116] Cannot create job directory on NC-CLIENT server #' +
                    conf.getServerConfig().serNo,{} ) );
    return;
  }

  log.detailed ( 19,'prepare new job, jobDir=' + jobDir );

  // 2. Download and unpack jobball

  let dnlURL = post_data_obj.feURL + post_data_obj.dnlURL;

  let get_options = {
    url : dnlURL,
    rejectUnauthorized : conf.getServerConfig().rejectUnauthorized
  };
  //if (conf.getServerConfig().useRootCA)
  //  get_options.ca = fs.readFileSync ( path.join('certificates','rootCA.pem') );

  request  // issue the download request
    .get ( get_options )
    .on('error', function(err) {
      log.error ( 20,'Download errors from ' + dnlURL + ', attempt #' + attemptNo );
      log.error ( 20,'Error: ' + err );
      // remove job
      ncJobRegister.removeJob ( job_token );
      writeNCJobRegister      ();
      if (attemptNo>0)  {
        setTimeout ( function(){
          ncRunClientJob1 ( post_data_obj,callback_func,attemptNo-1 );
        },10);
      } else
        callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                      '[00117] Download errors: ' + err,{} ) );
    })
    .pipe(fs.createWriteStream(path.join(jobDir,send_dir.jobballName)))
    .on('error', function(err) {
      log.error ( 23,'Download errors from ' + dnlURL + ', attempt #' + attemptNo );
      log.error ( 23,'Error: ' + err );
      // remove job
      ncJobRegister.removeJob ( job_token );
      writeNCJobRegister      ();
      if (attemptNo>0)  {
        setTimeout ( function(){
          ncRunClientJob1 ( post_data_obj,callback_func,attemptNo-1 );
        },10);
      } else
        callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                      '[00121] Download errors: ' + err,{} ) );
    })
    .on('close',function(){   // finish,end,
      // successful download, unpack and start the job

      //function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
      send_dir.unpackDir ( jobDir,null, function(code,jobballSize){
        if (!code)  {
          ncRunJob ( job_token,{
            'sender'   : post_data_obj.feURL,
            'setup_id' : '',
            'nc_name'  : 'client',
            'user_id'  : ''
          });
          // signal 'ok' to client
          callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00118] Job started',
                                             {job_token:job_token} ) );
          log.detailed ( 21,'directory contents has been received in ' + jobDir );
        } else  {
          // unpacking errors, remove job
          log.error ( 24,'unpack errors, attempt #' + attemptNo +
                         ', code=' + code + ', filesize=' + jobballSize );
          ncJobRegister.removeJob ( job_token );
          writeNCJobRegister      ();
          if (attemptNo>0)  {
            setTimeout ( function(){
              ncRunClientJob1 ( post_data_obj,callback_func,attemptNo-1 );
            },10);
          } else
            callback_func ( new cmd.Response ( cmd.nc_retcode.unpackErrors,
                             '[00119] Unpack errors (code=' + code + ')',{} ) );
        }
      });

    });

}

function ncRunClientJob ( post_data_obj,callback_func )  {
  ncRunClientJob1 ( post_data_obj,callback_func,10 );  // give 10 attempts
}


// ==========================================================================
// export for use in node

module.exports.cleanNC            = cleanNC;
module.exports.ncSendFile         = ncSendFile;
module.exports.calcCapacity       = calcCapacity;
module.exports.ncMakeJob          = ncMakeJob;
module.exports.ncStopJob          = ncStopJob;
module.exports.ncWakeZombieJobs   = ncWakeZombieJobs;
module.exports.ncRunRVAPIApp      = ncRunRVAPIApp;
module.exports.ncSendJobResults   = ncSendJobResults;
module.exports.ncRunClientJob     = ncRunClientJob;
module.exports.ncGetJobsDir       = ncGetJobsDir;
module.exports.readNCJobRegister  = readNCJobRegister;
module.exports.writeNCJobRegister = writeNCJobRegister;
