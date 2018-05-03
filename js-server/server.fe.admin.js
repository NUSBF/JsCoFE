
/*
 *  =================================================================
 *
 *    30.10.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.admin.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Admin Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

/*
//  load system modules
var path      = require('path');
var crypto    = require('crypto');

//  load application modules
var utils     = require('./server.utils');
var user      = require('./server.fe.user');
var prj       = require('./server.fe.projects');
var send_dir  = require('./server.send_dir');
var task_t    = require('../js-common/tasks/common.tasks.template');
var com_utils = require('../js-common/common.utils');
*/

//  load system modules
var request   = require('request');

//  load application modules
var conf      = require('./server.configuration');
var user      = require('./server.fe.user');
var cmd       = require('../js-common/common.commands');
var rj        = require('./server.fe.run_job');

//  prepare log
var log = require('./server.log').newLog(16);

// ===========================================================================

function _getNCData ( adminData,callback_func )  {

  function startNext()  {
    if (adminData.nodesInfo.ncInfo.length<conf.getNumberOfNCs())  {
      _getNCData ( adminData,callback_func );
    } else {
      callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',adminData) );
    }
  }

  var cfg = conf.getNCConfig(adminData.nodesInfo.ncInfo.length);

  if (cfg.name=='client')  {

    /*
    var nci    = {};
    nci.config = {};
    nci.config.name = 'client';
    adminData.nodesInfo.ncInfo.push ( nci );
    */
    adminData.nodesInfo.ncInfo.push ( null );

    startNext();

  } else  {

    var nc_url = cfg.externalURL;
    request({
      uri     : cmd.nc_command.getNCInfo,
      baseUrl : nc_url,
      method  : 'POST',
      body    : '',
      json    : true
    },function(error,response,body){

      //console.log ( error );
      //console.log ( response.statusCode );
      //console.log ( JSON.stringify(response) );
      //console.log ( JSON.stringify(body) );

      if (!error && (response.statusCode==200))  {
        adminData.nodesInfo.ncInfo.push ( body.data );
      } else  {
        var nci = {};
        nci.config = cfg;
        nci.jobRegister = null;
        adminData.nodesInfo.ncInfo.push ( nci );
      }

      startNext();

    });

  }

}

function getAdminData ( login,data,callback_func )  {

  adminData = {};
  adminData.served    = false;
  adminData.jobsStat  = '';
  adminData.usersInfo = [];
  adminData.nodesInfo = {};
  adminData.nodesInfo.FEconfig = {};
  adminData.nodesInfo.ncInfo   = [];

  var uData = user.readUserData ( login );
  if (!uData.admin)  {
    adminData.jobsStat  = 'Data available only in account with administrative privileges.';
    return new cmd.Response ( cmd.fe_retcode.ok,'',adminData );
  } else  {
    adminData.served    = true;
    adminData.jobsStat  = rj.readJobStats();
    adminData.usersInfo = user.readUsersData();
    adminData.nodesInfo.FEconfig = conf.getFEConfig();
    _getNCData ( adminData,callback_func );
    return null;
  }

}

// ==========================================================================
// export for use in node
module.exports.getAdminData  = getAdminData;
