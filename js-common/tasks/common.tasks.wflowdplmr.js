
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.wflowdplmr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Dimple MR Workflow Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev, 2023-2024
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

function TaskWFlowDPLMR()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowDPLMR';
  this.name        = 'Dimple MR workflow';
  this.setOName ( 'ccp4go_autodplmr' );  // default output file name template
  this.title       = 'Workflow: Dimple Molecular Replacement';
  this.autoRunId   = 'auto-DPLMR';

  this.file_select = [{
      file_types  : '.mtz,.sca', // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      tooltip     : '[Mandatory] Path to MTZ file with merged or unmerged ' +
                    'reflections.',
      inputId     : 'fhkldata',  // input Id for referencing input fields
      annotate    : false,
      path        : '',
      min         : 1           // minimum acceptable number of data instances
    },{
      file_types  : '.pdb,.mmcif', // data type(s) and subtype(s)
      label       : 'Template structure', // label for input dialog
      tooltip     : '[Mandatory] Path to PDB or mmCIF file with template structure',
      inputId     : 'fxyz',   // input Id for referencing input fields
      path        : '',
      min         : 1         // minimum acceptable number of data instances
    },{
      file_types  : '.cif,.lib', // data type(s) and subtype(s)
      label       : 'Ligand library', // label for input dialog
      tooltip     : '[Optional] Path to CIF file with restraints for ' +
                    'non-standard ligand found in Template structure, if any',
      inputId     : 'flibrary', // input Id for referencing input fields
      path        : '',
      min         : 0         // minimum acceptable number of data instances
    },{
      file_types  : '.pir,.seq,.fasta', // data type(s) and subtype(s)
      label       : 'Sequence(s)', // label for input dialog
      tooltip     : '[Optional] Path to sequence file in .fasta or .pir ' +
                    'format. For importing several sequences put them all in a ' +
                    'single file.',
      inputId     : 'fseq',   // input Id for referencing input fields
      path        : '',
      min         : 0         // minimum acceptable number of data instances
    },{
      file_types  : '.cif', // data type(s) and subtype(s)
      label       : '&nbsp;', // label for input dialog
      tooltip     : '[Optional] Path to CIF file with description of ligand ' +
                    'to be fitted in electron density blobs',
      inputId     : 'flig', // input Id for referencing input fields
      path        : '',
      min         : 0         // minimum acceptable number of data instances
    }
  ];

  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'', 'file' : 'flig' }];

  this.input_dtypes = [{    // input data types
      data_type   : {'DataUnmerged':[],'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'hkldata',  // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataXYZ':['protein','dna','rna','~mmcif_only'] },  // data type(s) and subtype(s)
      label       : 'Template structure',    // label for input dialog
      inputId     : 'xyz',    // input Id for referencing input fields
      tooltip     : 'Template structure to be molecular replaced in reflection data',
      min         : 1,            // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataLibrary':[],'DataLigand':[] },  // data type(s) and subtype(s)
      label       : 'Ligand library',    // label for input dialog
      inputId     : 'library',    // input Id for referencing input fields
      tooltip     : 'Restraints library for non-standard ligand found in the ' +
                    'Template structure, if any',
      min         : 0,            // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      tooltip     : '(Optional) Macromolecular sequence(s) expected in ASU.',
      inputId     : 'seq',         // input Id for referencing input fields
      version     : 0,             // minimum data version allowed
      force       : 10,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 1              // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand to fit', // label for input dialog
      tooltip     : '(Optional) Ligand to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    },
    {  // input data types
      data_type : {'DataRevision':[]}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      force     : 1,          // meaning choose, by default, 1 hkl dataset if
                              // available; otherwise, 0 (== do not use) will
                              // be selected
      min       : 0,          // minimum acceptable number of data instances
      max       : 0           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {};

}

if (__template)
  __cmd.registerClass ( 'TaskWFlowDPLMR',TaskWFlowDPLMR,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskWFlowDPLMR',TaskWFlowDPLMR,TaskTemplate.prototype );

// ===========================================================================

TaskWFlowDPLMR.prototype.icon           = function()  { return 'task_wflowdplmr';  }
TaskWFlowDPLMR.prototype.clipboard_name = function()  { return '"DPLMR Workflow"'; }

TaskWFlowDPLMR.prototype.desc_title     = function()  {
  return 'data import, ASU definition, Dimple MR, refinement, ligand fitting and PDB deposition';
}

//TaskWFlowDPLMR.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWFlowDPLMR.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWFlowDPLMR.prototype.currentVersion = function()  {
  let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWFlowDPLMR.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'workflow','molecular', 'replacement', 'model','dimple','refinement','auto',
                'automation','automatic','automatization','automatisation', 'mr'] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWFlowDPLMR.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
    //this.ha_type = task.ha_type;
  }

  // reserved function name
  //TaskWFlowDPLMR.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  const conf = require('../../js-server/server.configuration');

  TaskWFlowDPLMR.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_dplmr', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowDPLMR = TaskWFlowDPLMR;

}
