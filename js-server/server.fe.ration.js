
/*
 *  ==========================================================================
 *
 *    22.09.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.ration.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Projects Handler Functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *      function getUserRationFPath        ( loginData )
 *      function getUserRation             ( loginData )
 *      function saveUserRation            ( loginData,user_ration )
 *      function checkUserRation           ( loginData,include_cloudrun )
 *      function updateResourceStats       ( loginData,job_class,add_resource )
 *      function bookJob                   ( loginData,job_class,cloudrun_bool )
 *      function updateProjectStats        ( loginData,projectName,cpu_change,
 *                                          disk_space_change,njobs_change,
 *                                          update_ration_bool )
 *      function calculate_user_disk_space ( loginData,pList )
 *      function calculateUserDiskSpace    ( loginData )
 *      function maskProject               ( loginData,projectName )
 *  
 *  ==========================================================================
 *
 */

'use strict';

//  load system modules
const path      = require('path');

//  load application modules
const conf      = require('./server.configuration');
const class_map = require('./server.class_map');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const utils     = require('./server.utils');
const emailer   = require('./server.emailer');
const ud        = require('../js-common/common.data_user');
const urat      = require('../js-common/common.userration');
const cmd       = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(19);

// ===========================================================================

const rationFileExt = '.ration';

// ===========================================================================

function getUserRationFPath ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + rationFileExt );
}

function getUserRation ( loginData )  {
let fpath = getUserRationFPath ( loginData );
let r     = utils.readObject ( fpath );
let cfg   = conf.getFEConfig();

  if (!r)  {
    let cfg_ration = null;
    if (cfg.hasOwnProperty('ration'))
      cfg_ration = cfg.ration;
    r = new urat.UserRation(cfg_ration);
    utils.writeObject ( fpath,r );
  } else  {
    let modified = false;
    if (!('archives' in r))  {
      let cfg = conf.getFEConfig();
      if (cfg.hasOwnProperty('ration'))
            r.archive_year = cfg.ration.archive_year;
      else  r.archive_year = 2;
      r.archives = [];
      modified = true;
    }
    if (!('cloudrun_day' in r))  {
      let cfg = conf.getFEConfig();
      if (cfg.hasOwnProperty('ration'))
            r.cloudrun_day = cfg.ration.cloudrun_day;
      else  r.cloudrun_day = 100;
      r.cloudrun_day_used = 0;
      modified = true;
    }
    if (!('storage_max' in r))  {
      let cfg = conf.getFEConfig();
      r.storage_max = 0.0;
      if (r.storage>0.0)
        r.storage_max = cfg.ration.storage_max;
      modified = true;
    }
  
    if (loginData.login==ud.__local_user_id)  {
      modified = (r.storage>0.0)   || (r.storage_max>0.0) || (r.cpu_day>0.0) ||
                 (r.cpu_month>0.0) || (r.cloudrun_day>0)  || (r.archive_year>0);
      r.storage      = 0.0;  // committed MBytes (0: unlimited)
      r.storage_max  = 0.0;  // maximum allocatable MBytes (0: unlimited)
      r.cpu_day      = 0.0;  // hours  (0: unlimited)
      r.cpu_month    = 0.0;  // hours  (0: unlimited)
      r.cloudrun_day = 100;  // cloudruns (0: unlimited)
      // r.cloudrun_day = 0;    // cloudruns (0: unlimited)
      r.archive_year = 2;    // maximum number of project archived (0: unlimited)
      // r.archive_year = 0;    // maximum number of project archived (0: unlimited)
    }

    let msg_list = [];
    let uData    = null;
    function checkQuota ( name,quota,cfg_quota )  {
      if ((quota>0) && (quota<cfg_quota))  {
        // check that account is not dormant
        if (!uData)  // avoid multiple file reads
          uData = user.readUserData ( loginData );
        // do nothing if account is dormant
        if (uData && uData.dormant)
          return quota;
        msg_list.push ( [name,quota,cfg_quota] );
        quota = cfg_quota;
      }
      return quota;
    }

    r.storage      = checkQuota ( 'Storage (MBytes)'      ,r.storage,cfg.ration.storage     );
    r.storage_max  = checkQuota ( 'Storage top-up limit (MBytes)',r.storage_max,cfg.ration.storage_max );
    r.cpu_day      = checkQuota ( 'CPU 24h (hours)'       ,r.cpu_day,cfg.ration.cpu_day     );
    r.cpu_month    = checkQuota ( 'CPU 30d (hours)'       ,r.cpu_month,cfg.ration.cpu_month );
    r.cloudrun_day = checkQuota ( 'CloudRun 24h (jobs)'   ,r.cloudrun_day,cfg.ration.cloudrun_day );
    r.archive_year = checkQuota ( 'Archive 1yr (projects)',r.archive_year,cfg.ration.archive_year );

    if (msg_list.length>0)  {
      modified = true;
      let message = '<table><tr><td><i>Quota</i></td>' +
                               '<td><i>Old value</i></td>' +
                               '<td><i>New value</i></td></tr>';
      for (let i=0;i<msg_list.length;i++)
        message += '<tr><td><b>' + msg_list[i][0] + '</b></td><td>'    
                                 + msg_list[i][1] + '</td><td><b>' 
                                 + msg_list[i][2] + '</b></td></tr>'; 
      message += '</table>';
      emailer.sendTemplateMessage ( user.readUserData(loginData),
        cmd.appName() + ' Quota updated',
        'quota_updated',{
          'quotas' : message
        });
    }

    r = class_map.makeClass ( r );
    r.checkArchiveQuota();
    if (r.calculateTimeRation() || modified)
      utils.writeObject ( fpath,r );
  }

  return r;

}


