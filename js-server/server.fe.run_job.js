
/*
 *  ==========================================================================
 *
 *    16.02.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  ==========================================================================
 *
 *  Classes:
 *  ~~~~~~~~
 *     FEJobRegister
 *
 *  Functions:
 *  ~~~~~~~~~~
 *     getJobRegisterPath   ()
 *     getJobStatPath       ( logNo )
 *     readFEJobRegister    ()
 *     writeFEJobRegister   ()
 *     cleanFEJobRegister   ( nattempts )
 *     getEFJobEntry        ( loginData,project,jobId )
 *     selectNumberCruncher ( task )
 *     ncSelectAndCheck     ( nc_counter,task,callback_func )
 *     _run_job             ( loginData,task,job_token,ownerLoginData,
 *                            shared_logins,run_remotely, callback_func )
 *     runJob               ( loginData,data, callback_func )
 *     webappEndJob         ( loginData,data, callback_func )
 *     stopJob              ( loginData,data )
 *     killJob              ( loginData,projectName,taskId )
 *     webappFinished       ( loginData,data )
 *     writeJobStats        ( jobEntry )
 *     readJobStats         ()
 *     addJobAuto           ( jobEntry,jobClass )
 *     getJobResults        ( job_token,server_request,server_response )
 *     checkJobs            ( loginData,data )
 *     wakeZombieJobs       ( loginData,data )
 *     cloudRun             ( server_request,server_response )
 *     cloudFetch           ( server_request,server_response )
 *
 *  ==========================================================================
 */

'use strict';

//  load system modules
const fs        = require('fs-extra');
const path      = require('path');
const crypto    = require('crypto');
const request   = require('request');

//  load application modules
const emailer   = require('./server.emailer');
const utils     = require('./server.utils');
// const cache     = require('./server.cache');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const conf      = require('./server.configuration');
const send_dir  = require('./server.send_dir.js');
const ration    = require('./server.fe.ration');
const ustats    = require('./server.fe.usagestats');
const class_map = require('./server.class_map');
const task_t    = require('../js-common/tasks/common.tasks.template');
const cmd       = require('../js-common/common.commands');
const ud        = require('../js-common/common.data_user');
const pd        = require('../js-common/common.data_project');
const com_utils = require('../js-common/common.utils');
const knlg      = require('../js-common/common.knowledge');

//  prepare log
const log = require('./server.log').newLog(8);


// ===========================================================================

const feJobStatFile     = 'fe_job_stats';
const feJobRegisterFile = 'fe_job_register.meta';

function FEJobRegister()  {
  this.job_map        = {};
  this.token_map      = {};
  this.token_pull_map = {};  // jobs sent to 'REMOTE' NC that cannot push back
  this.n_jobs         = 0;   // serial counter for total number of jobs
  this.logflow        = {};
  this.logflow.logno  = 0;
  this.logflow.njob0  = 0;
}

FEJobRegister.prototype.addJob = function ( job_token,nc_number,loginData,
                                            project,jobId,shared_logins,
                                            eoj_notification,push_back )  {
  let crTime = Date.now();
  this.job_map[job_token] = {
    nc_number        : nc_number,
    nc_type          : 'ordinary',
    job_token        : job_token,  // job_token issued by NC (clashes hopefully minimal)
                                   // make tokens surely NC-specific through NC
                                   // confoguration
    loginData        : loginData,
    project          : project,
    jobId            : jobId,
    is_shared        : (Object.keys(shared_logins).length>0),
    start_time       : crTime,
    startTime_iso    : new Date(crTime).toISOString(),
    eoj_notification : eoj_notification,
    push_back        : push_back
  };
  let index = loginData.login + ':' + project + ':' + jobId;
  this.token_map[index] = job_token;
  if (push_back=='NO')
    this.token_pull_map[index] = job_token;
  for (let login in shared_logins)  {
    index = login + ':' + project + ':' + jobId;
    this.token_map[index] = job_token;
  }
}

FEJobRegister.prototype.getJobEntry = function ( loginData,project,jobId )  {
let index = loginData.login + ':' + project + ':' + jobId;
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
    let index = this.job_map[job_token].loginData.login + ':' +
                this.job_map[job_token].project         + ':' +
                this.job_map[job_token].jobId;
    //this.token_map = com_utils.mapExcludeKey ( this.token_map,index     );
    //this.job_map   = com_utils.mapExcludeKey ( this.job_map  ,job_token );
    if (index in this.token_map)
      delete this.token_map[index];
    if (index in this.token_pull_map)
      delete this.token_pull_map[index];
    if (this.job_map[job_token].is_shared)  {
      let index_list = [];
      for (let indx in this.token_map)
        if (this.token_map[indx]==job_token)
          index_list.push ( indx );
      for (let i=0;i<index_list.length;i++)
        delete this.token_map[index_list[i]];
    }
    delete this.job_map[job_token];
    return true;
  }
  return false;
}

FEJobRegister.prototype.cleanup = function ( job_token,token_list )  {
// removes job identified by job_token and jobs from the same NC with tokens
// not found in token_list
  if (job_token in this.job_map)  {
    let nc_number = this.job_map[job_token].nc_number;
    this.removeJob ( job_token );
    for (let token in this.job_map)
      if ((this.job_map.nc_number==nc_number) && (token_list.indexOf(token)<0))
        this.removeJob ( token );
        //removeJob ( token );
  }
}

/*
FEJobRegister.prototype.getListOfTokens = function ( nc_number )  {
  let tlist = '';
  for (var job_token in this.job_map)
    if (this.job_map[job_token].nc_number==nc_number)  {
      if (tlist)  tlist += ',';
      tlist += job_token;
    }
  return tlist;
}
*/

let feJobRegister = null;

function getJobRegisterPath()  {
  return path.join ( conf.getFEConfig().storage,feJobRegisterFile );
}

function getJobStatPath ( logNo )  {
  if (logNo<=0)
        return path.join ( conf.getFEConfig().storage,feJobStatFile + '.log' );
  else  return path.join ( conf.getFEConfig().storage,feJobStatFile + '.' +
                           com_utils.padDigits(logNo,3) + '.log' );
}

function readFEJobRegister()  {

  if (!feJobRegister)  {
    let fpath     = getJobRegisterPath();
    feJobRegister = new FEJobRegister();
    let obj       = utils.readObject ( fpath );
    if (obj)  {
      for (let key in obj)
        feJobRegister[key] = obj[key];
      for (let token in feJobRegister.job_map)  {
        if ('login' in feJobRegister.job_map[token])
          feJobRegister.job_map[token].loginData = {
            'login'  : feJobRegister.job_map[token].login,
            'volume' : '***'
          }
        if (!('push_back' in feJobRegister.job_map[token]))
          feJobRegister.job_map[token].push_back = 'YES';
      }
      if (!('token_pull_map' in feJobRegister))
        feJobRegister.token_pull_map = {};
    } else
      writeFEJobRegister();
  }
  
  checkPullMap();

}

function writeFEJobRegister()  {
let fpath = getJobRegisterPath();

  if (!feJobRegister)
    feJobRegister = new FEJobRegister();

  utils.writeObject ( fpath,feJobRegister );

}

function cleanFEJobRegister ( nattempts )  {

  if (!feJobRegister)
    readFEJobRegister();

  let dead_tokens = [];
  for (let job_token in feJobRegister.job_map)  {
    let jobEntry   = feJobRegister.job_map[job_token];
    let jobDirPath = prj.getJobDirPath ( jobEntry.loginData,jobEntry.project,
                                         jobEntry.jobId );
    if (!utils.dirExists(jobDirPath))
      dead_tokens.push ( job_token );
  }

  if (dead_tokens.length>0)  {
    if (nattempts>0)  {
      // additional attempts are given in order to compensate possible NFS lag
      setTimeout ( function(){
        cleanFEJobRegister ( nattempts-1 );
      },10000);
      log.standard ( 51,dead_tokens.length + ' dead entries in FE job registry found' );
      return;
    } else  {
      for (let i=0;i<dead_tokens.length;i++)
        feJobRegister.removeJob ( dead_tokens[i] );
      writeFEJobRegister();
    }
  }

  log.standard ( 50,dead_tokens.length + ' dead entries in FE job registry removed' );

}

function getEFJobEntry ( loginData,project,jobId )  {
  return feJobRegister.getJobEntry ( loginData,project,jobId );
}

// ===========================================================================
//
// REMOTE job management. REMOTE jobs are running on NC that cannot push results 
// back to FE. Typically, this is the case when jobs are sent to remote NC from 
// local (desktop) Cloud configuration. 'REMOTE' NCs are configured as any ordinary 
// NC, but on FE side, they should contain 'REMOTE' value for 'exeType':
//
//        exeType : 'REMOTE'
//
// On NC side, the configuration should specify the relevant NC typeof, such as
// 'SLURM', 'SGE' etc. When jobs are sent to 'REMOTE' NC, the results are pulled 
// back by FE, rather than pushed from NC. This is a less efficient model, which 
// should be used only when absolutely necessary, for example, when a task needs 
// complex software setup such as AF2.
//

var pull_jobs_timer = null;

