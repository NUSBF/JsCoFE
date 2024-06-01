
// temporary solution to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.coot.js (LEGACY)
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Model Building Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskCoot()  {
  if (__template)  __template.TaskCootMB.call ( this );
             else  TaskCootMB.call ( this );
  this._type = 'TaskCoot';
}


if (__template)
      TaskCoot.prototype = Object.create ( __template.TaskCootMB.prototype );
else  TaskCoot.prototype = Object.create ( TaskCootMB.prototype );
TaskCoot.prototype.constructor = TaskCoot;

TaskCoot.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

// ===========================================================================
// export such that it could be used in both node and a browser

TaskCoot.prototype.clipboard_name = function()  { return '"Coot"'; }

if (__template)  {
  //  for server side
  module.exports.TaskCoot = TaskCoot;
}