function saveUserRation ( loginData,user_ration )  {
let fpath = getUserRationFPath ( loginData );
console.log ( ' >>>>>>> save ration ' + fpath)
  if (utils.writeObject(fpath,user_ration))
    return true;
  log.error ( 9,'cannot save user ration at ' + fpath );
  return false;
}


function checkUserRation ( loginData,include_cloudrun )  {
let r = getUserRation ( loginData );
let check_list = [];
  if (r.storage && (r.storage_used>r.storage))
    check_list.push ( 'Disk space' );
  if (r.cpu_day && (r.cpu_day_used>r.cpu_day))
    check_list.push ( 'CPU daily' );
  if (r.cpu_month && (r.cpu_month_used>r.cpu_month))
    check_list.push ( 'CPU monthly' );
  if (include_cloudrun && r.cloudrun_day && (r.cloudrun_day_used>r.cloudrun_day))
    check_list.push ( 'CloudRun daily' );
  return check_list;
}


function updateResourceStats ( loginData,job_class,add_resource )  {
// this function is called once a job finishes in order to update user rations

  let disk_space = 0.0;
  let cpu_time   = 0.0;

  let pList = prj.readProjectList ( loginData,1 );
  if (pList)  {
    for (let i=0;i<pList.projects.length;i++)  {
      let pdesc = pList.projects[i];
      if (pdesc.name==job_class.project)  {
        if (pdesc.hasOwnProperty('disk_space'))  {
          disk_space = pdesc.disk_space;
          cpu_time   = pdesc.cpu_time;
        }
        if (add_resource)  {
          pdesc.disk_space = disk_space + job_class.disk_space;
          pdesc.cpu_time   = cpu_time   + job_class.cpu_time;
        } else  {
          pdesc.disk_space = Math.max(0.0,disk_space-job_class.disk_space);
          // do not change the total project's CPU time used when deleting a job
        }
        disk_space = pdesc.disk_space;
        cpu_time   = pdesc.cpu_time;
        pdesc.njobs++;  // count the job in
        utils.appendString ( 'ration.log',
          '\nproject list update: login=' + loginData.login +
          ' add_resource='      + add_resource +
          ' disk_space_change=' + job_class.disk_space   +
          ' project='           + pdesc.name             +
          ' p.disk_space='      + pdesc.disk_space       +
          ' p.cpu_time='        + pdesc.cpu_time         +
          ' p.njobs='           + pdesc.njobs
        );
        break;
      }
    }
    prj.writeProjectList ( loginData,pList );
  } else
    log.error ( 1,'cannot read project list at ' +
                  prj.getUserProjectListPath(loginData) ); // userProjectsListPath );


  if ((disk_space>0.0) || (cpu_time>0.0))  {
    let pData = prj.readProjectData ( loginData,job_class.project );
    if (pData)  {
      pData.desc.disk_space = disk_space;
      pData.desc.cpu_time   = cpu_time;
      pData.desc.njobs++;
      prj.writeProjectData ( loginData,pData,false );
      utils.appendString ( 'ration.log',
        '\nproject meta update: login=' + loginData.login +
        ' project='           + pData.desc.name       +
        ' p.disk_space='      + pData.desc.disk_space +
        ' p.cpu_time='        + pData.desc.cpu_time   +
        ' p.njobs='           + pData.desc.njobs
      );
    } else
      log.error ( 3,'cannot read project data at ' +
                    prj.getProjectDataPath(loginData,job_class.project) );
  }

}


