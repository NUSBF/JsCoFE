
/*
 *  =================================================================
 *
 *    23.03.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
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
const groups  = require('./server.fe.groups');
const cmd     = require('../js-common/common.commands');

//  prepare log
//const log = require('./server.log').newLog(7);


// ==========================================================================

function requestHandler ( loginData,request_cmd,data,callback_func )  {
  let response = null;
  let callbackCalled = false;
  
  // Define timeout duration and check if this is a group operation
  const timeoutDuration = 60000; // 60 seconds (60,000 ms)
  const isGroupOperation = request_cmd && (
    request_cmd === cmd.fe_reqtype.createGroup ||
    request_cmd === cmd.fe_reqtype.deleteGroup ||
    request_cmd === cmd.fe_reqtype.getAllGroups ||
    request_cmd === cmd.fe_reqtype.getUserGroups ||
    request_cmd === cmd.fe_reqtype.inviteToGroup ||
    request_cmd === cmd.fe_reqtype.acceptInvitation ||
    request_cmd === cmd.fe_reqtype.getGroupMembers ||
    request_cmd === cmd.fe_reqtype.getAccessibleProjects ||
    request_cmd === cmd.fe_reqtype.updateUserGroups
  );
  
  // Create a wrapper for the callback function to ensure it's only called once
  const safeCallback = function(resp) {
    if (!callbackCalled) {
      callbackCalled = true;
      callback_func(resp);
    }
  };
  
  const timeoutId = setTimeout(() => {
    if (!callbackCalled) {
      console.log(`Request timeout for ${request_cmd} - forcing response after ${timeoutDuration/1000} seconds`);
      
      let timeoutMessage = 'Server operation timed out. Please try again.';
      
      // Provide more specific message for group operations
      if (isGroupOperation) {
        timeoutMessage = 'Group operation timed out. Group operations may take longer to complete due to file operations. Please try again and allow more time for the operation to complete.';
      }
      
      safeCallback(new cmd.Response(
        cmd.fe_retcode.errors, 
        timeoutMessage, 
        ''
      ));
    }
  }, timeoutDuration);
  switch (request_cmd)  {

    case cmd.fe_reqtype.logout :
          response = user.userLogout ( loginData );
        break;

    case cmd.fe_reqtype.getUserData :
          response = user.getUserData ( loginData );
        break;

    case cmd.fe_reqtype.getUserRation :
          user.getUserRation ( loginData,data,safeCallback );
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
           arch.archiveProject ( loginData,data,safeCallback );
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
          rj.runJob ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.checkJobs :
          response = rj.checkJobs ( loginData,data );
       break;

    case cmd.fe_reqtype.wakeZombieJobs :
          rj.wakeZombieJobs ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.stopJob :
          response = rj.stopJob ( loginData,data );
       break;

    case cmd.fe_reqtype.webappEndJob :
         response = rj.webappEndJob ( loginData,data,safeCallback );
      break;

    case cmd.fe_reqtype.getCloudFileTree :
          storage.getCloudFileTree ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.getAdminData :
          response = adm.getAdminData ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.getAnalytics :
          response = adm.getAnalytics ( loginData,data );
       break;

    case cmd.fe_reqtype.getLogFiles :
         adm.getLogFiles ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.createGroup :
         console.log('[DEBUG] Server - request_handler - Received createGroup request');
         console.log('[DEBUG] Server - request_handler - Request data:', JSON.stringify(data));
         console.log('[DEBUG] Server - request_handler - Login data:', JSON.stringify(loginData));
         groups.createGroup ( loginData,data,safeCallback );
         console.log('[DEBUG] Server - request_handler - createGroup function called');
       break;

    case cmd.fe_reqtype.deleteGroup :
         groups.deleteGroup ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.getAllGroups :
         groups.getAllGroups ( loginData,safeCallback );
       break;

    case cmd.fe_reqtype.getUserGroups :
         groups.getUserGroups ( loginData,safeCallback );
       break;

    case cmd.fe_reqtype.inviteToGroup :
         groups.inviteToGroup ( loginData,data,safeCallback );
       break;

    case cmd.fe_reqtype.acceptInvitation :
         groups.acceptInvitation ( loginData,data.inviteCode,safeCallback );
       break;

    case cmd.fe_reqtype.getGroupMembers :
         groups.getGroupMembers ( loginData,data.groupId,safeCallback );
       break;

    case cmd.fe_reqtype.getAccessibleProjects :
         groups.getAccessibleProjects ( loginData,safeCallback );
       break;

    case cmd.fe_reqtype.updateUserGroups :
         groups.updateUserGroupMembership ( loginData,data,safeCallback );
       break;

    default: 
          // Provide more detailed error information
          let validRequestTypes = Object.keys(cmd.fe_reqtype).join(', ');
          let errorMessage = '[00001xxxxx] Unrecognised request <i>"' + request_cmd + '"</i><br><br>' +
                            'This request type is not recognized by the server. Please check:<br>' +
                            '1. The request type is spelled correctly<br>' +
                            '2. The request format is correct (should start with "-")<br>' +
                            '3. The request is properly formatted in the client code<br><br>' +
                            'If you are a developer, ensure the request type is defined in common.commands.js';
          
          console.log('Unrecognized request received: ' + request_cmd);
          response = new cmd.Response(cmd.fe_retcode.wrongRequest, errorMessage, '');

  }

  // Clear the timeout since we're about to respond
  clearTimeout(timeoutId);
  
  if (response) {
    safeCallback(response);
  } else {
    switch (request_cmd) {
      // All these operations now use safeCallback, so we don't need to do anything here
      // They will call safeCallback directly with their results
      case cmd.fe_reqtype.runJob           :
      case cmd.fe_reqtype.webappEndJob     :
      case cmd.fe_reqtype.getCloudFileTree :
      case cmd.fe_reqtype.getAdminData     :
      case cmd.fe_reqtype.getUserRation    :
      case cmd.fe_reqtype.wakeZombieJobs   :
      case cmd.fe_reqtype.archiveProject   :
      case cmd.fe_reqtype.getLogFiles      :
      case cmd.fe_reqtype.createGroup      :
      case cmd.fe_reqtype.deleteGroup      :
      case cmd.fe_reqtype.getAllGroups     :
      case cmd.fe_reqtype.getUserGroups    :
      case cmd.fe_reqtype.inviteToGroup    :
      case cmd.fe_reqtype.acceptInvitation :
      case cmd.fe_reqtype.getGroupMembers  :
      case cmd.fe_reqtype.getAccessibleProjects :
      case cmd.fe_reqtype.updateUserGroups :
            break;
      default : 
            console.log ( ' <<<<<>>>>> null response to ' + request_cmd );
            // Send a response to prevent client from waiting indefinitely
            let errorMessage = 'Server did not generate a response for request: ' + request_cmd;
            console.log(errorMessage);
            safeCallback(new cmd.Response(cmd.fe_retcode.errors, errorMessage, ''));
    }
  }

}


// ==========================================================================
// export for use in node
module.exports.requestHandler = requestHandler;
