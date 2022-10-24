
/*
 *  =================================================================
 *
 *    23.10.22   <--  Date of Last Modification.
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
// var fs        = require('fs-extra');
const path      = require('path');
const crypto    = require('crypto');
const checkDiskSpace = require('check-disk-space').default;

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
// const com_utils = require('../js-common/common.utils');
// var emailer   = require('./server.emailer');
// var send_dir  = require('./server.send_dir');
// var ration    = require('./server.fe.ration');
// var fcl       = require('./server.fe.facilities');
// var class_map = require('./server.class_map');
// var rj        = require('./server.fe.run_job');
// var pd        = require('../js-common/common.data_project');
// var task_t    = require('../js-common/tasks/common.tasks.template');

//  prepare log
const log = require('./server.log').newLog(26);

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

function selectArchiveDisk ( req_size,callback_func )  {
// var fe_conf = conf.getFEConfig();
var adisks  = Object.entries ( conf.getFEConfig().archivePath );
var fsname0 = null;
var ffree   = 0.0;

  function _check_disks ( n )  {
    if (n<adisks.length)  {
      var fspath = path.resolve ( adisks[n][1].path );
      checkDiskSpace(fspath).then((diskSpace) => {
          var dfree = diskSpace.free/(1024.0*1024.0);  // MBytes
          dfree -= Math.random();  // for choosing different disks in tests
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
  let result = new Array(length);
  let cursor = 0;
  for (let i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % chars.length];
  }
  return result.join('');
}


function makeArchiveID()  {
// generates unique archive ids CCP4-XXX.YYYY, where 'ccp4' is setup id from
// FE configuration file, 'XXX' and 'YYYY' are random strings of letters and
// numbers.
var aid     = null;
var fe_conf = conf.getFEConfig();
var sid     = fe_conf.description.id.toUpperCase();
var aconf   = fe_conf.archivePath;

  while (!aid) {
    aid = randomString ( 7,'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' );
    aid = sid + '-' + aid.slice(0, 3) + '.' + aid.slice(3);
    for (var fsn in aconf)  {
      var archPrjPath = path.join ( aconf[fsn].path,aid );
      if (utils.dirExists(archPrjPath))  {
        aid = null;
        break;
      }
    }
  }

  return aid;

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
    var msg = 'User data cannot be read, login=' + uData.login;
    log.error ( 1,msg );
    callback_func ( new cmd.Response(cmd.fe_retcode.readError,msg,'') );
  }

  var archiveID = makeArchiveID();

  log.standard ( 2,'archive project ' + pDesc.name + ', archive ID ' + 
                   archiveID + ', login ' + loginData.login );

  selectArchiveDisk ( pDesc.disk_space,function(adname){
    if (!adname)  {
      user.suspendUser ( loginData,false,'' );
      callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
        code      : 'no_space',
        archiveID : archiveID,
        message   : ''
      }));
    } else  {
      var projectDirPath = prj.getProjectDirPath ( loginData,pDesc.name );
      var archiveDirPath = getArchiveDirPath ( adname,archiveID );
      utils.copyDirAsync ( projectDirPath,archiveDirPath,false,function(err){
        if (!err)  {
//        } else  {
//          utils.removePath ( projectDirPath );
          user.suspendUser ( loginData,false,
            '<div style="width:400px"><h2>Archiving completed</h2>Project <b>"' + 
            pDesc.name +  '"</b> was archived successfully. It is now accessible via ' +
            'Archive ID <b>' + archiveID + 
            '</b>, and you may see it in folder <i>"Projects archived by me"</i>.</div>'
          );
          // add e-mail to user
        } else  {
          user.suspendUser ( loginData,false,
            '<div style="width:400px"><h2>Archiving failed</h2>Project <b>"' + 
            pDesc.name +  '"</b> was not archived due to errors. This is likely ' +
            'to be a consequence of intermittent system failures or a bug.' +
            '<p>Apologies for any inconvenience this may have caused.</div>'
          );
          // add e-mail to user and mainteiner
        }
      });
      // reply "archiving started"
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

// ==========================================================================
// export for use in node
module.exports.archiveProject  = archiveProject;
