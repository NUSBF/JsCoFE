/*
 *  ====================================================================
 *
 *    07.05.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.structureprediction.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Structure Prediction Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev 2022-2025
 *
 *  ====================================================================
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

// 1. Define task constructor

function TaskStructurePrediction()  {   // must start with Task...

  // invoke the template class constructor:
  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskStructurePrediction'; // must give name of the class
  this.name    = 'structure prediction';    // default name to be shown in Job Tree
  this.setOName ( 'af_struct' );            // default output file name template
  this.title   = 'Structure Prediction';    // title for job dialog

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      customInput : 'ncopies-spred',
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 24          // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // container for all input parameters
    sec1  :  // unique Section ID used for fetching parameters in Task Driver
        { type     : 'section',      // widget type
          title    : 'Main options', // Section title
          open     : true,       // true for the section to be initially open
          position : [0,0,1,5],  // must span 5 columns
          contains : {           // container for Section's parameters
            // PROGRAM : {
            //         type     : 'combobox', // for AF preferable (0 - 5)
            //         label    : 'Protocol number',
            //         tooltip  : 'The program that will be used for ' +
            //                    'structure prediction',
            //         range    : ['1|1', // the part for python|the part for users
            //                     '2|2',
            //                     '3|3',
            //                     '4|4',
            //                     '5|5'
            //        ],
            //         value    : '1',
            //         position : [0,0,1,1]
            //       }
            NSTRUCTS : { type     : 'integer',
                         keyword  : 'NSTRUCTS',
                         label    : 'Number of predictions',
                         tooltip  : 'Maximum number of structures to produce. Single ' +
                                    'structure is sufficient in most cases. Producing ' +
                                    'additional structures will increase wait times. ' +
                                    'Fewer structures may be produced if score threshold' +
                                    'is met.',
                         range    : [1,5],
                         value    : 1,
                         iwidth   : 40,
                         position : [0,0,1,1]
            //            },
            // MINSCORE : { type     : 'real',
            //              keyword  : 'MINSCORE',
            //              label    : 'Stop at score',
            //              tooltip  : 'Score threshold to stop calculations. Higher ' +
            //                         'thresholds may reduce calculation times, however, ' +
            //                         'solutions may be missed.',
            //              range    : [1,'*'],
            //              value    : 80,
            //              iwidth   : 40,
            //              position : [1,0,1,1]
                       }
          }
        }
  };

  this.saveDefaultValues ( this.parameters );

}

// finish constructor definition

if (__template)
  __cmd.registerClass ( 'TaskStructurePrediction',TaskStructurePrediction,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskStructurePrediction',TaskStructurePrediction,TaskTemplate.prototype );

// ===========================================================================

// 2. Define task icons. Any graphics formats (*.svg, *.png, *.jpg) may be used,
//    but please follow file name convention as below. Small 20x20px icon is
//    used in Job Tree, and the large icon is used in Job Dialog and documentation.

TaskStructurePrediction.prototype.icon           = function()  { return 'task_structureprediction'; }
TaskStructurePrediction.prototype.clipboard_name = function()  { return '"Structure Prediction"';   }

TaskStructurePrediction.prototype.canRunRemotely = function()  { return true; }

TaskStructurePrediction.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'generate structure model with AlphaFold2';
}

TaskStructurePrediction.prototype.usesGPU = function() {
// Virtual function with prototype defined in TaskTemplate. See comments there.
  return true;
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskStructurePrediction.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskStructurePrediction.prototype.requiredEnvironment = function() {
  return ['CCP4','ALPHAFOLD_CFG'];
}


// 3. Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. |jsCoFE| framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskStructurePrediction.prototype.currentVersion = function()  {
  let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskStructurePrediction.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                  'structure', 'prediction','molecular','replacement','mr', 'model','preparation',
                  'generation','alphafold','alphafold2','af', 'af2','colabfold','colab', 'fold',
                  'openfold'] );
}

TaskStructurePrediction.prototype.cleanJobDir = function ( jobDir )  {}

// ===========================================================================

//  4. Add server-side code

if (__template)  {  //  will run only on server side

  // acquire configuration module
  const conf = require('../../js-server/server.configuration');

  // form command line for server's node js to start task's python driver;
  // note that last 3 parameters are optional and task driver will not use
  // them in most cases.

  TaskStructurePrediction.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [ conf.pythonName(),         // will use python from configuration
             '-m',                      // will run task as a python module
             'pycofe.tasks.structureprediction', // path to python driver
              exeType,                  // framework's type of run: 'SHELL' or 'SGE'
              jobDir,                   // path to job directory given by framework
              this.id                   // task id (assigned by the framework)
            ];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in server's node js

  module.exports.TaskStructurePrediction = TaskStructurePrediction;

}
