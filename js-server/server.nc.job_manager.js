
/*
 *  =================================================================
 *
 *    17.04.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
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
var ud            = require('../js-common/common.data_user');
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
  this.logflow      = {};
  this.logflow.logno = 0;
  this.logflow.njob0 = 0;
}


NCJobRegister.prototype.addJob = function ( jobDir )  {
var job_token     = crypto.randomBytes(20).toString('hex');
var maxSendTrials = conf.getServerConfig().maxSendTrials;
  this.job_map[job_token] = {
    feURL      : '',
    jobDir     : jobDir,
    jobStatus  : task_t.job_code.new,
    sendTrials : maxSendTrials,
    exeType    : '',    // SHELL, SGE or SCRIPT
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

NCJobRegister.prototype.getListOfTokens = function()  {
  var tlist = '';
  for (var job_token in this.job_map)  {
    if (tlist)  tlist += ',';
    tlist += job_token;
  }
  return tlist;
}


/*
NCJobRegister.prototype.checkJobTokens = function ( token_list )  {
// returns a list of non-existing tokens
var tlist = [];
  for (var i=0;i<token_list.length;i++)
    if (!(token_list[i] in this.job_map))
      tlist.push ( token_list[i] );
  return tlist;
}
*/

var ncJobRegister = null;