function checkRemoteJobs ( check_jobs,nc_number )  {
let nc_servers = conf.getNCConfigs();

  if (nc_number>=nc_servers.length)  {
    // jobs on all REMOTE NCs are checked, analyse results now

    // console.log ( ' >>>>> check_jobs = ' + JSON.stringify(check_jobs) );

    // download and unpack jobbals of finished jobs, replace them in projects and
    // mark for deletion on NCs if success
    let were_changes = false;

    for (let index in check_jobs)  {

      let jobEntry  = feJobRegister.getJobEntryByToken ( check_jobs[index].job_token );

      if ((!check_jobs[index].status) || (check_jobs[index].status==cmd.nc_retcode.jobNotFound))  {

        // remove runaway job
        check_jobs[index].status = task_t.job_code.remove;
          // should never happen; not critical therefore warning only
         log.warning ( 1,'runaway pull token ' + check_jobs[index].job_token + 
                         ' for ' + index );
        delete feJobRegister.token_pull_map[index];
        if (index in feJobRegister.token_map)
        delete feJobRegister.token_map[index];
        were_changes = true;
      
      } else if (jobEntry && (check_jobs[index].status!=task_t.job_code.running))  {
        // job finished, results are ready

        (function(server_no,job_entry){
          let ncCfg    = nc_servers[check_jobs[server_no].nc_number];
          let nc_url   = ncCfg.externalURL;
          let filePath = path.join ( conf.getFETmpDir(),job_entry.job_token + '.zip' );
          let file     = fs.createWriteStream ( filePath );
          request({
              uri     : cmd.nc_command.getJobResults,
              baseUrl : nc_url,
              method  : 'POST',
              body    : { job_token : job_entry.job_token },
              json    : true,
              rejectUnauthorized : conf.getFEConfig().rejectUnauthorized
            }
          )
          .pipe(file)
          .on('finish',function()  {

            // Check whether this is a signal response or a possible zip file
            // this is redundant in view of preliminary checks, but we leave
            // this code for safety
            if (utils.fileSize(filePath)<1000)  {  // likely a signal
              let rdata = utils.readObject ( filePath );
              if (rdata)  {
                // if job is still running, just ignore received file till next round
                if (rdata.status==cmd.nc_retcode.jobIsRunning)
                  return;
                // the other signal is job not found on NC
                if (rdata.status==cmd.nc_retcode.jobNotFound)  {
                  log.warning ( 2,'job not found on REMOTE NC "' + ncCfg.name +
                                  '" job_token=' + job_entry.job_token + ' -- removed' );
                  feJobRegister.removeJob ( job_entry.job_token );
                  writeFEJobRegister();
                  check_jobs[server_no].status = task_t.job_code.remove;
                  were_changes = true;
                  return;
                }
              }
            }

            let jobDir = prj.getJobDirPath ( job_entry.loginData,job_entry.project,
                                             job_entry.jobId );
            send_dir.unpackDir ( filePath,jobDir,true,
              function(code,jobballSize){
                if (code)  {
                  // make a counter here to avoid infinite looping
                  log.error ( 1,'unpack errors, code=' + code + 
                                ', filesize='  + jobballSize  +
                                ', job_token=' + job_entry.job_token );
                } else  {
                  let meta = utils.readObject ( path.join(jobDir,cmd.ncMetaFileName) );
                  if (meta)
                    _place_job_results ( job_entry.job_token,code,'',meta,null );
                  else  {  // legacy only!
                    feJobRegister.removeJob ( jobEntry.job_token );
                    writeFEJobRegister();
                  }
                  check_jobs[server_no].status = task_t.job_code.remove;
                  checkRemoteJobs ( check_jobs,0 );  // remove fetched and runaway jobs from NCs
                }
              });

          })
          .on('error', (err) => {
            // make a counter here to avoid infinite looping
            utils.removeFile ( filePath ); // Remove file on error
            log.error ( 2,'Error receiving data from REMOTE NC: ' + err );
          });

        }(index,jobEntry))
      
      }

    }

    if (were_changes)  {
      checkRemoteJobs ( check_jobs,0 );  // remove fetched and runaway jobs from NCs
      writeFEJobRegister();
    } else  {
      pull_jobs_timer = null;  // note that timer was blocked up to this point
      checkPullMap();
    }

    return;

  } else if (nc_servers[nc_number].in_use && 
             (nc_servers[nc_number].exeType.toUpperCase()=='REMOTE'))  {
    // check jobs on next REMOTE NC

    request({
      uri     : cmd.nc_command.checkJobResults,
      baseUrl : nc_servers[nc_number].externalURL,
      method  : 'POST',
      body    : check_jobs,
      json    : true,
      rejectUnauthorized : conf.getFEConfig().rejectUnauthorized
    },function(error,response,body){
      // console.log ( ' >>>>> error = "' + error + '"' );
      // console.log ( ' >>>>> body = ' + JSON.stringify(body) );
      checkRemoteJobs ( body.data,nc_number+1 );
    });

  } else  {
    checkRemoteJobs ( check_jobs,nc_number+1 );
  }

}

function checkPullMap()  {

  // console.log ( ' >>>>> checkPullMap '); 

  if (Object.keys(feJobRegister.token_pull_map).length <= 0)  {

    pull_jobs_timer = null;
  
  } else if (!pull_jobs_timer)  {  // else the timer is already running, do not repeat

    pull_jobs_timer = setTimeout ( function(){

      let check_jobs = {};  // buffer structure for convenience
      for (let index in feJobRegister.token_pull_map)  {
        let job_token = feJobRegister.token_pull_map[index];
        let jobEntry  = feJobRegister.getJobEntryByToken ( job_token );
        if (jobEntry)  {
          check_jobs[index] = {
            job_token : feJobRegister.token_pull_map[index],
            nc_number : jobEntry.nc_number,
            status    : ''
          }
        } else  {  // no job entry, job cannot return therefore remove
          check_jobs[index] = {
            job_token : feJobRegister.token_pull_map[index],
            nc_number : -1,
            status    : task_t.job_code.remove
          }
        }
      }

      checkRemoteJobs ( check_jobs,0 );

    },conf.getFEConfig().jobsPullPeriod);

  }

}

// ===========================================================================

var nc_check_handler = null;

function setNCCapacityChecks()  {
  if (!nc_check_handler)  {
    nc_check_handler = setInterval ( function(){
      let nc_servers = conf.getNCConfigs();
      for (let i=0;i<nc_servers.length;i++)
        if (nc_servers[i].in_use && (nc_servers[i].exeType!='CLIENT'))
          nc_servers[i].checkNCCapacity ( function(error,response,body,config){
            if ((!error) && (response.statusCode==200))  {
              nc_servers[i].capacity         = response.body.data.capacity;
              nc_servers[i].current_capacity = response.body.data.current_capacity;
            } else
              log.standard ( 15,'NC' + i + ' (' +  nc_servers[i].name + ') is dead' );
          });
    },conf.getFEConfig().capacity_check_interval);
  }
}

var last_number_cruncher = -1;

function printNCState ( nc_selected )  {
let nc_servers = conf.getNCConfigs();
  let s = '';
  for (let i=0;i<nc_servers.length;i++)  {
    let s1 = ' ';
    if ((i==nc_selected) && (i==last_number_cruncher))  s1 += '!';
    else if (i==last_number_cruncher)  s1 += '^';
    else if (i==nc_selected)  s1 += '*';
    else if (i>0)  s1 += ' ';
    if (!nc_servers[i].in_use)
      s1 += (i+1) + ':NIU';
    else if (nc_servers[i].exeType=='CLIENT')
      s1 += (i+1) + ':CLIENT';
    else {
      s1 += (i+1) + '[' + nc_servers[i].capacity + ']';
      let s2 = Math.round ( 100*(1-nc_servers[i].current_capacity/nc_servers[i].capacity) ) + '%';
      while (s2.length<4)  s2 += ' ';
      s1 += s2;
    }
    s += s1;
  }
  log.standard ( 14,'NC state:' + s );
}

function advance_last_number_cruncher ( nc_servers )  {
  let i = 0;
  do {
    i++;
    last_number_cruncher = (last_number_cruncher+1) % nc_servers.length;
  } while ((i<nc_servers.length) && 
           ((nc_servers[last_number_cruncher].exeType=='CLIENT') || 
            (!nc_servers[last_number_cruncher].in_use)));
}


function selectNC_by_order ( task )  {
let nc_servers = conf.getNCConfigs();
let nc_number  = -1;
let n          = last_number_cruncher;
let maxcap0    = Number.MIN_SAFE_INTEGER;
let n0         = -1;

  if ('nc_number' in task)  {  // developer's option
    // last_number_cruncher = task.nc_number;
    advance_last_number_cruncher ( nc_servers );
    return task.nc_number;
  }

  if (task.nc_type!='ordinary')
    return -1;  // this will not be used for client job, just make a valid return

  if (task.fasttrack)  { // request for fast track
    let maxcap1 = Number.MIN_SAFE_INTEGER;
    let n1      = -1;

    // first, look for servers dedicated to fast tracking, and choose first
    // free or the least busy one

    for (let i=0;(i<nc_servers.length) && (nc_number<0);i++)  {

      // n++;
      // if (n>=nc_servers.length)  n = 0;
      n = (n+1) % nc_servers.length;

      if (nc_servers[n].in_use  &&
           (nc_servers[n].exeType!='CLIENT')  &&
           (nc_servers[n].exclude_tasks.indexOf(task._type)<0)  &&
           ( (nc_servers[n].only_tasks.length<=0) ||
             (nc_servers[n].only_tasks.indexOf(task._type)>=0) ) )  {

        //  fasttrack==2 means a fast-track dedicated server
        if ((nc_servers[n].fasttrack==2) && (nc_servers[n].current_capacity>0))  {
          nc_number = n;
        } else if (nc_servers[n].fasttrack==1)  {
          if (nc_servers[n].current_capacity>maxcap0)  {
            if ((nc_servers[n].current_capacity>0) && (n!=last_number_cruncher))
                 maxcap0 = Number.MAX_SAFE_INTEGER;
            else maxcap0 = nc_servers[n].current_capacity;
            n0 = n;
          }
        }

        if (nc_servers[n].exeType=='SHELL')  {
          if (nc_servers[n].current_capacity>maxcap1)  {
            if ((nc_servers[n].current_capacity>0) && (n!=last_number_cruncher))
                 maxcap1 = Number.MAX_SAFE_INTEGER;
            else maxcap1 = nc_servers[n].current_capacity;
            n1 = n;
          }
        }

      }

    }

    if (nc_number<0)  {   // no dedicated fast track servers found
      if (maxcap0>0)
        nc_number = n0;     // take first free accepting fast track in principle
      else if (maxcap1>-2)
        nc_number = n1;     // take first free of SHELL type
    }

    if (nc_number>=0)  {
      // last_number_cruncher = nc_number;
      advance_last_number_cruncher ( nc_servers );
      return nc_number;
    }

    // if no suitable servers found, choose one as per a not fast-track request
    // below

  }

  // look for next free server, starting from the last used one (#n)
  for (let i=0;(i<nc_servers.length) && (nc_number<0);i++)  {
    // n++;  // this ensures that NCs are cycled, as initially n = last_number_cruncher
    // if (n>=nc_servers.length)  n = 0;  // wrap around
    n = (n+1) % nc_servers.length;
    if (nc_servers[n].in_use  &&
         (nc_servers[n].exeType!='CLIENT')  &&
         (nc_servers[n].exclude_tasks.indexOf(task._type)<0)  &&
         ( (nc_servers[n].only_tasks.length<=0) ||
           (nc_servers[n].only_tasks.indexOf(task._type)>=0) ) )  {
      if (nc_servers[n].current_capacity>0)  {
        nc_number = n;  // just take the first one with positive capacity
      } else if (nc_servers[n].current_capacity>maxcap0)  {
        // or choose one with least negative capacity
        maxcap0 = nc_servers[n].current_capacity;
        n0      = n;
      }
    }
  }

  if (nc_number<0)  // all NCs are busy with negative current capacity,
    nc_number = n0;  // choose the least busy one

  // if (nc_number>=0)  // make sure that NCs work on rota basis
  //   last_number_cruncher = nc_number;

  advance_last_number_cruncher ( nc_servers );

  return nc_number;

}


