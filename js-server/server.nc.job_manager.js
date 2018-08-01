
/*
 *  =================================================================
 *
 *    26.05.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var path          = require('path');
var child_process = require('child_process');
var crypto        = require('crypto');
var fs            = require('fs-extra');
var psTree        = require('ps-tree');
var request       = require('request');

//  load application modules
var conf          = require('./server.configuration');
var send_dir      = require('./server.send_dir');
var utils         = require('./server.utils');
var task_t        = require('../js-common/tasks/common.tasks.template');
var task_rvapiapp = require('../js-common/tasks/common.tasks.rvapiapp');
var cmd           = require('../js-common/common.commands');
var comut         = require('../js-common/common.utils');

//  prepare log
var log = require('./server.log').newLog(11);

// ===========================================================================

var jobsDir       = 'jobs';  // area in nc-storage to host all job directories
var registerFName = 'job_register.meta';  // file name to keep job register

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
}


NCJobRegister.prototype.addJob = function ( jobDir )  {
var job_token     = crypto.randomBytes(20).toString('hex');
var maxSendTrials = conf.getServerConfig().maxSendTrials;
  this.job_map[job_token] = {
    feURL      : '',
    jobDir     : jobDir,
    jobStatus  : task_t.job_code.new,
    sendTrials : maxSendTrials,
    exeType    : '',    // SHELL or SGE
    pid        : 0      // job pid is added separately
  };
  return job_token;
}


NCJobRegister.prototype.addJob1 = function ( jobDir,job_token )  {
var maxSendTrials = conf.getServerConfig().maxSendTrials;
  this.job_map[job_token] = {
    feURL      : '',
    jobDir     : jobDir,
    jobStatus  : task_t.job_code.new,
    sendTrials : maxSendTrials,
    exeType    : '',    // SHELL or SGE
    pid        : 0      // job pid is added separately
  };
  return job_token;
}


NCJobRegister.prototype.getJobEntry = function ( job_token )  {
  if (job_token in this.job_map)
        return this.job_map[job_token];
  else  return null;
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


var ncJobRegister = null;

function readNCJobRegister()  {

  if (!ncJobRegister)  {
    var fpath     = path.join ( conf.getServerConfig().storage,registerFName );
    ncJobRegister = new NCJobRegister();
    obj           = utils.readObject ( fpath );
    if (obj)  {
      for (key in obj)
        ncJobRegister[key] = obj[key];
    } else
      writeNCJobRegister();
    startJobCheckTimer();
  }

  return ncJobRegister;

}

function writeNCJobRegister()  {
var fpath = path.join ( conf.getServerConfig().storage,registerFName );

  if (!ncJobRegister)
    ncJobRegister = new NCJobRegister();

  // Job register is a very light object, therefore, it is read/written in
  // synchronous mode. Therefore, we do not need to suspend job checking
  // loop here -- but take care not to write the timer object
  // (ncJobRegister.timer) in the file!

  var timer = ncJobRegister.timer;
  ncJobRegister.timer = null;

  utils.writeObject ( fpath,ncJobRegister );

  ncJobRegister.timer = timer;

}


// ===========================================================================

function writeJobDriverFailureMessage ( code,stdout,stderr,jobDir )  {

var msg = '<h2><i>Job Driver Failure</i></h2>' + 'Failure code: ' + code;

  if (stdout)
    msg += '<p>Catched stdout:<pre>' + stdout + '</pre>';
  if (stderr)
    msg += '<p>Catched stderr:<pre>' + stderr + '</pre>';

  msg += '<p>This is an internal error, which may be caused by different ' +
         'sort of hardware and network malfunction, but most probably due ' +
         'to a bug or not anticipated properties of input data.' +
         '<p>You may contribute to the improvement of jsCoFE by sending this ' +
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

  // loop over all entries in job registry
  for (var job_token in ncJobRegister.job_map)  {

    var jobEntry = ncJobRegister.job_map[job_token];

    // look only at jobs that are marked as 'running'. Others are either in
    // the queue or in process of being sent to FE

    if ([task_t.job_code.running,task_t.job_code.stopped]
                                           .indexOf(jobEntry.jobStatus)>=0)  {

      var is_signal = utils.jobSignalExists ( jobEntry.jobDir );

      if ((!is_signal) && (jobEntry.exeType=='SGE'))  {
        // check if job failed on sge level
        var sge_err_path = path.join(jobEntry.jobDir,'_job.stde');
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
        // the signal was thrown
        jobEntry.jobStatus = task_t.job_code.exiting;
        // we do not save changed registry here -- this will be done in
        // ncJobFinished() before asynchronous send to FE
        var code = utils.getJobSignalCode ( jobEntry.jobDir );
        // whichever the code is, wrap-up the job
        ncJobFinished ( job_token,code );
      }

    }

  }

  startJobCheckTimer();

}


function startJobCheckTimer()  {
  if (!ncJobRegister.timer)  {
    var areJobs = false;
    for (var job_token in ncJobRegister.job_map)
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
var fname = null;
var cap   = false;

  if (url_search)
    cap = (url_search.indexOf('?capsize')>=0);

  var ix = url.indexOf('jsrview');
  if (ix>=0)  {  // request for jsrview library file, load it from js-lib
                 // REGARDLESS the actual path requested

    fname = path.join ( 'js-lib',url.substr(ix) );

  } else  {
//console.log ( ' NC: url=' + url );
    var plist    = url.split('/');
    var jobEntry = ncJobRegister.getJobEntry( plist[1] );

    if (jobEntry)  {  // job token is valid

      // calculate path within job directory
      fname = jobEntry.jobDir;
      for (var i=2;i<plist.length;i++)
        fname = path.join ( fname,plist[i] );

    } else  {

      log.error ( 2,'Unrecognised job token in url ' + url );
      server_response.writeHead ( 404, {'Content-Type': 'text/html;charset=UTF-8'} );
      server_response.end ( '<p><b>UNRECOGNISED JOB TOKEN</b></p>' );
      return;

    }

  }

  // Read the requested file content from file system
  fs.readFile ( fname, function(err,data) {
    if (err)  {
      log.error ( 1,'Read file errors, file = ' + fname );
      log.error ( 1,'Error: ' + err );
      server_response.writeHead ( 404, {'Content-Type': 'text/html;charset=UTF-8'} );
      server_response.end ( '<p><b>FILE NOT FOUND [' + fname + ']</b></p>' );
    } else  {
      server_response.writeHead ( 200, {'Content-Type': utils.getMIMEType(fname)} );
      if (cap)
            server_response.end ( utils.capData(data,conf.getServerConfig().fileCapSize) );
      else  server_response.end ( data );
    }
  });

}


// ===========================================================================

function calcCapacity ( onFinish_func )  {
// calculates residual capacity and calls onFinish_func(capacity)
var ncConfig = conf.getServerConfig();
var capacity = ncConfig.capacity;  // total number of jobs the number cruncher
                                   // can accept without stretching
  switch (ncConfig.exeType)  {

    default       :
    case 'CLIENT' :
    case 'SHELL'  : capacity -= Object.keys(ncJobRegister.job_map).length;
                    onFinish_func ( capacity );
               break;

    case 'SGE'    : var job = utils.spawn ( 'qstat',['-u',process.env.USER],{} );
                    var qstat_output = '';
                    job.stdout.on('data', function(data) {
                      qstat_output += data.toString();
                    });
                    job.on('close', function(code) {
                      var regExp = new RegExp('  qw  ','gi');
                      var n = (qstat_output.match(regExp) || []).length;
                      if (n>0)  capacity = -n;
                          else  capacity -= Object.keys(ncJobRegister.job_map).length;
                      onFinish_func ( capacity );
                    });
                break;
  }

}


// ===========================================================================

function ncJobFinished ( job_token,code )  {

  log.debug2 ( 100,'term code=' + code );

  // acquire the corresponding job entry
  var jobEntry = ncJobRegister.getJobEntry ( job_token );

  if (!jobEntry)
    return;  // job token is not valid

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
  writeNCJobRegister();  // this is redundant at repeat sends, but harmless

  var taskDataPath = path.join ( jobEntry.jobDir,task_t.jobDataFName );
  var task         = utils.readClass ( taskDataPath );
  task.job_dialog_data.viewed = false;

  if (!task.informFE)  {
    // FE need not to be informed of job status (RVAPI application), just
    // remove the job and quit
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    return;
  }

  if (task && (jobEntry.sendTrials==conf.getServerConfig().maxSendTrials)) {
    log.debug2 ( 101,'put status' );
    // task instance is Ok, put status code in
    if (code==0)  {
      log.debug2 ( 102,'status finished' );
      task.state = task_t.job_code.finished;
    } else if (code==1001)  {
      task.state = task_t.job_code.stopped;
    } else  {
      task.state = task_t.job_code.failed;
      if (code==200)
        utils.writeJobReportMessage ( jobEntry.jobDir,
                                  '<h2>Python import(s) failure</h2>',false );
    }

    // deal with output data here -- in future
    task.makeOutputData ( jobEntry.jobDir );

    // deal with cleanup here -- in future
    task.cleanJobDir ( jobEntry.jobDir );

    // note residual disk space (in MBs)
    task.disk_space = utils.getDirectorySize ( jobEntry.jobDir ) / 1024.0 / 1024.0;

    // write job metadata back to job directory
    utils.writeObject ( taskDataPath,task );

  }

  // Send directory back to FE. This operation is asynchronous but we DO NOT
  // stop the job checking loop for it. The job is marked as 'exiting' in job
  // registry entry, which prevents interference with the job check loop.

  //   Results are being sent together with the remaining capcity estimations,
  // which are calculated differently in SHELL and SGE modes

  calcCapacity ( function(capacity){

    feURL = jobEntry.feURL;
    if (feURL.endsWith('/'))
      feURL = feURL.substr(0,feURL.length-1);

    send_dir.sendDir ( jobEntry.jobDir,'*',
                       feURL,
                       cmd.fe_command.jobFinished + job_token,
                       {'capacity':capacity},

      function ( rdata ){  // send was successful

        // The number cruncher will start dealing with the job automatically.
        // On FE end, register the job as engaged for further communication
        // with NC and client.
        ncJobRegister.removeJob ( job_token );
        writeNCJobRegister      ();

      },function(stageNo,code){  // send failed

        if (jobEntry.sendTrials>0)  {  // try to send again

          jobEntry.sendTrials--;
          log.warning ( 3,'repeat sending job results to FE' );
          setTimeout ( function(){ ncJobFinished(job_token,code); },
                                conf.getServerConfig().sendDataWaitTime );

        } else  { // what to do??? clean NC storage, the job was a waste.

          ncJobRegister.removeJob ( job_token );
          writeNCJobRegister      ();

          log.error ( 4,'cannot send job results to FE. JOB DELETED.' );

        }

      });

  });

}


// ===========================================================================

function ncRunJob ( job_token,feURL )  {
// This function must not contain asynchronous code.

  // acquire the corresponding job entry
  var jobEntry = ncJobRegister.getJobEntry ( job_token );
  jobEntry.feURL = feURL;

  // get number cruncher configuration object
  var ncConfig = conf.getServerConfig();

  // clear/initiate report directory
  utils.clearRVAPIreport ( jobEntry.jobDir,'task.tsk' );

  // put a new message in the report page indicating that the job is already
  // on number cruncher and is going to start; this write is synchronous
  utils.writeJobReportMessage ( jobEntry.jobDir,'<h1>Starting on &lt;' +
                                ncConfig.name + '&gt; ...</h1>',true );

  // Now start the job.
  // Firstly, acquire the corresponding task class.
  var taskDataPath = path.join ( jobEntry.jobDir,task_t.jobDataFName );
  var jobDir       = path.dirname ( taskDataPath );
  var task         = utils.readClass ( taskDataPath );

  if (task)  { // the task is instantiated, start the job

    utils.removeJobSignal ( jobDir );

    jobEntry.exeType = ncConfig.exeType;
    if (task.fasttrack)
      jobEntry.exeType = 'SHELL';

    var cmd = task.getCommandLine ( jobEntry.exeType,jobDir );

    switch (jobEntry.exeType)  {

      default      :
      case 'CLIENT':
      case 'SHELL' :  var job = utils.spawn ( cmd[0],cmd.slice(1),{} );
                      jobEntry.pid = job.pid;

                      log.standard ( 5,'task ' + task.id + ' started, pid=' +
                                       jobEntry.pid );

                      // make stdout and stderr catchers for debugging purposes
                      var stdout = '';
                      var stderr = '';
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
                      job.on ( 'close',function(code){

                        if (code!=0)
                          log.debug ( 103,'[' + comut.padDigits(task.id,4) +
                                          '] code=' + code );
                        if (stdout)
                          log.debug ( 104,'[' + comut.padDigits(task.id,4) +
                                          '] stdout=' + stdout );
                        if (stderr)
                          log.debug ( 105,'[' + comut.padDigits(task.id,4) +
                                          '] stderr=' + stderr );

                        if (jobEntry.jobStatus!=task_t.job_code.stopped)  {
                          if ((code!=0) && (code!=203))
                            writeJobDriverFailureMessage ( code,stdout,stderr,jobDir );
                          ncJobFinished ( job_token,code );
                        }

                      });

                  break;

      case 'SGE'   :  var queueName = ncConfig.getQueueName();
                      if (queueName.length>0)
                        cmd.push ( queueName );
                      cmd.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      var qsub_params = ncConfig.exeData.concat ([
                        '-o',path.join(jobDir,'_job.stdo'),  // qsub stdout
                        '-e',path.join(jobDir,'_job.stde'),  // qsub stderr
                        '-N','cofe_' + ncJobRegister.launch_count
                      ]);
                      var job = utils.spawn ( 'qsub',qsub_params.concat(cmd),{} );
                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just the scheduler, which
                      // quits nearly immediately; however, we use listeners to
                      // get the standard output and infer job id from there
                      var qsub_output = '';
                      job.stdout.on('data', function(data) {
                        qsub_output += data.toString();
                      });
                      job.on('close', function(code) {
                        var w = qsub_output.split(/\s+/);
                        jobEntry.pid = 0;
                        if (w.length>=3)  {
                          if ((w[0]=='Your') && (w[1]=='job'))
                            jobEntry.pid = parseInt(w[2]);
                        }
                        log.standard ( 6,'task ' + task.id + ' qsubbed, pid=' +
                                         jobEntry.pid );
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

    log.error ( 7,'no task received when expected' );
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

  readNCJobRegister();
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  var jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  var job_token = ncJobRegister.addJob ( jobDir ); // assigns 'new' status
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
      if (code==0)  {
        ncRunJob ( job_token,meta.sender );
        cmd.sendResponse ( server_response, cmd.nc_retcode.ok,
                           '[00104] Job started',
                           {job_token:job_token} );
      } else if (code=='err_rename')  { // file renaming errors
        sendErrResponse ( cmd.nc_retcode.fileErrors,
                          '[00105] File rename errors' );
      } else if (code=='err_dirnoexist')  { // work directory deleted
        cmd.sendResponse ( server_response, cmd.nc_retcode.fileErrors,
                          '[00106] Recepient directory does not exist (job deleted?)' );
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

function ncStopJob ( post_data_obj,callback_func )  {

  log.detailed ( 10,'stop object ' + JSON.stringify(post_data_obj) );

  if (post_data_obj.hasOwnProperty('job_token'))  {

    var jobEntry = ncJobRegister.getJobEntry ( post_data_obj.job_token );

    if (jobEntry)  {

      if (jobEntry.pid>0)  {

        log.detailed ( 11,'attempt to kill pid=' + jobEntry.pid );

        // write the respective signal in job directory

        if (!utils.jobSignalExists(jobEntry.jobDir))
          utils.writeJobSignal ( jobEntry.jobDir,'terminated_job','',1001 );

        // now this sgnal should be picked by checkJobs() at some point _after_
        // the current function quits.

        // put 'stopped' code in job registry, this prevents job's on-close
        // listener to call ncJobFinished(); instead, ncJobFinished() will be
        // invoked by checkJobsOnTimer(), which is universal for all exeTypes.
        jobEntry.jobStatus = task_t.job_code.stopped;

        // now kill the job itself; different approaches are taken for Unix
        // and Windows platforms, as well as for SHELL and SGE execution types
        switch (jobEntry.exeType)  {

          default      :
          case 'CLIENT':
          case 'SHELL' : //var isWindows = /^win/.test(process.platform);
                         if(!conf.isWindows()) {
                           psTree ( jobEntry.pid, function (err,children){
                             var pids = ['-9',jobEntry.pid].concat (
                                     children.map(function(p){ return p.PID; }));
                             child_process.spawn ( 'kill',pids );
                           });
                         } else {
                           child_process.exec ( 'taskkill /PID ' + jobEntry.pid +
                                       ' /T /F',function(error,stdout,stderr){});
                         }
                    break;

          case 'SGE'   : var pids = [jobEntry.pid];
                         var subjobs = utils.readString (
                                         path.join(jobEntry.jobDir,'subjobs'));
                         if (subjobs)
                           pids = pids.concat ( subjobs
                                          .replace(/(\r\n|\n|\r)/gm,' ')
                                          .replace(/\s\s+/g,' ').split(' ') );
                         utils.spawn ( 'qdel',pids,{} );

        }

        response = new cmd.Response ( cmd.nc_retcode.ok,
                                      '[00109] Job scheduled for deletion',{} );

      } else  {
        log.detailed ( 12,'attempt to kill a process without a pid' );
        response = new cmd.Response ( cmd.nc_retcode.pidNotFound,
                              '[00110] Job\'s PID not found; just stopped?',{} );
      }

    } else  {
      log.error ( 13,'attempt to kill failed no token found: ' +
                     post_data_obj.job_token );
      response = new cmd.Response ( cmd.nc_retcode.jobNotFound,
                                    '[00111] Job not found; just stopped?',{} );
    }

  } else  {
    log.error ( 14,'wrong request to kill post_data="' +
                         JSON.stringify(post_data_obj) + '"' );
    response = new cmd.Response ( cmd.nc_retcode.wrongRequest,
                                  '[00112] Wrong request data',{} );
  }

  callback_func ( response );

}


// ===========================================================================

function ncRunRVAPIApp ( post_data_obj,callback_func )  {

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister();
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  var jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  var job_token = ncJobRegister.addJob ( jobDir ); // assigns 'new' status
  writeNCJobRegister();

  var ok = utils.mkDir(jobDir) && utils.mkDir(path.join(jobDir,'input')) &&
                                  utils.mkDir(path.join(jobDir,'report'));
  if (!ok)  {
    log.error ( 15,'job directory "' + jobDir + '" cannot be created.' );
    ncJobRegister.removeJob ( job_token );
    writeNCJobRegister      ();
    callback_func ( new cmd.Response ( cmd.nc_retcode.mkDirError,
                    '[00113] Cannot create job directory on NC-CLIENT server #' +
                    conf.getServerConfig().serNo,{} ) );
    return;
  }

  log.detailed ( 16,'prepare new job, jobDir=' + jobDir );

  // 2. Download files

  var args = post_data_obj.data.split('*');  // argument list for RVAPI application
  var exts = ['.pdb','.cif','.mtz','.map'];  // recognised file extensions for download

  function prepare_job ( ix )  {

    if (ix<args.length)  {  // process ixth argument

      var ip = args[ix].lastIndexOf('.');  // is there a file extension?

      if (ip>=0)  {

        var ext = args[ix].substring(ip).toLowerCase();

        if (exts.indexOf(ext)>=0)  {  // file extension is recognised

          // compute full download url
          var url   = post_data_obj.base_url + '/' + args[ix];
          // compute full local path to accept the download
          var fpath = path.join ( 'input',url.substring(url.lastIndexOf('/')+1) );

          request  // issue the download request
            .get ( url )
            .on('error', function(err) {
              log.error ( 17,'Download errors from ' + url );
              log.error ( 17,'Error: ' + err );
              // remove job
              ncJobRegister.removeJob ( job_token );
              writeNCJobRegister      ();
              callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                                     '[00114] Download errors: ' + err,{} ) );
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

      var taskRVAPIApp = new task_rvapiapp.TaskRVAPIApp();
      taskRVAPIApp.id            = ncJobRegister.launch_count;
      taskRVAPIApp.rvapi_command = post_data_obj.command;
      taskRVAPIApp.rvapi_args    = args;
      utils.writeObject ( path.join(jobDir,task_t.jobDataFName),taskRVAPIApp );

      ncRunJob ( job_token,'' );

      // signal 'ok' to client
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00115] Ok',{} ) );

    }

  }

  // invoke preparation recursion
  prepare_job ( 0 );

}


// ===========================================================================

function ncRunClientJob ( post_data_obj,callback_func )  {
// This function creates a new job and job directory, receives jobball from FE,
// unpacks it and starts the job. Although the jobball is received in
// asynchronous mode, we DO NOT suspend the job checking loop here, because
// it looks only at 'running' jobs, while the new one is marked as 'new'.

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister();
  ncJobRegister.launch_count++; // this provides unique numbering of jobs

  var jobDir = ncGetJobDir ( ncJobRegister.launch_count );
  // make new entry in job registry
  var job_token = ncJobRegister.addJob1 ( jobDir,post_data_obj.job_token );

  writeNCJobRegister();

  var ok = utils.mkDir(jobDir) && utils.mkDir(path.join(jobDir,'input'))  &&
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

  var dnlURL = post_data_obj.feURL + post_data_obj.dnlURL;

  request  // issue the download request
    .get ( dnlURL )
    .on('error', function(err) {
      log.error ( 20,'Download errors from ' + dnlURL );
      log.error ( 20,'Error: ' + err );
      // remove job
      ncJobRegister.removeJob ( job_token );
      writeNCJobRegister      ();
      callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                             '[00117] Download errors: ' + err,{} ) );
    })
    .pipe(fs.createWriteStream(path.join(jobDir,send_dir.jobballName)))
    .on('error', function(err) {
      log.error ( 23,'Download errors from ' + dnlURL );
      log.error ( 23,'Error: ' + err );
      // remove job
      ncJobRegister.removeJob ( job_token );
      writeNCJobRegister      ();
      callback_func ( new cmd.Response ( cmd.nc_retcode.downloadErrors,
                             '[00121] Download errors: ' + err,{} ) );
    })
    .on('close',function(){   // finish,end,
      // successful download, unpack and start the job

      send_dir.unpackDir ( jobDir,false, function(code){
        if (code==0)  {
          ncRunJob ( job_token,post_data_obj.feURL );
          // signal 'ok' to client
          callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'[00118] Job started',
                                             {job_token:job_token} ) );
          log.detailed ( 21,'directory contents has been received in ' + jobDir );
        } else  {
          // unpacking errors, remove job
          ncJobRegister.removeJob ( job_token );
          writeNCJobRegister      ();
          callback_func ( new cmd.Response ( cmd.nc_retcode.unpackErrors,
                                             '[00119] Unpack errors',{} ) );
        }
      });

    });

}


// ==========================================================================
// export for use in node
module.exports.ncSendFile         = ncSendFile;
module.exports.ncMakeJob          = ncMakeJob;
module.exports.ncStopJob          = ncStopJob;
module.exports.ncRunRVAPIApp      = ncRunRVAPIApp;
module.exports.ncRunClientJob     = ncRunClientJob;
module.exports.ncGetJobsDir       = ncGetJobsDir;
module.exports.readNCJobRegister  = readNCJobRegister;
module.exports.writeNCJobRegister = writeNCJobRegister;
