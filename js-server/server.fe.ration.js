
/*
 *  ==========================================================================
 *
 *    13.12.20   <--  Date of Last Modification.
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

/*
function changeUserDiskSpace ( loginData,disk_space_change )  {
var r      = getUserRation      ( loginData );
var rfpath = getUserRationFPath ( loginData );
  r.storage_used = Math.max ( 0,r.storage_used+disk_space_change );
  utils.appendString ( 'ration.log',
    '\nchange user disk space: login=' + loginData.login +
    ' disk_space_change=' + disk_space_change +
    ' r.storage_used='    + r.storage_used
  );
  if (!utils.writeObject(rfpath,r))
    log.error ( 9,'cannot write ration file at ' + rfpath );
}
*/

/* obsolete */
/*
function changeProjectDiskSpace ( loginData,projectName,disk_space_change,
                                  updateProjectData_bool )  {

  if (disk_space_change!=0.0)  {

    var pdesc0 = null;
    if (projectName)  {
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
            utils.appendString ( 'ration.log',
              '\n(*) project list update: login=' + loginData.login +
              ' disk_space_change=' + disk_space_change +
              ' project='           + pdesc.name        +
              ' p.disk_space='      + pdesc.disk_space
            );
            break;
          }
        }
        prj.writeProjectList ( loginData,pList );
      } else
        log.error ( 5,'cannot read project list at ' +
                      prj.getUserProjectListPath(loginData) ); // userProjectsListPath );

      if (updateProjectData_bool)  {
        var pData = prj.readProjectData ( loginData,projectName );
        if (pData)  {
          pData.desc.disk_space += disk_space_change;
          prj.writeProjectData ( loginData,projectName,true );
          pdesc0 = pData.desc;
          utils.appendString ( 'ration.log',
            '\n(*) project meta update: login=' + loginData.login +
            ' disk_space_change=' + disk_space_change +
            ' project='           + pdesc0.name       +
            ' p.disk_space='      + pdesc0.disk_space
          );
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
*/

function bookJob ( loginData,job_class )  {
// this function is called when job has landed in FE
var r = getUserRation ( loginData );
  if (r && r.bookJob(job_class))  {
    var rfpath = getUserRationFPath ( loginData );
    if (!utils.writeObject(rfpath,r))
      log.error ( 10,'cannot write ration file at ' + rfpath );
  }
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
          if (pdesc.name==projectName)  {
            pdesc.cpu_time   = pData.desc.cpu_time;
            pdesc.disk_space = pData.desc.disk_space;
          }
          if (pdesc.owner.login==loginData.login)  {
            cpu_total_used   += pdesc.cpu_time;
            disk_space_total += pdesc.disk_space;
          }
        }
        prj.writeProjectList ( loginData,pList );
        if (update_ration_bool)  {
          var rfpath = getUserRationFPath ( loginData );
          var r      = getUserRation      ( loginData );
          if (r)  {
            r.cpu_total_used = cpu_total_used;
            r.storage_used   = disk_space_total;
            if (!utils.writeObject(rfpath,r))
              log.error ( 5,'cannot save user ration at ' + rfpath );
          } else
            log.error ( 6,'cannot read user ration at ' + rfpath );
        }
      } else
        log.error ( 7,'cannot read project list at ' +
                      prj.getUserProjectListPath(loginData) );
    } else
      log.error ( 8,'cannot read project data at ' +
                    prj.getProjectDataPath(loginData,projectName) );
  }
}


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
    if (!utils.writeObject(rfpath,r))
      log.error ( 9,'cannot save user ration at ' + rfpath );
  } else if (!r)
    log.error ( 10,'cannot read user ration at ' + rfpath );
  else
    log.error ( 11,'cannot read project list at ' +
                   prj.getUserProjectListPath(loginData) );
  return r;
}


/*
function updateUserRation_bookJob ( loginData,job_class )  {
var r = getUserRation ( loginData );
  if (job_class)  {
    utils.appendString ( 'ration.log',
      '\n **** login='  + loginData.login +
      ' job_state='     + job_class.state +
      ' job_type='      + job_class._type +
      '\nstorage_used=' + r.storage_used
    );
    r.bookJob ( job_class );
    var rfpath = getUserRationFPath ( loginData );
    if (!utils.writeObject(rfpath,r))
      log.error ( 10,'cannot write ration file at ' + rfpath );
    if (job_class.isComplete())
      updateResourceStats ( loginData,job_class,true );
    utils.appendString ( 'ration.log',
      '\nstorage_used=' + r.storage_used +
      '\n---------------------------------------------------------------------' );
  }
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

module.exports.getUserRationFPath       = getUserRationFPath;
module.exports.getUserRation            = getUserRation;
module.exports.saveUserRation           = saveUserRation;
//module.exports.updateUserRation_bookJob = updateUserRation_bookJob;
//module.exports.changeUserDiskSpace      = changeUserDiskSpace;
//module.exports.changeProjectDiskSpace   = changeProjectDiskSpace;


module.exports.bookJob                  = bookJob;
module.exports.updateProjectStats       = updateProjectStats;
module.exports.calculateUserDiskSpace   = calculateUserDiskSpace;
module.exports.maskProject              = maskProject;