function selectNC_by_capacity ( task )  {
let nc_servers     = conf.getNCConfigs();
let ft_cores       = [];  // fast track cores
let cores          = [];  // general cores
let ft_maxCapacity = Number.MIN_SAFE_INTEGER;
let ft_nc_number0  = -1;  // NC with maximal capacity
let maxCapacity    = Number.MIN_SAFE_INTEGER;
let nc_number0     = -1;  // NC with maximal capacity

  if ('nc_number' in task)  {  // developer's option
    return task.nc_number;
  }

  // Unless this is commented out, XDS does not run as a auto-workflow on
  // local machine, when it runs on client NC
  // if (task.nc_type!='ordinary')
  //   return -1;  // this will not be used for client job, just make a valid return

  for (let n=0;n<nc_servers.length;n++)
    if (nc_servers[n].in_use  &&
          (nc_servers[n].exeType!='CLIENT')  &&
          (nc_servers[n].exclude_tasks.indexOf(task._type)<0)  &&
          ( (nc_servers[n].only_tasks.length<=0) ||
            (nc_servers[n].only_tasks.indexOf(task._type)>=0) ) )  {

      if ((nc_servers[n].fasttrack>0) && 
          (nc_servers[n].current_capacity>ft_maxCapacity))  {
        ft_maxCapacity = nc_servers[n].current_capacity;
        ft_nc_number0  = n;
      }

      if (nc_servers[n].fasttrack==2)  {
        //  fasttrack==2 means a fast-track dedicated server
        for (let i=0;i<nc_servers[n].current_capacity;i++)
          ft_cores.push ( n );
      } else  {
        if (nc_servers[n].current_capacity>maxCapacity)  {
          maxCapacity = nc_servers[n].current_capacity;
          nc_number0  = n;
        }
        for (let i=0;i<nc_servers[n].current_capacity;i++)  {
          if (nc_servers[n].fasttrack==1)
            cores.push ( n );
        }
      }
    }

  if (task.fasttrack)  {
    if (ft_cores.length<=0)  { 
      // request for fast track but no fast track cores are available
      if (ft_nc_number0>=0)  {
        // fast track is supposed to clear up promptly, so put the task on
        // a fast track NC with maximal residual capacity
        return ft_nc_number0;
      }
      // if we are here than fast track NC is not found at all;
      // put job on a regular NC further down below
    } else  {
      // free fast track cores are found, choose fast track NC randomly with 
      // respect to residual capacities
      return ft_cores [ Math.floor(Math.random()*ft_cores.length) ];
    }
  }

  if (nc_number0>=0)  {
    if (cores.length<=0)  {
      // all cores are busy, choose NC with maximal residual capacity
      return nc_number0;
    }
    // free cores are found, choose NC randomly with respect to residual capacities
    return cores [ Math.floor(Math.random()*cores.length) ];
  }

  // no NC was found for job
  return -1;

}


function ncGetInfo_remote ( server_request,server_response )  {
//  This function imitates NC behaviour for 'REMOTE' NC framework

  let ncInfo = {};
  ncInfo.config         = conf.getServerConfig();
  ncInfo.jobRegister    = {};
  ncInfo.jobRegister.launch_count = 0;
  ncInfo.jobRegister.job_map      = {};
  ncInfo.ccp4_version   = conf.CCP4Version();
  ncInfo.jscofe_version = cmd.appVersion();
  ncInfo.environ        = conf.environ_server;

  let response = new cmd.Response ( cmd.nc_retcode.ok,'',ncInfo );
  response.send ( server_response );

}


function selectNumberCruncher ( task )  {
  if (conf.getFEConfig().job_despatch=="opt_comm")
        return selectNC_by_order    ( task );
  else  return selectNC_by_capacity ( task );
}

function ncSelectAndCheck ( nc_counter,task,callback_func )  {
//  nc_counter == conf.getNumberOfNCs() at 1st call
  let nc_number = selectNumberCruncher ( task );
  if (nc_number>=0)  {
    let cfg = conf.getNCConfig ( nc_number );
    if (cfg)  {
      cfg.checkNCStatus ( function(error,response,body,config){
        if ((error=='not-in-use') && (nc_counter>0))  {
          ncSelectAndCheck ( nc_counter-1,task,callback_func );
        } else if ((!error) && (response.statusCode==200))  {
          printNCState ( nc_number );
          if (nc_number>=0)
            conf.getNCConfigs()[nc_number].current_capacity--;
          callback_func ( nc_number );
        } else  {
          // log.standard ( 1,'NC-' + nc_number + ' does not answer' );
          log.error    ( 3,'NC-' + nc_number + ' does not answer' );
          if (nc_counter>0)  {
            ncSelectAndCheck ( nc_counter-1,task,callback_func );
          } else  {
            // log.standard ( 2,'no response from number crunchers' );
            log.error    ( 4,'no response from number crunchers' );
            callback_func ( -102 );
          }
        }
      });
    } else  {
      // log.standard ( 3,'NC-' + nc_number + ' configuration cannot be obtained' );
      log.error    ( 5,'NC-' + nc_number + ' configuration cannot be obtained' );
      callback_func ( -101 );
    }
  } else  {
    log.standard ( 4,'all number crunchers refused to accept a job' );
    callback_func ( nc_number );
  }
}


// ===========================================================================

function _run_job ( loginData,task,job_token,ownerLoginData,shared_logins,
                    run_remotely, callback_func )  {

  console.log ( ' >>>>>> run_remotely = ' + run_remotely );

  ncSelectAndCheck ( conf.getNumberOfNCs(),task,function(nc_number){

    let jobDir      = prj.getJobDirPath  ( loginData,task.project,task.id );
    let jobDataPath = prj.getJobDataPath ( loginData,task.project,task.id );

    if (nc_number<0)  {

      let msg = '<h1>Task cannot be proccessed</h1>';

      if (nc_number==-101)  {
        msg += 'Configuration data cannot be obtained. This is internal '   +
               'server error, caused by misconfiguration or a bug. Please ' +
               'report to server maintainer.';
      } else if (nc_number==-102)  {
        msg += 'Computational server(s) cannot be reached. Please report '  +
               'to server maintainer.';
      } else  {
        msg += 'No computational server has agreed to accept the task. This may ' +
               'be due to the lack of available servers for given task type, or ' +
               'because of the high number of tasks queued. Please try submitting ' +
               'this task later on.';
      }

      utils.writeJobReportMessage ( jobDir,msg,false );
      task.state = task_t.job_code.failed;
      utils.writeObject ( jobDataPath,task );

      if (callback_func)
        callback_func ( 0 );

    } else  {

      utils.writeJobReportMessage ( jobDir,'<h1>Preparing ...</h1>',true );

      // prepare input data
      task.makeInputData ( loginData,jobDir );

      let nc_cfg = conf.getNCConfig(nc_number);
      let nc_url = nc_cfg.externalURL;
      let uData  = user.readUserData ( loginData );
      let meta   = {};
      meta.setup_id  = conf.getSetupID();
      meta.nc_name   = nc_cfg.name;
      meta.user_id   = loginData.login;
      meta.feedback  = ud.feedback_code.decline;
      meta.user_name = '';
      // results may be pushed back to FE or pulled by FE in case of remote NC 
      if (nc_cfg.exeType.toUpperCase()=='REMOTE')
            meta.push_back = 'NO';
      else  meta.push_back = 'YES';
      meta.email     = '';
      if (uData)  {
        meta.feedback = uData.feedback;
        if (uData.feedback==ud.feedback_code.agree2)  {
          meta.user_name = uData.name;
          meta.email     = uData.email;
        }
        // if (nc_cfg.exeType=='REMOTE')
        //   meta.cloudrun_id = uData.remote_cloudrun_id;
      }

      send_dir.sendDir ( jobDir,nc_url,nc_cfg.fsmount,cmd.nc_command.runJob,
                         meta,{compression:nc_cfg.compression},

        function ( retdata,stats ){  // send successful

          log.standard ( 6,'job ' + task.id + ' sent to ' +
                           conf.getNCConfig(nc_number).name + ', job token:' +
                           job_token );
          log.standard ( 6,'compression: '  + nc_cfg.compression +
                           ', zip time: '   + stats.zip_time.toFixed(3) +
                           's, send time: ' + stats.send_time.toFixed(3) + 
                           's, size: '      + stats.size.toFixed(3) + ' MB' );

          // The number cruncher will start dealing with the job automatically.
          // On FE end, register job as engaged for further communication with
          // NC and client.
          feJobRegister.addJob ( retdata.job_token,nc_number,ownerLoginData,
                                 task.project,task.id,shared_logins,
                                 uData.settings.notifications.end_of_job,
                                 meta.push_back );
          writeFEJobRegister();
          checkPullMap();

          if (callback_func)
            callback_func ( retdata.job_token );

        },function(stageNo,code){  // send failed

          log.standard ( 6,'sending job ' + task.id + ' to ' +
                           conf.getNCConfig(nc_number).name + ' FAILED, job token:' +
                           job_token );

          switch (stageNo)  {

            case 1: utils.writeJobReportMessage ( jobDir,
                    '<h1>[00002] Failed: data preparation error (' + code + ').</h1>',
                    false );
                  break;

            case 2: utils.writeJobReportMessage ( jobDir,
                    '<h1>[00003] Failed: data transmission errors.</h1>' +
                    '<p><i>Return: ' + code + '</i>',false );
                    log.error ( 6,'[00003] Cannot send data to NC at ' + nc_url + ' please try again' );
                    emailer.send ( conf.getEmailerConfig().maintainerEmail,
                      'Cannot send job to NC',
                      'Detected data transmision errors while communicating to NC at '  + nc_url +
                      '.\nPossible NC failure, please investigate.' );
                  break;

            default: utils.writeJobReportMessage ( jobDir,
                     '<h1>[00004] Failed: number cruncher errors, please try again.</h1>' +
                     '<p><i>Stage No.: ' + stageNo + '<br>Return: ' + code + '</i>',false );

          }

          task.state = task_t.job_code.failed;
          utils.writeObject ( jobDataPath,task );

          if (callback_func)
            callback_func ( 0 );

        });

    }

  });

}


