/*
 *  ===========================================================================
 *
 *    31.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.commands.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Server Command Definitions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ===========================================================================
 *
 */

'use strict';

// ============================================================================
// name and version tag

function appName()  { return 'CCP4 Cloud'   }  // application name for reporting

// const jsCoFE_version = '1.7.019 [16.02.2024]';   // for the main server
const jsCoFE_version = '1.7.020 [31.05.2024]';   // for update

function appVersion()  {
  return jsCoFE_version;
}

function splitVersion ( version )  {
// returns [main_version,major_version,minor_version,year,month,day],
// all integers
  let vsplit = version.replace('[','.').replace(']','')
                      .split('.').map(function(item){ return parseInt(item); });
  if (vsplit.length==6)  {
    let year  = vsplit[5];
    vsplit[5] = vsplit[3];
    vsplit[3] = year;
  }
  return vsplit;
}

function compareVersions ( version1,version2 )  {
// returns -1,0,1 if version1<,=,>version2, dates disregarded
  let v1 = splitVersion ( version1 );
  let v2 = splitVersion ( version2 );
  function _compare ( n )  {
    if ((n>=v1.length) || (n>=v2.length))
                           return  0;
    else if (v1[n]<v2[n])  return -1;
    else if (v1[n]>v2[n])  return  1;
                     else  return _compare(n+1);
  }
  return _compare(0);
}

// ============================================================================

const localhost_name = 'localhost';
const projectFileExt = '.ccp4cloud';
const endJobFName    = '__end_job';    // signal file name to end job gracefully
const endJobFName1   = 'stop_file';    // signal file name to end job gracefully

// ============================================================================
// Commands for client - FE Server AJAX exchange. Commands are passed as paths
// of AJAX request urls, and data (typically a stringified JS class) passed as
// request body. 'Commands' relate to actions which do not require a user to
// be logged in.

const fe_command = {
  cofe              : 'cofe',            // load jsCoFE login page
  ignore            : 'ignore',          // special return code from Communicate module
  stop              : 'stop',            // quit the server
  whoareyou         : 'whoareyou',       // request server id
  status            : 'status',          // request server status, e.g., for uptime watchers
  getInfo           : '=getinfo',        // request server metadata
  getLocalInfo      : '=getlocalinfo',   // request local server metadata
  getClientInfo     : '=getclientinfo',  // request client server metadata
  register          : '=register',       // register a new user
  login             : '=login',          // register a new user
  recoverLogin      : '=recover_login',  // recover login details
  request           : '=request',        // general request to server
  upload            : '=upload',         // upload request, hard-coded in gui.upload.js
  jobFinished       : '=job_finished',   // request to accept data from finished job
  cloudRun          : '=cloud_run',      // run job from command prompt on client
  checkSession      : '=check_session',  // request to check session status
  authResponse      : '=auth_response',  // process from software authorisation server
  getFEProxyInfo    : '=getfeproxyinfo', // get FE Proxy config and other info
  checkAnnouncement : '=checkannouncement', // get service announcements
  control           : '=control'         // group of server service functions
};


// ============================================================================
// Request types for specific client - FE Server AJAX request, which require
// user autentication and optional specification of current project and job. All
// 'requests' are subtypes of the fe_command.request command. For each such
// command, a stringified JS class 'Request' (below), which contains request
// type as a field.

