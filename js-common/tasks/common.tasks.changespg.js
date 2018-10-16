
/*
 *  =================================================================
 *
 *    05.10.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.reindex.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Change Space Group Task Class
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

function TaskChangeSpG()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskChangeSpG';
  this.name      = 'change space group';  // short name for job tree
  this.oname     = 'SpG';          // default output file name template
  this.title     = 'Change Space Group';  // full title
  this.helpURL   = './html/jscofe_task_changespg.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
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
      TaskChangeSpG.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskChangeSpG.prototype = Object.create ( TaskTemplate.prototype );
TaskChangeSpG.prototype.constructor = TaskChangeSpG;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeSpG.prototype.icon_small = function()  { return './images/task_changespg_20x20.svg'; }
TaskChangeSpG.prototype.icon_large = function()  { return './images/task_changespg.svg';       }

TaskChangeSpG.prototype.currentVersion = function()  { return 1; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskChangeSpG.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)
      this.input_data.data['hkl'] = [this.input_data.data['revision'][0].HKL];

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskChangeSpG.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changespg', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeSpG = TaskChangeSpG;

}