function newJobToken()  {
  return 'fe-' + crypto.randomBytes(20).toString('hex');
}

function runJob ( loginData,data, callback_func )  {

  let rdata = {};  // response data structure

  let task = class_map.makeClass ( data.meta );
  if (!task)  {
    log.error ( 7,'Cannot make job class' );
    callback_func ( new cmd.Response(cmd.fe_retcode.corruptJobMeta,
                    '[00201] Corrupt job metadata',rdata) );
    return;
  }

  // modify user knowledge
  let userKnowledgePath = prj.getUserKnowledgePath ( loginData );
  let knowledge = {};
  if (utils.fileExists(userKnowledgePath))
    knowledge = utils.readObject ( userKnowledgePath );
  knlg.addWfKnowledgeByTypes ( knowledge,task._type,data.ancestors );
  if (!utils.writeObject(userKnowledgePath,knowledge))
    log.error ( 8,'Cannot write user knowledge at ' + userKnowledgePath );

  // run job

  let shared_logins  = {};
  let projectData    = prj.readProjectData ( loginData,task.project );
  let ownerLoginData = loginData;
  if (projectData)  {
    shared_logins = projectData.desc.share;
    if (projectData.desc.owner.login!=loginData.login)
      ownerLoginData = user.getUserLoginData ( projectData.desc.owner.login );
    if (task.autoRunId.length>0)
      projectData.desc.autorun = true;
    if ((Object.keys(shared_logins).length>0) || projectData.desc.autorun) // update the timestamp
      prj.writeProjectData ( loginData,projectData,true );
    rdata.timestamp = projectData.desc.timestamp;
  }

  let jobDir = prj.getJobDirPath ( loginData,task.project,task.id );
  if (!utils.dirExists(jobDir))  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.writeError,
                '[00005] Job directory does not exist (job deleted?).',rdata ) );
    return;
  }

  let jobDataPath = prj.getJobDataPath ( loginData,task.project,task.id );

  task.state      = task_t.job_code.running;
  let job_token   = newJobToken();
  if ((task.nc_type=='client') || task.nc_type.startsWith('browser'))
    task.job_dialog_data.job_token = job_token;
  task.start_time = Date.now();

  // force-write task data because it may have latest changes
  if (!utils.writeObject(jobDataPath,task,true))  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.writeError,
                              '[00005] Job metadata cannot be written.',rdata ) );
    return;
  }

//  utils.setLock ( jobDir,100 );  // to prevent deletion during data transmission

  if (task.nc_type=='client')  {
    // job for client NC, just pack the job directory and inform client

    log.standard ( 5,'sending job ' + task.id + ' to client service, token:' +
                     job_token );

    utils.writeJobReportMessage ( jobDir,'<h1>Preparing ...</h1>',true );

    // prepare input data
    task.makeInputData ( loginData,jobDir );

    // send_dir.packDir ( jobDir,'*',null,null, function(code,jobballSize){

    // this will pack into a file in temporary (fast) disk area; packing
    // directly into job directory causes an anfinished pack being part of
    // the final pack, which breaks olde client versions
    send_dir.packDir ( jobDir,null,
      function(code,packPath,packSize){
        if (!code)  {

          utils.writeJobReportMessage ( jobDir,'<h1>Running on client ...</h1>' +
                      'Job is running on client machine. Full report will ' +
                      'become available after job finishes.',true );

          // move pack back into job directory
          let jobballPath = send_dir.getPackPath(jobDir);
          utils.moveFile ( packPath,jobballPath );

          feJobRegister.addJob ( job_token,-1,ownerLoginData,  // -1 is nc number
                                task.project,task.id,shared_logins,
                                null,'YES' );  // no notifications for client jobs
          feJobRegister.getJobEntryByToken(job_token).nc_type = task.nc_type;
          writeFEJobRegister();

          rdata.job_token   = job_token;
          // rdata.jobballName = send_dir.jobballName;
          rdata.jobballName = path.basename(jobballPath);

          callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',rdata) );
          log.standard ( 11,'created jobball for client in ' + jobballPath + 
                            ', size=' + packSize );

        } else  {
          callback_func ( new cmd.Response(cmd.fe_retcode.jobballError,
                          '[00001] Jobball creation errors',rdata) );
        }
      });

    // NOTE: we do not count client jobs against user rations (quotas)

  } else if (task.nc_type.startsWith('browser'))  {
    // job for a web-application in browser, just prepare input data and inform client
  
    log.standard ( 5,'preparing job ' + task.id + ' for web-browser, token:' +
                      job_token );
  
    // utils.writeJobReportMessage ( jobDir,'<h1>Preparing ...</h1>',true );
  
    // prepare input data
    task.makeInputData ( loginData,jobDir );

    utils.writeJobReportMessage ( jobDir,'<h1>Running as web-app in browser ...</h1>' +
      'Job is running as web-application on client machine. Full report will ' +
      'become available after job finishes.',true );

    feJobRegister.addJob ( job_token,-1,ownerLoginData,  // -1 is nc number
                           task.project,task.id,shared_logins,
                           null,'YES' );  // no notifications for client jobs
    feJobRegister.getJobEntryByToken(job_token).nc_type = task.nc_type;
    writeFEJobRegister();

    rdata.job_token   = job_token;
    rdata.jobballName = send_dir.jobballName;

    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rdata ) );
    log.standard ( 12, 'prepared data for web-app, dir=' + jobDir );

    // NOTE: we do not count in-browser (web-app) jobs against user rations (quotas)
  
  } else  {
    // job for ordinary NC, pack and send all job directory to number cruncher

    _run_job ( loginData,task,job_token,ownerLoginData,shared_logins,
               data.run_remotely,  // remote/own NC comes from JobDialog
      function(jtoken){
        callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',rdata) );
      });

  }

}


function webappEndJob ( loginData,data, callback_func )  {

  let rdata = {};  // response data structure

  let task = class_map.makeClass ( data.meta );
  if (!task)  {
    log.error ( 9,'Cannot make job class' );
    callback_func ( new cmd.Response(cmd.fe_retcode.corruptJobMeta,
                    '[00201] Corrupt job metadata',rdata) );
    return;
  }

  // job for ordinary NC, pack and send all job directory to number cruncher

  let shared_logins  = {};
  let projectData    = prj.readProjectData ( loginData,task.project );
  let ownerLoginData = loginData;
  if (projectData)  {
    shared_logins = projectData.desc.share;
    if (projectData.desc.owner.login!=loginData.login)
      ownerLoginData = user.getUserLoginData ( projectData.desc.owner.login );
    if (task.autoRunId.length>0)
      projectData.desc.autorun = true;
    if ((Object.keys(shared_logins).length>0) || projectData.desc.autorun) // update the timestamp
      prj.writeProjectData ( loginData,projectData,true );
    rdata.timestamp = projectData.desc.timestamp;
  }

  let job_token = task.job_dialog_data.job_token;

  task.nc_type ='ordinary';

  _run_job ( loginData,task,job_token,ownerLoginData,shared_logins,
             false,  // webapps run only on own NCs
    function(jtoken){
      callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',rdata) );
    });

}


// ===========================================================================

function stopJob ( loginData,data )  {
// Request to stop a running job. 'data' must contain a 'meta' field, which
// must be the Task class of job to be terminated.

  let response = null;
  let task     = data.meta;
  let jobEntry = getEFJobEntry ( loginData,task.project,task.id );

  if (jobEntry)  {

    // send stop request to number cruncher
    let ncCfg  = conf.getNCConfig ( jobEntry.nc_number );
    if (ncCfg)  {
      let nc_url = ncCfg.externalURL;
      if (data.gracefully)
            log.standard ( 9,'request to stop job ' + task.id + ' at ' + nc_url +
                             ' gracefully' );
      else  log.standard ( 9,'request to stop job ' + task.id + ' at ' + nc_url );

      request({
          uri     : cmd.nc_command.stopJob,
          baseUrl : nc_url,
          method  : 'POST',
          body    : { job_token   : jobEntry.job_token,
                      gracefully  : data.gracefully,
                      return_data : true  // push job results back to FE
                    },
          json    : true,
          rejectUnauthorized : conf.getFEConfig().rejectUnauthorized
        },function(error,response,body){
          if ((!error) && (response.statusCode==200)) {
            log.standard ( 10,body.message );
          }
        }
      );

      response = new cmd.Response ( cmd.fe_retcode.ok,'',task );

    } else
      response = new cmd.Response ( cmd.fe_retcode.ok,
                                    '[00011] Number cruncher not found',task );

  } else  {  // repair job metadata

    let jobDir      = prj  .getJobDirPath    ( loginData,task.project,task.id );
    let jobDataPath = prj  .getJobDataPath   ( loginData,task.project,task.id );
    let code        = utils.getJobSignalCode ( jobDir      );
    let jobData     = utils.readObject       ( jobDataPath );

    log.standard ( 80,' **** REPAIR JOB METADATA'          );
    log.standard ( 80,'      jobDir      = ' + jobDir      );
    log.standard ( 80,'      jobDataPath = ' + jobDataPath );
    log.standard ( 80,'      code        = ' + code        );

    if (!jobData)
      jobData = task;

    if (!code)  jobData.state = task_t.job_code.finished;
          else  jobData.state = task_t.job_code.failed;

    utils.writeObject ( jobDataPath,jobData );

    response = new cmd.Response ( cmd.fe_retcode.ok,
                                  '[00037] Job was not running',jobData );

  }

  return response;

}


