
/*
 *  =================================================================
 *
 *    22.09.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const request = require('request');

//  load application modules
const conf    = require('./server.configuration');
const anl     = require('./server.fe.analytics');
const user    = require('./server.fe.user');
const rj      = require('./server.fe.run_job');
const ustats  = require('./server.fe.usagestats')
// const utils   = require('./server.utils');
const cmd     = require('../js-common/common.commands');
const ud      = require('../js-common/common.data_user');

//  prepare log
const log = require('./server.log').newLog(16);


// ===========================================================================

function getNCData ( ncInfo,callback_func )  {

  function startNext()  {
    if (ncInfo.length<conf.getNumberOfNCs())  {
      getNCData ( ncInfo,callback_func );
    } else {
      callback_func ( ncInfo );
    }
  }

  let cfg = conf.getNCConfig(ncInfo.length);

  if (cfg.name=='client')  {

    ncInfo.push ( null );
    startNext();

  } else if (cfg.in_use)  {

    let nc_url = cfg.externalURL;

    try {  // request may crash at timeouts!

      request({
        uri     : cmd.nc_command.getNCInfo,
        baseUrl : nc_url,
        method  : 'POST',
        body    : '',
        json    : true,
        rejectUnauthorized : conf.getFEConfig().rejectUnauthorized,
        timeout : 1000
      },function(error,response,body){

        //console.log ( error );
        //console.log ( response.statusCode );
        //console.log ( JSON.stringify(response) );
        //console.log ( JSON.stringify(body) );

        if ((!error) && (response.statusCode==200))  {
          ncInfo.push ( body.data );
        } else  {
          let nci = {
            'config'         : cfg,
            'jobRegister'    : null,
            'ccp4_version'   : 'unknown',
            'jscofe_version' : cmd.appVersion()
          };
          ncInfo.push ( nci );
        }
        startNext();

      });

    } catch(err)  {

      let nci = {
        'config'         : cfg,
        'jobRegister'    : null,
        'ccp4_version'   : 'unknown',
        'jscofe_version' : cmd.appVersion()
      };
      ncInfo.push ( nci );
      startNext();

    }

  } else  {

    let nci = {
      'config'         : cfg,
      'jobRegister'    : null,
      'ccp4_version'   : 'unknown',
      'jscofe_version' : cmd.appVersion()
    };
    ncInfo.push ( nci );
    startNext();

  }

}

function getAdminData ( loginData,data,callback_func )  {
// the 'data' parameter must be where it is

  let t0 = performance.now()
  let adminData = {};

  adminData.served    = false;
  adminData.jobsStat  = '';
  adminData.usersInfo = [];
  adminData.nodesInfo = {};
  adminData.nodesInfo.FEconfig = {};
  adminData.nodesInfo.ncInfo   = [];
  adminData.usageReportURL     = ustats.getUsageReportURL();
  adminData.nodesInfo.ccp4_version   = conf.CCP4Version();
  adminData.nodesInfo.jscofe_version = cmd.appVersion();

let t1 = performance.now();  let dt1 = t1-t0;  console.log ( ' >>>>>> dt1=' + dt1 );  
  let uData = user.readUserData ( loginData );
let t2 = performance.now();  let dt2 = t2-t1;  console.log ( ' >>>>>> dt2=' + dt2 );  
  if ((uData.role!=ud.role_code.admin) && (uData.role!=ud.role_code.localuser))  {
    adminData.jobsStat  = 'Data available only in account with administrative privileges.';
    return new cmd.Response ( cmd.fe_retcode.ok,'',adminData );
  } else  {
    adminData.served    = true;
    adminData.jobsStat  = rj.readJobStats();
let t3 = performance.now();  let dt3 = t3-t2;  console.log ( ' >>>>>> dt3=' + dt3 );  
    adminData.usersInfo = user.readUsersData();
let t4 = performance.now();  let dt4 = t4-t3;  console.log ( ' >>>>>> dt4=' + dt4 );  
    adminData.nodesInfo.FEconfig = conf.getFEConfig();
    getNCData ( adminData.nodesInfo.ncInfo,function(ncInfo){
      let dt = performance.now()-t0;
      log.standard ( 3,'admin data collected in ' + dt.toFixed(3) + 'ms' );
      callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',adminData,'getAdminData') );
    });
    //_getNCData ( adminData,callback_func );
    return null;
  }

}


function getAnalytics ( loginData,data )  {
let uData = user.readUserData ( loginData );
let rdata = {};

  anl.writeFEAnalytics();
  if ((uData.role!=ud.role_code.admin) && ((uData.role!=ud.role_code.localuser)))  {
    rdata.served = false;
    rdata.code   = 'Data available only in account with administrative privileges.';
  } else  {
    rdata = anl.getFEAnalytics().getReport();
    rdata.served = true;
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

}


function updateAndRestart ( loginData,data )  {

  let uData = user.readUserData ( loginData );
  if (uData.role!=ud.role_code.admin)  {
    log.standard ( 1,'attempt to update and restart from non-administrative account' );
  } else  {
    let FEconfig = conf.getFEConfig();
    if (FEconfig.update_rcode>0)  {
      log.standard ( 2,'update and restart ...' );
      setTimeout ( function(){ process.exit(FEconfig.update_rcode); },1000 );
    }
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',{} );

}


// ==========================================================================
// export for use in node
module.exports.getNCData        = getNCData;
module.exports.getAdminData     = getAdminData;
module.exports.getAnalytics     = getAnalytics;
module.exports.updateAndRestart = updateAndRestart;
