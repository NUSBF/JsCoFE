
/*
 *  =================================================================
 *
 *    27.08.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.ensembleprepseq.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Sequence Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2021
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskEnsemblePrepMG()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsemblePrepMG';
  this.name    = 'ensemble preparation (ccp4mg)';
  this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Prepare MR Ensemble with CCP4mg';
  //this.helpURL = './html/jscofe_task_ensembleprepmg.html';
  this.nc_type = 'client';  // job may be run only on client NC

  this.input_dtypes = [{  // input data types
      data_type : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label     : 'Sequence',          // label for input dialog
      inputId   : 'seq',      // input Id for referencing input fields
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                RLEVEL_SEL : {
                      type     : 'combobox',
                      keyword  : 'RLEVEL',
                      label    : 'Redundancy level',
                      tooltip  : 'Choose appropriate redundancy level for ' +
                                 'keeping hits in the list of matches. ',
                      range    : ['ALL|All','100|100%','95|95%','90|90%','70|70%','50|50%'],
                      value    : 'ALL',
                      position : [0,0,1,1]
                     },
                CUTOFF : {
                      type     : 'integer',
                      keyword  : 'CUTOFF',
                      label    : 'Cutoff threshold',
                      tooltip  : 'Cutoff threshold for phmmer results',
                      range    : [0,200],
                      value    : 20,
                      position : [1,0,1,1]
                    },
               MRNUM : {
                     type     : 'integer',
                     keyword  : 'MRNUM',
                     label    : 'Number of ensembles',
                     tooltip  : 'Specify the number of ensemblies to generate ' +
                                '(from 1 to 20).',
                     range    : [1,20],
                     value    : 5,
                     position : [2,0,1,1]
                    }
           }
         }

  };

}

if (__template)
      TaskEnsemblePrepMG.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsemblePrepMG.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsemblePrepMG.prototype.constructor = TaskEnsemblePrepMG;


// ===========================================================================

TaskEnsemblePrepMG.prototype.icon = function()  { return 'task_ensembleprepmg'; }

TaskEnsemblePrepMG.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'use MrBump and CCP4mg for interactive preparation and trimming MR ensembles';
}

TaskEnsemblePrepMG.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskEnsemblePrepMG.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEnsemblePrepMG.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembleprepmg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsemblePrepMG = TaskEnsemblePrepMG;

}
