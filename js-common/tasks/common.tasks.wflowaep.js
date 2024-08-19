
/*
 *  =================================================================
 *
 *    29.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, O. Kovalevskyi, A. Lebedev, M. Fando 2021-2024
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

function TaskWFlowAEP()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowAEP';
  this.name        = 'EP automatic workflow';
  this.setOName ( 'ccp4go_autoep' );  // default output file name template
  this.title       = 'Workflow: Automated Experimental Phasing with Crank-2';
  this.autoRunId   = 'auto-EP';

  this.file_select = [{
      file_types  : '.mtz,.sca', // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      tooltip     : '[Mandatory] Path to MTZ file with merged or unmerged ' +
                    'reflections. Anomalous data should be present.',
      inputId     : 'fhkldata',  // input Id for referencing input fields
      annotate    : false,
      path        : '',
      min         : 1           // minimum acceptable number of data instances
    },{
      file_types  : '.pir,.seq,.fasta', // data type(s) and subtype(s)
      label       : 'Sequence(s)', // label for input dialog
      tooltip     : '[Desirable] Path to sequence file in .fasta or .pir ' +
                    'format. For importing several sequences put them all in a ' +
                    'single file.',
      inputId     : 'fseq',   // input Id for referencing input fields
      path        : '',
      min         : 1         // minimum acceptable number of data instances
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

  // this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'' }];
  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'', 'file' : 'flig' }];

  this.input_dtypes = [{    // input data types
      data_type   : {'DataUnmerged':[],'DataHKL':['anomalous']}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'hkldata',  // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      tooltip     : '(Optional) Macromolecular sequence(s) expected in ASU.',
      inputId     : 'seq',         // input Id for referencing input fields
      version     : 0,             // minimum data version allowed
      force       : 10,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 1,             // minimum acceptable number of data instances
      max         : 10             // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand to fit', // label for input dialog
      tooltip     : '(Optional) Ligand to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    HATOM :     { type      : 'string',   // empty string not allowed
                  keyword   : 'hatom',
                  label     : '<b><i>Main anomalous<br>scatterer</i></b>',
                  reportas  : '<b><i>Main anomalous scatterer</i></b>',
                  tooltip   : 'Specify atom type of dominant anomalous scatterer ' +
                              '(e.g., S, SE etc.), or leave blank if uncertain.',
                  iwidth    : 40,
                  value     : '',
                  maxlength : 2,       // maximum input length
                  position  : [0,0,1,1]
                }
    // MR_ENGINE : { type     : 'combobox',
    //               keyword  : '',
    //               label    : '<b><i>Auto-MR solver</i></b>',
    //               tooltip  : 'Choose between MrBump and MoRDa auto-MR pipelines ' +
    //                          'to use. If MoRDa is not available, MrBump will be used.',
    //               range    : ['mrbump|MrBump',
    //                           'morda|MoRDa'
    //                          ],
    //               value    : 'mrbump',
    //               iwidth   : 140,
    //               position : [1,0,1,3]
    //             },
    // MB_ENGINE : { type     : 'combobox',
    //               keyword  : '',
    //               label    : '<b><i>Model builder</i></b>',
    //               tooltip  : 'Choose between CCP4Build and Buccaneer for model ' +
    //                          'building steps.',
    //               range    : ['ccp4build|CCP4Build',
    //                           'buccaneer|Buccaneer'
    //                          ],
    //               value    : 'ccp4build',
    //               iwidth   : 140,
    //               position : [2,0,1,3]
    //             }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskWFlowAEP',TaskWFlowAEP,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskWFlowAEP',TaskWFlowAEP,TaskTemplate.prototype );

// ===========================================================================

TaskWFlowAEP.prototype.icon           = function()  { return 'task_wflowaep'; }
TaskWFlowAEP.prototype.clipboard_name = function()  { return '"EP Workflow"'; }

TaskWFlowAEP.prototype.desc_title     = function()  {
  return 'data import, ASU definition, automatic EP, refinement, ligand fitting and PDB deposition';
}

//TaskWFlowAEP.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWFlowAEP.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWFlowAEP.prototype.currentVersion = function()  {
  let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWFlowAEP.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
          'workflow','experimental', 'phasing', 'crank2','asu','refinement','auto','automation',
          'auto-ep','automatic','automatization','automatisation', 'ep', 'substructure','deposition'
        ] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWFlowAEP.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
  }

  // reserved function name
  //TaskWFlowAEP.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  const conf = require('../../js-server/server.configuration');

  TaskWFlowAEP.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_aep', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowAEP = TaskWFlowAEP;

}
