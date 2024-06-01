
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.privateer.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Privateer Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
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

function TaskPrivateer()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPrivateer';
  this.name    = 'privateer';
  this.setOName ( 'privateer' );  // default output file name template
  this.title   = 'Validation of carbohydrate structures with Privateer';

  this.input_dtypes = [{      // input data types
      // data_type : {'DataRevision':['xyz','ligands']}, // data type(s) and subtype(s)
      data_type : {'DataRevision':['xyz','~mmcif_only']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}

if (__template)
  __cmd.registerClass ( 'TaskPrivateer',TaskPrivateer,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskPrivateer',TaskPrivateer,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskPrivateer.prototype.icon           = function()  { return 'task_privateer'; }
TaskPrivateer.prototype.clipboard_name = function()  { return '"Privateer"';    }

TaskPrivateer.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPrivateer.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'validates carbohydrate structures';
}

TaskPrivateer.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['privateer', 'validation','carbohydrate','sugar', 'monosaccharide','structure'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

//  TaskPrivateer.prototype.cleanJobDir = function ( jobDir )  {}

  TaskPrivateer.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskPrivateer.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.privateer', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPrivateer = TaskPrivateer;

}