const fe_reqtype = {
  logout              : '-logout',            // request to log out
  getUserData         : '-getUserData',       // request for user data
  saveHelpTopics      : '-saveHelpTopics',    // request to save list of help topics
  updateUserData      : '-updateUserData',    // request to update user data
  updateUData_admin   : '-updateUData_admin', // request to update user data by admin
  deleteUser          : '-deleteUser',        // request to delete user account and data
  deleteUser_admin    : '-deleteUser_admin',  // request to delete user account and data by admin
  retireUser_admin    : '-retireUser_admin',  // request to retire user by admin
  resetUser_admin     : '-resetUser_admin',   // request to reset user password by admin
  updateAndRestart    : '-updateAndRestart',  // request to update and restart all servers
  getUserRation       : '-getUserRation',     // request to retrieve current user ration
  getProjectList      : '-getProjectList',    // request for projects list
  getDockData         : '-getDockData',       // request for dock data
  getSharedPrjList    : '-getSharedPrjList',  // request for shared projects list
  deleteProject       : '-deleteProject',     // request to save delete project
  saveProjectList     : '-saveProjectList',   // request to save project list
  saveDockData        : '-saveDockData',      // request to save dock data
  getProjectData      : '-getProjectData',    // request for project data
  // advanceJobCounter : '-advanceJobCounter', // request to advance job counter
  saveProjectData     : '-saveProjectData',   // request to save project data
  preparePrjExport    : '-preparePrjExport',  // request to prepare project for export
  checkPrjExport      : '-checkPrjExport',    // request to check project export state
  finishPrjExport     : '-finishPrjExport',   // request to finish project export
  startDemoImport     : '-startDemoImport',   // request to start demo project import
  startSharedImport   : '-startSharedImport', // request to start shared project import
  archiveProject      : '-archiveProject',    // request to archive project
  accessArchivedPrj   : '-accessArchivedPrj', // request to access archived project
  searchArchive       : '-searchArchive',     // request to search archive
  checkPrjImport      : '-checkPrjImport',    // request to check project import state
  finishPrjImport     : '-finishPrjImport',   // request to finish project import
  prepareJobExport    : '-prepareJobExport',  // request to prepare job for export
  checkJobExport      : '-checkJobExport',    // request to check job export state
  finishJobExport     : '-finishJobExport',   // request to finish job export
  prepareFJobExport   : '-prepareFJobExport', // request to prepare failed job for export
  checkFJobExport     : '-checkFJobExport',   // request to check failed job export state
  finishFJobExport    : '-finishFJobExport',  // request to finish failed job export
  renameProject       : '-renameProject',     // request to rename a project
  cloneProject        : '-cloneProject',      // request to clone a project
  checkCloneProject   : '-checkCloneProject', // request to check project clone state
  importProject       : '-importProject',     // request to save import a project
  shareProjectConfirm : '-shareProjectConfirm', // request to prepare user data to confirm share
  shareProject        : '-shareProject',      // request to share a project
  saveJobData         : '-saveJobData',       // request to save job data
  saveJobFile         : '-saveJobFile',       // request to save file in job directory
  saveJobFiles        : '-saveJobFiles',      // request to save files in job directory
  runJob              : '-runJob',            // request to run job
  replayJob           : '-replayJob',         // request to replay job
  stopJob             : '-stopJob',           // request to stop job
  webappEndJob        : '-webappEndJob',      // request to conclude a webapp job
  checkJobs           : '-checkJobs',         // request to check on jobs' state
  wakeZombieJobs      : '-wakeZombieJobs',    // request to send zombie jobs to FE
  getJobFile          : '-getJobFile',        // request to download a job's file
  getAdminData        : '-getAdminData',      // request to serve data for admin page
  getAnalytics        : '-getAnalytics',      // request to serve analytics data
  sendAnnouncement    : '-sendAnnouncement',  // request to send announcement to users
  manageDormancy      : '-manageDormancy',    // request to manage dormant users
  getUserKnowledge    : '-getUserKnowledge',  // request to send user knowledge data
  getCloudFileTree    : '-getCloudFileTree',  // request for cloud file tree metadata
  saveMyWorkflows     : '-saveMyWorkflows'    // request to save custom workflow descriptions
};


// ============================================================================
// Return codes for client - FE Server AJAX exchange

const fe_retcode = {
  ok             : 'ok',             // everything's good
  largeData      : 'largeData',      // data sent to server is too large
  noProjectData  : 'noProjectData',  // project metadata not found on server
  writeError     : 'writeError',     // data cannot be written on server side
  mkDirError     : 'mkDirError',     // directory cannot be created on server
  readError      : 'readError',      // data cannot be read on server side
  jobballError   : 'jobballError',   // jobbal preparation error on server side
  existingLogin  : 'existingLogin',  // attempt to re-use login name at registration
  corruptDO      : 'corruptDO',      // corrupt data object found
  userNotFound   : 'userNotFound',   // login recovery failed
  userNotDeleted : 'userNotDeleted', // delete user request failed
  corruptJobMeta : 'corruptJobMeta', // corrupt job metadata
  wrongLogin     : 'wrongLogin',     // wrong login data supplied
  suspendedLogin : 'suspendedLogin', // wrong login data supplied
  unconfigured   : 'unconfigured',   // server not configured
  wrongPassword  : 'wrongPassword',  // wrong password given
  notLoggedIn    : 'notLoggedIn',    // request without loggin in
  wrongRequest   : 'wrongRequest',   // unrecognised request
  wrongSession   : 'wrongSession',   // unrecognised session code
  uploadErrors   : 'uploadErrors',   // upload errors
  unpackErrors   : 'unpackErrors',   // unpack errors
  noUploadDir    : 'noUploadDir',    // no upload directory within a job directory
  noTempDir      : 'noTempDir',      // no temporary directory
  noJobDir       : 'noJobDir',       // job directory not found
  noJobRunning   : 'noJobRunning',   // requested job was not found as running
  fileNotFound   : 'fileNotFound',   // file not found
  inProgress     : 'inProgress',     // process in progress
  askPassword    : 'askPassword',    // request password
  regFailed      : 'regFailed',      // user registration failed
  wrongJobToken  : 'wrongJobToken',  // unrecognised job token received
  proxyError     : 'proxyError',     // fe-proxy error
  projectAccess  : 'projectAccess',  // project access denied
  serverInactive : 'serverInactive', // project access denied
  errors         : 'errors'          // common errors
};


