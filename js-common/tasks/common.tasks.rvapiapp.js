
/*
 *  =================================================================
 *
 *    15.01.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.rvapiapp.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task Class for starting applications from RVAPI pages
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskRVAPIApp()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskRVAPIApp';
  this.name  = 'rvapiapp';
  this.setOName ( 'rvapiapp' );  // default output file name template
  this.title = 'RVAPI Local Application launcher';

  this.informFE = false;    // end of job and results are not sent back to FE

  this.rvapi_command = '';  // to be set up by client server
  this.rvapi_args    = [];  // to be set up by client server

}

if (__template)
      TaskRVAPIApp.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRVAPIApp.prototype = Object.create ( TaskTemplate.prototype );
TaskRVAPIApp.prototype.constructor = TaskRVAPIApp;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskRVAPIApp.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskRVAPIApp.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskRVAPIApp.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.rvapiapp', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRVAPIApp = TaskRVAPIApp;

}
