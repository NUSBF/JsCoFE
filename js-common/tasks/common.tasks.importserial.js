
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
      file_types  : '.hkl', // data type(s) and subtype(s)
      label       : 'Merged HKL file', // label for input dialog
      tooltip     : '[Mandatory] Path to HKL Merged data file ', //tooltip is hover over the label in the UI
      inputId     : 'hklin',  // input Id for referencing input fields
      path        : '',
      min         : 0,          // minimum acceptable number of data instances (change to 1 after debug)
      max         : 1
    },{
      file_types  : '.hkl1,', // data type(s) and subtype(s)
      label       : 'Half data set .HKL1 file', // label for input dialog
      tooltip     : '[Optional] Path to .HKL1 Half-Merged data set',
      inputId     : 'halfdataset1',   // input Id for referencing input fields
      path        : '',
      min         : 0   ,      // minimum acceptable number of data instances
      max         : 1
    },{
      file_types  : '.hkl2', // data type(s) and subtype(s)
      label       : 'Half data set .HKL2 file', // label for input dialog
      tooltip     : '[Optional] Path to .HKL1 Half-Merged data set',
      inputId     : 'halfdataset2',   // input Id for referencing input fields
      path        : '',
      min         : 0   ,      // minimum acceptable number of data instances
      max         : 1
    },{
      file_types: '.cell',
      label     : 'Cell file',
      tooltip   : '[Mandatory] Path to .CELL file ',
      inputId     : 'cellfile', // input Id for referencing input fields
      path        : '',
      min         : 0,   //Minimum files required    (change to 1 after debug)
      max         : 1
    },{
      file_types: '.pdb,.mmcif,.mtz',
      label     : 'Reference file',
      tooltip   : '[Optional]Path to PDB or mmCIF file or MTZ file to import  spacegroup and unit cell parameters',
      inputId     : 'reference', // input Id for referencing input fields
      path        : '',
      label2    : '<span style="font-size:85%;color:maroon;"><i>Reference file (PDB, mmCIF or MTZ)  ' +
                                ' to provide spacegroup and unit cell </i></span>',
      min         : 0,   //Minimum files required 
      showon      : {SOURCE_SEL:['R']}, //Check if this call is available ***
      max         : 1
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

    SPACER : {  //Empty spacer spacer does
      type     : 'label',
      keyword  : 'none',
      label    : '&nbsp',
      position : [0,0,1,5]
    },

    sec1 :  { type     : 'section', //creates segmented sections inside the user interface
              title    : 'Data required for CrystFel',  //name this for section title
              open     : true,  // true for the section to be initially open
              position : [1,0,1,8],
              contains : {

                // SOURCE_SEL : {
                //   type     : 'combobox',
                //   label    : '<b><i>Data required for CrystFel &nbsp;</i></b>', //Name of title beside the combobox &nbsp = extra space
                //   tooltip  : 'Source for the Space Group and Unit Cell Parameters',
                //   range    : ['R|Reference File',
                //               'SU|Space Group and Unit Cell Parameters',                   //This is the values available inside the dropdown list
          
                //             ],
                //   value    : 'R',
                //   position : [2,2,1,1]
                // },
                // REFERENCEFILE : {
                //   // keyword   : 'smiles',
                //   // label     : '<i> Reference File </i>',
                //   // tooltip   : '(Optional) Reference File  ',
                //   value     : '',
                //   position  : [3,2,1,1],
                //   iwidth    : 200,            
                //   type: 'file',
                //   label     : 'Reference file',
                //   tooltip   : '[Optional]Path to PDB or mmCIF file or MTZ file to import  spacegroup and unit cell parameters',
                //   // inputId     : 'referencefile', // input Id for referencing input fields
                //   path        : '',
                //   min         : 0,   //Minimum files required 
                //   showon      : {SOURCE_SEL:['R']}, //Check if this call is available ***
                //   max         : 1
                // },

                WAVELENGTH : {
                  type      : 'real_',   // empty string not allowed (change to no _ after debugging)
                  label     : '<i> <b> Wavelength </b> </i>',
                  tooltip   : ' (Mandatory) Wavelength (only for data from CrystFEL) ',
                  align     : "left",
                  inputId     : 'wavelength', // input Id for referencing input fields
                  keyword : "wavelength", //user for keyword option in cmd 
                  value     : '',
                  range     : [0.00,2.00], //check the range of the high resolution cutoff
                  position  : [2,2,1,1], // grid-row, grid-column ,
                },

                SPACEGROUP : {
                  type      : 'string_',   // empty string not allowed
                  label     : '<b><i> Space Group </b></i>',
                  tooltip   : ' (Mandatory) Required Specification of Space Group ',
                  value     : '',
                  inputId     : 'spacegroup', // input Id for referencing input fields
                  keyword : "spacegroup", //user for keyword option in cmd 
                  position  : [3,2,1,1],
                  maxlength : 5,       // largest identified protein space group
                },

                UNITCELLPARAMETERS : {
                  type      : 'string_',   // empty string not allowed (change to no _ after debugging)
                  label     : '<b><i> Unit Cell Parameters </b></i>',
                  tooltip   : '(Mandatory) Required Specification of Unit Cell Parameters ',
                  label2    : '<span style="font-size:85%;color:maroon;"><i>Unit cell parameters ' +
                                ' divided by spaces, e.g. 60 50 40 90 90 90 </i></span>',
                  align     : "left",
                  keyword   : "cell",
                  value     : '',
                  iwidth    : 200,
                  inputId     : 'cell', // input Id for referencing input fields
                  position  : [4,2,2,5],
                  // maxlength : 5  //determine if their is a restraint already
                },
            }, //posibly require a ,
            
          },


    sec2 :  { type     : 'section',
    title    : 'Resolution cutoff',
    open     : true,  // true for the section to be initially open
    position : [2,0,1,8],
    contains : {
      DMIN : {
        type      : 'real_',   // empty string allowed
        label     : '<i> <b> High-resolution cutoff </b> </i>',
        tooltip   : '(Optional) High-resolution cutoff for data',
        default   : '',
        keyword   : "dmin",
        value     : '',
        iwidth    : 100,
        range     : [0.00,2.00], //check the range of the high resolution cutoff
        maxlength : 3,       // maximum input length
        lwidth2   : '100%',
        position  : [2,1,1,7],
        inputId     : 'dmin' // input Id for referencing input fields
      
          },
      DMAX : {
        type      : 'real_',   // empty string allowed
        label     : '<i> <b> Low-resolution cutoff </b> </i>',
        tooltip   : '(Optional) Low-resolution cutoff for data',
        default   : '',
        value     : '',
        keyword   : "dmax",
        iwidth    : 100,
        range     : [0.00,2.00], //check the range of the high resolution cutoff
        maxlength : 3,       // maximum input length
        lwidth2   : '100%',
        position  : [3,1,1,7],
        inputId     : 'dmax' // input Id for referencing input fields
      },
     
    },
  }

    


  };

}

if (__template)
  __cmd.registerClass ( 'TaskImportSerial',TaskImportSerial,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskImportSerial',TaskImportSerial,TaskTemplate.prototype );

// ===========================================================================

TaskImportSerial.prototype.icon           = function()  { return 'task_wflowafmr';  }  // *EK* make new icon
TaskImportSerial.prototype.clipboard_name = function()  { return '"Import Serial"'; }

TaskImportSerial.prototype.desc_title     = function()  {  // *EK* edit description
  return 'upload and import .hkl, .mtz, .cell files from your device to merge and convert to MTZ Format ';
}

TaskImportSerial.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Upload and import .hkl, .mtz, .cell files from your device to merge and convert to MTZ Format ';
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
