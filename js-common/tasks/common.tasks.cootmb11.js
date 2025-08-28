/*
 * ------------------------------------------------------------------------
 * file js-common/tasks/common.tasks.cootmb11.js
 * ------------------------------------------------------------------------
 */

var __template = null; // null __template indicates that the code runs in
                       // client browser

// otherwise, the code runs on a server, in which case __template references
// a module with Task Template Class:

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

// 1. Define task constructor

function TaskCootMB11() { // must start with Task...

  // call parent constructor
  if (__template)  __template.TaskTemplate.call ( this );
             else            TaskTemplate.call ( this );

  // set task class name (used internally)
  this._type = 'TaskCootMB11';

  // set task name (used in Job Tree)
  this.name = 'cootmb11';

  // set task title (used in Job Dialog)
  this.title = 'Model Building with Coot 1.1';

  // set documentation link
  this.helpURL = './html/jscofe_task_cootmb11.html';

}

// finish constructor definition

if (__template)
  TaskCootMB11.prototype = Object.create ( __template.TaskTemplate.prototype );
else
  TaskCootMB11.prototype = Object.create ( TaskTemplate.prototype );
TaskCootMB11.prototype.constructor = TaskCootMB11;

// ===========================================================================

// 2. Define task icons

TaskCootMB11.prototype.icon_small = function() {
  return 'task_cootmb11_20x20.png';
}

TaskCootMB11.prototype.icon_large = function() {
  return 'task_cootmb11.png';
}

TaskCootMB11.prototype.icon = function() {
  return 'task_cootmb11';
}

// ===========================================================================

// 3. Define task version

TaskCootMB11.prototype.currentVersion = function() { return 0; }

// ===========================================================================

// 4. Add server-side code

if (__template) { // will run only on server side

  // acquire configuration module
  var conf = require('../../js-server/server.configuration');

  // form command line for server's node js to start task's python driver
  TaskCootMB11.prototype.getCommandLine = function ( exeType,jobDir ) {
    return [ conf.pythonName(), // will use python from configuration
             '-m', // will run task as a python module
             'pycofe.tasks.cootmb11', // path to python driver
             exeType, // framework's type of run: 'SHELL' or 'SGE'
             jobDir, // path to job directory given by framework
             this.id // task id (assigned by the framework)
           ];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in server's node js

  module.exports.TaskCootMB11 = TaskCootMB11;

}
