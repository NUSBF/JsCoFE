
// temporary solution to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    12.07.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.arcimboldolite' );

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

if (__template)
      TaskArcimboldo.prototype = Object.create ( __template.TaskArcimboldoLite.prototype );
else  TaskArcimboldo.prototype = Object.create ( TaskArcimboldoLite.prototype );
TaskArcimboldo.prototype.constructor = TaskArcimboldo;

// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side
  module.exports.TaskArcimboldo = TaskArcimboldo;
}
