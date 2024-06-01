
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
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

function TaskEnsemblePrepMG()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsemblePrepMG';
  this.name    = 'ensemble preparation (ccp4mg)';
  this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Prepare MR Ensemble with CCP4mg';
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
                      label    : 'PDB sequence redundancy level',
                      tooltip  : 'Choose appropriate redundancy level for ' +
                                 'keeping hits in the list of matches. ',
                      range    : ['ALL|All','100|100%','95|95%','90|90%','70|70%','50|50%'],
                      value    : '100',
                      position : [0,0,1,1]
                     },
                AFDB_CBX : {
                        type     : 'checkbox',
                        label    : 'Include structures from AFDB',
                        tooltip  : 'Check to include structures from AlphaFold-2 database',
                        value    : true,
                        position : [1,0,1,3]
                      },
                AFLEVEL_SEL : {
                      type     : 'combobox',
                      keyword  : 'AFLEVEL',
                      label    : 'EBI AlphaFold database model residue confidence cut-off (higher values are more confident)',
                      tooltip  : 'Choose confidence level (pLDDT) cut-off for residues in AlphaFold predictions.' +
                                 'The higher the value the higher the confidence threshold. Residues with lower values are removed from the search models ',
                      range    : ['0|0','10|10','20|20','30|30','40|40','50|50','60|60','70|70','80|80','90|90'],
                      value    : '50',
                      position : [2,0,1,1],
                      hideon   : {AFDB_CBX:[false]}
                     },
//	         CUTOFF : {
//	 	       type     : 'integer',
//		       keyword  : 'CUTOFF',
//		       label    : 'Cutoff threshold',
//		       tooltip  : 'Cutoff threshold for phmmer results',
//		       range    : [0,200],
//		       value    : 20,
//		       position : [2,0,1,1]
//		      },
               MRNUM : {
                     type     : 'integer',
                     keyword  : 'MRNUM',
                     label    : 'Maximum number of models to create',
                     tooltip  : 'Specify the maximum number of models to generate ' +
                                '(from 1 to 20).',
                     range    : [1,20],
                     value    : 5,
                     position : [3,0,1,1]
                    }
           }
         }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskEnsemblePrepMG.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsemblePrepMG.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsemblePrepMG.prototype.constructor = TaskEnsemblePrepMG;


// ===========================================================================

TaskEnsemblePrepMG.prototype.icon           = function()  { return 'task_ensembleprepmg'; }
TaskEnsemblePrepMG.prototype.clipboard_name = function()  { return '"MR Ensemble (MG)"';  }

TaskEnsemblePrepMG.prototype.desc_title     = function()  {
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

TaskEnsemblePrepMG.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['ensemble','ensembles','model',
                        'preparation','mr', 'molecular', 'replacement', 'sequence',
                        'ccp4mg','mg','mrbump'] );
}

if (__template)  {
  //  for server side

  var path  = require('path');
  var conf  = require('../../js-server/server.configuration');
  var utils = require('../../js-server/server.utils');

  TaskEnsemblePrepMG.prototype.cleanJobDir = function ( jobDir )  {

    __template.TaskTemplate.prototype.cleanJobDir.call ( this,jobDir );

    // paranoid piece of code, ugly
    var badDirPath = path.join ( jobDir,'mrbump_dir' );
    if (utils.fileExists(badDirPath))  {
      console.log ( ' +++ remove stray directory ' + badDirPath +
                    ' from TaskEnsemblePrepMG job' );
      utils.removePath ( badDirPath );
    }

  }

  TaskEnsemblePrepMG.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembleprepmg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsemblePrepMG = TaskEnsemblePrepMG;

}
