
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
 *  **** Content :  Change Space Group Task Class
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

function TaskChangeSpGHKL()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskChangeSpGHKL';
  this.name      = 'change dataset space group';  // short name for job tree
  this.setOName ( 'SpG' );  // default output file name template
  this.title     = 'Change Dataset Space Group';  // full title
  //this.helpURL   = './html/jscofe_task_changespghkl.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'idata',    // input Id for referencing input fields
      customInput : 'reindex',  // lay custom fields next to the selection
                                // dropdown for anomalous data
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 0,          // minimum acceptable number of data instances
      max         : 0           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}

if (__template)
  __cmd.registerClass ( 'TaskChangeSpGHKL',TaskChangeSpGHKL,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskChangeSpGHKL',TaskChangeSpGHKL,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeSpGHKL.prototype.icon           = function()  { return 'task_changespghkl';    }
TaskChangeSpGHKL.prototype.clipboard_name = function()  { return '"Change Space Group"'; }

TaskChangeSpGHKL.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskChangeSpGHKL.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['change','space', 'group', 'hkl'] );
  }

if (!__template)  {
  // for client side

  TaskChangeSpGHKL.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'allows changing the merged reflection dataset space group with the same point group';
    };

  TaskChangeSpGHKL.prototype.addDataDialogHints = function ( inp_item,summary )  {
    // This function may be used for adding or modifying hints in summary.hints
    // when they are dependent on task rather than, or in addition to, daat type.
    // 'inp_item' corresponds to an item in this.input_data.
    summary.hints.push (
      'Why <i>"Structure Revision"</i> is not allowed? This means that the ' +
      'task can be used only before a <i>"Structure Revision"</i> ' +
      'is created. If you are past this point in your Project, you may have ' +
      'to start, with this task, a new branch in your Project after data ' +
      'import or data processing.'
    );
    summary.hints.push (
      'Is it possible to change Space Group in <i>"Structure Revision"</i>? ' +
      'The answer is "in general, no", because such change would be incompatible ' +
      'with results of pre-existing phasing and refinement. However, one can ' +
      'change between alternative space groups in an empty ASU, before any ' +
      'phasing is done, with <i>"Change ASU Space Group"</i> task. This may ' +
      'require starting a new branch in your Project.'
    );
    return summary;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskChangeSpGHKL.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changespg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeSpGHKL = TaskChangeSpGHKL;

}
