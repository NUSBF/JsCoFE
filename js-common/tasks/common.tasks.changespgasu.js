
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.changespg.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Change ASU Space Group Task Class
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
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskChangeSpGASU()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskChangeSpGASU';
  this.name      = 'change asu space group';  // short name for job tree
  this.setOName ( 'SpG' );  // default output file name template
  this.title     = 'Change ASU Space Group';  // full title
  //this.helpURL   = './html/jscofe_task_changespgasu.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['~xyz','~substructure','~phases']}, // data type(s) and subtype(s)
      label       : 'ASU definition', // label for input dialog
      inputId     : 'idata',    // input Id for referencing input fields
      customInput : 'reindex',  // lay custom fields next to the selection
                                // dropdown for anomalous data
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}

if (__template)
  __cmd.registerClass ( 'TaskChangeSpGASU',TaskChangeSpGASU,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskChangeSpGASU',TaskChangeSpGASU,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeSpGASU.prototype.icon           = function()  { return 'task_changespgasu';    }
TaskChangeSpGASU.prototype.clipboard_name = function()  { return '"Change Space Group"'; }

TaskChangeSpGASU.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'reindex reflection dataset in Structure Revision';
}

TaskChangeSpGASU.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskChangeSpGASU.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['change','space', 'group', 'asu'] );
  }


if (!__template)  {
  //  for client side

  TaskChangeSpGASU.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'changes ASU Space Group';
    };

  TaskChangeSpGASU.prototype.addDataDialogHints = function ( inp_item,summary )  {
    // This function may be used for adding or modifying hints in summary.hints
    // when they are dependent on task rather than, or in addition to, daat type.
    // 'inp_item' corresponds to an item in this.input_data.
    summary.hints.push (
      'This task can be run only right after the definition of ASU, before ' +
      'any phasing or substructure search are performed -- you may need to branch ' +
      'your Project accordingly. Use <i>"Change Dataset Space Group"</i> ' +
      'task in order to change space group of a reflection dataset'
    );
    return summary;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskChangeSpGASU.prototype.makeInputData = function ( loginData,jobDir )  {
    // put hkl in input databox for copying their files in
    // job's 'input' directory
    this.input_data.data['hkl'] = [this.input_data.data['idata'][0].HKL];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskChangeSpGASU.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changespg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeSpGASU = TaskChangeSpGASU;

}
