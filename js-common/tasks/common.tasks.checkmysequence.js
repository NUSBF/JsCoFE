
/*
 *  =================================================================
 *
 *    25.03.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.checkmysequence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CheckMySequence Task Class
 *       ~~~~~~~~~
 *
 *  (C) G. Chojnowski, E. Krissinel, A. Lebedev 2022-2024
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

function TaskCheckMySequence()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskCheckMySequence';
  this.name  = 'checkmysequence';
  this.setOName ( 'checkmysequence' );  // default 
  this.title = 'CheckMySequence';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskCheckMySequence',TaskCheckMySequence,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskCheckMySequence',TaskCheckMySequence,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskCheckMySequence.prototype.icon           = function()  { return 'task_checkmysequence'; }
TaskCheckMySequence.prototype.clipboard_name = function()  { return '"checkMySequence"';    }

TaskCheckMySequence.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'validates model sequence';
};

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskCheckMySequence.prototype.platforms = function()  { return 'LMUW'; }

TaskCheckMySequence.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskCheckMySequence.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['checkmysequence', 'sequence'] );
}


if (!__template)  {
  //  for client side

  TaskCheckMySequence.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Model sequence validation based on a map';
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCheckMySequence.prototype.makeInputData = function ( loginData,jobDir )  {
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['istruct'] = [revision.Structure];
      this.input_data.data['seq'] = revision.ASU.seq;
    }
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskCheckMySequence.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.checkmysequence', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCheckMySequence = TaskCheckMySequence;

}