function killJob ( loginData,projectName,taskId )  {
// Request to stop a running job immediately and do not return data.

  let jobEntry = getEFJobEntry ( loginData,projectName,taskId );

  if (jobEntry)  {

    // send stop request to number cruncher
    let ncCfg  = conf.getNCConfig ( jobEntry.nc_number );
    if (ncCfg)  {

      let nc_url = ncCfg.externalURL;

      log.standard ( 91,'request to kill job ' + taskId + ' at ' + nc_url );

      request({
          uri     : cmd.nc_command.stopJob,
          baseUrl : nc_url,
          method  : 'POST',
          body    : { job_token   : jobEntry.job_token,
                      gracefully  : false,
                      return_data : false
                    },
          json    : true,
          rejectUnauthorized : conf.getFEConfig().rejectUnauthorized
        },function(error,response,body){
          if ((!error) && (response.statusCode==200)) {
            log.standard ( 101,body.message );
          }
        }
      );

      feJobRegister.removeJob ( jobEntry.job_token );
      writeFEJobRegister();

    }

  }

}


// ===========================================================================

const _day  = 86400000;
const _hour = 3600000;
const _min  = 60000;
const _sec  = 1000;

function writeJobStats ( jobEntry )  {

  let t  = Date.now();
  let dt = t - jobEntry.start_time;
  let dd = Math.trunc(dt/_day );   dt -= dd*_day;
  let dh = Math.trunc(dt/_hour);   dt -= dh*_hour;
  let dm = Math.trunc(dt/_min );   dt -= dm*_min;
  let ds = Math.trunc(dt/_sec );

  let jobDataPath = prj.getJobDataPath ( jobEntry.loginData,jobEntry.project,
                                         jobEntry.jobId );
  let jobClass    = utils.readClass    ( jobDataPath );

  if (jobClass)  {

    // note residual disk space (in MB)
    let jobDir = prj.getJobDirPath ( jobEntry.loginData,jobEntry.project,
                                     jobEntry.jobId );

    // make user ration bookkeeping

    // calculate the size of job directory as is on FE
    jobClass.disk_space = utils.getDirectorySize ( jobDir ) / 1024.0 / 1024.0;

    let report_task_fpath = path.join (
      prj.getJobReportDirPath(jobEntry.loginData,jobEntry.project,jobEntry.jobId),
      'task.tsk' 
    );
    let report_tsk = utils.readString ( report_task_fpath );
    if (report_tsk)  {
      let report_tsk_list = report_tsk.split(';;;');
      for (let i=0;i<report_tsk_list.length;i++)
        if (report_tsk_list[i].includes('<br>Started:')   &&
            report_tsk_list[i].includes('<br>Finished:')  &&
            report_tsk_list[i].includes('<br>CPU:'))
          report_tsk_list[i] = report_tsk_list[i].replace ( '</div>',
                ', Disk: ' + jobClass.disk_space.toFixed(2) + 'M</div>' );
      utils.writeString ( report_task_fpath,report_tsk_list.join(';;;') );
    }

    // update records in user's ration book
    // jobEntry.loginData corresponds to the project owner account
    let userRation = ration.bookJob ( jobEntry.loginData,jobClass,
                                      ('cloudrun' in jobEntry) );

    ration.updateProjectStats ( jobEntry.loginData,jobClass.project,
                                jobClass.cpu_time,jobClass.disk_space,1,false );

    let S     = '';
    let fpath = getJobStatPath(0);

    if ((Math.trunc(feJobRegister.n_jobs/20)*20==feJobRegister.n_jobs) ||
        (!utils.fileExists(fpath)))  {

      if (!('logflow' in feJobRegister))  {
        feJobRegister.logflow = {};
        feJobRegister.logflow.logno = 0;
        feJobRegister.logflow.njob0 = 0;
      }

      if (conf.getFEConfig().checkLogChunks(
          feJobRegister.n_jobs-feJobRegister.logflow.njob0,
          feJobRegister.logflow.logno))  {
        feJobRegister.logflow.logno++;
        feJobRegister.logflow.njob0 = feJobRegister.n_jobs;
        utils.moveFile ( fpath,getJobStatPath(feJobRegister.logflow.logno) );
      }

      S = '------------------------------------------------------------------' +
          '------------------------------------------------------------------' +
          '--------------------------------\n' +
          ' ###          Date Finished                   Date Started'  +
          '             DDD-HH:MM:SS NC#  State   User (jobs)        '  +
          '  Title\n' +
          '------------------------------------------------------------------' +
          '------------------------------------------------------------------' +
          '--------------------------------\n';
    }

    let wfId = jobClass.autoRunId;
    if (wfId)
      wfId = '[' + wfId + ']:';

    S += com_utils.padDigits ( feJobRegister.n_jobs+1,6 ) + ' ' +

         '['   + new Date(t).toUTCString() +
         '] [' + new Date(jobEntry.start_time).toUTCString() +
         '] '  +

         com_utils.padDigits ( dd,3 ) + '-' +
         com_utils.padDigits ( dh,2 ) + ':' +
         com_utils.padDigits ( dm,2 ) + '.' +
         com_utils.padDigits ( ds,2 ) + ' ' +

         com_utils.padDigits ( jobEntry.nc_number.toString(),3 ) + ' ' +
         com_utils.padStringRight ( jobClass.state,' ',-8 )      + ' ' +

         com_utils.padStringRight ( jobEntry.loginData.login +
                ' (' + userRation.jobs_total + ')',' ',20 ) +
                    ' ' + wfId + jobClass.title + '\n';

    utils.appendString ( fpath,S );

    jobClass.end_time = Date.now();

    if (jobClass.autoRunId)
      jobClass.job_dialog_data.panel = 'output';

    utils.writeObject ( jobDataPath,jobClass );

  } else  {

    log.error ( 12,'No job metadata found at path ' + jobDataPath );

  }

  return jobClass;

}

function readJobStats()  {
  let stats = utils.readString ( getJobStatPath(0) );
  if (!stats)
    stats = 'Job stats are not available.';
  return stats;
}


// ===========================================================================

