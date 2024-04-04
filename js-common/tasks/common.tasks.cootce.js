
/*
 *  =================================================================
 *
 *    02.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.cootce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Coordinate Editor Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2018-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCootCE()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCootCE';
  this.name    = 'coot (edit coordinates)';
  this.setOName ( 'coot-ce' );  // default output file name template
  this.title   = 'Edit Coordinates with Coot';
  this.nc_type = 'client';    // job may be run only on client NC

  this.input_dtypes = [{      // input data types
      data_type : {'DataStructure':['xyz'],'DataXYZ':[],
                   'DataEnsemble':[],'DataModel':[]}, // data type(s) and subtype(s)
      label     : 'Structure to edit',     // label for input dialog
      inputId   : 'ixyz',     // input Id for referencing input fields
      cast      : 'xyz',
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 20          // maximum acceptable number of data instances
    }
  ];

  /*
  this.input_dtypes = [{      // input data types
      data_type : {'DataXYZ':[],'DataEnsemble':[]}, // data type(s) and subtype(s)
      label     : 'Structure to edit',     // label for input dialog
      inputId   : 'ixyz',     // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    },{
      data_type : {'DataXYZ':[],'DataEnsemble':[],'DataStructure':['xyz']},  // data type(s) and subtype(s)
      label     : 'Additional data', // label for input dialog
      inputId   : 'aux_struct', // input Id for referencing input fields
      min       : 0,            // minimum acceptable number of data instances
      max       : 20            // maximum acceptable number of data instances
    }
  ];
  */

}


if (__template)
      TaskCootCE.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCootCE.prototype = Object.create ( TaskTemplate.prototype );
TaskCootCE.prototype.constructor = TaskCootCE;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCootCE.prototype.icon           = function()  { return 'task_cootce';   }
TaskCootCE.prototype.clipboard_name = function()  { return '"Coot Editor"'; }

TaskCootCE.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'use for editing structure models without electron density (e.g., MR models)';
}

TaskCootCE.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Edit structure models without electron density';
}


TaskCootCE.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskCootCE.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskCootCE.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['coot','model', 'coordinate', 'editor'] );
  }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCootCE.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.coot_ce', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCootCE = TaskCootCE;

}
