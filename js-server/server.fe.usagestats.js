
/*
 *  =================================================================
 *
 *    11.11.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const fs        = require('fs-extra');
const path      = require('path');
// const child_process = require('child_process');

//  load application modules
const cmd     = require('../js-common/common.commands');
const cutils  = require('../js-common/common.utils');
const conf    = require('./server.configuration');
const anl     = require('./server.fe.analytics');
const user    = require('./server.fe.user');
const emailer = require('./server.emailer');
const utils   = require('./server.utils');
const prj     = require('./server.fe.projects');
const ration  = require('./server.fe.ration');
const pd      = require('../js-common/common.data_project');
const task_t  = require('../js-common/tasks/common.tasks.template');
const ud      = require('../js-common/common.data_user');

//  prepare log
const log = require('./server.log').newLog(20);


// ===========================================================================

const statsDirName  = 'usage_stats';
const statsFileName = 'stats.json';

// ===========================================================================

const day_ms = 86400000;  // milliseconds in a day

function UsageStats()  {
  this._type       = 'UsageStats';
  this.startDate   = cutils.round ( Date.now()/day_ms-0.50001,0 ) * day_ms;
  this.startDateS  = new Date(this.startDate).toUTCString();
  this.currentDate = this.startDate;  // current date
  this.njobs       = [0];  // njobs[n] is number of jobs passed in nth day since start
  this.cpu         = [0];  // cpu[n] is number of cpu hours booked in nth day since start
  this.volumes     = {};
  this.tasks       = {};   // task[TaskTitle].icon        is path to task's icon
                           // task[TaskTitle].type        is task's type
                           // task[TaskTitle].nuses       is number of uses since start
                           // task[TaskTitle].nfails      is number of failures since start
                           // task[TaskTitle].nterms      is number of terminations since start
                           // task[TaskTitle].cpu_time    is average cpu consumption since start
                           // task[TaskTitle].disk_space  is average disk space consumption since start
                           // task[TaskTitle].last_used   time of last use
                           // task[TaskTitle].last_failed time of last fail
}

UsageStats.prototype.registerJob = function ( job_class )  {
// returns true if 24-hour period was counted

  if ('disk_free_projects' in this)  {  // backward compatibility, to delete
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

  let currDate = Date.now();
  let n0 = this.njobs.length;
  while (currDate-this.currentDate>day_ms)  {
    this.currentDate += day_ms;
    this.njobs.push(0);
    this.cpu  .push(0);
    for (let vname in this.volumes)  {
      if (!('committed' in this.volumes[vname]))
        this.volumes[vname].committed = Array(this.volumes[vname].free.length).fill(0)
      this.volumes[vname].free.push ( this.volumes[vname].free[n0-1] );
      this.volumes[vname].committed.push ( this.volumes[vname].committed[n0-1] );
    }
  }
  let n1 = this.njobs.length-1;
  this.njobs[n1]++;

  if (job_class)  {

    this.cpu[n1] += job_class.cpu_time;

    if (!this.tasks.hasOwnProperty(job_class.title))
      this.tasks[job_class.title] = {
        'icon'        : cmd.image_path(job_class.icon()),
        'type'        : job_class._type, //title.split('(')[0],
        'nuses'       : 0,
        'nfails'      : 0,
        'nterms'      : 0,
        'cpu_time'    : 0,
        'disk_space'  : 0,
        'last_used'   : 0,
        'last_failed' : 0
      };
    let ts = this.tasks[job_class.title];
    ts.nuses++;
    let today = new Date();
    ts.last_used = today.toISOString().slice(0,10);
    if (job_class.state==task_t.job_code.failed)  {
      ts.nfails++;
      ts.last_failed = ts.last_used;
    }
    if (job_class.state==task_t.job_code.stopped)
      ts.nterms++;

    let rf = (ts.nuses-1.0)/ts.nuses;
    ts.cpu_time   = ts.cpu_time*rf   + job_class.cpu_time/ts.nuses;
    ts.disk_space = ts.disk_space*rf + job_class.disk_space/ts.nuses;

  }

  // return true;
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
let fe_config       = conf.getFEConfig();
let statsDirPath    = path.join ( fe_config.storage,statsDirName );
let statsFilePath   = path.join ( statsDirPath,statsFileName );
let generate_report = false;

  if (!usageStats)  {
    usageStats = utils.readClass ( statsFilePath );
    if (!usageStats)  {
      if (utils.fileExists(statsFilePath))  {
        let statsFilePath1 = statsFilePath + '.sav';
        utils.copyFile ( statsFilePath,statsFilePath1 );
        log.warning ( 1,'usage stats reading error; ' + statsFilePath +
                      '\n               retained as ' + statsFilePath1  );
      }
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

    for (let vname in usageStats.volumes)  {
      let committed = usageStats.volumes[vname].committed;
      committed[committed.length-1] = 0.0;
    }

    let users = user.readUsersData().userList;
    for (let i=0;i<users.length;i++)  {
      let c = 0;
      if (users[i].dormant)  c = users[i].ration.storage_used;
                       else  c = users[i].ration.storage;
      if (users[i].volume in usageStats.volumes)  {
        let committed = usageStats.volumes[users[i].volume].committed;
        committed[committed.length-1] += c/1024.0;  // from MB to GB
      }
    }

  }

  utils.writeObject ( statsFilePath,usageStats );

  if (generate_report)  {

    log.standard ( 2,'save current analytics ...' );
    anl.writeFEAnalytics();

    // generate usage report once in 24 hours

    log.standard ( 2,'generate usage stats report ...' );
    let cmd_params = [ '-m', 'pycofe.proc.usagestats',
                       statsFilePath,
                       statsDirPath,
                       'user_data', fe_config.userDataPath,
                       'storage',   fe_config.storage
                     ];
    for (let fsname in fe_config.projectsPath)  {
      cmd_params.push ( fsname );
      cmd_params.push ( fe_config.projectsPath[fsname].path );
    }

    // console.log ( conf.pythonName() + ' ' + cmd_params.join(' ') );

    // ccp4-python -m
    //              pycofe.proc.usagestats
    //              cofe-projects/usage_stats/stats.json
    //              cofe-projects/usage_stats
    //              user_data ./cofe-users
    //              storage ./cofe-projects
    //              *** ./cofe-projects
    //              disk1 ./cofe-projects-1

    let job = utils.spawn ( conf.pythonName(),cmd_params,{} );
    // make stdout and stderr catchers for debugging purposes
    let stdout = '';
    let stderr = '';
    job.stdout.on('data',function(buf){
      stdout += buf;
    });
    job.stderr.on('data',function(buf){
      stderr += buf;
    });
    job.on ( 'close',function(code){
      if (code)  {
        log.standard ( 3,'failed to generate usage report, code=' + code +
                         '\n    stdout=\n' + stdout );
        log.error    ( 3,'failed to generate usage report, code=' + code +
                         '\n    stderr=\n' + stderr );
      } else  {
        let ustats = utils.readClass ( statsFilePath );
        if (ustats)  {
          usageStats = ustats;
          log.standard ( 2,'usage stats report generated' );
        } else
          log.warning ( 2,'cannot read usage stats report at ' + statsFilePath );
      }
    });

    //  check for ccp4 updates once in 24 hours

    let emailer_conf = conf.getEmailerConfig();
    conf.checkOnUpdate ( function(code){
      if ((code>0) && (code<255))  {
        let userData   = new ud.UserData();
        userData.name  = cmd.appName() + ' Maintainer';
        userData.email = emailer_conf.maintainerEmail;
        if (code==254)  {
          log.standard ( 20,'New CCP4 series released, please upgrade' );
          if (emailer_conf.type!='desktop')
            emailer.sendTemplateMessage ( userData,
                      cmd.appName() + ': New CCP4 Series','ccp4_release',{} );
        } else  {
          log.standard ( 21,code + ' CCP4 updates available, please apply' );
          if (emailer_conf.type!='desktop')  {
            let txt = 'CCP4 Update is ';
            if (code>1)
              txt = code + ' CCP4 Updates are '
            emailer.sendTemplateMessage ( userData,
                  cmd.appName() + ': CCP4 Update','ccp4_update',{
                      'text' : txt
                    } );
                  }
        }
      }
    });

    /*
    if (process.env.hasOwnProperty('CCP4'))  {
      let ccp4um_path = path.join ( process.env.CCP4,'libexec','ccp4um-bin' );
      if (utils.fileExists())
        utils.spawn ( ccp4um_path,['-check-silent'] )
             .on('exit', function(code){
               let emailer_conf = conf.getEmailerConfig();
               let userData = null;
               if (emailer_conf.type!='desktop')  {
                 userData = new ud.UserData();
                 userData.name  = cmd.appName() + ' Mainteiner';
                 userData.email = emailer_conf.maintainerEmail;
               }
               if (code==254)  {
                 log.standard ( 20,'New CCP4 series released, please upgrade' );
                 if (userData)
                   emailer.sendTemplateMessage ( userData,
                         cmd.appName() + ': New CCP4 Series','ccp4_release',{} );
               } else if ((0<code) && (code<254))  {
                 log.standard ( 21,code + ' CCP4 updates available, please apply' );
                 if (userData)  {
                   let txt = 'CCP4 Update is ';
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
    */

  }

}


