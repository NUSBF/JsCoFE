
/*
 *  =================================================================
 *
 *    18.04.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.ccp4goautomr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CCP4go Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, O. Kovalevskiy, A. Lebedev, M. Fando 2021-2022
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskWFlowAFMR()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowAFMR';
  this.name        = 'AlphaFold MR workflow';
  this.setOName ( 'ccp4go_afmr' );  // default output file name template
  this.title       = 'Workflow: Molecular Replacement with AlphaFold Model';
  this.autoRunId   = 'af-MR';

  //this.ha_type = '';

  this.file_select = [{
      file_types  : '.mtz,.sca', // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      tooltip     : '[Mandatory] Provide a path to MTZ file with merged or unmerged ' +
                    'reflections.',
      inputId     : 'fhkldata',  // input Id for referencing input fields
      annotate    : false,
      path        : '',
      min         : 1           // minimum acceptable number of data instances
    },{
      file_types  : '.pir,.seq,.fasta', // data type(s) and subtype(s)
      label       : 'Sequence(s)', // label for input dialog
      tooltip     : '[Desired] Provide a path to sequence file in .fasta or .pir ' +
                    'format. For importing several sequences put them all in a ' +
                    'single file.',
      inputId     : 'fseq',   // input Id for referencing input fields
      path        : '',
      min         : 1,         // minimum acceptable number of data instances
      max         : 1
    },{
      file_types  : '.cif', // data type(s) and subtype(s)
      label       : 'Ligand CIF definition', // label for input dialog
      tooltip     : '[Optional] Provide a path to CIF file with your ligand definition ',
      inputId     : 'fcif',   // input Id for referencing input fields
      path        : '',
      min         : 0,         // minimum acceptable number of data instances
      max         : 1
    }
  ];

  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'' }];

  this.input_dtypes = [{    // input data types
      data_type   : {'DataUnmerged':[],'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'hkldata',  // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      //unchosen_label : 'sequence unknown',
      tooltip     : '(Optional) Macromolecular sequence(s) expected in ASU.',
      inputId     : 'seq',         // input Id for referencing input fields
      //customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,             // minimum data version allowed
      force       : 1,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 1,             // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data', // label for input dialog
      tooltip     : '(Optional) Specify ligands to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // no input parameters to mak user's life easier
//    MR_ENGINE : { type     : 'combobox',
//                  keyword  : '',
//                  label    : '<b><i>Auto-MR solver</i></b>',
//                  tooltip  : 'Choose between MrBump and MoRDa auto-MR pipelines ' +
//                             'to use. If MoRDa is not available, MrBump will be used.',
//                  range    : ['mrbump|MrBump',
//                              'morda|MoRDa'
//                             ],
//                  value    : 'mrbump',
//                  iwidth   : 140,
//                  position : [0,0,1,3]
//                },
//    MB_ENGINE : { type     : 'combobox',
//                  keyword  : '',
//                  label    : '<b><i>Model builder</i></b>',
//                  tooltip  : 'Choose between CCP4Build and Buccaneer for model ' +
//                             'building steps.',
//                  range    : ['ccp4build|CCP4Build',
//                              'buccaneer|Buccaneer'
//                             ],
//                  value    : 'ccp4build',
//                  iwidth   : 140,
//                  position : [1,0,1,3]
//                }
  };

}

if (__template)
      TaskWFlowAFMR.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWFlowAFMR.prototype = Object.create ( TaskTemplate.prototype );
TaskWFlowAFMR.prototype.constructor = TaskWFlowAFMR;


// ===========================================================================

TaskWFlowAFMR.prototype.icon = function()  { return 'task_wflowafmr'; }
TaskWFlowAFMR.prototype.desc_title = function()  {
  return 'data import, ASU definition, automatic MR, refinement, ligand fitting and PDB deposition';
}

//TaskWFlowAFMR.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskWFlowAFMR.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWFlowAFMR.prototype.requiredEnvironment = function() { return ['CCP4','ALPHAFOLD_CFG']; }

TaskWFlowAFMR.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWFlowAFMR.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
              'workflow','molecular', 'replacement', 'af-mr','asu','auto','automation','auto-mr',
              'automatic','automatization','automatisation', 'mr', 'structure', 'prediction',
              'alphafold','alphafold2','af', 'af2','colabfold','colab', 'fold', 'openfold'
            ] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWFlowAFMR.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
    //this.ha_type = task.ha_type;
  }

  // reserved function name
  //TaskWFlowAFMR.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskWFlowAFMR.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_afmr', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowAFMR = TaskWFlowAFMR;

}
