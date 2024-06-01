
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CCP4go Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, O. Kovalevskiy, A. Lebedev, M. Fando 2021-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;
var __make_lig = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template'   );
  __cmd      = require ( '../common.commands' );
  __make_lig = require ( './common.tasks.makeligand' );
}

// ===========================================================================

function TaskWFlowREL()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskWFlowREL';
  this.name        = 'Refinement and ligand fitting automatic workflow';
  this.setOName ( 'ccp4go_autorel' );  // default output file name template
  this.title       = 'Workflow: Automated refinement and ligand fitting';
  this.autoRunId   = 'auto-REL';

  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'' }];

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['phases']}, // data type(s) and subtype(s)
      label     : 'Structure revision',        // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
//      customInput : 'map-sel', // lay custom fields below the dropdown
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data', // label for input dialog
      tooltip     : '(Optional) Specify ligands to be fit in electron density.',
      inputId     : 'ligand',      // input Id for referencing input fields
      force       : 1,             // force selecting ligand if found in Project
      min         : 0,             // minimum acceptable number of data instances
      max         : this.input_ligands.length // maximum acceptable number of data instances
    }
  ];

  var __coot_codes = null;
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
              showon   : {'ligand':[1,-1]}, // from this and input data section
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

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskWFlowREL.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWFlowREL.prototype = Object.create ( TaskTemplate.prototype );
TaskWFlowREL.prototype.constructor = TaskWFlowREL;


// ===========================================================================

TaskWFlowREL.prototype.icon           = function()  { return 'task_wflowrel';         }
TaskWFlowREL.prototype.clipboard_name = function()  { return '"Refinement Workflow"'; }

TaskWFlowREL.prototype.desc_title     = function()  {
  return 'refinement, ligand fitting and PDB deposition, starting from a phased structure';
}

//TaskWFlowREL.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWFlowREL.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWFlowREL.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWFlowREL.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
              'workflow','refmac','refmac5','refinement','auto','automation','automatic',
              'automatization','automatisation'
            ] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWFlowREL.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
  }

  // TaskMakeLigand.prototype.collectInput = function ( inputPanel )  {

  //   var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

  //   var ligCode = this.parameters.CODE.value;
  //   if (this.parameters.SOURCE_SEL.value=='M')
  //     ligCode = this.parameters.CODE3.value;

  //   if (__coot_reserved_codes.indexOf(ligCode)>=0)
  //     msg += '|<b>ligand code ' + ligCode + ' is reserved by Coot for own ' +
  //            'purposes and cannot be used</b>';

  //   return msg;

  // }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskWFlowREL.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.wflow_rel', jobManager, jobDir, this.id];
  }

  module.exports.TaskWFlowREL = TaskWFlowREL;

}
