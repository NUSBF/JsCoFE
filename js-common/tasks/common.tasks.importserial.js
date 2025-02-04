
/*
 *  =================================================================
 *
 *    04.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.importserial.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ImportSerial Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Talavera, M. Fando, E. Krissinel 2025
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

function TaskImportSerial()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.inputMode = __template.input_mode.root;  // settings for "on project top only", managed in TaskList
  } else  {
    TaskTemplate.call ( this );
    this.inputMode = input_mode.root;  // settings for "on project top only", managed in TaskList
  }
          
  this._type       = 'TaskImportSerial';
  this.name        = 'import_serial';
  this.setOName ( 'import_serial' );  // default output file name template
  this.title       = 'Import Serial';

  this.file_select = [{
      file_types  : '.mtz,.hkl', // data type(s) and subtype(s)
      label       : 'File #1', // label for input dialog
      tooltip     : '[Mandatory] Path to MTZ file with merged or unmerged ' +
                    'reflections.',
      inputId     : 'hklin1',  // input Id for referencing input fields
      path        : '',
      min         : 0           // minimum acceptable number of data instances
    },{
      file_types  : '.mtz,.hkl', // data type(s) and subtype(s)
      label       : 'File #2', // label for input dialog
      tooltip     : '[Desirable] Path to sequence file in .fasta or .pir ' +
                    'format. For importing several sequences put them all in a ' +
                    'single file.',
      inputId     : 'hklin2',   // input Id for referencing input fields
      path        : '',
      min         : 0         // minimum acceptable number of data instances
    },{
      file_types  : '.mtz', // data type(s) and subtype(s)
      label       : 'File #3', // label for input dialog
      tooltip     : '[Optional] Path to CIF file with description of ligand ' +
                    'to be fitted in electron density blobs',
      inputId     : 'hklin3', // input Id for referencing input fields
      path        : '',
      min         : 0         // minimum acceptable number of data instances
    }
  ];

  this.input_ligands = [];
  this.input_dtypes  = [];

  this.parameters = { // *EK* parameters to be defined as necessary
  //  MR_ENGINE : { type     : 'combobox',
  //                keyword  : '',
  //                label    : '<b><i>Auto-MR solver</i></b>',
  //                tooltip  : 'Choose between MrBump and MoRDa auto-MR pipelines ' +
  //                           'to use. If MoRDa is not available, MrBump will be used.',
  //                range    : ['mrbump|MrBump',
  //                            'morda|MoRDa'
  //                           ],
  //                value    : 'mrbump',
  //                iwidth   : 140,
  //                position : [0,0,1,3]
  //              },
  //  MB_ENGINE : { type     : 'combobox',
  //                keyword  : '',
  //                label    : '<b><i>Model builder</i></b>',
  //                tooltip  : 'Choose between CCP4Build and Buccaneer for model ' +
  //                           'building steps.',
  //                range    : ['ccp4build|CCP4Build',
  //                            'buccaneer|Buccaneer'
  //                           ],
  //                value    : 'ccp4build',
  //                iwidth   : 140,
  //                position : [1,0,1,3]
  //              }
  };

}

if (__template)
  __cmd.registerClass ( 'TaskImportSerial',TaskImportSerial,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskImportSerial',TaskImportSerial,TaskTemplate.prototype );

// ===========================================================================

TaskImportSerial.prototype.icon           = function()  { return 'task_wflowafmr';  }  // *EK* make new icon
TaskImportSerial.prototype.clipboard_name = function()  { return '"Import Serial"'; }

TaskImportSerial.prototype.desc_title     = function()  {  // *EK* edit description
  return 'data import, ASU definition, automatic MR, refinement, ligand fitting and PDB validation report';
}


// *EK* Can ImportSerial work on Windows?

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
// TaskImportSerial.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

// TaskImportSerial.prototype.requiredEnvironment = function() { return ['CCP4','ALPHAFOLD_CFG']; }

TaskImportSerial.prototype.currentVersion = function()  {
  const version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskImportSerial.prototype.checkKeywords = function ( keywords )  {  // *EK* revise keywords
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

  // reserved function name
  TaskImportSerial.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  const conf = require('../../js-server/server.configuration');

  TaskImportSerial.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.importserial', jobManager, jobDir, this.id];
  }

  module.exports.TaskImportSerial = TaskImportSerial;

}
