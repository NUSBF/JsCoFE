
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

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');
// var emailer   = require('./server.emailer');
// var send_dir  = require('./server.send_dir');
// var ration    = require('./server.fe.ration');
// var fcl       = require('./server.fe.facilities');
// var user      = require('./server.fe.user');
// var class_map = require('./server.class_map');
// var rj        = require('./server.fe.run_job');
// var pd        = require('../js-common/common.data_project');
// var com_utils = require('../js-common/common.utils');
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

function selectArchiveDisk ( callback_func )  {

  if (!archive_index)
    callback_func ( '#no_archive#' );

  var fsname0 = '#no_space#';
  var ffree   = 0.0;
  var fsn     = [];
  for (var fsname in archive_index)
    fsn.push ( fsname );

  function _check_disks ( n )  {
    if (n<vdata.length)  {
      var fspath = path.resolve ( archive_index[fsn[n]].path );
      checkDiskSpace(fspath).then((diskSpace) => {
          var dfree = diskSpace.free/(1024.0*1024.0);  // MBytes
          var dsize = diskSpace.size/(1024.0*1024.0);  // MBytes
          var rf = (dfree - archive_index[fsn[n]].diskReserve) /
                   (dsize - archive_index[fsn[n]].diskReserve);
          if (rf>ffree)  {
            ffree   = rf;
            fsname0 = fsn[n];
          }
          _check_disks ( n+1 );
        }
      );
    } else
      callback_func ( fsname0 );
  }

  _check_disks(0);

}


function makeArchiveID ( fsname )  {
// generates unique archive ids  ccp4.XXX-YYYY, where 'ccp4' is serup id from
// FE configuration file, 'XXX' and 'YYYY' are random strings of letters and
// numbers; empty archive entry is created simultaneously in disck 'fsname'
var aid = null;
var sid = conf.getFEConfig().description.id;

  while (!aid) {
    aid = sid + '.' + crypto.randomBytes(3).toString('hex') + '-' +
                      crypto.randomBytes(4).toString('hex');
    for (var fsn in archive_index)
      if (aid in archive_index[fsn])  {
        aid = null;
        break;
      }
  }

  archive_index[fsname][aid] = {};  // empty entry to fix aid

  return aid;

}
*/


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

function archiveProject ( loginData,data )  {
var projectDesc       = data.pdesc;
var projectAnnotation = data.annotation;
      // coauthors : this.coauthors,
      // pdbs      : this.pdbs,
      // dois      : this.dois,
      // kwds      : this.kwds
var archiveID = makeArchiveID();

  log.standard ( 1,'archive project ' + projectDesc.name +
                    ', archive ID ' + archiveID + ', login ' + loginData.login );

  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    code      : cmd.fe_retcode.ok,
    archiveID : archiveID,
    message   : 'Attempt to retire a user without having privileges'
  });

}

// ==========================================================================
// export for use in node
module.exports.archiveProject  = archiveProject;
