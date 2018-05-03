
/*
 *  =================================================================
 *
 *    06.03.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.deposition.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RefMac Task Class
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

function TaskDeposition()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskDeposition';
  this.name    = 'deposition';
  this.oname   = 'deposition';  // default output file name template
  this.title   = 'Prepare data for deposition';
  this.helpURL = './html/jscofe_task_deposition.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  /*
  this.parameters = {
    sec1 : { type     : 'section',
             title    : 'Basic options',
             open     : true,
             position : [0,0,1,5],
             contains : {
                MKHYDR : { type : 'combobox',
                       keyword  : 'none',
                       label    : 'Generate H-atoms for refinement',
                       tooltip  : 'Select how to represent hydrogen atoms in refinement',
                       range    : ['no|No','yes|Yes if in input file','all|Yes'],
                       value    : 'no',
                       position : [0,0,1,1]
                     },
                NCYC  : { type  : 'integer',
                       keyword  : 'none',
                       label    : 'Number of refinement cycles',
                       tooltip  : 'Number of refinement cycles',
                       range    : [0,'*'],
                       value    : '10',
                       position : [1,0,1,1]
                     },
                NCSR : { type   : 'combobox',
                       keyword  : 'none',
                       label    : 'Use automatically generated NCS restraints',
                       tooltip  : 'Use automatically generated NCS restraints',
                       range    : ['no|No','local|Local','global|Global'],
                       value    : 'local',
                       position : [2,0,1,1]
                     },
                RIDGE_YES : { type : 'combobox',
                       keyword  : 'none',
                       label    : 'Use jelly-body refinement',
                       tooltip  : 'Use jelly-body refinement',
                       range    : ['no|No','yes|Yes'],
                       value    : 'no',
                       position : [3,0,1,1]
                     },
                RIDGE_VAL : { type : 'real',
                       keyword  : 'none',
                       label    : '&nbsp;&nbsp;&nbsp;&nbsp;Ridge distance sigma',
                       tooltip  : 'Ridge distance sigma',
                       range    : [0,'*'],
                       value    : '0.02',
                       showon   : {'RIDGE_YES':['yes']},
                       position : [4,0,1,1]
                     },
                WAUTO_YES : { type : 'combobox',
                       keyword  : 'none',
                       label    : 'Use automatic weighting',
                       tooltip  : 'Use automatic weighting',
                       range    : ['no|No','yes|Yes'],
                       value    : 'yes',
                       position : [5,0,1,1]
                     },
                WAUTO_VAL : { type : 'real',
                       keyword  : 'none',
                       label    : '&nbsp;&nbsp;&nbsp;&nbsp;Weight for X-ray term',
                       tooltip  : 'Weight for X-ray term',
                       range    : [0,'*'],
                       value    : '0.01',
                       showon   : {'WAUTO_YES':['no']},
                       position : [6,0,1,1]
                     },
                TWIN : { type : 'combobox',
                       keyword  : 'none',
                       label    : 'Twin refinement',
                       tooltip  : 'Switch twin refinement on/off',
                       range    : ['no|No','yes|Yes'],
                       value    : 'no',
                       position : [7,0,1,1]
                     }
             }
           }
  };
  */

}


if (__template)
      TaskDeposition.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDeposition.prototype = Object.create ( TaskTemplate.prototype );
TaskDeposition.prototype.constructor = TaskDeposition;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDeposition.prototype.icon_small = function()  { return './images/task_deposition_20x20.svg'; }
TaskDeposition.prototype.icon_large = function()  { return './images/task_deposition.svg';       }

TaskDeposition.prototype.cleanJobDir = function ( jobDir )  {}

TaskDeposition.prototype.currentVersion = function()  { return 1; } // from 16.12.2007

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskDeposition.prototype.makeInputData = function ( jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
      this.input_data.data['seq']     = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskDeposition.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.deposition', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDeposition = TaskDeposition;

}