function bookJob ( loginData,job_class,cloudrun_bool )  {
// this function is called when job has landed in FE
let r = getUserRation ( loginData );
  if (r && r.bookJob(job_class,cloudrun_bool))  {
    console.log ( ' >>>>>> save ration ' + r.cpu_day_used)
    saveUserRation ( loginData,r );
  }
  return r;
}


function updateProjectStats ( loginData,projectName,cpu_change,
                              disk_space_change,njobs_change,
                              update_ration_bool )  {
// loginData.login is project's owner
  if ((disk_space_change!=0.0) && projectName)  {
    let pData = prj.readProjectData ( loginData,projectName );
    if (pData)  {
      pData.desc.cpu_time   += cpu_change;
      pData.desc.disk_space += disk_space_change;
      pData.desc.njobs      += njobs_change;
      prj.writeProjectData ( loginData,pData,true );
      let pList = prj.readProjectList ( loginData,1 );
      if (pList)  {
        let cpu_total_used   = 0.0;
        let disk_space_total = 0.0;
        for (let i=0;i<pList.projects.length;i++)  {
          let pdesc = pList.projects[i];
          if ((!pdesc.archive) || (!pdesc.archive.in_archive))  {
            if (pdesc.name==projectName)  {
              pdesc.cpu_time   = pData.desc.cpu_time;
              pdesc.disk_space = pData.desc.disk_space;
            }
            if (pdesc.owner.login==loginData.login)  {
              cpu_total_used   += pdesc.cpu_time;
              disk_space_total += pdesc.disk_space;
            }
          }
        }
        prj.writeProjectList ( loginData,pList );
        if (update_ration_bool)  {
          // let rfpath = getUserRationFPath ( loginData );
          let r = getUserRation ( loginData );
          if (r)  {
            r.cpu_total_used = cpu_total_used;
            r.storage_used   = disk_space_total;
            saveUserRation ( loginData,r );
            // if (!utils.writeObject(rfpath,r))
            //   log.error ( 5,'cannot save user ration at ' + rfpath );
          } else
            log.error ( 6,'cannot read user ration at ' + 
                          getUserRationFPath(loginData) );
        }
      } else
        log.error ( 7,'cannot read project list at ' +
                      prj.getUserProjectListPath(loginData) );
    } else
      log.error ( 8,'cannot read project data at ' +
                    prj.getProjectDataPath(loginData,projectName) );
  }
}


function calculate_user_disk_space ( loginData,pList )  {
// let rfpath = getUserRationFPath ( loginData );
let r = getUserRation ( loginData );
  if (r)  {
    let disk_space_total = 0.0;
    for (let i=0;i<pList.projects.length;i++)  {
      let pdesc = pList.projects[i];
      if ((pdesc.owner.login==loginData.login) &&
          ((!pdesc.archive) || (!pdesc.archive.in_archive)))
        disk_space_total += pdesc.disk_space;
    }
    if (r.storage_used!=disk_space_total)  {
      r.storage_used = disk_space_total;
      // if (!utils.writeObject(rfpath,r))
      //   log.error ( 9,'cannot save user ration at ' + rfpath );
      saveUserRation ( loginData,r );
    }
  } else if (!r)
    log.error ( 10,'cannot read user ration at ' + getUserRationFPath(loginData) );
  return r;
}


function calculateUserDiskSpace ( loginData )  {
let pList = prj.readProjectList ( loginData,1 );
  if (pList)
    return calculate_user_disk_space ( loginData,pList );
  log.error ( 11,'cannot read project list at ' +
                 prj.getUserProjectListPath(loginData) );
  return getUserRation ( loginData );
}


function maskProject ( loginData,projectName )  {
let r = getUserRation ( loginData );
  r.maskProject ( projectName );
  let rfpath = getUserRationFPath ( loginData );
  if (!utils.writeObject(rfpath,r))
    log.error ( 11,'cannot write ration file at ' + rfpath );
}


// ==========================================================================
// export for use in node

module.exports.getUserRationFPath        = getUserRationFPath;
module.exports.getUserRation             = getUserRation;
module.exports.saveUserRation            = saveUserRation;
module.exports.checkUserRation           = checkUserRation;
module.exports.bookJob                   = bookJob;
module.exports.updateProjectStats        = updateProjectStats;
module.exports.calculate_user_disk_space = calculate_user_disk_space;
module.exports.calculateUserDiskSpace    = calculateUserDiskSpace;
module.exports.maskProject               = maskProject;
