
/*
 *  =================================================================
 *
 *    08.11.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

const user    = require('./server.fe.user');
const prj     = require('./server.fe.projects');
const storage = require('./server.fe.storage');
const rj      = require('./server.fe.run_job');
const adm     = require('./server.fe.admin');
const arch    = require('./server.fe.archive');
const cmd     = require('../js-common/common.commands');

//  prepare log
//const log = require('./server.log').newLog(7);


// ==========================================================================

function requestHandler ( loginData,request_cmd,data,callback_func )  {
let response = null;

  switch (request_cmd)  {

    case cmd.fe_reqtype.logout :
          response = user.userLogout ( loginData );
        break;

    case cmd.fe_reqtype.getUserData :
          response = user.getUserData ( loginData );
        break;

    case cmd.fe_reqtype.getUserRation :
          user.getUserRation ( loginData,data,callback_func );
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

    case cmd.fe_reqtype.retireUser_admin :
          response = user.retireUser_admin ( loginData,data );
        break;

    case cmd.fe_reqtype.resetUser_admin :
          response = user.resetUser_admin ( loginData,data );
        break;

    case cmd.fe_reqtype.updateAndRestart :
          response = adm.updateAndRestart ( loginData,data );
        break;

    case cmd.fe_reqtype.saveHelpTopics :
          response = user.saveHelpTopics ( loginData,data );
       break;

    case cmd.fe_reqtype.sendMailToAllUsers :
          response = user.sendMailToAllUsers ( loginData,data );
       break;

    case cmd.fe_reqtype.makeAnnouncement :
          response = user.makeAnnouncement ( loginData,data );
       break;

    case cmd.fe_reqtype.manageDormancy :
          response = user.manageDormancy ( loginData,data );
       break;

    case cmd.fe_reqtype.saveMyWorkflows :
          response = user.saveMyWorkflows ( loginData,data );
       break;

    case cmd.fe_reqtype.getProjectList :
          response = prj.getProjectList ( loginData );
       break;

    case cmd.fe_reqtype.getDockData :
          response = prj.getDockData ( loginData );
       break;

    case cmd.fe_reqtype.getSharedPrjList :
          response = prj.getSharedPrjList ( loginData );
       break;

    case cmd.fe_reqtype.getUserKnowledge :
          response = prj.getUserKnowledgeData ( loginData );
       break;

    case cmd.fe_reqtype.saveProjectList :
          response = prj.saveProjectList ( loginData,data );
       break;

    case cmd.fe_reqtype.deleteProject :
          response = prj.deleteProject ( loginData,data );
       break;

    case cmd.fe_reqtype.saveDockData :
          response = prj.saveDockData ( loginData,data );
       break;

    case cmd.fe_reqtype.getProjectData :  // returns _current_ project data
          response = prj.getProjectData ( loginData,data );
       break;

    case cmd.fe_reqtype.renameProject :  // returns _current_ project data
          response = prj.renameProject ( loginData,data );
       break;

    case cmd.fe_reqtype.cloneProject :
          response = prj.cloneProject ( loginData,data );
       break;

    case cmd.fe_reqtype.checkCloneProject :
          response = prj.checkCloneProject ( loginData,data );
       break;

    // case cmd.fe_reqtype.advanceJobCounter :
    //       response = prj.advanceJobCounter ( loginData,data );
    //    break;

    case cmd.fe_reqtype.saveProjectData :
          response = prj.saveProjectData ( loginData,data );
       break;

    case cmd.fe_reqtype.shareProjectConfirm :
          response = prj.shareProjectConfirm ( loginData,data );
       break;

   case cmd.fe_reqtype.shareProject :
          response = prj.shareProject ( loginData,data );
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

    case cmd.fe_reqtype.startSharedImport :
           response = prj.startSharedImport ( loginData,data );
       break;

    case cmd.fe_reqtype.archiveProject :
           arch.archiveProject ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.accessArchivedPrj :
           response = arch.accessArchivedProject ( loginData,data );
       break;

    case cmd.fe_reqtype.searchArchive :
           response = arch.searchArchive ( loginData,data );
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

    case cmd.fe_reqtype.prepareFJobExport :
          response = prj.prepareFailedJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.checkFJobExport :
          response = prj.checkFailedJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.finishFJobExport :
          response = prj.finishFailedJobExport ( loginData,data );
       break;

    case cmd.fe_reqtype.saveJobData :
          response = prj.saveJobData ( loginData,data );
       break;

    case cmd.fe_reqtype.saveJobFile :
          response = prj.saveJobFile ( loginData,data );
       break;

    case cmd.fe_reqtype.saveJobFiles :
          response = prj.saveJobFiles ( loginData,data );
       break;

    case cmd.fe_reqtype.getJobFile :
          response = prj.getJobFile ( loginData,data );
       break;

    case cmd.fe_reqtype.runJob :
          rj.runJob ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.checkJobs :
          response = rj.checkJobs ( loginData,data );
       break;

    case cmd.fe_reqtype.wakeZombieJobs :
          rj.wakeZombieJobs ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.stopJob :
          response = rj.stopJob ( loginData,data );
       break;

    case cmd.fe_reqtype.webappEndJob :
         response = rj.webappEndJob ( loginData,data,callback_func );
      break;

    case cmd.fe_reqtype.getCloudFileTree :
          storage.getCloudFileTree ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.getAdminData :
          response = adm.getAdminData ( loginData,data,callback_func );
       break;

    case cmd.fe_reqtype.getAnalytics :
          response = adm.getAnalytics ( loginData,data );
       break;

    default: response = new cmd.Response ( cmd.fe_retcode.wrongRequest,
                  '[00001] Unrecognised request <i>"' + request_cmd + '"</i>','' );

  }

  if (response)
    callback_func ( response );
  else  {
    switch (request_cmd)  {
      case cmd.fe_reqtype.runJob           :
      case cmd.fe_reqtype.webappEndJob     :
      case cmd.fe_reqtype.getCloudFileTree :
      case cmd.fe_reqtype.getAdminData     :
      case cmd.fe_reqtype.getUserRation    :
      case cmd.fe_reqtype.wakeZombieJobs   :
      case cmd.fe_reqtype.archiveProject   :
            break;
      default : console.log ( ' <<<<<>>>>> null response to ' + request_cmd );
    }
  }

}


// ==========================================================================
// export for use in node
module.exports.requestHandler = requestHandler;
