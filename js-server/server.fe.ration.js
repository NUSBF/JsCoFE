
/*
 *  ==========================================================================
 *
 *    01.07.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  ==========================================================================
 *
 */

//  load system modules
//var fs            = require('fs-extra');
/*
var child_process = require('child_process');

//  load application modules
//var emailer  = require('./server.emailer');
var uh    = require('./server.fe.upload_handler');
var cmd   = require('../js-common/common.commands');
var fcl   = require('../js-common/common.data_facility');
*/

//  load system modules
var path  = require('path');

//  load application modules
var conf  = require('./server.configuration');
var user  = require('./server.fe.user');
var prj   = require('./server.fe.projects');
var utils = require('./server.utils');
var urat  = require('../js-common/common.userration');

//  prepare log
var log = require('./server.log').newLog(19);

// ===========================================================================

var rationFileExt = '.ration';

// ===========================================================================

function getUserRationFPath ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + rationFileExt );
}

function getUserRation ( loginData )  {
var fpath = getUserRationFPath ( loginData );
var r     = utils.readClass ( fpath );
  if (!r)  {
    var cfg = conf.getFEConfig();
    var cfg_ration = null;
    if (cfg.hasOwnProperty('ration'))
      cfg_ration = cfg.ration;
    r = new urat.UserRation(cfg_ration);
    utils.writeObject ( fpath,r );
  } else if (r.calculateTimeRation())
    utils.writeObject ( fpath,r );
  return r;
}


function saveUserRation ( loginData,user_ration )  {
var fpath = getUserRationFPath ( loginData );
  utils.writeObject ( fpath,user_ration );
}


function updateResourceStats ( loginData,job_class,add_resource )  {

  var disk_space = 0.0;
  var cpu_time   = 0.0;

//  var userProjectsListPath = prj.getUserProjectListPath ( loginData );
//  if (utils.fileExists(userProjectsListPath))  {
//    var pList = utils.readObject ( userProjectsListPath );
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
        pdesc.njobs++;
        break;
      }
    }
    prj.writeProjectList ( loginData,pList );
//    utils.writeObject ( userProjectsListPath,pList );
  } else
    log.error ( 1,'cannot read project list at ' +
                  prj.getUserProjectListPath(loginData) ); // userProjectsListPath );

//  } else
//    log.error ( 2,'cannot find project list at ' + userProjectsListPath );

  if ((disk_space>0.0) || (cpu_time>0.0))  {
//    var projectDataPath = prj.getProjectDataPath ( loginData,job_class.project );
//    if (utils.fileExists(projectDataPath))  {
//      var pData = utils.readObject ( projectDataPath );
    var pData = prj.readProjectData ( loginData,job_class.project );
    if (pData)  {
      pData.desc.disk_space = disk_space;
      pData.desc.cpu_time   = cpu_time;
      pData.desc.njobs++;
      //utils.writeObject ( projectDataPath,pData );
      prj.writeProjectData ( loginData,pData,false );
    } else
      log.error ( 3,'cannot read project data at ' +
                    prj.getProjectDataPath(loginData,job_class.project) );
    //  log.error ( 3,'cannot read project data at ' + projectDataPath );
    //} else
    //  log.error ( 4,'cannot find project data at ' + projectDataPath );
  }

}


function changeUserDiskSpace ( loginData,disk_space_change )  {
var r      = getUserRation      ( loginData );
var rfpath = getUserRationFPath ( loginData );
  r.storage_used = Math.max ( 0,r.storage_used+disk_space_change );
  if (!utils.writeObject(rfpath,r))
    log.error ( 9,'cannot write ration file at ' + rfpath );
}


function changeProjectDiskSpace ( loginData,projectName,disk_space_change,
                                  updateProjectData_bool )  {

  if (disk_space_change!=0.0)  {

    var pdesc0 = null;
    if (projectName)  {
//      var userProjectsListPath = prj.getUserProjectListPath ( loginData );
//      if (utils.fileExists(userProjectsListPath))  {
//        var pList = utils.readObject ( userProjectsListPath );
      var pList = prj.readProjectList ( loginData );
      if (pList)  {
        for (var i=0;i<pList.projects.length;i++)  {
          var pdesc = pList.projects[i];
          if (pdesc.name==projectName)   {
            if ('disk_space' in pdesc)  // backward compatibility on 05.06.2018
              pdesc.disk_space += disk_space_change;
            else if (disk_space_change>0.0)
              pdesc.disk_space  = disk_space_change;
            pdesc0 = pdesc;
            break;
          }
        }
//        utils.writeObject ( userProjectsListPath,pList );
        prj.writeProjectList ( loginData,pList );
      } else
        log.error ( 5,'cannot read project list at ' +
                      prj.getUserProjectListPath(loginData) ); // userProjectsListPath );
//      } else
//        log.error ( 6,'cannot find project list at ' + userProjectsListPath );

      if (updateProjectData_bool)  {
        var pData = prj.readProjectData ( loginData,projectName );
        if (pData)  {
          pData.desc.disk_space += disk_space_change;
          prj.writeProjectData ( loginData,projectName,true );
          pdesc0 = pData.desc;
        } else
          log.error ( 7,'cannot read project data at ' +
                        prj.getProjectDataPath(loginData,projectName) );
      }

    }

    var ownerLoginData = loginData;
    if (pdesc0 && (pdesc0.owner.login!=loginData.login))
      ownerLoginData = user.getUserLoginData ( pdesc0.owner.login );
    changeUserDiskSpace ( ownerLoginData,disk_space_change );

  }

}


function updateUserRation_bookJob ( loginData,job_class )  {
var r = getUserRation ( loginData );
  if (job_class)  {
    r.bookJob ( job_class );
    var rfpath = getUserRationFPath ( loginData );
    if (!utils.writeObject(rfpath,r))
      log.error ( 10,'cannot write ration file at ' + rfpath );
    if (job_class.isComplete())
      updateResourceStats ( loginData,job_class,true );
  }
  return r;
}


function maskProject ( loginData,projectName )  {
var r = getUserRation ( loginData );
  r.maskProject ( projectName );
  var rfpath = getUserRationFPath ( loginData );
  if (!utils.writeObject(rfpath,r))
    log.error ( 11,'cannot write ration file at ' + rfpath );
}


// ==========================================================================
// export for use in node

module.exports.getUserRationFPath       = getUserRationFPath;
module.exports.getUserRation            = getUserRation;
module.exports.saveUserRation           = saveUserRation;
module.exports.updateUserRation_bookJob = updateUserRation_bookJob;
module.exports.changeUserDiskSpace      = changeUserDiskSpace;
module.exports.changeProjectDiskSpace   = changeProjectDiskSpace;
module.exports.maskProject              = maskProject;
