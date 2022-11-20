
/*
 *  ==========================================================================
 *
 *    20.11.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  ==========================================================================
 *
 */

'use strict';

//  load system modules
const path  = require('path');

//  load application modules
const conf      = require('./server.configuration');
const class_map = require('./server.class_map');
// const user  = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const utils     = require('./server.utils');
const urat      = require('../js-common/common.userration');

//  prepare log
const log = require('./server.log').newLog(19);

// ===========================================================================

const rationFileExt = '.ration';

// ===========================================================================

function getUserRationFPath ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + rationFileExt );
}

function getUserRation ( loginData )  {
var fpath = getUserRationFPath ( loginData );
var r     = utils.readObject ( fpath );
  if (!r)  {
    var cfg = conf.getFEConfig();
    var cfg_ration = null;
    if (cfg.hasOwnProperty('ration'))
      cfg_ration = cfg.ration;
    r = new urat.UserRation(cfg_ration);
    utils.writeObject ( fpath,r );
  } else  {
    var modified = false;
    if (!('archives' in r))  {
      var cfg = conf.getFEConfig();
      if (cfg.hasOwnProperty('ration'))
            r.archive_year = cfg.ration.archive_year;
      else  r.archive_year = 5;
      r.archives = [];
      modified = true;
    }
    if (!('cloudrun_day' in r))  {
      var cfg = conf.getFEConfig();
      if (cfg.hasOwnProperty('ration'))
            r.cloudrun_day = cfg.ration.cloudrun_day;
      else  r.cloudrun_day = 100;
      r.cloudrun_day_used = 0;
      modified = true;
    }
    if (!('storage_max' in r))  {
      var cfg = conf.getFEConfig();
      r.storage_max = 0.0;
      if (r.storage>0.0)
        r.storage_max = cfg.ration.storage_max;
      modified = true;
    }
    r = class_map.makeClass ( r );
    r.checkArchiveQuota();
    if (r.calculateTimeRation() || modified)
      utils.writeObject ( fpath,r );
  }
  return r;
}


function saveUserRation ( loginData,user_ration )  {
var fpath = getUserRationFPath ( loginData );
  if (utils.writeObject(fpath,user_ration))
    return true;
  log.error ( 9,'cannot save user ration at ' + fpath );
  return false;
}


function checkUserRation ( loginData,include_cloudrun )  {
var r = getUserRation ( loginData );
var check_list = [];
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

  var disk_space = 0.0;
  var cpu_time   = 0.0;

  var pList = prj.readProjectList ( loginData );
  if (pList)  {
    for (var i=0;i<pList.projects.length;i++)  {
      var pdesc = pList.projects[i];
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
    var pData = prj.readProjectData ( loginData,job_class.project );
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
var r = getUserRation ( loginData );
  if (r && r.bookJob(job_class,cloudrun_bool))
    saveUserRation ( loginData,r );
  // if (r && r.bookJob(job_class,cloudrun_bool))  {
  //   var rfpath = getUserRationFPath ( loginData );
  //   if (!utils.writeObject(rfpath,r))
  //     log.error ( 10,'cannot write ration file at ' + rfpath );
  // }
  return r;
}


function updateProjectStats ( loginData,projectName,cpu_change,
                              disk_space_change,njobs_change,
                              update_ration_bool )  {
// loginData.login is project's owner
  if ((disk_space_change!=0.0) && projectName)  {
    var pData = prj.readProjectData ( loginData,projectName );
    if (pData)  {
      pData.desc.cpu_time   += cpu_change;
      pData.desc.disk_space += disk_space_change;
      pData.desc.njobs      += njobs_change;
      prj.writeProjectData ( loginData,pData,true );
      var pList = prj.readProjectList ( loginData );
      if (pList)  {
        var cpu_total_used   = 0.0;
        var disk_space_total = 0.0;
        for (var i=0;i<pList.projects.length;i++)  {
          var pdesc = pList.projects[i];
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
          // var rfpath = getUserRationFPath ( loginData );
          var r = getUserRation ( loginData );
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
// var rfpath = getUserRationFPath ( loginData );
var r = getUserRation ( loginData );
  if (r)  {
    var disk_space_total = 0.0;
    for (var i=0;i<pList.projects.length;i++)  {
      var pdesc = pList.projects[i];
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
var pList = prj.readProjectList ( loginData );
  if (pList)
    return calculate_user_disk_space ( loginData,pList );
  log.error ( 11,'cannot read project list at ' +
                 prj.getUserProjectListPath(loginData) );
  return getUserRation ( loginData );
}


/*
function calculateUserDiskSpace ( loginData )  {
var pList  = prj.readProjectList ( loginData );
var rfpath = getUserRationFPath ( loginData );
var r      = getUserRation      ( loginData );
  if (r && pList)  {
    var disk_space_total = 0.0;
    for (var i=0;i<pList.projects.length;i++)  {
      var pdesc = pList.projects[i];
      if (pdesc.owner.login==loginData.login)
        disk_space_total += pdesc.disk_space;
    }
    r.storage_used = disk_space_total;
    // if (!utils.writeObject(rfpath,r))
    //   log.error ( 9,'cannot save user ration at ' + rfpath );
    saveUserRation ( loginData,r );
  } else if (!r)
    log.error ( 10,'cannot read user ration at ' + rfpath );
  else
    log.error ( 11,'cannot read project list at ' +
                   prj.getUserProjectListPath(loginData) );
  return r;
}
*/


function maskProject ( loginData,projectName )  {
var r = getUserRation ( loginData );
  r.maskProject ( projectName );
  var rfpath = getUserRationFPath ( loginData );
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
