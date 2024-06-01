
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.crank2' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskShelxAuto()  {

  if (__template)  __template.TaskCrank2.call ( this );
             else  TaskCrank2.call ( this );

  this._type   = 'TaskShelxAuto';
  this.name    = 'SHELX Auto-EP';
  this.setOName ( 'shelx' );  // default output file name template
  this.title   = 'SHELX Automated Experimental Phasing via Crank-2';

  this.input_dtypes[0].data_type   = {'DataRevision':['!anomalous','~xyz','~substructure']}, // data type(s) and subtype(s)
  this.input_dtypes[0].customInput = 'shelx-auto';     // lay custom fields next to the selection
  this.input_dtypes[1].customInput = 'anomData-Shelx'; // lay custom fields next to the selection

  this.parameters.sec1.value = 'shelx-auto';
  // this.parameters.sec2.contains.SUBSTRDET_PROGRAM.value = 'shelxd';

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskShelxAuto',TaskShelxAuto,__template.TaskCrank2.prototype );
else    registerClass ( 'TaskShelxAuto',TaskShelxAuto,TaskCrank2.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxAuto.prototype.icon           = function()  { return 'task_shelx';   }
TaskShelxAuto.prototype.clipboard_name = function()  { return '"Shelx-Auto"'; }

TaskShelxAuto.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'finds heavy-atom substructure, performs EP and builds atomic model';
}

TaskShelxAuto.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4/bin/shelxe','$CCP4/bin/shelxe.exe']];
}

TaskShelxAuto.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskCrank2.prototype.currentVersion.call ( this );
  else  return  version + TaskCrank2.prototype.currentVersion.call ( this );
}

TaskShelxAuto.prototype.getHelpURL = function()  {
  return __task_reference_base_url + 'doc.task.SHELX.html';
}

TaskShelxAuto.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['shelx', 'crank2','crank-2','experimental', 'phasing', 'auto-ep', 'ep', 'substructure'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskShelxAuto.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxauto', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxAuto = TaskShelxAuto;

}