function addJobAuto ( jobEntry,jobClass )  {
let loginData   = jobEntry.loginData;
let projectName = jobEntry.project;
let pJobDir     = prj.getJobDirPath ( loginData,projectName,jobEntry.jobId );
let auto_meta   = utils.readObject  ( path.join(pJobDir,'auto.meta') );

  if (auto_meta && (Object.keys(auto_meta).length))  { // empty meta can be used
                        // to stop the workflow from python layer. Note that
                        // just removing meta in python does not do the trick 
                        // because the file persists on FE and must be
                        // overwritten, rather than removed.

    // let projectData = prj.readProjectData ( loginData,projectName );
    let projectDesc = prj.readProjectDesc ( loginData,projectName );

    if (!projectDesc)  {
      log.error ( 13,'project data ' + projectName + ' not found, login ' +
                     loginData.login );
    } else  {

      if (!('_root' in auto_meta.context.job_register))
        auto_meta.context.job_register._root = jobEntry.jobId;

      let shared_logins  = projectDesc.share;
      let ownerLoginData = loginData;
      if (projectDesc.owner.login!=loginData.login)
        ownerLoginData = user.getUserLoginData ( projectDesc.owner.login );

      user.topupUserRation ( ownerLoginData,function(rdata){

        let check_list = ration.checkUserRation ( ownerLoginData,false );
        if (check_list.length<=0)  {
  
          let tasks = [];
          let projectData = prj.readProjectData ( loginData,projectName );
          // pd.printProjectTree ( ' >>>auto-1',projectData );
  
          for (let key in auto_meta)
            if (key!='context')  {
  
              let task = class_map.makeTaskClass ( auto_meta[key]._type );
  
              if (!task)  {
                log.error ( 14,'wrong task class name ' + auto_meta[key]._type );
              } else  {
  
                // place job tree node
  
                let pid = jobEntry.jobId;
                if (auto_meta[key].parentName in auto_meta.context.job_register)
                  pid = auto_meta.context.job_register[auto_meta[key].parentName];
  
                let pnode = pd.getProjectNode ( projectData,pid );
                if (!pnode)  {
                  log.error ( 15,'cannot get project node in workflow [' + loginData.login +
                                 ']:' + projectName + ':' + pid );
                  log.error ( 15,'jobEntry=\n' + JSON.stringify(jobEntry) );
                  log.error ( 15,'key=\n' + key );
                  log.error ( 15,'auto_meta[key]=\n' + JSON.stringify(auto_meta[key]) );
                  log.error ( 15,'projectData=\n' + JSON.stringify(projectData) );
                  pd.printProjectTree ( ' >>>auto-2',projectData );
                  pd.printProjectTree ( ' >>>auto-3',prj.readProjectData ( loginData,projectName ) );
                } else  {

                  // make job directory
  
                  let mjd = prj.make_job_directory ( loginData,projectName,projectData.desc.jobCount+1 );

                  if (mjd[0]<0)  {
                    // job directory cannot be created because if errors
                    log.error ( 16,'cannot create job directory in workflow at ' + mjd[1] );
                  } else  {

                    // form task
    
                    task.project              = projectName;
                    task.id                   = mjd[2];
                    projectData.desc.jobCount = mjd[2];
                    task.autoRunName          = key;
                    // task.harvestedTaskIds = dataBox.harvestedTaskIds;
                    task.autoRunId            = jobClass.autoRunId;
                    if (task.autoRunName.startsWith('@'))  {
                      task.script         = jobClass.script;
                      task.script_pointer = jobClass.script_end_pointer;
                    }
                    task.submitter            = loginData.login;
                    task.input_data.data      = auto_meta[key].data;
                    task.start_time           = Date.now();
    
                    for (let field in auto_meta[key].fields)
                      task[field] = auto_meta[key].fields[field];
    
                    task._clone_suggested ( task.parameters,auto_meta[key].parameters );
                    tasks.push ( [task,mjd[1]] );
    
                    let pnode_json = JSON.stringify ( pnode );
    
                    let cnode = JSON.parse ( pnode_json );
                    cnode.id       = pnode.id + '_' + key;
                    cnode.parentId = pnode.id;
                    cnode.dataId   = task.id;
                    cnode.icon     = cmd.image_path ( task.icon() );
                    // cnode.text     = '<b>' + task.autoRunId + ':</b>[' +
                    //                  com_utils.padDigits(task.id,4) + '] ' + task.name;
                    cnode.text     = prj.makeNodeName ( task,task.name );
                    cnode.text0    = cnode.text;
                    cnode.state.selected = false;
                    cnode.children = [];
                    pnode.children.push ( cnode );
    
                    auto_meta.context.job_register[key] = task.id;
    
      // console.log ( ' >>>>> jobEntry.jobId = ' + jobEntry.jobId );
      // console.log ( ' >>>>> pid            = ' + pid );
      // console.log ( ' >>>>> parentName     = ' + auto_meta[key].parentName );
      // console.log ( ' >>>>> pnode.dataId   = ' + pnode.dataId );
      // console.log ( ' >>>>> pnode.text     = ' + pnode.text   );
      // console.log ( ' >>>>> task.id        = ' + task.id );
      // console.log ( ' >>>>> cnode.text     = ' + cnode.text   );
      // console.log ( ' >>>>> jobCount       = ' + projectData.desc.jobCount );

                  }
  
                }
  
              }
            }
  
          prj.writeProjectData ( loginData,projectData,true );
    // pd.printProjectTree ( ' >>>auto-2',projectData );
  
          for (let i=0;i<tasks.length;i++)  {
  
            let task       = tasks[i][0];
            let jobDirPath = tasks[i][1];
    
            // handle remarks and other pseudo-jobs here
            let task_state = task.state;
            if (task_state==task_t.job_code.new)  {
              task.state = task_t.job_code.running;
              task.job_dialog_data.panel = 'output';
            }

            let jobDataPath = prj.getJobDataPath ( loginData,projectName,task.id );

            if (!utils.writeObject(jobDataPath,task))  {
              log.error ( 17,'cannot write job metadata at ' + jobDataPath );
            } else if (task_state==task_t.job_code.new)  {

              auto_meta.context.custom.excludedTasks = conf.getFEConfig().exclude_tasks;
              utils.writeObject ( path.join(jobDirPath,"auto.context"),auto_meta.context );

              // create report directory
              utils.mkDir_anchor ( prj.getJobReportDirPath(loginData,projectName,task.id) );
              // create input directory (used only for sending data to NC)
              utils.mkDir_anchor ( prj.getJobInputDirPath(loginData,projectName,task.id) );
              // create output directory (used for hosting output data)
              utils.mkDir_anchor ( prj.getJobOutputDirPath(loginData,projectName,task.id) );
              // write out the self-updating html starting page, which will last
              // only until it gets replaced by real report's bootstrap
              utils.writeJobReportMessage ( jobDirPath,'<h1>Idle</h1>',true );

              // Run the job
              let job_token = newJobToken();

              _run_job ( loginData,task,job_token,ownerLoginData,shared_logins,
                         false, // temporary workflows run only on own NCs
                         function(jtoken){} );

            }
    
          }
  
        } else  {
          log.standard ( 30,'Workflow stopped because of quota(s): ' + 
                            check_list.join(', ') + ', login ' + 
                            ownerLoginData.login );
        }
  
      });

    }

  }

}


// ===========================================================================

function _place_job_results ( job_token,code,errs,meta,server_response )  {

  let jobEntry = feJobRegister.getJobEntryByToken ( job_token );

  if (jobEntry.nc_number>=0)  {
    let nc_servers = conf.getNCConfigs();
    if (jobEntry.nc_number>=nc_servers.length)  {
      log.error ( 18,'wrong NC number (' + jobEntry.nc_number + ')' );
    } else  {
      if ('current_capacity' in meta)  {
        nc_servers[jobEntry.nc_number].capacity         = meta.capacity;
        nc_servers[jobEntry.nc_number].current_capacity = meta.current_capacity;
        log.standard ( 19,'NC' + jobEntry.nc_number + ' current capacity ' + 
                          meta.current_capacity + ' / ' +
                          meta.capacity );
      } else if ('capacity' in meta)  {
        nc_servers[jobEntry.nc_number].current_capacity = meta.capacity;
        log.standard ( 19,'NC' + jobEntry.nc_number + ' capacity=' + meta.capacity );
      }
    }
  }

  if (!code)  {  // success
    // print usage stats and update the user ration state

    let jobClass = writeJobStats ( jobEntry );
    if (jobClass)  {
      if (jobClass.autoRunId && jobClass.isSuccessful())
        addJobAuto ( jobEntry,jobClass );
      ustats.registerJob ( jobClass );
      let nhours = (jobClass.end_time-jobEntry.start_time)/3600000.0;
      if (jobEntry.eoj_notification &&
          jobEntry.eoj_notification.send &&
          (nhours>jobEntry.eoj_notification.lapse))  {
        let uData = user.readUserData ( jobEntry.loginData );
        emailer.sendTemplateMessage ( uData,
          cmd.appName() + ' Job Finished',
          'job_finished',{
            'job_id'     : jobEntry.jobId,
            'project_id' : jobEntry.project,
            'job_title'  : jobClass.title,
            'job_time'   : nhours
          });
      }
    }

    if ('tokens' in meta)
      feJobRegister.cleanup ( job_token,meta.tokens.split(',') );
    // if (('capacity' in meta) && (jobEntry.nc_number>=0))  {
    //   let nc_servers = conf.getNCConfigs();
    //   if (jobEntry.nc_number<nc_servers.length)  {
    //     nc_servers[jobEntry.nc_number].current_capacity = meta.capacity;
    //     log.standard ( 19,'NC' + jobEntry.nc_number + ' capacity=' + meta.capacity );
    //   } else
    //     log.error ( 19,'wrong NC number (' + jobEntry.nc_number + ') capacity=' + 
    //                    meta.capacity );
    // }
    feJobRegister.removeJob ( job_token );
    feJobRegister.n_jobs++;
    writeFEJobRegister();

    if (server_response)  // does not exist for 'REMOTE' NC
      cmd.sendResponse ( server_response, cmd.nc_retcode.ok,'','' );

  // error codes are handled by 'REMOTE' NC separately
  } else if (code=='err_rename')  { // file renaming errors
    log.error ( 20,'cannot accept job from NC due to file rename errors' );
    cmd.sendResponse ( server_response, cmd.nc_retcode.fileErrors,
                      '[00012] File rename errors' );
  } else if (code=='err_dirnotexist')  { // work directory deleted
    log.error ( 21,'cannot accept job from NC as job directory does not ' +
                   'exist' );
    cmd.sendResponse ( server_response, cmd.nc_retcode.fileErrors,
                      '[00013] Recepient directory does not exist ' +
                      '(job deleted?)' );
  } else if (code=='err_transmission')  {  // data transmission errors
    log.error ( 22,'cannot accept job from NC due to transmission errors: ' +
                   errs );
    cmd.sendResponse ( server_response, cmd.nc_retcode.uploadErrors,
                      '[00014] Data transmission errors: ' + errs );
  } else if (code=='data_unpacking_errors')  {  // data unpacking errors
    log.error ( 23,'cannot accept job from NC due to unpacking errors: ' +
                   errs );
    cmd.sendResponse ( server_response, cmd.nc_retcode.uploadErrors,
                      '[00015] Data unpack errors: ' + errs );
  } else  {
    log.error ( 24,'cannot accept job from NC due to unspecified unpacking ' +
                   'errors' );
    cmd.sendResponse ( server_response, cmd.nc_retcode.unpackErrors,
                      '[00016] Unspecified unpacking errors' );
  }

}

function getJobResults ( job_token,server_request,server_response )  {

  let jobEntry = feJobRegister.getJobEntryByToken ( job_token );

  if (jobEntry)  {

    let jobDir = prj.getJobDirPath ( jobEntry.loginData,jobEntry.project,
                                     jobEntry.jobId );

    send_dir.receiveDir ( jobDir,server_request,
      function(code,errs,meta){
        _place_job_results ( job_token,code,errs,meta,server_response );
      });

  } else  { // job token not recognised, return Ok
    log.error ( 25,'cannot accept job from NC because job token is not recognised' );
    log.error ( 25,'job token: [' + JSON.stringify(job_token) + ']' );
    cmd.sendResponse ( server_response, cmd.fe_retcode.wrongJobToken,'','' );
  }

}


// ===========================================================================

