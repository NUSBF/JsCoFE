
/*
 *  =================================================================
 *
 *    07.02.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. fando 2016-2025
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

function TaskShelxSubstr()  {

  if (__template)  __template.TaskCrank2.call ( this );
             else  TaskCrank2.call ( this );

  this._type   = 'TaskShelxSubstr';
  this.name    = 'shelx substructure search (crank-2)';
  this.setOName ( 'shelx-substr' );  // default output file name template
  this.title   = 'Substructure Search with SHELX via Crank-2';
  //this.helpURL = './html/jscofe_task_shelxsubstr.html';

  this.input_dtypes[0].data_type   = {'DataRevision':['!anomalous','~xyz','~substructure']}, // data type(s) and subtype(s)
  this.input_dtypes[0].customInput = 'shelx-substr';   // lay custom fields next to the selection
  this.input_dtypes[1].customInput = 'anomData-Shelx'; // lay custom fields next to the selection

  this.parameters.sec1.value = 'shelx-substr';

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskShelxSubstr',TaskShelxSubstr,__template.TaskCrank2.prototype );
else    registerClass ( 'TaskShelxSubstr',TaskShelxSubstr,TaskCrank2.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxSubstr.prototype.icon           = function()  { return 'task_shelx_substr'; }
TaskShelxSubstr.prototype.clipboard_name = function()  { return '"Shelx (substr)"';  }
TaskShelxSubstr.prototype.canRunRemotely = function()  { return true;                }

TaskShelxSubstr.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'find heavy-atom substructure for use in Phaser-EP';
}

TaskShelxSubstr.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskCrank2.prototype.currentVersion.call ( this );
  else  return  version + TaskCrank2.prototype.currentVersion.call ( this );
}

TaskShelxSubstr.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4/bin/shelxe','$CCP4/bin/shelxe.exe']];
}

TaskShelxSubstr.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'shelx', 'crank2','crank-2','experimental', 'phasing', 'ep', 'substructure'
              ] );
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskShelxSubstr.prototype.hotButtons = function() {
    return [PhaserEPHotButton()];
  }

  TaskShelxSubstr.prototype.getHelpURL = function()  {
    return __task_reference_base_url + 'doc.task.SHELX.html';
  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');
  //var tsk_template = require ( './common.tasks.template' );

  TaskShelxSubstr.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxsubstr', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxSubstr = TaskShelxSubstr;

}
