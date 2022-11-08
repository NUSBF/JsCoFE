
/*
 *  =================================================================
 *
 *    06.11.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.archive.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Archive management Functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const fs        = require('fs-extra');
const path      = require('path');
const crypto    = require('crypto');
const checkDiskSpace = require('check-disk-space').default;

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const task_t    = require('../js-common/tasks/common.tasks.template');
const emailer   = require('./server.emailer');
// const com_utils = require('../js-common/common.utils');
// var send_dir  = require('./server.send_dir');
// var ration    = require('./server.fe.ration');
// var fcl       = require('./server.fe.facilities');
// var class_map = require('./server.class_map');
// var rj        = require('./server.fe.run_job');
// var pd        = require('../js-common/common.data_project');

//  prepare log
const log = require('./server.log').newLog(27);

// ==========================================================================
/*
const archiveIndexFile = 'archive.meta';

var archive_index = null;


// ==========================================================================

function writeArchiveIndex()  {
  if (archive_index)
    for (var fsname in archive_index)
      utils.writeObject (
          path.join ( archive_index[fsname].path,archiveIndexFile ),
          archive_index[fsname].index
      );
}

function readArchiveIndex()  {
  if (!archive_index)  {
    var archivePath = conf.getFEConfig().archivePath;
    if (archivePath)  {
      for (var fsname in archivePath)  {
        archive_index[fsname] = {};
        archive_index[fsname].path = archivePath[fsname].path;
        archive_index[fsname].type = archivePath[fsname].type;
        archive_index[fsname].diskReserve = archivePath[fsname].diskReserve;
        archive_index[fsname].index = utils.readObject (
            path.join ( archive_index[fsname].path,archiveIndexFile )
        );
        if (!archive_index[fsname].index)
          archive_index[fsname].index = {};
      }
      writeArchiveIndex();
    }
  }
}

*/

function getArchiveDirPath ( archDiskName,archiveID )  {
  return path.join ( conf.getFEConfig().archivePath[archDiskName].path,archiveID );
}

function chooseArchiveDisk ( req_size,callback_func )  {
var adisks  = Object.entries ( conf.getFEConfig().archivePath );
var fsname0 = null;
var ffree   = 0.0;

  function _check_disks ( n )  {
    if (n<adisks.length)  {
      var fspath = path.resolve ( adisks[n][1].path );
      checkDiskSpace(fspath).then ( (diskSpace) => {
          var dfree = diskSpace.free/(1024.0*1024.0);  // MBytes
          var dnoise = Math.random();
          dfree -= dnoise;  // for choosing different disks in tests
          var dsize = diskSpace.size/(1024.0*1024.0);  // MBytes
          var rf = (dfree - adisks[n][1].diskReserve) /
                   (dsize - adisks[n][1].diskReserve);
          if ((rf>ffree) && (dfree>req_size))  {
            ffree   = rf;
            fsname0 = adisks[n][0];
          }
          _check_disks ( n+1 );
        }
      );
    } else
      callback_func ( fsname0 );
  }

  _check_disks(0);

}


function randomString ( length, chars ) {
const randomBytes = crypto.randomBytes(length);
let   result = new Array(length);
let   cursor = 0;
  for (let i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % chars.length];
  }
  return result.join('');
}


function findArchivedProject ( archiveID )  {
var aconf = conf.getFEConfig().archivePath;
var archPrjPath = null;

  for (var fsn in aconf)  {
    var apath = path.join ( aconf[fsn].path,archiveID );
    if (utils.dirExists(apath))  {
      archPrjPath = apath;
      break;
    }
  }

  return archPrjPath;

}


function makeArchiveID()  {
// generates unique archive ids CCP4-XXX.YYYY, where 'ccp4' is setup id from
// FE configuration file, 'XXX' and 'YYYY' are random strings of letters and
// numbers.
var aid     = null;
var fe_conf = conf.getFEConfig();
var sid     = fe_conf.description.id.toUpperCase();

  while (!aid) {
    aid = randomString ( 7,'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' );
    aid = sid + '-' + aid.slice(0,3) + '.' + aid.slice(3);
    if (findArchivedProject(aid))
      aid = null;
  }

  return aid;

}


