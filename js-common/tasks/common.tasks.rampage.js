/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.rampage.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RAMPAGE Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev  2022-2024
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

function TaskRampage()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskRampage';
  this.name    = 'rampage';
  this.setOName ( 'rampage' ); // default output file name template
  this.title   = 'Rampage';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz','~mmcif_only'],
                    'DataEnsemble' : ['~mmcif_only'],
                    'DataModel'    : ['~mmcif_only'],
                    'DataXYZ'      : ['~mmcif_only']
                  },  // data type(s) and subtype(s)
    label       : 'Structure', // label for input dialog
    inputId     : 'ixyz'   ,   // input Id for referencing input fields
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }];

}

if (__template)
      TaskRampage.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRampage.prototype = Object.create ( TaskTemplate.prototype );
TaskRampage.prototype.constructor = TaskRampage;


// ===========================================================================

TaskRampage.prototype.icon           = function()  { return 'task_rampage'; }
TaskRampage.prototype.clipboard_name = function()  { return '"Rampage"';    }

TaskRampage.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskRampage.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['rampage','ramachandran','analysis'] );
  }

// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskRampage.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'Ramachandran plots and analysis';
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskRampage.prototype.makeInputData = function ( loginData,jobDir )  {
    var ixyz = this.input_data.data['ixyz'][0];
    if (ixyz._type=='DataRevision')
      this.input_data.data['istruct'] = [ixyz.Structure];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskRampage.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.rampage', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRampage = TaskRampage;

}