// ============================================================================
// Commands for NC Server exchange.

const nc_command = {
  stop           : 'stop',            // quit the server
  countBrowser   : '-countBrowser',   // request to advance browser start counter
  runJob         : '-runJob',         // request to upload job data and run the job
  stopJob        : '-stopJob',        // request to stop a running job
  wakeZombieJobs  : '-wakeZombieJobs',  // request to send zombi jobs to FE
  selectDir      : '-selectDir',      // request to select directory (local service)
  selectFile     : '-selectFile',     // request to select file (local service)
  selectImageDir : '-selectImageDir', // request to select image directory (local service)
  runRVAPIApp    : '-runRVAPIApp',    // run RVAPI helper application (local service)
  runClientJob   : '-runClientJob',   // run client job (local service)
  getNCInfo      : '-getNCInfo',      // get NC config and other info
  getNCCapacity  : '-getNCCapacity',  // get NC current capacity
  sendJobResults : '-sendJobResults'  // request to send job results to 3rd party application
};


// ============================================================================
// Return codes for NC Server exchange

const nc_retcode = {
  ok             : 'ok',             // everything's good
  unkCommand     : 'unkCommand',     // unknown command passed
  mkDirError     : 'mkDirError',     // directory cannot be created on server
  selDirError    : 'selDirError',    // selection directory error (local service)
  uploadErrors   : 'uploadErrors',   // upload errors
  downloadErrors : 'downloadErrors', // download errors
  fileErrors     : 'fileErrors',     // file operations errors
  unpackErrors   : 'unpackErrors',   // unpack errors
  wrongRequest   : 'wrongRequest',   // incomplete or malformed request
  jobNotFound    : 'jobNotFound',    // job token not found in registry
  pidNotFound    : 'pidNotFound'     // job's pid not found in registry
};


// ============================================================================
// Image loader

function image_path ( image_basename )  {
  return './images_png/' + image_basename + '.png';
  /*
  if (typeof __local_setup !== 'undefined' && __local_setup)
        return './images_svg/' + image_basename + '.svg';
  else  return './images_png/' + image_basename + '.png';
  */
}

function activityIcon()  {
  return './images_com/activity.gif';
}

// ============================================================================
// General Request/Response structures for communication with the Front End

const __special_url_tag    = 'xxJsCoFExx';
const __special_fjsafe_tag = 'xxFJSafexx';
const __special_client_tag = 'xxClientxx';

function Response ( status,message,data )  {
  this._type   = 'Response';
  this.version = appVersion();
  this.status  = status;
  this.message = message;
  this.data    = data;
}


Response.prototype.send = function ( server_response )  {
  server_response.writeHead ( 200, {
    'Content-Type'                 : 'text/plain',
    // 'Transfer-Encoding'            : 'deflate, compress, gzip',
    'Access-Control-Allow-Origin'  : '*'
  });
  server_response.end ( JSON.stringify(this) );
}

function sendResponse ( server_response, status,message,data )  {
  let resp = new Response ( status,message,data );
  resp.send ( server_response );
}

function sendResponseMessage ( server_response,message,mimeType )  {
  server_response.writeHead ( 200, {
    'Content-Type'                 : mimeType,
    // 'Transfer-Encoding'            : 'deflate, compress, gzip',
    'Access-Control-Allow-Origin'  : '*'
  });
  server_response.end ( message );
}

function Request ( request,token,data )  {
  this._type   = 'Request';
  this.version = appVersion();
  this.request = request;      // request code from fe_request list
  this.token   = token;        // user login data token
  this.data    = data;         // request data
}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.appName              = appName;
  module.exports.appVersion           = appVersion;
  module.exports.localhost_name       = localhost_name;
  module.exports.image_path           = image_path;
  module.exports.activityIcon         = activityIcon;
  module.exports.fe_command           = fe_command;
  module.exports.fe_reqtype           = fe_reqtype;
  module.exports.fe_retcode           = fe_retcode;
  module.exports.nc_command           = nc_command;
  module.exports.nc_retcode           = nc_retcode;
  module.exports.__special_url_tag    = __special_url_tag;
  module.exports.__special_fjsafe_tag = __special_fjsafe_tag;
  module.exports.__special_client_tag = __special_client_tag;
  module.exports.projectFileExt       = projectFileExt;
  module.exports.endJobFName          = endJobFName;
  module.exports.endJobFName1         = endJobFName1;
  module.exports.Response             = Response;
  module.exports.sendResponse         = sendResponse;
  module.exports.sendResponseMessage  = sendResponseMessage;
  module.exports.Request              = Request;
}
