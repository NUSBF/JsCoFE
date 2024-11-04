
/*
 *  =================================================================
 *
 *    15.03.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2022-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const fs        = require('fs-extra');
const path      = require('path');
const crypto_ex = require('crypto');
const checkDiskSpace = require('check-disk-space').default;

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');
const comut     = require('../js-common/common.utils');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const task_t    = require('../js-common/tasks/common.tasks.template');
const ration    = require('./server.fe.ration');
const emailer   = require('./server.emailer');

//  prepare log
const log = require('./server.log').newLog(27);


// ==========================================================================

const annot_fname    = 'annot.index';
const deplogin_fname = 'deplogin.index';
const depname_fname  = 'depname.index';
const depemail_fname = 'depemail.index';
const depdate_fname  = 'depdate.index';
const prid_fname     = 'prid.index';
const pdb_fname      = 'pdb.index';
const doi_fname      = 'doi.index';
const kwd_fname      = 'kwd.index';


var annot_index      = {};
var deplogin_index   = {};
var depname_index    = {};
var depemail_index   = {};
var depdate_index    = {};
var prid_index       = {};
var pdb_index        = {};
var doi_index        = {};
var kwd_index        = {};


function clearIndex()  {
  annot_index      = {};
  deplogin_index   = {};
  depname_index    = {};
  depemail_index   = {};
  depdate_index    = {};
  prid_index       = {};
  pdb_index        = {};
  doi_index        = {};
  kwd_index        = {};
}


function loadIndex()  {
  let primePath = conf.getFEConfig().archivePrimePath;
  
  if (!primePath)  {
    log.error ( 2,'attempt to load archive index while archive is not configured' );
    return -1;   // archive is not configured
  }

  let ipath = path.join ( primePath,annot_fname );
  if (!utils.fileExists(ipath))  {
    // all new index
    clearIndex();
    log.standard ( 11,'archive index is initialised' );
    return 1;  // Ok
  }

  annot_index    = utils.readObject ( ipath );
  deplogin_index = utils.readObject ( path.join(primePath,deplogin_fname) );
  depname_index  = utils.readObject ( path.join(primePath,depname_fname ) );
  depemail_index = utils.readObject ( path.join(primePath,depemail_fname) );
  depdate_index  = utils.readObject ( path.join(primePath,depdate_fname ) );
  prid_index     = utils.readObject ( path.join(primePath,prid_fname    ) );
  pdb_index      = utils.readObject ( path.join(primePath,pdb_fname     ) );
  doi_index      = utils.readObject ( path.join(primePath,doi_fname     ) );
  kwd_index      = utils.readObject ( path.join(primePath,kwd_fname     ) );

  if ((!annot_index)    || (!deplogin_index) || (!depname_index) || 
      (!depemail_index) || (!depdate_index)  || (!prid_index)    || 
      (!pdb_index)      || (!doi_index)      || (!kwd_index))  {
    log.error ( 3,'archive index is corrupt' );
    return -2;  // corrupt index
  }

  return 0;  // Ok

}


function saveIndex()  {
  let primePath = conf.getFEConfig().archivePrimePath;

  if (!primePath)  {
    log.error ( 5,'attempt to save archive index while archive is not configured' );
    return -1;   // archive is not configured
  }

  if ((!utils.writeObject(path.join(primePath,annot_fname   ),annot_index   )) ||
      (!utils.writeObject(path.join(primePath,deplogin_fname),deplogin_index)) ||
      (!utils.writeObject(path.join(primePath,depname_fname ),depname_index )) ||
      (!utils.writeObject(path.join(primePath,depemail_fname),depemail_index)) ||
      (!utils.writeObject(path.join(primePath,depdate_fname ),depdate_index )) ||
      (!utils.writeObject(path.join(primePath,prid_fname    ),prid_index    )) ||
      (!utils.writeObject(path.join(primePath,pdb_fname     ),pdb_index     )) ||
      (!utils.writeObject(path.join(primePath,doi_fname     ),doi_index     )) ||
      (!utils.writeObject(path.join(primePath,kwd_fname     ),kwd_index)))  {
    log.error ( 6,'errors at saving archive index, possibly index is corrupt' );
    return -2;   // archive is not configured
  }

  return 0;

}


function _add_to_archive_index ( projectDesc )  {
// Archive index structure:
//
// depositor login index:
// deplogin_index = {
//   login1 : [aid1,aid2,...],
//   .........
// }
//
// depositor name index (duplicated for names and surnames):
// depname_index = {
//   name1 : [aid1,aid2,...],
//   .........
// }
//
// depositor e-mail index
// depemail_index = {
//   email1 : [aid1,aid2,...],
//   .........
// }
//
// deposition date index
// depdate_index = {
//   year : [ [aid1,aid2,...],  // month 1
//            [...],            // month 2
//            .........
//          ],
//   .........
// }
//
// project ID index
// prid_index = {
//   projectId1 : [aid1,aid2,...],
//   .........
// }
//
// pdb code index
// pdb_index = {
//   pdbcode1 : [aid1,aid2,...],
//   .........
// }
//
// publication doi index
// doi_index = {
//   doi1 : [aid1,aid2,...],
//   .........
// }
//
// keyword index
// kwd_index = {
//   kwd1 : [aid1,aid2,...],
//   .........
// }
//

  let pa  = projectDesc.archive;
  let aid = pa.id;

  function _add_to_index ( index,key )  {
    if (!(key in index))       
      index[key] = [];
    if (index[key].indexOf(aid)<0)
      index[key].push ( aid );
  }

  function _list_to_index ( index,keylist,minkeylength )  {
    for (let i=0;i<keylist.length;i++)  {
      let key = keylist[i].trim();
      if (key.length>=minkeylength)
        _add_to_index ( index,key.toUpperCase() );
    }
  }

  annot_index[aid] = pa;
  annot_index[aid].project_title = projectDesc.title;
  
  _add_to_index ( deplogin_index,pa.depositor.login );

  let name_lst = comut.replaceAll ( comut.replaceAll ( 
                            pa.depositor.name,'.',' '), ',',' ' ).split(' ');
  _list_to_index ( depname_index,name_lst,2 );

  _add_to_index ( depemail_index,pa.depositor.email.toUpperCase() );

  for (let i=0;i<pa.date.length;i++)  {
    let date  = new Date(pa.date[i]);
    let year  = date.getFullYear();
    let month = date.getMonth();
    if (!(year in depdate_index))
      depdate_index[year] = [
        [],[],[], [],[],[], [],[],[], [],[],[]
      ];
    if (depdate_index[year][month].indexOf(aid)<0)
      depdate_index[year][month].push ( aid );
  }

  _add_to_index  ( prid_index,pa.project_name );
  _list_to_index ( pdb_index,pa.pdbs,4 );
  _list_to_index ( doi_index,pa.dois,4 );
  _list_to_index ( kwd_index,pa.kwds,1 );

}


function addToIndex ( projectDesc )  {
  if (!projectDesc)  {
    log.error ( 8,'empty project description attempted for archive indexing' );
    return -3;
  }
  if (loadIndex()<0)
    return -1;
  _add_to_archive_index ( projectDesc );
  if (saveIndex()<0)
    return -2;
  return 0;
}


function generateIndex()  {
  let fe_config = conf.getFEConfig();

  if (!fe_config.isArchive())  {
    log.error ( 7,'attempt to generate archive index while archive is not configured' );
    return -1;
  }

  clearIndex();
  log.standard ( 12,'archive index is initialised' );

  for (let fsname in fe_config.archivePath)  {
    let adir_path = fe_config.archivePath[fsname].path;
    fs.readdirSync(adir_path).forEach(function(file,index){
      let curPath = path.join ( adir_path,file );
      let lstat   = fs.lstatSync(curPath);
      if (lstat.isDirectory())  {
        let pdesc_path  = path.join ( curPath,prj.projectDescFName );
        let projectDesc = utils.readObject ( pdesc_path );
        if (projectDesc)  {
          _add_to_archive_index ( projectDesc );
          console.log ( ' ... added ' + curPath );
        } else 
          log.warning ( 1,'project description is not found at  ' + pdesc_path );
      }
    });
  }

  if (saveIndex()<0)
    return -2;

  return 0;

}


// --------------------------------------------------------------------------

function getArchiveDirPath ( archDiskName,archiveID )  {
  return path.join ( conf.getFEConfig().archivePath[archDiskName].path,archiveID );
}

function chooseArchiveDisk ( archLocation,req_size,callback_func )  {

  if (archLocation[1])  {

    callback_func ( archLocation[1] );

  } else  {
    let adisks  = Object.entries ( conf.getFEConfig().archivePath );
    let fsname0 = null;
    let ffree   = 0.0;

    function _check_disks ( n )  {
      if (n<adisks.length)  {
        let fspath = path.resolve ( adisks[n][1].path );
        checkDiskSpace(fspath).then ( (diskSpace) => {
            let dfree = diskSpace.free/(1024.0*1024.0);  // MBytes
            let dnoise = Math.random();
            dfree -= dnoise;  // for choosing different disks in tests
            let dsize = diskSpace.size/(1024.0*1024.0);  // MBytes
            let rf = (dfree - adisks[n][1].diskReserve) /
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

}


function randomString ( length, chars ) {
  const randomBytes = crypto_ex.randomBytes(length);
  let   result = new Array(length);
  let   cursor = 0;
  for (let i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % chars.length];
  }
  return result.join('');
}


function findArchivedProject ( archiveID )  {
  let aconf = conf.getFEConfig().archivePath;
  let archPrjPath = [null,null];

  for (let fsn in aconf)  {
    let apath = path.join ( aconf[fsn].path,archiveID );
    if (utils.dirExists(apath))  {
      archPrjPath = [apath,fsn];
      break;
    }
  }

  return archPrjPath;

}


function makeArchiveID ( loginData )  {
// generates unique archive ids CCP4-XXX.YYYY, where 'ccp4' is setup id from
// FE configuration file, 'XXX' and 'YYYY' are random strings of letters and
// numbers.
  let aid = null;
  let sid = conf.getFEConfig().description.id.toUpperCase();

  while (!aid) {
    aid = randomString ( 7,'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' );
    aid = sid + '-' + aid.slice(0,3) + '.' + aid.slice(3);
    if (findArchivedProject(aid)[0] || 
        utils.dirExists(prj.getProjectDirPath(loginData,aid)))
      aid = null
  }

  return aid;

}


function annotateProject ( archiveDirPath,pAnnotation )  {
  let projectDescPath = path.join ( archiveDirPath,prj.projectDescFName );
  let projectDataPath = path.join ( archiveDirPath,prj.projectDataFName );
  let pDesc = utils.readObject ( projectDescPath );
  let pData = utils.readObject ( projectDataPath );

  if ((!pDesc) || (!pData))
    return 'project meta files are missing';

  if (pDesc.archive)  {
    if (pDesc.archive.id!=pAnnotation.id)
      return 'archive IDs do not match';
    pAnnotation.version = pDesc.archive.version + 1;
    pAnnotation.date    = pDesc.archive.date;
  } else {
    pAnnotation.version = 1;
    pAnnotation.date    = [];
  }
  pAnnotation.date.push ( Date.now() );

  pDesc.archive = pAnnotation;
  pDesc.name    = pDesc.archive.id;
  pData.desc    = pDesc;

  utils.writeObject ( projectDataPath,pData );
  utils.writeObject ( projectDescPath,pDesc );

  // lock job directories by archive versioning

  let dirlist = fs.readdirSync ( archiveDirPath );
  for (let i=0;i<dirlist.length;i++)
    if (dirlist[i].startsWith(prj.jobDirPrefix))  {
      let jobMetaFPath = path.join ( archiveDirPath,dirlist[i],task_t.jobDataFName );
      let job_meta     = utils.readObject ( jobMetaFPath );
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
  let uRation     = ration.getUserRation ( loginData );
  let pDesc       = data.pdesc;
  let pAnnotation = data.annotation;
  let archiveID   = pAnnotation.id.toUpperCase();
  let uData       = user.suspendUser ( loginData,true,'' );

      // id        : this.aid,
      // coauthors : this.coauthors,
      // pdbs      : this.pdbs,
      // dois      : this.dois,
      // kwds      : this.kwds

  if (!uData)  {
    let msg = 'User data cannot be read, login=' + loginData.login;
    log.error ( 1,msg );
    callback_func ( new cmd.Response(cmd.fe_retcode.readError,msg,'') );
  }

  if (pDesc.owner.login!=loginData.login)  {
    user.suspendUser ( loginData,false,'' );
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
      code      : 'not_owner',
      archiveID : archiveID,
      message   : ''
    }));
    return;
  }

  if (pDesc.archive && (pDesc.archive.depositor.login!=loginData.login))  {
    user.suspendUser ( loginData,false,'' );
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
      code      : 'not_depositor',
      archiveID : archiveID,
      message   : ''
    }));
    return;
  }

  // if ((Object.keys(pDesc.share).length>0) || pDesc.autorun)  {
  //   callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
  //     code      : 'shared',
  //     archiveID : archiveID,
  //     message   : ''
  //   }));
  //   return;
  // }

  let archLocation = [null,null];
  let update = false;
  if (archiveID)  {
    let instanceID = conf.getFEConfig().description.id.toUpperCase();
    if (!archiveID.startsWith(instanceID))
      archiveID = instanceID + '-' + archiveID;
    archLocation = findArchivedProject ( archiveID );
    if (archLocation[0])  { 
      // project with given archiveID already exists; is this a clash or update?
      if (!pDesc.archive)  {
        // project was not archived before, so this is a clash
        user.suspendUser ( loginData,false,'' );
        callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
          code      : 'duplicate_archive_id',
          archiveID : archiveID,
          message   : ''
        }));
        return;
      } else   {
        // project was previously archived, this is updates
        update = true;
        if (pDesc.archive.id!=archiveID)  {
          // project was previously archived, but id does not match -- error
          user.suspendUser ( loginData,false,'' );
          callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
            code      : 'unmatched_archive_id',
            archiveID : archiveID,
            message   : ''
          }));
          return;
        }
      }
    }
    // check whether archive ID clashes with one of user's project name
    let checkPath = prj.getProjectDirPath ( loginData,archiveID );
    if (utils.dirExists(checkPath) && (!utils.isSymbolicLink(checkPath)))  {
      user.suspendUser ( loginData,false,'' );
      callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
        code      : 'duplicate_project_name',
        archiveID : archiveID,
        message   : ''
      }));
      return;
    }
  } else
    archiveID = makeArchiveID ( loginData );


  if ((!update) && (!uRation.checkArchiveQuota()))  {
    user.suspendUser ( loginData,false,'' );
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',{
      code      : 'no_quota',
      archiveID : archiveID,
      message   : ''
    }));
    return;
  }


  log.standard ( 1,'archive project ' + pDesc.name + ', archive ID ' + 
                   archiveID + ', login ' + loginData.login );

  chooseArchiveDisk ( archLocation,pDesc.disk_space,function(adname){

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

        // remove project from user's account
        let unshared_users = prj.unshare_project ( pDesc );

        let projectDirPath = prj.getProjectDirPath ( loginData,pDesc.name );
        let archiveDirPath = getArchiveDirPath ( adname,archiveID );

        let archiveBackupPath = null;
        if (utils.dirExists(archiveDirPath))  {
          archiveBackupPath += '.bak';
          utils.moveDir ( archiveDirPath,archiveBackupPath,true );
        }

        utils.copyDirAsync ( projectDirPath,archiveDirPath,true,function(err){

          let failcode = 0;
          if (!err)  {
            // put archive metadata in project description, lock jobs for deletion
            pAnnotation.id         = archiveID;
            pAnnotation.in_archive = true;
            pAnnotation.depositor  = {
              login : loginData.login,  // login name of depositor
              name  : uData.name,       // depositor's name
              email : uData.email       // depositor's email
            };
            pAnnotation.project_name = pDesc.name;
            annotateProject ( archiveDirPath,pAnnotation );
            // make archived project link in user's projects directory
            let linkDir   = path.resolve(prj.getProjectDirPath(loginData,archiveID));
            let linkedDir = path.resolve(archiveDirPath);
            if (update && utils.isSymbolicLink(linkDir))
              utils.removeFile ( linkDir );
            if (utils.makeSymLink(linkDir,linkedDir))  {
              // remove project from user's account
              prj.delete_project ( loginData,pDesc.name,pDesc.disk_space,
                                   projectDirPath );
              // update archive tables
              // unlock user's account and inform user through Cloud message and via e-mail
              if (archiveBackupPath)  {
                // the project was updated in archive
                utils.removePathAsync ( archiveBackupPath );
                user.suspendUser ( loginData,false,
                  '<div style="width:400px"><h2>Archive updating completed</h2>' +
                  'Archived Project <b>"' + pDesc.name +  
                  '"</b> was updated successfully. It is now accessible ' +
                  'via Archive ID <b>' + archiveID + 
                  '</b>, and you may see it in folder <i>"Projects archived by me"</i>.</div>'
                );
                log.standard ( 2,'project ' + pDesc.name + ' updated in archive; ' +
                    ' archiveID=' + archiveID + ', login ' + loginData.login + 
                    ', archive disk ' + adname );
              } else  {
                // the project was archived for 1st time
                uRation.bookArchive();
                ration.saveUserRation ( loginData,uRation );
                user.suspendUser ( loginData,false,
                  '<div style="width:400px"><h2>Archiving completed</h2>Project <b>"' + 
                  pDesc.name +  '"</b> was archived successfully. It is now accessible ' +
                  'via Archive ID <b>' + archiveID + 
                  '</b>, and you may see it in folder <i>"Projects archived by me"</i>.</div>'
                );
                log.standard ( 3,'project ' + pDesc.name + ' archived with ID ' + 
                    archiveID + '; login ' + loginData.login + ', archive disk ' +
                    adname );
              }
              
              // update archive index

              addToIndex ( utils.readObject(path.join(archiveDirPath,prj.projectDescFName)) );


              // add e-mail to user

              emailer.sendTemplateMessage ( uData,
                        cmd.appName() + ' Project Archived',
                        'project_archived',{
                            archiveID    : archiveID,
                            projectName  : pDesc.name,
                            projectTitle : pDesc.title
                        });

              for (let i=0;i<unshared_users.length;i++)
                emailer.sendTemplateMessage ( unshared_users[i],
                          cmd.appName() + ' Project Archived',
                          'shared_project_archived',{
                              archiveID    : archiveID,
                              projectName  : pDesc.name,
                              projectTitle : pDesc.title
                          });

            } else
              failcode = 1;

          } else
            failcode = 2;

          if (failcode)  {
            utils.removePathAsync ( archiveDirPath );
            if (archiveBackupPath)
              utils.moveDir ( archiveBackupPath,archiveDirPath,true );
            user.suspendUser ( loginData,false,
              '<div style="width:400px"><h2>Archiving failed</h2>Project <b>"' + 
              pDesc.name +  '"</b> was not archived due to errors (fail code ' +
              failcode +'). This is likely to be a consequence of intermittent ' +
              'system failures or program bugs.' +
              '<p>Apologies for any inconvenience this may have caused.</div>'
            );
            log.error ( 4,'project archiving failed, failcode=' + failcode +
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

            // add e-mail to user and maintainer
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

}


// --------------------------------------------------------------------------

function accessArchivedProject ( loginData,data )  {
  let archiveID   = data.archiveID;
  let archPrjPath = findArchivedProject(archiveID)[0];

  // 1. Check that requested project exists in the archive

  if (!archPrjPath)
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code    : 'project_not_found'
    });

  // 2. Check that the project is not already in users' account

  let projectDir = prj.getProjectDirPath ( loginData,archiveID );
  if (utils.dirExists(projectDir))  {
    let pDesc = prj.readProjectDesc ( loginData,archiveID );
    let pList = prj.readProjectList ( loginData,1 );  // this reads new project in
    if (pDesc && pList)  {
      pList.current = pDesc.name;        // make it current
      if (!prj.writeProjectList(loginData,pList))  {
        log.error ( 11,'cannot write project list, login ' + loginData.login );
        return new cmd.Response ( cmd.fe_retcode.ok,'',{
          code : 'error_write_plist'
        });
      }
    }
    let code  = 'already_accessed';
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

    let pList = prj.readProjectList ( loginData,1 );  // this reads new project in
    let pDesc = prj.readProjectDesc ( loginData,archiveID );
    // pList.projects.push ( pDesc );  // should be no need for this
    pList.current = pDesc.name;        // make it current
    if (!prj.writeProjectList(loginData,pList))  {
      log.error ( 12,'cannot write project list, login ' + loginData.login );
      return new cmd.Response ( cmd.fe_retcode.ok,'',{
        code : 'error_write_plist'
      });
    }

  } catch(e)  {

    log.error ( 13,'update project list errors, login ' + loginData.login );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code : 'error_update_plist'
    });

  }

  log.standard ( 10,'accessed archive project ' + archiveID );
  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    code : 'ok'
  });

}


// --------------------------------------------------------------------------

function searchArchive ( loginData,data )  {
  let mlist = [];

  let code = 'ok';
  switch (loadIndex())  {
    case -1 : code = 'archive_unconfigured';  break; 
    case -2 : code = 'archive_corrupt';       break; 
    case  1 : code = 'archive_unindexed';     break;
    default : ;
  }

  if (code=='ok')  {

    let aids = [];
    let filtered = false;

    function __filter_list ( index,key )  {
      if (key && (key in index))  {
        if (!filtered)  {
          aids     = index[key];
          filtered = true;
        } else
          aids     = aids.filter ( Set.prototype.has, new Set(index[key]) );
      }
    }

    __filter_list ( pdb_index     ,data.pdbcode.toUpperCase() ); 
    __filter_list ( prid_index    ,data.prid                  ); 
    __filter_list ( deplogin_index,data.dlogin                );
    __filter_list ( depemail_index,data.demail.toUpperCase()  );
    __filter_list ( doi_index     ,data.doiref.toUpperCase()  );

    let name_lst = comut.replaceAll ( comut.replaceAll ( 
                                      data.dname,'.',' '), ',',' ' ).split(' ');
    for (let i=0;i<name_lst.length;i++)  {
      let name = name_lst[i].trim().toUpperCase();
      if (name.length>=2)
        __filter_list ( depname_index,name );
    }

    for (let i=0;i<data.kwds.length;i++)
      __filter_list ( kwd_index,data.kwds[i].toUpperCase() );

    if ((data.year!='any') && (data.year in depdate_index))  {
      let year_list = depdate_index[data.year];
      let aids1     = [];
      for (let i=0;i<year_list.length;i++)  // loop over months
        aids1 = aids1.concat ( year_list[i] );
      __filter_list ( { 'year' : aids1 },'year' );
    }

    for (let i=0;i<aids.length;i++)
      if (aids[i] in annot_index)
        mlist.push ( annot_index[aids[i]] );

  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    code  : code,
    mlist : mlist
  });

}


// ==========================================================================
// export for use in node

module.exports.archiveProject        = archiveProject;
module.exports.generateIndex         = generateIndex;
module.exports.accessArchivedProject = accessArchivedProject;
module.exports.searchArchive         = searchArchive;
