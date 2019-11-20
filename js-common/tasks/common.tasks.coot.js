
// temporary solution to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    26.08.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.cootmb' );

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

// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side
  module.exports.TaskCoot = TaskCoot;
}
