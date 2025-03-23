
/*
 *  =================================================================
 *
 *    23.03.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.nc.requests.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Number Cruncher Server -- Requests Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const path   = require('path');

//  load application modules
const conf   = require('./server.configuration');
const utils  = require('./server.utils');
const jm     = require('./server.nc.job_manager');
const cmd    = require('../js-common/common.commands');
const task_t = require('../js-common/tasks/common.tasks.template');

//  prepare log
const log  = require('./server.log').newLog(15);


// ===========================================================================

function ncSelectDir ( post_data_obj,callback_func )  {

//  console.log ( ' request='+JSON.stringify(post_data_obj));

  let job = utils.spawn ( conf.pythonName(),
                          ['-m', 'pycofe.varut.selectdir', post_data_obj.title],
                          {} );

  // make stdout and stderr catchers for debugging purposes
  let stdout = '';
  let stderr = '';
  job.stdout.on('data', function(buf) {
    stdout += buf;
  });
  job.stderr.on('data', function(buf) {
    stderr += buf;
  });

  job.on('close',function(code){

    //if (code==0)
    if (!code)
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',
                                     {'directory':stdout.replace('\n','')} ) );
    else
      callback_func ( new cmd.Response ( cmd.nc_retcode.selDirError,'',
                                         {'stdout':stdout,'stderr':stderr }) );

  });

}


// ===========================================================================

function ncSelectFile ( post_data_obj,callback_func )  {

  //console.log ( ' request='+JSON.stringify(post_data_obj));

  let job = utils.spawn ( conf.pythonName(),
                          ['-m', 'pycofe.varut.selectfile',
                           post_data_obj.title,post_data_obj.filters],
                          {} );

  // make stdout and stderr catchers for debugging purposes
  let stdout = '';
  let stderr = '';
  job.stdout.on('data', function(buf) {
    stdout += buf;
  });
  job.stderr.on('data', function(buf) {
    stderr += buf;
  });

  job.on('close',function(code){

//    if (code==0)
    if (!code)
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',
                                         {'file':stdout.replace('\n','')} ) );
    else
      callback_func ( new cmd.Response ( cmd.nc_retcode.selDirError,'',
                                         {'stdout':stdout,'stderr':stderr }) );

  });

}


// ===========================================================================

function ncSelectImageDir ( post_data_obj,callback_func )  {

//  console.log ( ' request='+JSON.stringify(post_data_obj));

  let job = utils.spawn ( conf.pythonName(),
                          ['-m', 'pycofe.varut.select_image_dir', post_data_obj.title],
                          {} );

  // make stdout and stderr catchers for debugging purposes
  let stdout = '';
  let stderr = '';
  job.stdout.on('data', function(buf) {
    stdout += buf;
  });
  job.stderr.on('data', function(buf) {
    stderr += buf;
  });

  job.on('close',function(code){

//    if (code==0)  {
    if (!code)  {
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',JSON.parse(stdout) ) );
      /*
      let meta    = JSON.parse ( stdout );
      let dirPath = meta['path'];
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',
                                     {'directory':dirPath.replace('\n','')} ) );
      */
    } else
      callback_func ( new cmd.Response ( cmd.nc_retcode.selDirError,'',
                                         {'stdout':stdout,'stderr':stderr }) );

  });

}


// ==========================================================================

function ncGetInfo ( server_request,server_response )  {

  function checkFile ( fpath )  {
    let flist = fpath.split('/');
    let ok    = true;
    let vpath = null;
    for (let i=0;(i<flist.length) && ok;i++)  {
      if (flist[i].startsWith('$'))  {
        let vname = flist[i].substring(1);
        if (vname in process.env)  flist[i] = process.env[vname];
                             else  ok = false;
      }
      if (!vpath)  vpath = flist[i];
             else  vpath = path.join ( vpath,flist[i] );
    }
    if (!ok)
      return null;
    return utils.fileExists(vpath);
  }

  let ncInfo = {};
  ncInfo.config      = conf.getServerConfig();
  ncInfo.jobRegister = {};
  let jobRegister    = jm.readNCJobRegister ( 1 );
  ncInfo.jobRegister.launch_count = jobRegister.launch_count;
  ncInfo.jobRegister.job_map      = jobRegister.job_map;
  ncInfo.ccp4_version   = conf.CCP4Version();
  ncInfo.jscofe_version = cmd.appVersion();
  ncInfo.environ = [];
  for (let i=0;i<task_t.keyEnvironment.length;i++)
    if ((task_t.keyEnvironment[i] in process.env) ||
        checkFile(task_t.keyEnvironment[i]))
      ncInfo.environ.push ( task_t.keyEnvironment[i] );

//$CCP4/lib/py2/morda/LINKED
//$CCP4/share/mrd_data/VERSION

  return new cmd.Response ( cmd.nc_retcode.ok,'',ncInfo );

}


function ncGetCapacity ( server_request,server_response )  {
  jm.calcCapacity ( function(current_capacity){
    let response = new cmd.Response ( cmd.nc_retcode.ok,'',{
      'capacity'         : conf.getServerConfig().capacity,
      'current_capacity' : current_capacity
    });
    response.send ( server_response );
  });
}


function getLogFiles ( post_data_obj,callback_func )  {
  // console.log ( ' >>>>> ' + JSON.stringify(conf.getServerConfig().getLogFiles()))
  callback_func ( 
    new cmd.Response ( cmd.nc_retcode.ok,'',conf.getServerConfig().getLogFiles() )
  );
}


// ==========================================================================
// export for use in node
module.exports.ncSelectDir      = ncSelectDir;
module.exports.ncSelectFile     = ncSelectFile;
module.exports.ncSelectImageDir = ncSelectImageDir;
module.exports.ncGetInfo        = ncGetInfo;
module.exports.ncGetCapacity    = ncGetCapacity;
module.exports.getLogFiles      = getLogFiles;
