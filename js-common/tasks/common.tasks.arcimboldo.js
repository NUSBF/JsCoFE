
// temporary solution only to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.arcimboldo.js (LEGACY)
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Arcimboldo-Lite Legacy Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.arcimboldolite' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskArcimboldo()  {
  if (__template)  __template.TaskArcimboldoLite.call ( this );
             else  TaskArcimboldoLite.call ( this );
  this._type = 'TaskArcimboldo';
}
TaskArcimboldo.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'performs ab initio phasing using polyalanine helices or other single search fragments';
};

// if (__template)
//       TaskArcimboldo.prototype = Object.create ( __template.TaskArcimboldoLite.prototype );
// else  TaskArcimboldo.prototype = Object.create ( TaskArcimboldoLite.prototype );
// TaskArcimboldo.prototype.constructor = TaskArcimboldo;

if (__template)
  __cmd.registerClass ( 'TaskArcimboldo',TaskArcimboldo,__template.TaskArcimboldoLite.prototype );
else    registerClass ( 'TaskArcimboldo',TaskArcimboldo,TaskArcimboldoLite.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskArcimboldo.prototype.clipboard_name = function()  { return '"Arcimboldo"'; }

if (__template)  {
  //  for server side
  module.exports.TaskArcimboldo = TaskArcimboldo;
}
