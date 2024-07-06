
/*
 *  =================================================================
 *
 *    04.07.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.webcootce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Web-Coot Coordinate Editor Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.webcoot' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskWebCootCE()  {

  if (__template)  __template.TaskWebCoot.call ( this );
             else  TaskWebCoot.call ( this );

  this._type     = 'TaskWebCootCE';
  this.name      = 'webcoot (edit coordinates)';
  this.setOName ( 'webcootce' );  // default output file name template
  this.title     = 'Edit Coordinates with WebCoot/Moorhen';
  this.nc_type   = 'browser-secure';   // job runs in-browser
  this.fasttrack = true;  // forces immediate execution

  this.input_dtypes = [{        // input data types
      data_type   : {'DataStructure':['xyz'],
                     'DataXYZ'      :[],
                     'DataEnsemble' :[],
                     'DataModel'    :[]
                    }, // data type(s) and subtype(s)
      label       : 'Structure to edit', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

}

if (__template)
  __cmd.registerClass ( 'TaskWebCootCE',TaskWebCootCE,__template.TaskWebCoot.prototype );
else    registerClass ( 'TaskWebCootCE',TaskWebCootCE,TaskWebCoot.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskWebCootCE.prototype.icon           = function()  { return 'task_webcootce'; }
TaskWebCootCE.prototype.clipboard_name = function()  { return '"WebCootCE"';    }

TaskWebCootCE.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'use for editing structure models without electron density with WebCoot/Moorhen';
}

TaskWebCootCE.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

TaskWebCootCE.prototype.cloneItems = function() { return ['backups']; }

// TaskWebCootCE.prototype.cleanJobDir = function ( jobDir )  {}

TaskWebCootCE.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskWebCoot.prototype.currentVersion.call ( this );
  else  return  version + TaskWebCoot.prototype.currentVersion.call ( this );
}

// function CootMBHotButton()  {
//   return {
//     'task'    : 'TaskWebCoot',
//     'tooltip' : 'Launch Coot for model building'
//   };
// }

TaskWebCootCE.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
    'webcoot','moorhen','coot','model','coordinate','editor'
  ]);
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskWebCootCE.prototype.hotButtons = function()  {
    return [];
    // return [RefmacHotButton()];
  }

} else  {
  //  for server side

  // -------------------------------------------------------------------------

  module.exports.TaskWebCootCE = TaskWebCootCE;

}