function annotateProject ( archiveDirPath,pAnnotation )  {
var projectDescPath = path.join ( archiveDirPath,prj.projectDescFName );
var projectDataPath = path.join ( archiveDirPath,prj.projectDataFName );
var pDesc = utils.readObject ( projectDescPath );
var pData = utils.readObject ( projectDataPath );

  if ((!pDesc) || (!pData))
    return 'project meta files are missing';

  if (pDesc.archive)  {
    if (pDesc.archive.id!=pAnnotation.id)
      return 'archive IDs do not match';
    pAnnotation.version = pDesc.archive.version + 1;
  } else
    pAnnotation.version = 1;

  pDesc.archive = pAnnotation;
  pDesc.name    = pDesc.archive.id;
  pData.desc    = pDesc;

  utils.writeObject ( projectDataPath,pData );
  utils.writeObject ( projectDescPath,pDesc );

  // lock job directories by archive versioning

  var dirlist = fs.readdirSync ( archiveDirPath );
  for (var i=0;i<dirlist.length;i++)
    if (dirlist[i].startsWith(prj.jobDirPrefix))  {
      var jobMetaFPath = path.join ( archiveDirPath,dirlist[i],task_t.jobDataFName );
      var job_meta     = utils.readObject ( jobMetaFPath );
      if (job_meta && (!('archive_version' in job_meta)))  {
        job_meta.archive_version = pDesc.archive.version;
        job_meta.project = pDesc.name;
        utils.writeObject ( jobMetaFPath,job_meta );
      }
    }

  return '';  // Ok

}


// --------------------------------------------------------------------------

function archiveProject ( loginData,data,callback_func )  {
var pDesc       = data.pdesc;
var pAnnotation = data.annotation;
var uData       = user.suspendUser ( loginData,true,'' );

      // coauthors : this.coauthors,
      // pdbs      : this.pdbs,
      // dois      : this.dois,
      // kwds      : this.kwds

  if (!uData)  {
    var msg = 'User data cannot be read, login=' + loginData.login;
    log.error ( 1,msg );
    callback_func ( new cmd.Response(cmd.fe_retcode.readError,msg,'') );
  }

  var archiveID = makeArchiveID();

  log.standard ( 1,'archive project ' + pDesc.name + ', archive ID ' + 
                   archiveID + ', login ' + loginData.login );

  chooseArchiveDisk ( pDesc.disk_space,function(adname){

    if (!adname)  {  // disk name null -- no space or misconfiguration

      user.suspendUser ( loginData,false,'' );
      callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
        code      : 'no_space',
        archiveID : archiveID,
        message   : ''
      }));
    
    } else  {  // archive disk was chosen successfully, disk space checked
      // *copy* project directory to chosen archive disk asynchronously

      setTimeout ( function(){

        var projectDirPath = prj.getProjectDirPath ( loginData,pDesc.name );
        var archiveDirPath = getArchiveDirPath ( adname,archiveID );

        utils.copyDirAsync ( projectDirPath,archiveDirPath,false,function(err){

          var failcode = 0;
          if (!err)  {
            // put archive metadata in project description, lock jobs for deletion
            pAnnotation.id = archiveID;
            pAnnotation.in_archive = true;
            pAnnotation.depositor = {
              login : loginData.login,  // login name of depositor
              name  : uData.name,       // depositor's name
              email : uData.email       // depositor's email
            };
            pAnnotation.project_name = pDesc.name;
            annotateProject ( archiveDirPath,pAnnotation );
            // make project link in user's projects directory
            var linkDir   = path.resolve(prj.getProjectDirPath(loginData,archiveID));
            var linkedDir = path.resolve(archiveDirPath);
            if (utils.makeSymLink(linkDir,linkedDir))  {
              // update archive tables
              // remove original job directory
              // prj.deleteProject ( loginData,pDesc.name );
              // unlock user's account and inform user through Cloud message and via e-mail
              user.suspendUser ( loginData,false,
                '<div style="width:400px"><h2>Archiving completed</h2>Project <b>"' + 
                pDesc.name +  '"</b> was archived successfully. It is now accessible ' +
                'via Archive ID <b>' + archiveID + 
                '</b>, and you may see it in folder <i>"Projects archived by me"</i>.</div>'
              );
              log.standard ( 2,'project ' + pDesc.name + ' archived with ID ' + 
                   archiveID + '; login ' + loginData.login + ', archive disk ' +
                   adname );
              // add e-mail to user

              emailer.sendTemplateMessage ( uData,
                        cmd.appName() + ' Project Archived',
                        'project_archived',{
                            archiveID    : archiveID,
                            projectName  : pDesc.name,
                            projectTitle : pDesc.title
                        });

            } else
              failcode = 1;
          
          } else
            failcode = 2;

          if (failcode)  {
            utils.removePath ( archiveDirPath );
            user.suspendUser ( loginData,false,
              '<div style="width:400px"><h2>Archiving failed</h2>Project <b>"' + 
              pDesc.name +  '"</b> was not archived due to errors (fail code ' +
              failcode +'). This is likely to be a consequence of intermittent ' +
              'system failures or program bugs.' +
              '<p>Apologies for any inconvenience this may have caused.</div>'
            );
            log.error ( 3,'project archiving failed, failcode=' + failcode +
                          '; login=' + loginData.login + ', project ' + 
                          pDesc.name + ', archive disk ' + adname );
            emailer.sendTemplateMessage ( uData,
                        cmd.appName() + ' Project Archived',
                        'project_arching_failed',{
                            archiveID    : archiveID,
                            projectName  : pDesc.name,
                            projectTitle : pDesc.title,
                            failcode     : '' + failcode
                        });

            // add e-mail to user and mainteiner
          }

        });

      },2000);

      // reply "archiving started" to client (copying goes in separate thread )

      callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
        code      : 'ok',
        archiveID : archiveID,
        message   : ''
      }));

    }

  });


