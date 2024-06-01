
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.morda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MakeLigand Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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


const __coot_reserved_codes = [
  "XXX","LIG","DRG","INH","LG0","LG1","LG2","LG3","LG4","LG5","LG6",
  "LG7","LG8","LG9"
];

function TaskMakeLigand()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMakeLigand';
  this.name    = 'make ligand';
  this.oname   = '';  // output file name template (this or ligand name if empty)
  this.title   = 'Make Ligand with Acedrg';
  //this.helpURL = './html/jscofe_task_makeligand.html';

  /*
  this.input_dtypes = [{       // input data types
      data_type   : {'DataLigand':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 1000,      // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 1000       // maximum acceptable number of data instances
    }
  ];
  */

  this.input_dtypes = [{       // input data types
      data_type   : {'DataRevision':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 100,       // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 100        // maximum acceptable number of data instances
    // ********* ligand
    // },{
    //   data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
    //   label       : 'Ligand', // label for input dialog
    //   tooltip     : 'Ligand to be recalculated with AceDRG.',
    //   inputId     : 'ligand',      // input Id for referencing input fields
    //   min         : 0,             // minimum acceptable number of data instances
    //   max         : 1              // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    // ********* ligand
    // INFO1_LBL : { type     : 'label',
    //               label    : '&nbsp;<i>Ligand restraints will be recalculated with AceDRG</i>',
    //               showon   : {'ligand':[1,2,3,4,5]},
    //               position : [0,3,1,5]
    //             },
    sec1 :  { type     : 'section',
              title    : '',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,8],
              // ********* ligand
              // showon   : { 'ligand':[-1,0] },
              contains : {
                SOURCE_SEL : {
                    type     : 'combobox',
                    label    : '<b><i>&nbsp;&nbsp;&nbsp;Use&nbsp;</i></b>',
                    tooltip  : 'Source of data for making a ligand',
                    range    : ['S|SMILES string',
                                'M|Monomer library'
                              ],
                    value    : 'S',
                    position : [0,0,1,5]
                  },
                SMILES : {
                      type      : 'string',   // empty string not allowed
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
                      iwidth    : 60,
                      value     : '',
                      maxlength : 5,       // maximum input length
                      label2    : '<span style="font-size:85%;color:maroon;"><i>if no code ' +
                                'is given (recommended), a suitable new one will be ' +
                                'autogenerated</i></span>',
                      lwidth2   : '100%',
                      position  : [2,2,1,1],
                      showon    : {SOURCE_SEL:['S']}
                    },
                CODE3 : {
                      type      : 'string',   // empty string not allowed
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
                FORCE_ACEDRG_CBX  : {
                      type      : 'checkbox',
                      label     : 'Recalculate with AceDrg',
                      align     : 'left',
                      tooltip   : 'Check for recalculating ligand data using AceDrg. If ' +
                                  'unchecked, both restraints and atomic coordinates ' +
                                  'will be merely copied from CCP4 Monomer Library.',
                      value     : false,
                      iwidth    : 200,
                      position  : [3,5,1,1],
                      showon    : {SOURCE_SEL:['M']}
                    },
                INFO2_LBL : {
                      type     : 'label',
                      label    : '&nbsp;<br><span style="font-size:85%;color:maroon;"><i>Codes ' +
                                  __coot_reserved_codes.join(', ') +
                                '<br>are reserved by Coot and cannot be used here.</i></span>',
                      position : [4,4,1,5]
                    }
              },
            },
    sec2 :  { type     : 'section',
              title    : '',
              open     : true,  // true for the section to be initially open
              position : [2,0,1,8],
              contains : {
                NOPROT  : {
                      type      : 'checkbox',
                      label     : 'Suppress protonation/deprotonation by AceDrg',
                      align     : 'right',
                      
                      tooltip   : 'No further protonation/deprotonation will be done by Acedrg. By default AceDRG can re-evaluate the protonation',
                      value     : false,
                      iwidth    : 350,
                      position  : [6,1,1,7],
                    },
                NUMINITCONFORMERS : { 
                      type     : 'real_',
                      keyword  : 'NUMINITCONFORMERS',
                      label    : 'Number of initial conformers to try',
                      align     : 'left',
                      tooltip  : 'Override number of initial conformers',
                      range    : [1,'*'],
                      value    : "",
                      iwidth   : 50,
                      position : [8,1,1,5]
                    },
              }
            }
  };


}


if (__template)
      TaskMakeLigand.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMakeLigand.prototype = Object.create ( TaskTemplate.prototype );
TaskMakeLigand.prototype.constructor = TaskMakeLigand;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskMakeLigand.prototype.icon           = function()  { return 'task_makeligand'; }
TaskMakeLigand.prototype.clipboard_name = function()  { return '"MakeLigand"';    }

TaskMakeLigand.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'generate crystallographic restraints for fitting ligand in the density and refinement';
}

// TaskMakeLigand.prototype.cleanJobDir = function ( jobDir )  {}

TaskMakeLigand.prototype.currentVersion = function()  {
let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskMakeLigand.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['acedrg', 'ligand','make', 'chemical', 'monomer', 'smile'] );
}

TaskMakeLigand.prototype.getWorkflowScript = function ( serialNo )  {
let wscript = [];
  if (__template)
        wscript = __template.TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  else  wscript = TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  wscript.splice ( 1,0,'    ALIAS     revision   void1' );
  return wscript;
}

if (!__template)  {
  // client side

  //TaskMakeLigand.prototype.canMove = function ( node,jobTree )  {
  //  return (node.parentId!=null);
  //}

  TaskMakeLigand.prototype.collectInput = function ( inputPanel )  {

    let msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    let ligCode = this.parameters.sec1.contains.CODE.value;
    if (this.parameters.sec1.contains.SOURCE_SEL.value=='M')
      ligCode = this.parameters.sec1.contains.CODE3.value;

    if (__coot_reserved_codes.indexOf(ligCode)>=0)
      msg += '<b>ligand code ' + ligCode + ' is reserved by Coot for own ' +
             'purposes and cannot be used</b>';

    return msg;

  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskMakeLigand.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.makeligand', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMakeLigand        = TaskMakeLigand;
  module.exports.__coot_reserved_codes = __coot_reserved_codes;

}
