
/*
 *  =================================================================
 *
 *    09.11.23   <--  Date of Last Modification.
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
 *  (C) M. Fando, E. Krissinel, A. Lebedev,  2023
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskWFlowDPLMR()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowDPLMR';
  this.name        = 'Dimple MR workflow';
  this.setOName ( 'ccp4go_autodplmr' );  // default output file name template
  this.title       = 'Workflow: Dimple Molecular Replacement';
  this.autoRunId   = 'auto-DPLMR';

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
    file_types  : '.pdb,.mmcif', // data type(s) and subtype(s)
    label       : 'Template structure', // label for input dialog
    tooltip     : '[Mandatory] Provide a path to PDB file with corresponding structure ',
    inputId     : 'fpdb',   // input Id for referencing input fields
    path        : '',
    min         : 1         // minimum acceptable number of data instances
  },{
    file_types  : '.cif', // data type(s) and subtype(s)
    label       : 'Ligand CIF definition', // label for input dialog
    tooltip     : '[Optional] Provide a path to CIF file with your ligand definition ',
    inputId     : 'fcif',   // input Id for referencing input fields
    path        : '',
    min         : 0         // minimum acceptable number of data instances
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
      force       : 10,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 1              // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data', // label for input dialog
      tooltip     : '(Optional) Specify ligands to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    },{
      data_type   : {'DataXYZ':['protein','dna','rna'] },  // data type(s) and subtype(s)
      label       : 'Template structure',    // label for input dialog
      inputId     : 'xyz',    // input Id for referencing input fields
      //customInput : 'chain-sel', // lay custom fields next to the selection
      min         : 1,            // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    }
  ];

  this.parameters = {};

}

if (__template)
      TaskWFlowDPLMR.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWFlowDPLMR.prototype = Object.create ( TaskTemplate.prototype );
TaskWFlowDPLMR.prototype.constructor = TaskWFlowDPLMR;


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
  var version = 0;
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

  var conf = require('../../js-server/server.configuration');

  TaskWFlowDPLMR.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_dplmr', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowDPLMR = TaskWFlowDPLMR;

}
