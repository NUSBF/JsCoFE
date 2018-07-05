
/*
 *  =================================================================
 *
 *    27.03.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.coot.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Task Class (for local server)
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

function TaskCoot()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCoot';
  this.name    = 'coot';
  this.oname   = 'coot';  // default output file name template
  this.title   = 'Model Building with Coot';
  this.helpURL = './html/jscofe_task_coot.html';
  this.nc_type = 'client';  // job may be run only on client NC

  this.input_dtypes = [{      // input data types
      data_type : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    },{
      data_type : {'DataLigand':[]},  // data type(s) and subtype(s)
      label     : 'Ligand data', // label for input dialog
      inputId   : 'ligand',      // input Id for referencing input fields
      min       : 0,             // minimum acceptable number of data instances
      max       : 1              // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskCoot.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCoot.prototype = Object.create ( TaskTemplate.prototype );
TaskCoot.prototype.constructor = TaskCoot;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCoot.prototype.icon_small = function()  { return './images/task_coot_20x20.svg'; }
TaskCoot.prototype.icon_large = function()  { return './images/task_coot.svg';       }

TaskCoot.prototype.currentVersion = function()  { return 0; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCoot.prototype.makeInputData = function ( jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskCoot.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.coot', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCoot = TaskCoot;

}
