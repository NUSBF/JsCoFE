
/*
 *  =================================================================
 *
 *    05.12.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.balbes.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  BALBES Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskBalbes()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskBalbes';
  this.name    = 'balbes';
  this.oname   = 'balbes';  // default output file name template
  this.title   = 'Balbes: Model Search & Preparation + MR';
  this.helpURL = './html/jscofe_task_balbes.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Additional parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                FULLSPACEGROUP_CBX : {
                        type     : 'checkbox',
                        label    : 'Check full spacegroup',
                        tooltip  : 'Check to explore full space group',
                        value    : false,
                        position : [0,0,1,3]
                      }
             }
           }
  };

}


if (__template)
      TaskBalbes.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskBalbes.prototype = Object.create ( TaskTemplate.prototype );
TaskBalbes.prototype.constructor = TaskBalbes;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskBalbes.prototype.icon_small = function()  { return './images/task_balbes_20x20.svg'; }
TaskBalbes.prototype.icon_large = function()  { return './images/task_balbes.svg';       }

TaskBalbes.prototype.currentVersion = function()  { return 1; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskBalbes.prototype.makeInputData = function ( jobDir )  {

    // put hkl and seq data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskBalbes.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.balbes', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskBalbes = TaskBalbes;

}
