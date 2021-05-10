
// temporary solution to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    10.05.21   <--  Date of Last Modification.
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

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.arcimboldolite' );

// ===========================================================================

function TaskArcimboldo()  {
  if (__template)  __template.TaskArcimboldoLite.call ( this );
             else  TaskArcimboldoLite.call ( this );
  this._type = 'TaskArcimboldo';
}

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
