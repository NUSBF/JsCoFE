
/*
 *  =================================================================
 *
 *    02.11.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.workflow.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Generic Workflow Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2023
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskWorkflow()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskWorkflow';
  this.name   = 'Workflow';
  this.setOName ( 'workflow' );  // default output file name template
  this.title  = 'Workflow';

  this.icon_name       = 'workflow';
  this.task_desc       = 'generic workflow';
  this.search_keywords = ['workflow'];

  this.script          = [];  // script to execute
  this.script_pointer  = 0;   // current script line

  //this.ha_type = '';

  /*
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
      tooltip     : '[Mandatory] Provide a path to PDB file with a search model',
      inputId     : 'fpdb',   // input Id for referencing input fields
      path        : '',
      min         : 1         // minimum acceptable number of data instances
    },{
      file_types  : '.pir,.seq,.fasta', // data type(s) and subtype(s)
      label       : 'Sequence(s)', // label for input dialog
      tooltip     : '[Desired] Provide a path to sequence file in .fasta or .pir ' +
                    'format. For importing several sequences put them all in a ' +
                    'single file.',
      inputId     : 'fseq',   // input Id for referencing input fields
      path        : '',
      min         : 1         // minimum acceptable number of data instances
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
      force       : 10,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 1,             // minimum acceptable number of data instances
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

  this.parameters = { // no input parameters to make user's life easier
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
  */

  // this.parseWorkflowScript ( workflowDesc.script );

}

if (__template)
      TaskWorkflow.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWorkflow.prototype = Object.create ( TaskTemplate.prototype );
TaskWorkflow.prototype.constructor = TaskWorkflow;


// ===========================================================================

/*
#  workflow script keywords
NAME  my_workflow
ONAME wflow1
TITLE My own Workflow
DESC  This is first template for custom workflow script 
KEYWORDS my workflow first
ALLOW_UPLOAD

!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
DATA SEQ          TYPES protein dna rna
DATA LIGAND

@STEP1 TaskDimpleMR

*/

TaskWorkflow.prototype.setWorkflow = function ( workflowDesc )  {
//
//  workflowDesc = { id: workflow_id, script: workflow_script }
//
  this.script    = workflowDesc.script.trim().split ( /\r?\n/ );

  this.autoRunId = workflowDesc.id;

  this.file_select   = [];
  this.input_ligands = [];
  this.input_dtypes  = [];
  this.parameters    = {};

  let allow_upload = (workflowDesc.script.toUpperCase().indexOf('ALLOW_UPLOAD')>=0);

  for (let i=0;i<this.script.length;i++)  {
    let line  = this.script[i].trim();
    this.script[i] = line;
    let ihash = line.indexOf('#');
    if (ihash>=0)  // remove comment
      line = line.slice ( 0,ihash );
  
    line = line.trim();
    if (line.length>0)  {
      
      let words = this.script[i].split(' ').filter(Boolean);
      let word0 = words[0].toUpperCase();
      switch (word0)  {
        
        case 'NAME'     : this.name      = words[1];                  break;
        case 'ONAME'    : this.setOName  ( words[1] );                break;
        case 'ICON'     : this.icon_name = words[1];                  break;
        case 'TITLE'    : this.title     = words.slice(1).join(' ');  break;
        case 'DESC'     : this.task_desc = words.slice(1).join(' ');  break;
        case 'KEYWORDS' : this.search_keywords = words.slice(1);      break;

        case '!DATA'    : // means the data is mandatory
        case 'DATA'     : let dtype = {        // input data type
                            data_type   : {},  // data type(s) and subtype(s)
                            label       : '',  // label for input dialog
                            inputId     : '',  // input Id for referencing input fields
                            version     : 0,   // minimum data version allowed
                            min         : 0,   // minimum acceptable number of data instances
                            max         : 1    // maximum acceptable number of data instances
                          };
                          if (word0=='!DATA')
                            dtype.min = 1;
                          let sec  = words.slice(1).join(' ').toUpperCase().split('TYPES');
                          let dsec = sec[0].split(' ').filter(Boolean);
                          let tsec = [];
                          if (sec.length>1)
                            tsec = sec[1].toLowerCase().split(' ').filter(Boolean);
                          for (let j=0;j<dsec.length;j++)  {
                            dtype.inputId = dsec[j].toLowerCase();
                            switch (dsec[j])  {
                              case 'HKL'      : dtype.data_type.DataHKL = tsec;
                                                dtype.label   = 'Reflection data';
                                            break;
                              case 'UNMERGED' : dtype.data_type.DataUnmerged = [];
                                                dtype.label   = 'Reflection data';
                                                dtype.inputId = 'hkl';  // special case
                                            break;
                              case 'XYZ'      : dtype.data_type.DataXYZ = tsec;
                                                dtype.label   = 'Template structure';
                                            break;
                              case 'SEQ'      : dtype.data_type.DataSequence = tsec;
                                                dtype.label   = 'Sequence';
                                                dtype.tooltip = 'Macromolecular ' +
                                                        'sequence expected in ASU.';
                                            break;
                              case 'LIGAND'   : dtype.data_type.DataLigand = [];
                                                dtype.label   = 'Ligand description';
                                                dtype.tooltip = 'Specify ligand to '+
                                                        'be fit in electron density.';
                                                dtype.max     = this.input_ligands.length;
                                            break;
                              default : ;
                            }
                          }
                          // console.log ( " >>>> " + JSON.stringify(dtype) );
                          this.input_dtypes.push ( dtype );
                          if (allow_upload)  {
                            let fdesc = {
                              file_types  : '',  // data type(s) and subtype(s)
                              label       : dtype.label, // label for input dialog
                              tooltip     : '',
                              inputId     : 'f' + dtype.inputId, // input Id for referencing input fields
                              path        : '',
                              min         : dtype.min  // minimum acceptable number of data instances
                            };
                            switch (dtype.inputId)  {
                              case 'hkl' :
                                  fdesc.file_types  = '.mtz,.sca';
                                  fdesc.tooltip     = 'Provide path to MTZ file ' +
                                          'with merged or unmerged reflections.';
                                  fdesc.annotate    = false;
                                break;
                              case 'xyz' : 
                                  fdesc.file_types  = '.pdb,.mmcif';
                                  fdesc.tooltip     = 'Provide path to PDB/mmCIF '+
                                          'file with a search model';
                                break;
                              case 'seq' : 
                                  fdesc.file_types  = '.pir,.seq,.fasta';
                                  fdesc.tooltip     = 'Provide path to sequence ' +
                                          'file in .fasta or .pir format. For importing ' +
                                          'several sequences put them all in a ' +
                                          'single file.';
                                break;
                              case 'ligand' : 
                                  fdesc.file_types  = '.cif';
                                  fdesc.tooltip     = 'Provide path to CIF file ' +
                                          'with your ligand definition.';
                                break;
                              default : ;
                            }
                            if (fdesc.file_types)
                              this.file_select.push ( fdesc );
                          }
                        break;
        default : ;
      }
    
    }
  
  }

}

TaskWorkflow.prototype.icon           = function()  { return this.icon_name;   }
TaskWorkflow.prototype.clipboard_name = function()  { return this.autoRunId;   }

TaskWorkflow.prototype.desc_title     = function()  { return this.task_desc;   }

//TaskWorkflow.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWorkflow.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWorkflow.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWorkflow.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,this.search_keywords );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWorkflow.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
    //this.ha_type = task.ha_type;
  }

  // reserved function name
  //TaskWorkflow.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskWorkflow.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.workflow', jobManager, jobDir, this.id];
  }

  module.exports.TaskWorkflow = TaskWorkflow;

}
