
/*
 *  =================================================================
 *
 *    23.12.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

//  load system modules
var request = require('request');

//  load application modules
var conf    = require('./server.configuration');
var user    = require('./server.fe.user');
var rj      = require('./server.fe.run_job');
var ustats  = require('./server.fe.usagestats')
var utils   = require('./server.utils');
var cmd     = require('../js-common/common.commands');

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

    adminData.nodesInfo.ncInfo.push ( null );

    startNext();

  } else if (cfg.in_use)  {

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

      if ((!error) && (response.statusCode==200))  {
        adminData.nodesInfo.ncInfo.push ( body.data );
      } else  {
        var nci = {
          'config'         : cfg,
          'jobRegister'    : null,
          'ccp4_version'   : 'unknown',
          'jscofe_version' : cmd.appVersion()
        };
        adminData.nodesInfo.ncInfo.push ( nci );
      }
      startNext();

    });

  } else  {

    var nci = {
      'config'         : cfg,
      'jobRegister'    : null,
      'ccp4_version'   : 'unknown',
      'jscofe_version' : cmd.appVersion()
    };
    adminData.nodesInfo.ncInfo.push ( nci );
    startNext();

  }

}

function getAdminData ( loginData,data,callback_func )  {

  adminData = {};
  adminData.served    = false;
  adminData.jobsStat  = '';
  adminData.usersInfo = [];
  adminData.nodesInfo = {};
  adminData.nodesInfo.FEconfig = {};
  adminData.nodesInfo.ncInfo   = [];
  adminData.usageReportURL     = ustats.getUsageReportURL();
  adminData.nodesInfo.ccp4_version   = conf.CCP4Version();
  adminData.nodesInfo.jscofe_version = cmd.appVersion();

  var uData = user.readUserData ( loginData );
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


function updateAndRestart ( loginData,data )  {

  var uData = user.readUserData ( loginData );
  if (!uData.admin)  {
    log.standard ( 1,'attempt to update and restart from non-administrative account' );
  } else  {
    var FEconfig = conf.getFEConfig();
    if (FEconfig.update_rcode>0)  {
      log.standard ( 2,'update and restart ...' );
      setTimeout ( function(){ process.exit(FEconfig.update_rcode); },100 );
    }
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',{} );

}


// ==========================================================================
// export for use in node
module.exports.getAdminData     = getAdminData;
module.exports.updateAndRestart = updateAndRestart;
