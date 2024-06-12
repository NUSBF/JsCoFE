
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.reindexhkl.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Reindex Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2022-2024
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

function TaskReindexHKL()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskReindexHKL';
  this.name      = 'reindex dataset';  // short name for job tree
  this.setOName ( 'rndx' );  // default output file name template
  this.title     = 'Reindex Dataset';  // full title
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'idata',    // input Id for referencing input fields
      customInput : 'cell-info',// lay custom fields next to the selection
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

  this.parameters = {
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,
             position : [0,0,2,5],
             contains : {
                SYMM : {
                   type     : 'string',
                   label    : 'Space Group',
                   tooltip  : 'The value is not validated and passed to reindex program as is',
                   iwidth   : '100',
                   value    : '',
                   placeholder : 'e.g. P 43 21 2',
                   position : [0,0,1,1] // [row,col,rowSpan,colSpan]
                },
                REINDEX : {
                   type     : 'string',
                   label    : 'Reindex',
                   tooltip  : 'The value is not validated and passed to reindex program as is',
                   iwidth   : '200',
                   value    : '',
                   placeholder : 'e.g. h,k,2l',
                   position : [1,0,1,1] // [row,col,rowSpan,colSpan]
                }
             }
    }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskReindexHKL',TaskReindexHKL,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskReindexHKL',TaskReindexHKL,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskReindexHKL.prototype.icon           = function()  { return 'task_reindexhkl'; }
TaskReindexHKL.prototype.clipboard_name = function()  { return '"Reindex"';       }

TaskReindexHKL.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskReindexHKL.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'change space group and indexing';
}
  
TaskReindexHKL.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['reindex', 'hkl','dataset', 'toolbox'] );
}

if (!__template)  {
  // for client side

  TaskReindexHKL.prototype.addDataDialogHints = function ( inp_item,summary )  {
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
    return summary;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskReindexHKL.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changespg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskReindexHKL = TaskReindexHKL;

}
