
/*
 *  =================================================================
 *
 *    22.10.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.shelxauto.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  SHELX-Auto Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.crank2' );


// ===========================================================================

function TaskShelxAuto()  {

  if (__template)  __template.TaskCrank2.call ( this );
             else  TaskCrank2.call ( this );

  this._type   = 'TaskShelxAuto';
  this.name    = 'SHELX Auto-EP';
  this.oname   = 'shelx';  // default output file name template
  this.title   = 'SHELX Automated Experimental Phasing';
  this.helpURL = './html/jscofe_task_shelxauto.html';

  this.input_dtypes[0].customInput = 'shelx-auto';     // lay custom fields next to the selection
  this.input_dtypes[1].customInput = 'anomData-Shelx'; // lay custom fields next to the selection

  this.parameters.sec1.value = 'shelx-auto';

}

if (__template)
      TaskShelxAuto.prototype = Object.create ( __template.TaskCrank2.prototype );
else  TaskShelxAuto.prototype = Object.create ( TaskCrank2.prototype );
TaskShelxAuto.prototype.constructor = TaskShelxAuto;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxAuto.prototype.icon_small = function()  { return './images/task_shelx_20x20.svg'; }
TaskShelxAuto.prototype.icon_large = function()  { return './images/task_shelx.svg';       }

TaskShelxAuto.prototype.currentVersion = function()  { return 1; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskShelxAuto.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxauto', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxAuto = TaskShelxAuto;

}
