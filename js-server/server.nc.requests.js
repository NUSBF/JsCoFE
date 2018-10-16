
/*
 *  =================================================================
 *
 *    15.10.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
//var child_process = require('child_process');

//  load application modules
var conf  = require('./server.configuration');
var utils = require('./server.utils');
var cmd   = require('../js-common/common.commands');
var jm    = require('./server.nc.job_manager');

//  prepare log
var log  = require('./server.log').newLog(15);


// ===========================================================================

function ncSelectDir ( post_data_obj,callback_func )  {

//  console.log ( ' request='+JSON.stringify(post_data_obj));

  var job = utils.spawn ( conf.pythonName(),
                          ['-m', 'pycofe.varut.selectdir', post_data_obj.title],
                          {} );

  // make stdout and stderr catchers for debugging purposes
  var stdout = '';
  var stderr = '';
  job.stdout.on('data', function(buf) {
    stdout += buf;
  });
  job.stderr.on('data', function(buf) {
    stderr += buf;
  });

  job.on('close',function(code){

    if (code==0)
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',
                                     {'directory':stdout.replace('\n','')} ) );
    else
      callback_func ( new cmd.Response ( cmd.nc_retcode.selDirError,'',
                                         {'stdout':stdout,'stderr':stderr }) );

  });

}


// ===========================================================================

function ncSelectImageDir ( post_data_obj,callback_func )  {

//  console.log ( ' request='+JSON.stringify(post_data_obj));

  var job = utils.spawn ( conf.pythonName(),
                          ['-m', 'pycofe.varut.select_image_dir', post_data_obj.title],
                          {} );

  // make stdout and stderr catchers for debugging purposes
  var stdout = '';
  var stderr = '';
  job.stdout.on('data', function(buf) {
    stdout += buf;
  });
  job.stderr.on('data', function(buf) {
    stderr += buf;
  });

  job.on('close',function(code){

    if (code==0)  {
      var meta    = JSON.parse ( stdout );
      var dirPath = meta['path'];
      callback_func ( new cmd.Response ( cmd.nc_retcode.ok,'',
                                     {'directory':dirPath.replace('\n','')} ) );
    } else
      callback_func ( new cmd.Response ( cmd.nc_retcode.selDirError,'',
                                         {'stdout':stdout,'stderr':stderr }) );

  });

}


// ==========================================================================

function ncGetInfo ( server_request,server_response )  {

  var ncInfo = {};
  ncInfo.config      = conf.getServerConfig();
  ncInfo.jobRegister = {};
  var jobRegister    = jm.readNCJobRegister();
  ncInfo.jobRegister.launch_count = jobRegister.launch_count;
  ncInfo.jobRegister.job_map      = jobRegister.job_map;

  return new cmd.Response (  cmd.nc_retcode.ok,'',ncInfo );

}


// ==========================================================================
// export for use in node
module.exports.ncSelectDir      = ncSelectDir;
module.exports.ncSelectImageDir = ncSelectImageDir;
module.exports.ncGetInfo        = ncGetInfo;
