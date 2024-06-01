
// temporary solution to keep existing projects alive
// TO BE DELETED

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phasermr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CCP4ez Task Class
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
  __template = require ( './common.tasks.ccp4go' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskCCP4ez()  {

  if (__template)  __template.TaskCCP4go.call ( this );
             else  TaskCCP4go.call ( this );

  this._type   = 'TaskCCP4go';
  this.name    = 'ccp4go';
  this.setOName ( 'ccp4go' );  // default output file name template
  this.title   = 'CCP4go "Don\'t make me think!" (experimental)';

}

if (__template)
  __cmd.registerClass ( 'TaskCCP4ez',TaskCCP4ez,__template.TaskCCP4go.prototype );
else    registerClass ( 'TaskCCP4ez',TaskCCP4ez,TaskCCP4go.prototype );

// ===========================================================================

TaskCCP4ez.prototype.clipboard_name = function()  { return '"CCP4ez"'; }

// export such that it could be used in both node and a browser
if (__template)  {
// for server side
  module.exports.TaskCCP4ez = TaskCCP4ez;
}
