
/*
 *  =================================================================
 *
 *    20.10.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.request_handler.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Request Handler
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


var user = require('./server.fe.user');
var prj  = require('./server.fe.projects');
var fcl  = require('./server.fe.facilities');
var rj   = require('./server.fe.run_job');
var adm  = require('./server.fe.admin');
var fcl  = require('./server.fe.facilities');
var cmd  = require('../js-common/common.commands');

//  prepare log
//var log = require('./server.log').newLog(7);


// ==========================================================================

function requestHandler ( loginData,request_cmd,data,callback_func )  {
var response = null;

  switch (request_cmd)  {

    case cmd.fe_reqtype.logout :
          response = user.userLogout ( loginData );
        break;

    case cmd.fe_reqtype.getUserData :
          response = user.getUserData ( loginData );
        break;

    case cmd.fe_reqtype.getUserRation :
          response = user.getUserRation ( loginData );
        break;

    case cmd.fe_reqtype.updateUserData :
          response = user.updateUserData ( loginData,data );
        break;

    case cmd.fe_reqtype.updateUData_admin :
          response = user.updateUserData_admin ( loginData,data );
        break;

    case cmd.fe_reqtype.deleteUser :
          response = user.deleteUser ( loginData,data );
        break;

    case cmd.fe_reqtype.deleteUser_admin :
          response = user.deleteUser_admin ( loginData,data );
        break;

    case cmd.fe_reqtype.saveHelpTopics :
          response = user.saveHelpTopics ( loginData,data );
       break;

    case cmd.fe_reqtype.sendAnnouncement :
          response = user.sendAnnouncement ( loginData,data );
       break;

    case cmd.fe_reqtype.manageDormancy :
          response = user.manageDormancy ( loginData,data );
       break;

    case cmd.fe_reqtype.getProjectList :
          response = prj.getProjectList ( loginData );
       break;

    case cmd.fe_reqtype.getUserKnowledge :
          response = prj.getUserKnowledgeData ( loginData );
       break;

    case cmd.fe_reqtype.saveProjectList :
          response = prj.saveProjectList ( loginData,data );
       break;

    case cmd.fe_reqtype.getProjectData :  // returns _current_ project data
          response = prj.getProjectData ( loginData,data );
       break;

    case cmd.fe_reqtype.renameProject :  // returns _current_ project data
          response = prj.renameProject ( loginData,data );
       break;

    case cmd.fe_reqtype.saveProjectData :
          response = prj.saveProjectData ( loginData,data );
       break;

    case cmd.fe_reqtype.preparePrjExport :
          response = prj.prepareProjectExport ( loginData,data );
       break;

    case cmd.fe_reqtype.checkPrjExport :
          response = prj.checkProjectExport ( loginData,data );
       break;

    case cmd.fe_reqtype.finishPrjExport :
          response = prj.finishProjectExport ( loginData,data );
       break;

    case cmd.fe_reqtype.startDemoImport :
          response = prj.startDemoImport ( loginData,data );
       break;

    case cmd.fe_reqtype.checkPrjImport :
          response = prj.checkProjectImport ( loginData,data );
       break;

    case cmd.fe_reqtype.finishPrjImport :
          response = prj.finishProjectImport ( loginData,data );
       break;

    case cmd.fe_reqtype.prepareJobExport :
          response = prj.prepareJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.checkJobExport :
          response = prj.checkJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.finishJobExport :
          response = prj.finishJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.saveJobData :
          response = prj.saveJobData ( loginData,data );
       break;

    case cmd.fe_reqtype.getJobFile :
          response = prj.getJobFile ( loginData,data );
       break;

    case cmd.fe_reqtype.runJob :
          rj.runJob ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.replayJob :
          rj.replayJob ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.checkJobs :
          response = rj.checkJobs ( loginData,data );
       break;

    case cmd.fe_reqtype.stopJob :
          response = rj.stopJob ( loginData,data );
       break;

    case cmd.fe_reqtype.getFacilityData :
          response = fcl.getUserFacilityList ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.updateFacility :
          response = fcl.updateFacility ( loginData,data );
       break;

    case cmd.fe_reqtype.checkFclUpdate :
          response = fcl.checkFacilityUpdate ( loginData,data );
       break;

    case cmd.fe_reqtype.getAdminData :
          response = adm.getAdminData ( loginData,data,callback_func );
       break;

    default: response = new cmd.Response ( cmd.fe_retcode.wrongRequest,
                  '[00001] Unrecognised request <i>"' + request_cmd + '"</i>','' );

  }

  if (response)
    callback_func ( response );

}


// ==========================================================================
// export for use in node
module.exports.requestHandler = requestHandler;