function readNCJobRegister ( readKey )  {

  if (!ncJobRegister)  {

    var fpath = path.join ( conf.getServerConfig().storage,registerFName );
    var saveRegister = true;

    ncJobRegister = new NCJobRegister();
    obj           = utils.readObject ( fpath );

    if (obj)  {

      saveRegister = false;

      for (key in obj)
        ncJobRegister[key] = obj[key];

      if (readKey==0)  {
        var maxSendTrials = conf.getServerConfig().maxSendTrials;
        for (var job_token in ncJobRegister.job_map)
          if (ncJobRegister.job_map.hasOwnProperty(job_token))  {
            if (ncJobRegister.job_map[job_token].jobStatus==task_t.job_code.exiting) {
              ncJobRegister.job_map[job_token].jobStatus  = task_t.job_code.running;
              ncJobRegister.job_map[job_token].sendTrials = maxSendTrials;
              var saveRegister = true;
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


function removeJobDelayed ( job_token,jobStatus )  {
  if (ncJobRegister)  {
    var jobEntry = ncJobRegister.getJobEntry ( job_token );
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


// ===========================================================================

function writeJobDriverFailureMessage ( code,stdout,stderr,jobDir )  {

var msg = '<h1><i>Job Driver Failure</i></h1>' + 'Failure code: ' + code;

  if (stdout)
    msg += '<p>Catched stdout:<pre>' + stdout + '</pre>';
  if (stderr)
    msg += '<p>Catched stderr:<pre>' + stderr + '</pre>';

  msg += '<p>This is an internal error, which may be caused by different ' +
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

//console.log ( ' jobEntry found, fname=' + fname );

    } else  {

//console.log ( ' jobEntry NOT found, url=' + url );

      log.error ( 2,'Unrecognised job token in url ' + url );
      if (url.endsWith('.html'))  {
        // assume that this is due to a delay in job launching
        server_response.writeHead ( 200,
                                    {'Content-Type': 'text/html;charset=UTF-8'} );
        server_response.end (
          '<html><head>' +
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

  // Read the requested file content from file system

  if (fname)  {
    var capSize = 0;
    if (cap)
      capSize = conf.getServerConfig().fileCapSize;
    utils.send_file ( fname,server_response,utils.getMIMEType(fname),false,
                      capSize,20,null );
  }

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

    case 'SCRIPT' : var job = utils.spawn ( ncConfig.exeData,
                                            ['check_waiting',process.env.USER],{} );
                    var job_output = '';
                    job.stdout.on ( 'data', function(data) {
                      job_output += data.toString();
                    });
                    job.on ( 'close', function(code) {
                      // should return just the number but escape just in case
                      var n = 0;
                      try {
                        n = parseInt(job_output);
                      } catch(err)  {
                        log.error ( 31,'error parsing NC capacity: "' +
                                       job_output + '"' );
                      }
                      if (n>0)  capacity = -n;
                          else  capacity -= Object.keys(ncJobRegister.job_map).length;
                      onFinish_func ( capacity );
                    });
                break;

  }

}


// ===========================================================================

function copyToSafe ( task,jobEntry )  {

  if ([ud.feedback_code.agree1,ud.feedback_code.agree2].indexOf(jobEntry.feedback)>=0)  {

    var jobsSafe    = conf.getServerConfig().getJobsSafe();
    var safeDirPath = path.join ( jobsSafe.path,task._type );

    try {

      if (!utils.fileExists(safeDirPath))  {

        if (!utils.mkDir(safeDirPath))  {
          log.error ( 40,'cannot create safe job area at ' + safeDirPath );
          return;
        }
        log.standard ( 40,'created safe job area at ' + safeDirPath );

      } else  {
        // check that the safe is not full

        var files  = fs.readdirSync ( safeDirPath );
        var dpaths = [];
        for (var i=0;i<files.length;i++)  {
          var fpath = path.join ( safeDirPath,files[i] );
          var stat  = fs.statSync ( fpath );
          if (stat && stat.isDirectory())
            dpaths.push ( fpath );
        }

        if (dpaths.length>=jobsSafe.capacity)  {
          // safe is full, remove old entries
          for (var i=0;i<dpaths.length;i++)
            for (var j=i+1;j<dpaths.length;j++)
              if (dpaths[j]>dpaths[i])  {
                var dname = dpaths[j];
                dpaths[j] = dpaths[i];
                dpaths[i] = dname;
              }
          for (var i=Math.max(0,jobsSafe.capacity-1);i<dpaths.length;i++)
            utils.removePath ( dpaths[i] );
        }

      }

      safeDirPath = path.join ( safeDirPath,'job_' + Date.now() );
      fs.copySync ( jobEntry.jobDir,safeDirPath );

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

  log.debug2 ( 100,'term code=' + code );

  // acquire the corresponding job entry
  var jobEntry = ncJobRegister.getJobEntry ( job_token );

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
    //if (code==0)  {
    if (!code)  {
      log.debug2 ( 102,'status finished' );
      if (task.state!=task_t.job_code.remdoc)
        task.state = task_t.job_code.finished;
    } else if (code==1001)  {
      task.state = task_t.job_code.stopped;
    } else if (code==204)  {
      task.state = task_t.job_code.noresults;
    } else  {
      task.state = task_t.job_code.failed;
      if (code==200)
        utils.writeJobReportMessage ( jobEntry.jobDir,
                                  '<h1>Python import(s) failure</h1>',false );
      copyToSafe ( task,jobEntry );
    }

    // deal with output data here -- in future
    task.makeOutputData ( jobEntry.jobDir );

    // deal with cleanup here -- in future
    task.cleanJobDir ( jobEntry.jobDir );

    // note residual disk space (in MB)
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

    // get original front-end url
    var feURL = jobEntry.feURL;

    // but, if FE is configured, take it from configuration
    var fe_config = conf.getFEConfig();
    if (fe_config && fe_config.localSetup)
      feURL = fe_config.externalURL;

    if (feURL.endsWith('/'))
      feURL = feURL.substr(0,feURL.length-1);

    send_dir.sendDir ( jobEntry.jobDir,'*',
                       feURL,
                       cmd.fe_command.jobFinished + job_token, {
                          'capacity' : capacity,
                          'tokens'   : ncJobRegister.getListOfTokens()
                       },

      function ( rdata ){  // send was successful

        // just remove the job; do it in a separate thread and delayed,
        // which is useful for debugging etc.

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

        log.standard ( 103,'task ' + task.id + ' sent back to FE, job token ' +
                           job_token );
        removeJobDelayed ( job_token,task_t.job_code.finished );

      },function(stageNo,code){  // send failed

        if (stageNo==2)  {

          // do not countdown trials here
          log.warning ( 3,'repeat sending task ' + task.id +
                          ' back to FE due to send errors [' +
                           JSON.stringify(code) + ']' );
          setTimeout ( function(){ ncJobFinished(job_token,code); },
                       conf.getServerConfig().sendDataWaitTime );

        } else if (jobEntry.sendTrials>0)  {  // try to send again

          jobEntry.sendTrials--;
          log.warning ( 4,'repeat sending task ' + task.id +
                          ' back to FE due to FE errors (stage' +
                          stageNo + ', code [' + JSON.stringify(code) + '])' );
          setTimeout ( function(){ ncJobFinished(job_token,code); },
                       conf.getServerConfig().sendDataWaitTime );

        } else  { // what to do??? clean NC storage, the job was a waste.

          removeJobDelayed ( job_token,task_t.job_code.finished );

          log.error ( 4,'cannot send task ' + task.id +
                        ' back to FE. TASK DELETED.' );

        }

      });

  });

}


// ===========================================================================

function ncRunJob ( job_token,meta )  {
// This function must not contain asynchronous code.

  // acquire the corresponding job entry
  var jobEntry = ncJobRegister.getJobEntry ( job_token );
  jobEntry.feURL     = meta.sender;
  jobEntry.feedback  = meta.feedback;
  jobEntry.user_name = meta.user_name;
  jobEntry.email     = meta.email;

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

  function getJobName()  {
    //return 'cofe_' + ncJobRegister.launch_count;
    var jname = 'ccp4cloud-' + ncJobRegister.launch_count;
    if (meta.user_id)   jname += '.' + meta.user_id + '.' + task.project + '.' + task.id;
    if (meta.setup_id)  jname += '.' + meta.setup_id;
    return jname;
  }

//console.log ( getJobName() );

  if (task)  { // the task is instantiated, start the job

    var nproc  = ncConfig.getMaxNProc();
    var ncores = task.getNCores ( nproc );
    utils.writeObject ( path.join(jobEntry.jobDir,'__despatch.meta'),{
      'sender'   : meta.sender,
      'setup_id' : meta.setup_id,
      'nc_name'  : meta.nc_name
    });

    utils.removeJobSignal ( jobDir );

    jobEntry.exeType = ncConfig.exeType;
    if (task.fasttrack)
      jobEntry.exeType = 'SHELL';

    var cmd = task.getCommandLine ( ncConfig.jobManager,jobDir );

    switch (jobEntry.exeType)  {

      default      :
      case 'CLIENT':
      case 'SHELL' :  log.standard ( 5,'starting... ' );
                      cmd.push ( nproc.toString() );
                      var job = utils.spawn ( cmd[0],cmd.slice(1),{} );
                      jobEntry.pid = job.pid;

                      log.standard ( 5,'task ' + task.id + ' started, pid=' +
                                       jobEntry.pid + ', job token ' + job_token );

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

//                        if (code!=0)
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
                          if (code && (code!=203) && (code!=204))
                            writeJobDriverFailureMessage ( code,stdout,stderr,jobDir );
                          ncJobFinished ( job_token,code );
                        }

                      });
                  break;

      case 'SGE'   :  cmd.push ( ncConfig.getQueueName() );
                      //cmd.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      cmd.push ( nproc.toString() );
                      var jname = getJobName();
                      var qsub_params = ncConfig.exeData.concat ([
                        '-o',path.join(jobDir,'_job.stdo'),  // qsub stdout
                        '-e',path.join(jobDir,'_job.stde'),  // qsub stderr
                        '-N',jname
                      ]);
                      var job = utils.spawn ( 'qsub',qsub_params.concat(cmd),{} );
                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just SGE job scheduler, which
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
                        log.standard ( 6,'task '  + task.id + ' qsubbed, '  +
                                         'name='  + jname   +
                                         ', pid=' + jobEntry.pid +
                                         ', job token ' + job_token );
                      });

                      // indicate queuing to please the user
                      utils.writeJobReportMessage ( jobDir,
                                '<h1>Queuing up on &lt;' + ncConfig.name +
                                '&gt;, please wait ...</h1>', true );

                  break;

      case 'SCRIPT' : cmd.push ( ncConfig.getQueueName() );
                      //cmd.push ( Math.max(1,Math.floor(ncConfig.capacity/4)).toString() );
                      cmd.push ( nproc.toString() );
                      var jname = getJobName();
                      var script_params = [
                        'start',
                        path.join(jobDir,'_job.stdo'),  // qsub stdout
                        path.join(jobDir,'_job.stde'),  // qsub stderr
                        jname,
                        ncores
                      ];
                      var job = utils.spawn ( ncConfig.exeData,script_params.concat(cmd),{} );
                      // in this mode, we DO NOT put job listener on the spawn
                      // process, because it is just the launcher script, which
                      // quits nearly immediately; however, we use listeners to
                      // get the standard output and infer job id from there
                      var job_output = '';
                      job.stdout.on('data', function(data) {
                        job_output += data.toString();
                      });
                      job.on('close', function(code) {
                        // the script is supposed to retun only jobID, but
                        // escape just in case
                        try {
                          jobEntry.pid = parseInt(job_output);
                          log.standard ( 7,'task '  + task.id + ' submitted, ' +
                                           'name='  + jname   +
                                           ', pid=' + jobEntry.pid +
                                           ', job token ' + job_token );
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

  readNCJobRegister ( 1 );
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
      //if (code==0)  {
      if (!code)  {
        ncRunJob ( job_token,meta );
        cmd.sendResponse ( server_response, cmd.nc_retcode.ok,
                           '[00104] Job started', {
                             job_token     : job_token
                           });
        /*
        var absent_tokens = [];
        if ('check_tokens' in meta)
          absent_tokens = ncJobRegister.checkJobTokens ( meta.check_tokens.split(',') );
        cmd.sendResponse ( server_response, cmd.nc_retcode.ok,
                           '[00104] Job started', {
                             job_token     : job_token,
                             absent_tokens : absent_tokens
                           });
        */
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

          default       :
          case 'CLIENT' :
          case 'SHELL'  : //var isWindows = /^win/.test(process.platform);
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

          case 'SGE'    : var pids = [jobEntry.pid];
                          var subjobs = utils.readString (
                                          path.join(jobEntry.jobDir,'subjobs'));
                          if (subjobs)
                            pids = pids.concat ( subjobs
                                           .replace(/(\r\n|\n|\r)/gm,' ')
                                           .replace(/\s\s+/g,' ').split(' ') );
                          utils.spawn ( 'qdel',pids,{} );
                    break;

          case 'SCRIPT' : var pids = ['kill',jobEntry.pid];
                          var subjobs = utils.readString (
                                          path.join(jobEntry.jobDir,'subjobs'));
                          if (subjobs)
                            pids = pids.concat ( subjobs
                                           .replace(/(\r\n|\n|\r)/gm,' ')
                                           .replace(/\s\s+/g,' ').split(' ') );
                          utils.spawn ( conf.getServerConfig().exeData,pids,{} );

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

  readNCJobRegister ( 1 );
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

}


// ===========================================================================

function ncRunClientJob ( post_data_obj,callback_func )  {
// This function creates a new job and job directory, receives jobball from FE,
// unpacks it and starts the job. Although the jobball is received in
// asynchronous mode, we DO NOT suspend the job checking loop here, because
// it looks only at 'running' jobs, while the new one is marked as 'new'.

  // 1. Get new job directory and create an entry in job registry

  readNCJobRegister ( 1 );
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

  var get_options = { url: dnlURL };
  //if (conf.getServerConfig().useRootCA)
  //  get_options.ca = fs.readFileSync ( path.join('certificates','rootCA.pem') );

  request  // issue the download request
    .get ( get_options )
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

      send_dir.unpackDir ( jobDir,null, function(code){
        //if (code==0)  {
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
