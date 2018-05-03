
/*
 *  =================================================================
 *
 *    14.03.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.ample.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ample Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskAmple()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskAmple';
  this.name   = 'ample';
  this.oname  = 'ample';  // default output file name template
  this.title  = 'Ab-Initio Molecular Replacement with Ample';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      //customInput : 'molrep',   // lay custom fields below the dropdown
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskAmple.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAmple.prototype = Object.create ( TaskTemplate.prototype );
TaskAmple.prototype.constructor = TaskAmple;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAmple.prototype.icon_small = function()  { return './images/task_ample_20x20.svg'; }
TaskAmple.prototype.icon_large = function()  { return './images/task_ample.svg';       }

TaskAmple.prototype.currentVersion = function()  { return 0; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskAmple.prototype.makeInputData = function ( jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskAmple.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ample', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAmple = TaskAmple;

}