/*
  // start archiving thread

  setTimeout ( function(){

    var projectDirPath = prj.getProjectDirPath ( loginData,pDesc.name );
    var projectDirPath = getProjectDirPath ( loginData,projectName );

    if (utils.moveDir(uProjectDir,sProjectDir,false))  {
      var pData = prj.readProjectData ( sData,pName );
      if (!('author' in pData.desc.owner))
        pData.desc.owner.author = pData.desc.owner.login;
      pData.desc.owner.login = sData.login;
      // pData.desc.folderPath  = pData.desc.folderPath.replace (
      //                                         'My Projects',folder_name );
      prj.writeProjectData ( sData,pData,true );
    } else
      failed_move.push ( pName );




    // log out user and successor and suspend their accounts

    var uDataFile = getUserDataFName ( uData );
    var sDataFile = getUserDataFName ( sData );

    var ulogin = uData.login;
    __userLoginHash.removeUser ( ulogin );     // logout
    uData.login = __suspend_prefix + uData.login;   // suspend
    utils.writeObject ( uDataFile,uData );  // commit
    uData.login = ulogin;

    var slogin = sData.login;
    __userLoginHash.removeUser ( slogin );     // logout
    sData.login = __suspend_prefix + sData.login;   // suspend
    utils.writeObject ( sDataFile,sData );  // commit
    sData.login = slogin;

    // loop and move
    // var folder_name = ulogin + '\'s projects';
    var failed_move = [];
    var were_shared = [];
    for (var i=0;i<userPrjList.projects.length;i++)  {
      var pName = userPrjList.projects[i].name;
      var uProjectDir = prj.getProjectDirPath ( uData,pName );
      if (!utils.isSymbolicLink(uProjectDir))  {
        var sProjectDir = prj.getProjectDirPath ( sData,pName );
        if (utils.moveDir(uProjectDir,sProjectDir,false))  {
          var pData = prj.readProjectData ( sData,pName );
          if (!('author' in pData.desc.owner))
            pData.desc.owner.author = pData.desc.owner.login;
          pData.desc.owner.login = sData.login;
          // pData.desc.folderPath  = pData.desc.folderPath.replace (
          //                                         'My Projects',folder_name );
          prj.writeProjectData ( sData,pData,true );
        } else
          failed_move.push ( pName );
      } else
        were_shared.push ( pName );
    }

    // update rations and activate user and successor accounts

    var uRation = ration.getUserRation ( uData );
    var sRation = ration.getUserRation ( sData );

    sRation.storage      += uRation.storage;
    sRation.storage_used += uRation.storage_used;
    uRation.storage       = 0.1;  // block user by outquoting
    sRation.storage_used  = 1.0;

    ration.saveUserRation ( sData,sRation );
    ration.saveUserRation ( uData,uRation );

    utils.writeObject ( uDataFile,uData );  // commit
    utils.writeObject ( sDataFile,sData );  // commit

    var msg = '';
    if (failed_move.length>0)
      msg = 'The following project(s) could not be moved due to errors:<p>' +
            failed_move.join(', ');
    if (were_shared.length>0)  {
      if (msg)  msg += '<p>';
      msg += 'The following project(s) were not moved because they are ' +
             'shared with the user:<p>' +
             were_shared.join(', ');
    }
    if (!msg)
      msg = 'Operation finished successfully.';

    emailer.sendTemplateMessage ( uData,
              cmd.appName() + ' User Retired',
              'user_retired_admin',{
                  message : msg
              });
    emailer.sendTemplateMessage ( sData,
              cmd.appName() + ' User Retired',
              'succ_retired_admin',{
                  retLogin    : uData.login,
                  message     : msg,
                  folder_name : folder_name
              });

  },2000);
*/

}