function checkJobs ( loginData,data )  {

  let projectName = data.project;
  let run_map     = data.run_map;

  let completed_map = {};
  let empty = true;

  for (let key in run_map)  {
    let jobDataPath = prj.getJobDataPath ( loginData,projectName,key );
    let jobData     = utils.readObject   ( jobDataPath );
    if (jobData)  {
      if ((jobData.state!=task_t.job_code.running) &&
          (jobData.state!=task_t.job_code.ending)  &&
          (jobData.state!=task_t.job_code.exiting))  {
        completed_map[key] = jobData;
        empty = false;
      }
    }
  }

  let rdata = {};
  rdata.completed_map = completed_map;
  rdata.reload        = 0;

  if ((!empty) || data.shared)  {
    let pDesc = prj.readProjectDesc ( loginData,projectName );
    if (pDesc)  {
      rdata.pdesc = pDesc;
      if ((data.shared) && (pDesc.timestamp>data.timestamp))  {
        rdata.reload = 1;  // on-client data should be safe
        // if (pDesc.project_version>data.project_version)
        //       rdata.reload = 2;  // project changed considerably, reload client
        // else  rdata.reload = 1;  // on-client data should be safe
      }
      if (((!empty) && (pDesc.owner.login==loginData.login)) || (rdata.reload>0))  {
        // save on reading files if nothing changes
        rdata.ration = ration.getUserRation(loginData).clearJobs();
      }
//console.log ( ' >>>>>>>> ' + loginData.login + '    ' +
//                             pDesc.timestamp + ' : ' + data.timestamp + ' -- ' +
//                             rdata.reload );
    }
  }

  return  new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

}


function wakeZombieJobs ( loginData,data,callback_func )  {
let nc_servers = conf.getNCConfigs();

  let projectName = data.project;
  let tokens = [];
  if (projectName=='*')  {
    tokens = ['*'];
  } else  {
    for (let token in feJobRegister.job_map)  {
      let jobEntry = feJobRegister.job_map[token];
      // here to check for job expiration date (to be defined for FE)
      if ((jobEntry.loginData.login==loginData.login) &&
          (jobEntry.project==projectName) &&
          (jobEntry.push_back=='YES'))
        tokens.push ( token );
    }
  }

  // we send all tokens to all ordinary (non-client NCs, because their
  // numeration can change if cloud was reconfigured after job was run;
  // zombi jobs on client NCs are awakened directly from browsers

  // console.log ( ' >>>> tokend = ' + JSON.stringify(tokens) );

  if (tokens.length>0)  {

    let nzombies = 0;

    function nc_wake_zombie ( n )  {

      if (n>=nc_servers.length)  {

        log.standard ( 17,nzombies + ' zombies awaken on request' );
        callback_func ( new cmd.Response(cmd.fe_retcode.ok,
                        '',{nzombies:nzombies}) );
      
      } else if ((nc_servers[n].exeType!='CLIENT') && nc_servers[n].in_use)  {
      
        request ({
          uri     : cmd.nc_command.wakeZombieJobs,
          baseUrl : nc_servers[n].externalURL,
          method  : 'POST',
          body    : {job_tokens:tokens},
          json    : true,
          rejectUnauthorized : conf.getFEConfig().rejectUnauthorized
        },function(error,response,body){
          // console.log ( ' >>> NC#' + n + ' responded ' + JSON.stringify(response) );
          // console.log ( ' >>> NC#' + n + ' responded with ' + response.body.data.nzombies + ' zombies' );
          if (error)
            log.error ( 26,'errors communicating with NC' + n + ': ' + error );
          else  {
            try {
              nzombies += response.body.data.nzombies;
            } catch (e)  {
              log.error ( 27,'corrupt response on waking zombies: ' + JSON.stringify(response) );
            }
          }
          nc_wake_zombie ( n+1 );
        });
      
      } else
        nc_wake_zombie ( n+1 );
    
    }

    nc_wake_zombie ( 0 );

  } else  {
    callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',{nzombies:0}) );
  }

  // return  new cmd.Response ( cmd.fe_retcode.ok,'',{} );

}


// ===========================================================================

function cloudRun ( server_request,server_response )  {
// This function receives data from js-utils/cloudrun.js script, and runs the
// requested job. New project is created if necessary.

  // Check if cloudRun was run so quickly after CCP4 Cloud started that
  // server environment is not yet calculated. This is important if data 
  // contains custom workflow script that checks on task availability.

  if (conf.environ_server.length<=0)  {
    // asynchronous but should be very quick comparing with receiving directory
    // below :(
    conf.getServerEnvironment(function(environ_server){}); 
  }

  // 1. Receive data and metadata

  // let tmpDir    = conf.getTmpFileName();
  let tmpJobDir = conf.getTmpFileName();

  // if ((!utils.mkDir(tmpDir)) || (!utils.mkDir(tmpJobDir)))  {
  if (!utils.mkDir(tmpJobDir))  {
    log.error ( 28,'cannot make temporary directory for cloud run' );
    // utils.removePath ( tmpDir    );
    utils.removePathAsync ( tmpJobDir );
    cmd.sendResponse ( server_response, cmd.fe_retcode.mkDirError,
                      'cannot make temporary directory to receive files','' );
    return;
  }

  // send_dir.receiveDir ( tmpJobDir,tmpDir,server_request,
  send_dir.receiveDir ( tmpJobDir,server_request,
    function(code,errs,meta){

      let response = null;
      let message  = '';

      // remove temporary directory
      // utils.removePath ( tmpDir );

      if (code)  {
        // upload errors, directory with data was not received
        log.error ( 29,'receive directory errors: code=' + code + '; desc=' + errs );
        response = new cmd.Response ( cmd.fe_retcode.uploadErrors,
                                      'errors: code='+code+'; desc='+errs,{} );
      } else  {

        // directory with data in 'uploads' subdirectory received safely
        //   meta.user        - user login
        //   meta.cloudrun_id - user login
        //   meta.project     - project Id
        //   meta.title       - project title (for new projects)
        //   meta.task        - task code

        // 2. Check that user exists and make loginData structure

        let localSetup = conf.isLocalSetup();
        if (localSetup>0)
          meta.user = ud.__local_user_id;
        let loginData = { login : meta.user, volume : null };

        let uData = user.readUserData ( loginData );
        if (!uData)  {

          log.standard ( 60,'cloudrun request for unknown user (' + meta.user +
                            ') -- ignored' );
          response = new cmd.Response ( cmd.fe_retcode.wrongLogin,'unknown user',{} );

        } else if ((!localSetup) && (uData.cloudrun_id!=meta.cloudrun_id))  {

          log.standard ( 61,'cloudrun request with wrong cloudrun_id (user ' +
                            meta.user + ') -- ignored' );
          response = new cmd.Response ( cmd.fe_retcode.wrongLogin,'wrong CloudRun Id',{} );

        } else  {

          loginData.volume = uData.volume;

          user.topupUserRation ( loginData,function(rdata){

            let check_list = ration.checkUserRation ( loginData,true );
            if (check_list.length>0)  {

              log.standard ( 62,'cloudrun rejected for user (' + meta.user + '): ' +
                                check_list.join(', ') );
              response = new cmd.Response ( cmd.fe_retcode.errors,
                'cloudrun rejected: ' + check_list.join(', ') + ' quota is up',{} );

            } else  {

              // 3. Check project Id and make new project if necessary

              let pData = prj.readProjectData ( loginData,meta.project );
              if (!pData)  {
                let pDesc = new pd.ProjectDesc();
                pDesc.init ( meta.project,meta.title,com_utils.getDateString() );
                if (('folder' in meta) && meta.folder)  {
                  if (meta.folder.startsWith('/'))
                        pDesc.folderPath = meta.folder.slice(1);
                  else  pDesc.folderPath = 'My Projects/' + meta.folder;
                }
                response = prj.makeNewProject ( loginData,pDesc );
                if (response.status==cmd.fe_retcode.ok)  {
                  pData = prj.readProjectData ( loginData,meta.project );
                  if (!pData)  {
                    log.error ( 30,'error creating new project for cloudRun: login ' +
                                  loginData.login );
                    response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                                                  'error creating new project',{} );
                  } else  {
                    response = null;
                    message  = 'project "' + meta.project + '" created, ';
                    pData.tree.push({
                      id          : 'treenode_06062',  // can be any
                      parentId    : null,
                      folderId    : null,
                      fchildren   : [],
                      text        : '<b>[' + meta.project + ']</b> <i>' + meta.title + '</i>',
                      text0       : '',
                      highlightId : 0,
                      icon        : cmd.image_path('project'),
                      data : {
                        customIcon : cmd.activityIcon(),
                        ci_width   : '22px',
                        ci_height  : '22px',
                        ci_state   : 'hidden'
                      },
                      state : {
                        opened     : true,
                        disabled   : false,
                        selected   : false
                      },
                      children : [],
                      li_attr  : {},
                      a_attr   : {},
                      dataId   : ''
                    });
                  }
                }
              }

              if (pData)  {

                // 4. The project is either created or retrieved. Prepare task and run it

                let task = utils.readClass ( path.join(tmpJobDir,task_t.jobDataFName) );
                if (!task)  {
                  log.error ( 31,'error reading task meta in cloudRun: login ' +
                                 loginData.login + ', project ' + meta.project );
                  response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                                                'error creating new project',{} );
                } else  {

                  // 5. Prepare task object

                  // make job directory just to fix the task id
  
                  let mjd = prj.make_job_directory ( loginData,meta.project,pData.desc.jobCount+1 );

                  if (mjd[0]<0)  {
                    // job directory cannot be created because if errors
                    log.error ( 32,'cannot create job directory in workflow at ' + mjd[1] );
                    response = new cmd.Response ( cmd.fe_retcode.errors,
                        'cloudRun rejected because job directory could not be created.',{} );
                  } else  {

                    task.project        = meta.project;
                    task.id             = mjd[2];
                    pData.desc.jobCount = mjd[2];
                    task.submitter      = loginData.login;
                    task.start_time     = Date.now();
                    if (!task.autoRunId)
                      task.autoRunId = 'cloudrun';
                    task.state          = task_t.job_code.running;
                    task.job_dialog_data.panel = 'output';
                    prj.writeProjectData ( loginData,pData,true );  // fix job count promptly

                    let jobDirPath = mjd[1];
                    // utils.moveDir ( tmpJobDir,jobDirPath,true );
                    // let tempJobDir = tmpJobDir;
                    // tmpJobDir      = null;  // essential

                    utils.moveDirAsync ( tmpJobDir,jobDirPath,true,function(err){

                      if (err)  {
                        response = new cmd.Response ( cmd.fe_retcode.ok,
                              'cloudRun task failed because of error in moving ' +
                              'data from temporary area after upload.',{} );
                      } else  {

                        let jobDataPath = prj.getJobDataPath ( loginData,meta.project,task.id );

                        if (!utils.writeObject(jobDataPath,task))  {
                          log.error ( 33,'cannot write job metadata at ' + jobDataPath );
                          utils.removePathAsync ( jobDirPath );
                          response = new cmd.Response ( cmd.fe_retcode.ok,
                                'cloudRun task failed because of error in writing ' +
                                'job metadata area after upload.',{} );
                        } else  {

                          // 6. Shape job getDirectory

                          // create report directory
                          utils.mkDir_anchor ( prj.getJobReportDirPath(loginData,meta.project,task.id) );
                          // create input directory (used only for sending data to NC)
                          utils.mkDir_anchor ( prj.getJobInputDirPath(loginData,meta.project,task.id) );
                          // create output directory (used for hosting output data)
                          utils.mkDir_anchor ( prj.getJobOutputDirPath(loginData,meta.project,task.id) );
                          // write out the self-updating html starting page, which will last
                          // only until it gets replaced by real report's bootstrap
                          utils.writeJobReportMessage ( jobDirPath,'<h1>Idle</h1>',true );

                          // 7. Make project tree node

                          let pnode = pData.tree[0];
                          let pnode_json = JSON.stringify ( pnode );

                          let cnode = JSON.parse ( pnode_json );
                          cnode.id       = pnode.id + '_' + newJobToken(); //key;
                          cnode.parentId = pnode.id;
                          cnode.dataId   = task.id;
                          cnode.icon     = cmd.image_path ( task.icon() );

                          // cnode.text     = '[' + com_utils.padDigits(task.id,4) + '] ' + task.name;
                          cnode.text     = prj.makeNodeName ( task,task.name );
                          cnode.text0    = cnode.text;
                          cnode.children = [];
                          pnode.children.push ( cnode );

                          prj.writeProjectData ( loginData,pData,true );

                          // Run the job
                          let job_token = newJobToken();
                          log.standard ( 6,'cloudrun job ' + task.id + ' formed, login:' +
                                           loginData.login + ', token:' + job_token );
                          _run_job ( loginData,task,job_token,loginData,[],
                                     false, // temoporary cloudrun runs only on own NCs
                                     function(jtoken){
                            let jobEntry = feJobRegister.getJobEntryByToken ( jtoken );
                            if (jobEntry)  {
                              jobEntry.cloudrun = true;
                              // we do not save job register here, which is a small sin
                              // (may lead only to miscalculation of cloudrun quota for)
                              // the user), but one disk write less :)
                            }

                            response = new cmd.Response ( cmd.fe_retcode.ok,
                                message + 'files uploaded, ' + meta.task + ' started',{} );
      
                            response.send ( server_response );

                            if (meta.load_project.toLowerCase()=='yes')
                                  user.signalUser ( loginData.login,'cloudrun_switch_to_project:'   + meta.project );
                            else  user.signalUser ( loginData.login,'cloudrun_reload_project_list:' + meta.project );

                          });  // end of job run callback

                        }

                      }

                      if (response)  {
                        utils.removePathAsync ( jobDirPath );
                        response.send ( server_response );
                      }

                    });  // end of temporary directory moving callback

                  }

                }

              }

            }

            if (response)  {
              //  cloudRun did not start, clean up and respond
              utils.removePathAsync ( tmpJobDir );
              response.send ( server_response );
            }

          });  // end of topup user ration callback

        }

      }

      if (response)  {
        //  cloudRun did not start, clean up and respond
        utils.removePathAsync ( tmpJobDir );
        response.send ( server_response );
      }

    });  // end of upload (task data receive) callback

}


