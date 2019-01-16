
/*
 *  ===========================================================================
 *
 *    16.01.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.commands.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Server Command Definitions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  ===========================================================================
 *
 */


// ============================================================================
// name and version tag

function appName()  { return 'CCP4 Cloud' }
var jsCoFE_version = '0.2.0 [16.01.2019]';


// ============================================================================
// Commands for client - FE Server AJAX exchange. Commands are passed as paths
// of AJAX request urls, and data (typically a stringified JS class) passed as
// request body. 'Commands' relate to actions which do not require a user to
// be logged in.

var fe_command = {
  cofe         : 'cofe',           // load jsCoFE login page
  stop         : 'stop',           // quit the server
  getInfo      : '=getinfo',       // register a new user
  register     : '=register',      // register a new user
  login        : '=login',         // register a new user
  recoverLogin : '=recover_login', // recover login details
  request      : '=request',       // general request to server
  upload       : '=upload',        // upload request, hard-coded in gui.upload.js
  jobFinished  : '=job_finished'   // request to accept data from finished job
}


// ============================================================================
// Request types for specific client - FE Server AJAX request, which require
// user autentication and optional specification of current project and job. All
// 'requests' are subtypes of the fe_command.request command. For each such
// command, a stringified JS class 'Request' (below), which contains request
// type as a field.

var fe_reqtype = {
  logout            : '-logout',            // request to log out
  getUserData       : '-getUserData',       // request for user data
  saveHelpTopics    : '-saveHelpTopics',    // request to save list of help topics
  updateUserData    : '-updateUserData',    // request to update user data
  updateUData_admin : '-updateUData_admin', // request to update user data by admin
  deleteUser        : '-deleteUser',        // request to delete user account and data
  deleteUser_admin  : '-deleteUser_admin',  // request to delete user account and data by admin
  getUserRation     : '-getUserRation',     // request to retrieve current user ration
  getProjectList    : '-getProjectList',    // request for project list
  saveProjectList   : '-saveProjectList',   // request to save project list
  getProjectData    : '-getProjectData',    // request for project data
  saveProjectData   : '-saveProjectData',   // request to save project data
  preparePrjExport  : '-preparePrjExport',  // request to prepare project for export
  checkPrjExport    : '-checkPrjExport',    // request to check project export state
  finishPrjExport   : '-finishPrjExport',   // request to finish project export
  checkPrjImport    : '-checkPrjImport',    // request to check project import state
  finishPrjImport   : '-finishPrjImport',   // request to finish project import
  importProject     : '-importProject',     // request to save import a project
  saveJobData       : '-saveJobData',       // request to save job data
  runJob            : '-runJob',            // request to run job
  replayJob         : '-replayJob',         // request to replay job
  stopJob           : '-stopJob',           // request to stop job
  checkJobs         : '-checkJobs',         // request to check on jobs' state
  getJobFile        : '-getJobFile',        // request to download a job's file
  getAdminData      : '-getAdminData',      // request to serve data for admin page
  sendAnnouncement  : '-sendAnnouncement',  // request to send announcement to users
  getUserKnowledge  : '-getUserKnowledge',  // request to send user knowledge data
  getFacilityData   : '-getFacilityData',   // request for facility metadata
  updateFacility    : '-updateFacility',    // request to update facility metadata
  checkFclUpdate    : '-checkFclUpdate'     // request to check facility update
}


// ============================================================================
// Return codes for client - FE Server AJAX exchange

var fe_retcode = {
  ok             : 'ok',             // everything's good
  largeData      : 'largeData',      // data sent to server is too large
  writeError     : 'writeError',     // data cannot be written on server side
  mkDirError     : 'mkDirError',     // directory cannot be created on server
  readError      : 'readError',      // data cannot be read on server side
  jobballError   : 'jobballError',   // jobbal preparation error on server side
  existingLogin  : 'existingLogin',  // attempt to re-use login name at registration
  userNotFound   : 'userNotFound',   // login recovery failed
  userNotDeleted : 'userNotDeleted', // delete user request failed
  corruptJobMeta : 'corruptJobMeta', // corrupt job metadata
  wrongLogin     : 'wrongLogin',     // wrong login data supplied
  unconfigured   : 'unconfigured',   // server not configured
  wrongPassword  : 'wrongPassword',  // wrong password given
  notLoggedIn    : 'notLoggedIn',    // request without loggin in
  wrongRequest   : 'wrongRequest',   // unrecognised request
  uploadErrors   : 'uploadErrors',   // upload errors
  noUploadDir    : 'noUploadDir',    // no upload directory within a job directory
  noTempDir      : 'noTempDir',      // no temporary directory
  noJobDir       : 'noJobDir',       // job directory not found
  noJobRunning   : 'noJobRunning',   // requested job was not found as running
  fileNotFound   : 'fileNotFound',   // file not found
  inProgress     : 'inProgress',     // process in progress
  askPassword    : 'askPassword'     // request password
}


// ============================================================================
// Commands for NC Server exchange.

var nc_command = {
  stop           : 'stop',            // quit the server
  runJob         : '-runJob',         // request to upload job data and run the job
  stopJob        : '-stopJob',        // request to stop a running job
  selectDir      : '-selectDir',      // request to select directory (local service)
  selectImageDir : '-selectImageDir', // request to select image directory (local service)
  runRVAPIApp    : '-runRVAPIApp',    // run RVAPI helper application (local service)
  runClientJob   : '-runClientJob',   // run client job (local service)
  getNCInfo      : '-getNCInfo'       // get NC config and other info
}


// ============================================================================
// Return codes for NC Server exchange

var nc_retcode = {
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
}

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

// ============================================================================
// General Request/Response structures for communication with the Front End

var special_url_tag = 'xxJsCoFExx';

function Response ( status,message,data )  {
  this._type   = 'Response';
  this.version = jsCoFE_version;
  this.status  = status;
  this.message = message;
  this.data    = data;
}

Response.prototype.send = function ( server_response )  {
  server_response.writeHead ( 200, {'Content-Type': 'text/plain',
                                    'Access-Control-Allow-Origin':'*' } );
  server_response.end ( JSON.stringify(this) );
}

function sendResponse ( server_response, status,message,data )  {
var resp = new Response ( status,message,data );
  resp.send ( server_response );
}


function Request ( request,token,data )  {
  this._type   = 'Request';
  this.version = jsCoFE_version;
  this.request = request;      // request code from fe_request list
  this.token   = token;        // user login data token
  this.data    = data;         // request data
}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.appName         = appName;
  module.exports.image_path      = image_path;
  module.exports.fe_command      = fe_command;
  module.exports.fe_reqtype      = fe_reqtype;
  module.exports.fe_retcode      = fe_retcode;
  module.exports.nc_command      = nc_command;
  module.exports.nc_retcode      = nc_retcode;
  module.exports.special_url_tag = special_url_tag;
  module.exports.Response        = Response;
  module.exports.sendResponse    = sendResponse;
  module.exports.Request         = Request;
}
