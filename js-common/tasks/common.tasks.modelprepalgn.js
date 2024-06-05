
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.modelprepalgn.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Alignment Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.modelprepxyz' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskModelPrepAlgn()  {

  if (__template)  __template.TaskModelPrepXYZ.call ( this );
             else  TaskModelPrepXYZ.call ( this );

  this._type   = 'TaskModelPrepAlgn';
  this.name    = 'prepare MR model(s) from alignment data';
  //this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Prepare MR Model(s) from Alignment data';
  //this.helpURL = './html/jscofe_task_modelprepalgn.html';

  this.input_dtypes[0] = {
    data_type   : {'DataAlignment':[]},  // data type(s) and subtype(s)
    label       : 'Alignment',   // label for input dialog
    tooltip     : 'Specify coordinate sets to be merged in an ensamble for ' +
                  'further use in Molecular Replacement. Usually you will ' +
                  'choose homologous single chains of approximately equal ' +
                  'length. The resulting ensemble will be named after the ' +
                  'leading coordinate set.',
    inputId     : 'alignment', // input Id for referencing input fields
    customInput : 'align-sel', // lay custom fields next to the selection
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }

}

if (__template)
  __cmd.registerClass ( 'TaskModelPrepAlgn',TaskModelPrepAlgn,__template.TaskModelPrepXYZ.prototype );
else    registerClass ( 'TaskModelPrepAlgn',TaskModelPrepAlgn,TaskModelPrepXYZ.prototype );

// ===========================================================================

//TaskModelPrepAlgn.prototype.cleanJobDir = function ( jobDir )  {}

TaskModelPrepAlgn.prototype.icon           = function()  { return 'task_modelprepalgn'; }
TaskModelPrepAlgn.prototype.clipboard_name = function()  { return '"MR Model (align)"'; }

TaskModelPrepAlgn.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'prepare MR search models from HHPRED alignments';
}

TaskModelPrepAlgn.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskModelPrepXYZ.prototype.currentVersion.call ( this );
  else  return  version + TaskModelPrepXYZ.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

TaskModelPrepAlgn.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['model', 'preparation','mr', 'alignment'] );
}

if (!__template)  {

  TaskModelPrepAlgn.prototype.collectInput = function ( inputPanel )  {
    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    return msg;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskModelPrepAlgn.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelprepalgn', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelPrepAlgn = TaskModelPrepAlgn;

}