function diskSpaceFix ( check_only )  {
// This function calcualtes the actual disk use in the system for every
// user, project and job and stores results in the corresponding metadata files.
// Since the metadata files are used, this function should be used only when
// CCP4 Cloud is taken down for maintenance.
let users      = user.readUsersData().userList;
let total_diff = 0;

  for (let i=0;i<users.length;i++)  {

    let pList = prj.readProjectList ( users[i],1 );
    if (pList)  {

      let uData = users[i];
      let user_size = 0;
      log.standard ( 100,'checking disk space for for user ' + uData.login +
                         '  ' + (i+1) + '/' + users.length );

      for (let j=0;j<pList.projects.length;j++)  {

        let pDesc  = pList.projects[j];
        let prjInd = '(' + uData.login + ')' + pDesc.name;
        let pData  = prj.readProjectData ( uData,pDesc.name );
        let project_size = 0;

        if (pData)  {

          if (pd.isProjectJoined(uData.login,pDesc))  {
            log.standard ( 101,'project #' + (j+1) + ' ' + pDesc.name + ' is joined -- skipping' );
          } else if (pd.inArchive(pDesc))  {
            log.standard ( 102,'project #' + (j+1) + ' ' + pDesc.name + ' is archived -- skipping' );
          } else  {

            log.standard ( 103,'project #' + (j+1) + ' ' + prjInd );
            let projectDirPath = prj.getProjectDirPath ( uData,pDesc.name );

            fs.readdirSync ( projectDirPath).sort().forEach(function(file,index){
              if (file.startsWith(prj.jobDirPrefix)) {

                let jobPath = path.join ( projectDirPath,file,task_t.jobDataFName );
                let task    = utils.readObject ( jobPath );
                if (task)  {
                  let jobDirPath = path.join ( projectDirPath,file );
                  let job_size   = utils.getDirectorySize ( jobDirPath ) / 1024.0 / 1024.0;
                  project_size  += job_size;
                  user_size     += job_size;
                  if (task.hasOwnProperty('disk_space'))  {
                    let dspace  = job_size - task.disk_space;
                    total_diff += dspace;
                    if (Math.abs(dspace)>1.0)
                      log.standard ( 104,'job #' + task.id  + prjInd   + ' ' + 
                                         task._type  + ' [' + task.state +
                                         '] disk/rec/diff MBs: ' + job_size + 
                                         '/' + task.disk_space   +
                                         '/' + dspace + ' [MISMATCHED]' );
                  } else
                    log.standard ( 105,'job #' + task.id + prjInd + ' ' + 
                                       task._type + ' [' + task.state +
                                       '] disk MBs: ' + job_size +
                                       ' [NOT RECORDED]' );
                  if (!check_only)  {
                    task.disk_space = job_size;
                    if (!utils.writeObject(jobPath,task))
                      log.error ( 101,'cannot write job data for job ' + task.id +
                                      ', project ' + prjInd  );
                    else
                      log.standard ( 106,'job #' + task.id + prjInd + ' ' + 
                                         task._type + ' [' + task.state +
                                         '] ' + job_size + 'MB UPDATED' );
                  }
                } else  {
                  log.error ( 102,'cannot read job data in project ' + prjInd );
                }
 
              }
            });

            log.standard ( 107,'project #' + (j+1) + ' ' + prjInd + ' disk/rec MBs: ' +
                               project_size + '/' + pDesc.disk_space );
            
            if (!check_only)  {
              pDesc.disk_space      = project_size;
              pData.desc.disk_space = project_size;
              if (!prj.writeProjectData(uData,pData,true))
                log.error ( 103,'cannot write project data for project ' + prjInd );
              else
                log.standard ( 108,'project #' + (j+1) + ' ' + prjInd + ' ' +
                                    project_size + 'MB UPDATED' );
            }

          }
        } else
          log.error ( 104,'cannot read project data for project ' + prjInd );
      }

      if (!check_only)  {
        if (!prj.writeProjectList(users[i],pList))
          log.error ( 104,'cannot write project list for user ' + users[i].login );
        else
          log.standard ( 109,'project list for user ' + users[i].login +
                             ' ' + user_size + 'MB UPDATED' );
        ration.calculate_user_disk_space ( uData,pList )
      }

    } else
      log.error ( 104,'cannot read project list for user ' + users[i].login );
  }
  log.standard ( 110,'total space mismatch (MB): ' + total_diff );
}


// ==========================================================================
// export for use in node
module.exports.UsageStats             = UsageStats;
module.exports.registerJob            = registerJob;
module.exports.statsDirName           = statsDirName;
module.exports.getUsageReportURL      = getUsageReportURL;
module.exports.getUsageReportFilePath = getUsageReportFilePath;
module.exports.diskSpaceFix           = diskSpaceFix;