function cloudFetch ( server_request,server_response )  {

  utils.receiveRequest ( server_request,function(errs,meta){

    let fetch_tmp_dir = path.join ( conf.getFETmpDir(),
                      'cloudfetch_' + crypto.randomBytes(20).toString('hex') );
    utils.removePath ( fetch_tmp_dir );
    utils.mkDir ( fetch_tmp_dir );
    let fetch_dir = path.join ( fetch_tmp_dir,'cloudfetch' );
    utils.mkDir ( fetch_dir );

    let not_completed = [];
    let not_found     = [];
    let ncopied       = 0;

    function pack_and_send ( message )  {

      let S = message;
      
      if (!message) {

        S = 'Status: ';
        if ((not_completed.length==0) && (not_found.length==0) && (ncopied>0))
          S += '0 (Ok)';
        else if (not_completed.length>0)
          S += '1 (job(s) unfinished)';
        else if (not_found.length>0)
          S += '2 (lost jobs - bugs or malfunction)';
        else if (ncopied==0)
          S += '3 (no jobs selected)';
        
        S += '\nJobs delivered: ' + ncopied;

        if (not_completed.length>0)
          S += '\nSelected job(s) (' + not_completed.join(', ') +
              ') are still running and cannot be fetched';
        if (not_found.length>0)
            S += '\nSelected job(s) (' + not_found.join(', ') +
                ') are not found; this is a bug or server malfunction; ' +
                'please report';
      }

      utils.writeString ( path.join(fetch_dir,'delivery.log'),S );

      send_dir.packDir ( fetch_tmp_dir,{
        compression : 9,
        destination : fetch_tmp_dir + '.zip'
      },function(code,packFile,packSize ){
        // packed, send the archive back to client now

        // Set headers for file download
        server_response.writeHead ( 200, {
          'Content-Type'        : 'application/octet-stream',
          'Content-Disposition' : 'attachment; filename="cloudfetch.zip"'
        });

        // Stream the file to the client
        const fileStream = fs.createReadStream ( packFile );
        fileStream.pipe ( server_response );

        fileStream.on('end', () => {
          // Clean up temporary file
          utils.removePathAsync ( fetch_tmp_dir );
          utils.removeFile      ( packFile );
        });

        fileStream.on('error', ( streamErr ) => {
          log.error ( 70,'Error streaming file: ' + streamErr );
          server_response.writeHead(500, { 'Content-Type': 'text/plain' });
          server_response.end ( 'Error streaming file ' + streamErr );
          // utils.removePathAsync ( fetch_tmp_dir );
          // utils.removeFile      ( packFile );
        });

      });
      
    }

    if (!errs)  {

      let localSetup = conf.isLocalSetup();
      if (localSetup>0)
        meta.user = ud.__local_user_id;
      let loginData = { login : meta.user, volume : null };

      let uData = user.readUserData ( loginData );
      if (!uData)  {

        log.standard ( 70,'cloudrun request for unknown user (' + meta.user +
                          ') -- ignored' );
        pack_and_send ( 'Errors: unknown user' );

      } else if ((!localSetup) && (uData.cloudrun_id!=meta.cloudrun_id))  {

        log.standard ( 71,'cloudrun request with wrong cloudrun_id (user ' +
                          meta.user + ') -- ignored' );
        pack_and_send ( 'Errors: wrong CloudRun Id' );

      } else  {

        loginData.volume = uData.volume;

        let projectName  = meta.project;

        meta.jobs = JSON.parse ( meta.jobs );

        if (meta.jobs.length<=0)  {
          let jmetas = prj.getJobMetas ( loginData,projectName );
          let metas  = [];
          for (let i=0;i<jmetas.length;i++)
            metas.push ( jmetas[i].meta );
          utils.writeObject ( path.join(fetch_dir,'index.json'),metas );
          pack_and_send ( 'Index return' );
          return;
        }

        function prepare_pack_and_send ( n )  {

          if (n>=meta.jobs.length)  {
 
            pack_and_send ( null );
 
          } else  {
            // prepare next job for packing

            let jobDataPath = prj.getJobDataPath ( loginData,projectName,meta.jobs[n] );
            let jobData     = utils.readObject   ( jobDataPath );
            if (jobData)  {
              jobData = class_map.makeClass ( jobData );
              if (jobData.isComplete())  {
                // job is completed and may be fetched
                let dirpath  = prj.getJobDirPath ( loginData,projectName,meta.jobs[n] );
                let new_path = path.join(fetch_dir,path.basename(dirpath)); 
                utils.copyDirAsync ( dirpath,new_path,true,
                                      function(){ 
                  ncopied++;  // just a count
                  prepare_pack_and_send ( n+1 );
                });
              } else  {
                not_completed.push ( meta.jobs[n] );
                prepare_pack_and_send ( n+1 );
              }
            } else  {
              not_found.push ( meta.jobs[n] );
              prepare_pack_and_send ( n+1 );
            }

          }

        }

        prepare_pack_and_send ( 0 );

      }

    } else
      pack_and_send ( 'Errors: ' + errs );
  
  });

}


// ==========================================================================
// export for use in node
module.exports.readFEJobRegister   = readFEJobRegister;
module.exports.writeFEJobRegister  = writeFEJobRegister;
module.exports.cleanFEJobRegister  = cleanFEJobRegister;
module.exports.getEFJobEntry       = getEFJobEntry;
module.exports.setNCCapacityChecks = setNCCapacityChecks;
module.exports.ncGetInfo_remote    = ncGetInfo_remote;
module.exports.runJob              = runJob;
module.exports.readJobStats        = readJobStats;
module.exports.stopJob             = stopJob;
module.exports.killJob             = killJob;
module.exports.webappEndJob        = webappEndJob;
module.exports.getJobResults       = getJobResults;
module.exports.checkJobs           = checkJobs;
module.exports.wakeZombieJobs      = wakeZombieJobs;
module.exports.cloudRun            = cloudRun;
module.exports.cloudFetch          = cloudFetch;