// --------------------------------------------------------------------------

function accessArchivedProject ( loginData,data )  {
var archiveID   = data.archiveID;
var archPrjPath = findArchivedProject(archiveID);

  // 1. Check that requested project exists in the archive

  if (!archPrjPath)
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code    : 'project_not_found'
    });

  // 2. Check that the project is not already in users' account

  var projectDir = prj.getProjectDirPath ( loginData,archiveID );
  if (utils.dirExists(projectDir))  {
    var pDesc = prj.readProjectDesc ( loginData,archiveID );
    var code  = 'already_accessed';
    if (!pDesc)  code = 'error_read_project';
    else if (!pDesc.archive)  code = 'duplicate_name';
    else if (pDesc.owner.login==loginData.login)  code = 'author_archive';
    return new cmd.Response ( cmd.fe_retcode.ok,'',{ code : code });
  }

  // 3. Link to the archive

  if (!utils.makeSymLink(projectDir,path.resolve(archPrjPath)))  {
    log.error ( 10,'failed to symplink archive project ' + archiveID + 
                   ', login ' + loginData.login );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code : 'error_access_project'
    });
  }

  // 4. Add project to user's list of projects

  try {

    var pList = prj.readProjectList ( loginData );  // this reads new project in
    var pDesc = prj.readProjectDesc ( loginData,archiveID );
    // pList.projects.push ( pDesc );  // should be no need for this
    pList.current = pDesc.name;        // make it current
    if (!prj.writeProjectList(loginData,pList))  {
      log.error ( 11,'cannot write project list, login ' + loginData.login );
      return new cmd.Response ( cmd.fe_retcode.ok,'',{
        code : 'error_write_plist'
      });
    }

  } catch(e)  {

    log.error ( 12,'update project list errors, login ' + loginData.login );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code : 'error_update_plist'
    });

  }

  log.standard ( 10,'accessed archive project ' + archiveID );
  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    code : 'ok'
  });

}

// ==========================================================================
// export for use in node
module.exports.archiveProject        = archiveProject;
module.exports.accessArchivedProject = accessArchivedProject;
