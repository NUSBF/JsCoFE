
/*
 *  =================================================================
 *
 *    14.05.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, O. Kovalevskiy, A. Lebedev 2021
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskWFlowDPL()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowDPL';
  this.name        = 'Dimple Refinement and Ligand Fitting Workflow';
  this.setOName ( 'ccp4go_autodpl' );  // default output file name template
  this.title       = 'Workflow: Dimple Refinement and Ligand Fitting';
  this.autoRunId   = 'auto-DPL';

  this.file_select = [{
      file_types  : '.mtz,.sca', // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      tooltip     : '[Mandatory] Provide a path to MTZ file with merged or unmerged ' +
                    'reflections. Anomalous data should be present.',
      inputId     : 'fhkldata',  // input Id for referencing input fields
      annotate    : false,
      path        : '',
      min         : 1           // minimum acceptable number of data instances
    },{
      file_types  : '.pdb,.mmcif', // data type(s) and subtype(s)
      label       : 'PDB structure', // label for input dialog
      tooltip     : '[Mandatory] Provide a path to PDB file with corresponding structure ',
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
    }
  ];

  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'' }];

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
      //unchosen_label : 'sequence unknown',
      tooltip     : '(Optional) Macromolecular sequence(s) expected in ASU.',
      inputId     : 'seq',         // input Id for referencing input fields
      //customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,             // minimum data version allowed
      force       : 10,            // meaning choose, by default, n<=1 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 10             // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data', // label for input dialog
      tooltip     : '(Optional) Specify ligands to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    },{
      // require brunching from data import, so no revision must be there
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 0,          // minimum acceptable number of data instances
      max         : 0           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {};

/*  var __coot_codes = null;
  if (__make_lig)  __coot_codes = __make_lig.__coot_reserved_codes;
             else  __coot_codes = __coot_reserved_codes;

  this.parameters = { // input parameters
    LIGAND_LBL : {
            type     : 'label',
            label    : '&nbsp;',
            position : [0,0,1,5],
            showon   : {'ligand':[0,-1]}, // from this and input data section
          },
    sec1  : { type     : 'section',
              title    : '',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              showon   : {'ligand':[0,-1]}, // from this and input data section
              contains : {
                        SOURCE_SEL : {
                                type     : 'combobox',
                                label    : '<b><i>Make Ligand</i></b>',
                                tooltip  : 'Source of data for making a ligand',
                                range    : ['N|No',
                                            'S|using SMILES string',
                                            'M|from Monomer library entry'
                                           ],
                                value    : 'N',
                                position : [0,0,1,5]
                              },
                        SMILES : {
                              type      : 'string_',
                              keyword   : 'smiles',
                              label     : '<i>SMILES string</i>',
                              tooltip   : 'SMILES string to define ligand structure',
                              iwidth    : 680,
                              value     : '',
                              position  : [1,2,1,5],
                              showon    : {SOURCE_SEL:['S']}
                            },
                        CODE : {
                              type      : 'string_',   // empty string allowed
                              keyword   : 'code',
                              label     : '<i>Ligand Code</i>',
                              tooltip   : '3-letter ligand code for identification',
                              default   : '',
                              iwidth    : 40,
                              value     : '',
                              maxlength : 3,       // maximum input length
                              label2    : '<span style="font-size:85%;color:maroon;"><i>if no code ' +
                                         'is given (recommended), a suitable new one will be ' +
                                         'autogenerated</i></span>',
                              lwidth2   : '100%',
                              position  : [2,2,1,1],
                              showon    : {SOURCE_SEL:['S']}
                            },
                        CODE3 : {
                              type      : 'string_',
                              label     : '<i>3-letter Code</i>',
                              tooltip   : '3-letter ligand code',
                              default   : '',
                              iwidth    : 40,
                              value     : '',
                              maxlength : 3,       // maximum input length
                              label2    : "&nbsp;",
                              lwidth2   : 100,
                              position  : [3,2,1,1],
                              showon    : {SOURCE_SEL:['M']}
                            },
                          INFO2_LBL : {
                              type     : 'label',
                              label    : '&nbsp;<br><span style="font-size:85%;color:maroon;"><i>Codes ' +
                                           __coot_codes.join(', ') +
                                         '<br>are reserved by Coot for own purposes and cannot' +
                                         ' be used here.</i></span>',
                              position : [4,4,1,5],
                              hideon    : {SOURCE_SEL:['N']}
                            }

                        }
    }

  };
*/
}

if (__template)
      TaskWFlowDPL.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWFlowDPL.prototype = Object.create ( TaskTemplate.prototype );
TaskWFlowDPL.prototype.constructor = TaskWFlowDPL;


// ===========================================================================

TaskWFlowDPL.prototype.icon = function()  { return 'task_wflowdpl'; }
TaskWFlowDPL.prototype.desc_title = function()  {
  return 'data import, Dimple pipeline, ligand fitting, refinement and PDB deposition';
}

//TaskWFlowAEP.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWFlowAEP.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWFlowDPL.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWFlowDPL.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
  }

  // reserved function name
  //TaskWFlowAEP.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskWFlowDPL.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_dpl', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowDPL = TaskWFlowDPL;

}
