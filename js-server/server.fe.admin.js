
/*
 *  =================================================================
 *
 *    23.03.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
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
const utils   = require('./server.utils');
const cache   = require('./server.cache');
const groups  = require('./server.fe.groups');
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

  // if ((cfg.name=='client') || (cfg.exeType=='REMOTE'))  {
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
          if (cfg.exeType=='REMOTE')
            body.data.config = cfg;
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

  // cache.printMemoryReport();

  let t0 = performance.now()
  let adminData = {};

  adminData.served    = false;
  adminData.jobsStat  = '';
  adminData.usersInfo = [];
  adminData.groupsInfo = { groups: {} };
  adminData.nodesInfo = {};
  adminData.nodesInfo.FEconfig = {};
  adminData.nodesInfo.ncInfo   = [];
  adminData.usageReportURL     = ustats.getUsageReportURL();
  adminData.nodesInfo.ccp4_version   = conf.CCP4Version();
  adminData.nodesInfo.jscofe_version = cmd.appVersion();

  let uData = user.readUserData ( loginData );
  if ((uData.role!=ud.role_code.admin) && (uData.role!=ud.role_code.localuser))  {
    adminData.jobsStat  = 'Data available only in account with administrative privileges.';
    return new cmd.Response ( cmd.fe_retcode.ok,'',adminData );
  } else  {
    adminData.served    = true;
    adminData.jobsStat  = rj.readJobStats();
    adminData.usersInfo = user.readUsersData();
    adminData.groupsInfo = groups.readGroupsData();

    // Enhance user data with group information
    if (adminData.usersInfo && adminData.usersInfo.userList) {
      for (let i = 0; i < adminData.usersInfo.userList.length; i++) {
        let userDesc = adminData.usersInfo.userList[i];
        let userLoginData = { login: userDesc.login };
        let userGroups = groups.readUserGroups(userLoginData);

        // Add group information to user description
        userDesc.groups = [];
        userDesc.group_count = 0;
        userDesc.leadership_count = 0;
        userDesc.groupRole = 'None';

        if (userGroups.memberships && Object.keys(userGroups.memberships).length > 0) {
          userDesc.group_count = Object.keys(userGroups.memberships).length;
          userDesc.leadership_count = userGroups.leadership ? userGroups.leadership.length : 0;

          let highestRole = 'member';
          for (let groupId in userGroups.memberships) {
            if (adminData.groupsInfo.groups[groupId]) {
              let groupInfo = {
                id: groupId,
                name: adminData.groupsInfo.groups[groupId].name,
                role: userGroups.memberships[groupId].role
              };
              userDesc.groups.push(groupInfo);

              // Determine highest role
              if (userGroups.memberships[groupId].role === 'leader') {
                highestRole = 'leader';
              } else if (userGroups.memberships[groupId].role === 'admin' && highestRole !== 'leader') {
                highestRole = 'admin';
              }
            }
          }

          userDesc.groupRole = highestRole === 'leader' ? 'Leader' : 
                              highestRole === 'admin' ? 'Admin' : 'Member';
        }
      }
    }

    adminData.nodesInfo.FEconfig = conf.getFEConfig();
    getNCData ( adminData.nodesInfo.ncInfo,function(ncInfo){
      let dt = performance.now()-t0;
      log.standard ( 3,'admin data collected in ' + dt.toFixed(3) + 'ms' );
      let response_timing = cmd.getResponseTiming();
      anl.setPerformance ( 'Server response time, ms',
        response_timing.time_sum,response_timing.n_sum,
        response_timing.time_min,response_timing.time_max 
      );
      adminData.memoryReport = cache.memoryReport();
      adminData.memoryReport.forceCacheFill = conf.forceCacheFill();
      adminData.performance  = anl.getFEAnalytics().performance;
      anl.logPerformance ( 'Collecting Admin Data, ms',dt,1 );
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


function getLogFiles ( loginData,data,callback_func )  {
let rdata = null;
  if (data.log_ref==0)  {
    callback_func ( 
      new cmd.Response ( cmd.fe_retcode.ok,'',conf.getFEConfig().getLogFiles() ) 
    );
  } else if (data.log_ref>0)  {
    let ncConfig = conf.getNCConfig ( data.log_ref-1 );
    if (ncConfig)  {
      request({
        uri     : cmd.nc_command.getLogFiles,
        baseUrl : ncConfig.externalURL,
        method  : 'POST',
        body    : {},
        json    : true,
        rejectUnauthorized : conf.getFEConfig().rejectUnauthorized,
        timeout : 10000
      },function(error,response,body){
        if (error)  {
          callback_func ( 
            new cmd.Response ( cmd.fe_retcode.ok,'',{ 
                                ontent: 'Log file was not fetched due to errors' 
                               }) 
          );          
        } else  {
          callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',body.data ) );
        }
      });
    } else
      rdata = { content : 'Wrong server reference (' + data.log_ref + 
                          '), probably a bug' };

  } else
    rdata = { content : 'Wrong server reference (' + data.log_ref + 
                        '), probably a bug' };
  if (rdata)
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rdata ) );
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
module.exports.getLogFiles      = getLogFiles;
module.exports.updateAndRestart = updateAndRestart;
