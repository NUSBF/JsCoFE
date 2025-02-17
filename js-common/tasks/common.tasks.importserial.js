
/*
 *  =================================================================
 *
 *    17.02.25   <--  Date of Last Modification.
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
      label       : 'Merged HKL ', // label for input dialog
      tooltip     : 'Specify merged hkl file from CrystFEL', //tooltip is hover over the label in the UI
      inputId     : 'hklin',  // input Id for referencing input fields
      path        : '',
      min         : 1,          // minimum acceptable number of data instances (change to 1 after debug)
      max         : 1
    },{
      file_types  : '.hkl1,', // data type(s) and subtype(s)
      label       : 'Half data set .HKL1 ', // label for input dialog
      tooltip     : '(Optional) Specify half-data-set merge .HKL1',
      inputId     : 'halfdataset1',   // input Id for referencing input fields
      path        : '',
      min         : 1   ,      // minimum acceptable number of data instances
      max         : 1
    },{
      file_types  : '.hkl2', // data type(s) and subtype(s)
      label       : 'Half data set .HKL2 ', // label for input dialog
      tooltip     : '(Optional) Specify half-data-set merge .HKL2',
      inputId     : 'halfdataset2',   // input Id for referencing input fields
      path        : '',
      min         : 1   ,      // minimum acceptable number of data instances
      max         : 1
    },{
      file_types: '.cell',
      label     : 'Cell file',
      tooltip   : '(Optional) Specify Cell file from CrystFEL ',
      inputId     : 'cellfile', // input Id for referencing input fields
      path        : '',
      min         : 0,   //Minimum files required    (change to 1 after debug)
      max         : 1
    },{
      file_types: '.pdb,.mmcif,.mtz',
      label     : 'Reference file',
      tooltip   : '[Optional] Path to PDB or mmCIF file or MTZ file to provide spacegroup and unit cell parameters',
      inputId     : 'reference', // input Id for referencing input fields
      path        : '',
      label2    : '<span style="font-size:85%;color:maroon;"><i>Reference file (PDB, mmCIF or MTZ)  ' +
                                ' to provide spacegroup and unit cell </i></span>',
      min         : 0,   //Minimum files required 
      max         : 1
    }
    
  ];

  this.input_ligands = [];
  this.input_dtypes  = [];

  this.parameters = { // *EK* parameters to be defined as necessary

    SPACER : {  //Empty spacer
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

                WAVELENGTH : {
                  type      : 'real_',   // empty string not allowed (change to no _ after debugging)
                  label     : '<i> <b> Wavelength (Å) </b> </i>',
                  tooltip   : 'Wavelength in Å',
                  align     : "left",
                  inputId     : 'wavelength', // input Id for referencing input fields
                  keyword : "wavelength", //user for keyword option in cmd 
                  value     : '',
                  position  : [2,2,1,1], // grid-row, grid-column ,
                },

                SPACEGROUP : {
                  type      : 'string_',   // empty string not allowed
                  label     : '<b><i> Space Group </b></i>',
                  tooltip   : ' Provide a target space group',
                  value     : '',
                  inputId     : 'spacegroup', // input Id for referencing input fields
                  keyword : "spacegroup", //user for keyword option in cmd 
                  position  : [3,2,1,1],
                  maxlength : 5,       // largest identified protein space group
                },

                UNITCELLPARAMETERS : {
                  type      : 'string_',   // empty string not allowed (change to no _ after debugging)
                  label     : '<b><i> Unit Cell Parameters </b></i>',
                  tooltip   : 'Provide a target Unit Cell Parameters ',
                  label2    : '<span style="font-size:85%;color:maroon;"><i>Unit cell parameters ' +
                                ' divided by spaces, e.g. 60 50 40 90 90 90 </i></span>',
                  align     : "left",
                  keyword   : "cell",
                  value     : '',
                  iwidth    : 200,
                  inputId     :"cell", // input Id for referencing input fields
                  position  : [4,2,2,5],
                },
            }, 
            
          },


    sec2 :  { type     : 'section',
    title    : 'Resolution cutoff',
    open     : true,  // true for the section to be initially open
    position : [2,0,1,8],
    contains : {
      DMAX : {
        type      : 'real_',   // empty string allowed
        label     : '<i> <b> Low-resolution cutoff </b> </i>',
        tooltip   : '(Optional) Low-resolution cutoff (Å)',
        default   : '',
        value     : '',
        keyword   : "dmax",
        iwidth    : 100,
        lwidth2   : '100%',
        position  : [2,1,1,7],
        inputId     : 'dmax' // input Id for referencing input fields
      },
      DMIN : {
        type      : 'real_',   // empty string allowed
        label     : '<i> <b> High-resolution cutoff </b> </i>',
        tooltip   : '(Optional) High-resolution cutoff (Å)',
        default   : '',
        keyword   : "dmin",
        value     : '',
        iwidth    : 100,
        lwidth2   : '100%',
        position  : [3,1,1,7],
        inputId     : 'dmin' // input Id for referencing input fields
      
          },
      
      
     
    },
  }

    


  };

}

if (__template)
  __cmd.registerClass ( 'TaskImportSerial',TaskImportSerial,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskImportSerial',TaskImportSerial,TaskTemplate.prototype );

// ===========================================================================

TaskImportSerial.prototype.icon           = function()  { return 'task_importserial';  }  // *EK* make new icon
TaskImportSerial.prototype.clipboard_name = function()  { return '"Import Serial"'; }

TaskImportSerial.prototype.desc_title     = function()  {  // *EK* edit description
  return 'upload and import .hkl, .mtz, .cell files from your device to merge and convert to MTZ Format ';
}

TaskImportSerial.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Upload and import .hkl, .mtz, .cell files from your device to merge and convert to MTZ Format ';
  }


// empty work directory cleaner
TaskImportSerial.prototype.cleanJobDir = function ( keywords )  {}
    

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

  TaskImportSerial.prototype.collectInput = function ( inputPanel )  {
    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    let hkl = this.input_data.getData('hkl')[0];

     //Unit cell parameter validation with cell file, ref file, input
    let cell_file = this.file_select[3].path;
    let ref_file = this.file_select[4].path;
    let cell = this.parameters.sec1.contains.UNITCELLPARAMETERS.value.trim(); //retriaval of params
    if (!cell_file && !cell &&!ref_file){
      input_msg += '|<b><i>Missing unit cell parameters from either cell file, reference file or input</i></b>';
    } else if (cell_file && cell){
        input_msg += '|<b><i>Cell file already contains unit cell parameters</i></b>';
    } else if (ref_file && cell){
      input_msg += '|<b><i>Reference file already contains unit cell parameters</i></b>';
    }

    //Wavelength validation
    let wavelength = this.parameters.sec1.contains.WAVELENGTH.value;
    if (!wavelength){
      input_msg += '|<b><i>Missing wavelength</i></b>';
    }

    //Spacegroup validation with ref file
    let spacegroup = this.parameters.sec1.contains.SPACEGROUP.value;
    if (!ref_file && !spacegroup){
      input_msg += '|<b><i>Missing spacegroup from either Reference file or input</i></b>';
    }else if (ref_file && spacegroup){
      input_msg += '|<b><i>Reference file already contains spacegroup</i></b>';
    }
    
   

    console.log ( ' >>>> ' + input_msg)

    return input_msg;

  }

 



} else  {
  // for server side

  const conf = require('../../js-server/server.configuration');

  TaskImportSerial.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.importserial', jobManager, jobDir, this.id];
  }

  module.exports.TaskImportSerial = TaskImportSerial;

}
