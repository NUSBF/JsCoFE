
/*
 *  =================================================================
 *
 *    24.07.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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

function requestHandler ( login,request_cmd,data,callback_func )  {
var response = null;

  switch (request_cmd)  {

    case cmd.fe_reqtype.logout :
          response = user.userLogout ( login );
        break;

    case cmd.fe_reqtype.getUserData :
          response = user.getUserData ( login );
        break;

    case cmd.fe_reqtype.getUserRation :
          response = user.getUserRation ( login );
        break;

    case cmd.fe_reqtype.updateUserData :
          response = user.updateUserData ( login,data );
        break;

    case cmd.fe_reqtype.deleteUser :
          response = user.deleteUser ( login,data );
        break;

    case cmd.fe_reqtype.saveHelpTopics :
          response = user.saveHelpTopics ( login,data );
       break;

    case cmd.fe_reqtype.sendAnnouncement :
          response = user.sendAnnouncement ( login,data );
       break;

    case cmd.fe_reqtype.getProjectList :
          response = prj.getProjectList ( login );
       break;

    case cmd.fe_reqtype.getUserKnowledge :
          response = prj.getUserKnowledgeData ( login );
       break;

    case cmd.fe_reqtype.saveProjectList :
          response = prj.saveProjectList ( login,data );
       break;

    case cmd.fe_reqtype.getProjectData :  // returns _current_ project data
          response = prj.getProjectData ( login,data );
       break;

    case cmd.fe_reqtype.saveProjectData :
          response = prj.saveProjectData ( login,data );
       break;

    case cmd.fe_reqtype.preparePrjExport :
          response = prj.prepareProjectExport ( login,data );
       break;

    case cmd.fe_reqtype.checkPrjExport :
          response = prj.checkProjectExport ( login,data );
       break;

    case cmd.fe_reqtype.finishPrjExport :
          response = prj.finishProjectExport ( login,data );
       break;

    case cmd.fe_reqtype.checkPrjImport :
          response = prj.checkProjectImport ( login,data );
       break;

    case cmd.fe_reqtype.finishPrjImport :
          response = prj.finishProjectImport ( login,data );
       break;

    case cmd.fe_reqtype.saveJobData :
          response = prj.saveJobData ( login,data );
       break;

    case cmd.fe_reqtype.getJobFile :
          response = prj.getJobFile ( login,data );
       break;

    case cmd.fe_reqtype.runJob :
          rj.runJob ( login,data,callback_func );
       break;

    case cmd.fe_reqtype.replayJob :
          rj.replayJob ( login,data,callback_func );
       break;

    case cmd.fe_reqtype.checkJobs :
          response = rj.checkJobs ( login,data );
       break;

    case cmd.fe_reqtype.stopJob :
          response = rj.stopJob ( login,data );
       break;

    case cmd.fe_reqtype.getFacilityData :
          response = fcl.getUserFacilityList ( login );
       break;

    case cmd.fe_reqtype.updateFacility :
          response = fcl.updateFacility ( login,data );
       break;

    case cmd.fe_reqtype.checkFclUpdate :
          response = fcl.checkFacilityUpdate ( login,data );
       break;

    case cmd.fe_reqtype.getAdminData :
          response = adm.getAdminData ( login,data,callback_func );
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
