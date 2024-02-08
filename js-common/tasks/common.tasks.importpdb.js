
/*
 *  ==========================================================================
 *
 *    09.07.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.import.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2023
 *
 *  ==========================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskImportPDB()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskImportPDB';
  this.name      = 'import from PDB/AFDB';
  this.oname     = '*';   // asterisk here means do not use
  this.title     = 'Import from PDB/AFDB';
  this.fasttrack = true;  // enforces immediate execution

  // declare void input data for passing pre-existing revisions through the task
  this.input_dtypes = [{       // input data types
      data_type   : {'DataRevision':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 100000000, // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 100000000  // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    CODES : {
          type      : 'string',   // empty string not allowed
          keyword   : 'codes',
          label     : '<i><b>PDB/UniProt code(s)</b></i>',
          tooltip   : 'Comma-separated list of PDB and/or UniProt codes to import data from',
          iwidth    : 680,
          value     : '',
          emitting  : true,
          position  : [0,0,1,4]
        },
    SEPARATOR_LBL : {
          type     : 'label',
          label    : '&nbsp;',
          position : [1,0,1,1]
        },
    IMPORT_LBL : {
          type     : 'label',
          label    : '<i><b>Import data:</b></i>',
          align    : 'right',
          position : [2,0,1,1],
          hideon   : {CODES:['']}
        },
    COORDINATES_CBX : {
          type      : 'checkbox',
          label     : 'coordinates',
          tooltip   : 'Check for importing coordinates.',
          value     : true,
          iwidth    : 130,
          position  : [2,2,1,1],
          hideon    : {CODES:['']}
        },
    SEQUENCES_CBX : {
          type      : 'checkbox',
          label     : 'sequences',
          tooltip   : 'Check for importing sequences.',
          value     : false,
          iwidth    : 130,
          position  : [2,3,1,1],
          hideon    : {CODES:['']}
        },
    REFLECTIONS_CBX : {
          type      : 'checkbox',
          label     : 'reflection data',
          tooltip   : 'Check for importing reflection data.',
          value     : false,
          iwidth    : 130,
          position  : [2,4,1,1],
          hideon    : {CODES:['']}
        },
    REVISION_CBX : {
          type      : 'checkbox',
          label     : 'structure revision',
          tooltip   : 'Check for making structure revision(s).',
          value     : false,
          iwidth    : 150,
          position  : [2,5,1,1],
          hideon    : {'_':'||',CODES:[''],COORDINATES_CBX:[false],SEQUENCES_CBX:[false],REFLECTIONS_CBX:[false]}
        },
    SPRING_LBL : {
          type      : 'label',
          label     : ' ',
          position  : [3,5,1,1],
          lwidth    : 150
        },
    ROW_BREAK1 : {
          type      : 'label',
          label     : '&nbsp;',
          position  : [4,0,1,1]
        },
    // ROW_BREAK2 : {
    //       type      : 'label',
    //       label     : '&nbsp;',
    //       position  : [5,0,1,1]
    //     },
    PDB_LBL : {
          type      : 'label',
          label     : '<i>wwPDB:</i>',
          align     : 'right',
          position  : [5,0,1,1]
        },
    PDB_LINK : {
          type      : 'label',
          label     : '<a href="https://www.wwpdb.org" target="_blank"><span style="color:blue;">https://www.wwpdb.org</span></a>',
          position  : [5,2,1,1]
        },
    UNIPROT_LBL : {
          type      : 'label',
          label     : '<i>UniProt:</i>',
          align     : 'right',
          position  : [6,0,1,1]
        },
    UNIPROT_LINK : {
          type      : 'label',
          label     : '<a href="https://www.uniprot.org" target="_blank"><span style="color:blue;">https://www.uniprot.org</span></a>',
          position  : [6,2,1,1]
        }
    /*
    SPRING_LBL : {
          type      : 'label',
          label     : ' ',
          position  : [2,5,1,1],
          lwidth    : 250
        },
    REVISION_SEL : {
          type      : 'combobox',
          label     : ' ',
          tooltip   : 'Source of data for making a ligand',
          range     : ['N|Do not make structure revision(s)',
                       'Y|Make structure revision(s)'
                      ],
          value     : 'N',
          iwidth    : 450,
          position  : [3,0,1,3],
          hideon    : {'_':'||',CODES:[''],SEQUENCES_CBX:[false],REFLECTIONS_CBX:[false]}
        }
    */
  };

}

if (__template)
      TaskImportPDB.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskImportPDB.prototype = Object.create ( TaskTemplate.prototype );
TaskImportPDB.prototype.constructor = TaskImportPDB;


// ===========================================================================

TaskImportPDB.prototype.icon           = function()  { return 'task_importpdbafdb'; }
TaskImportPDB.prototype.clipboard_name = function()  { return '"PDB Import"';       }

TaskImportPDB.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['import', 'data','pdb'] );
}

TaskImportPDB.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'fetch coordinates, sequences and reflection data for given PDB/UniProt code(s)';
}

TaskImportPDB.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fetch coordinates, sequences and reflection data for given PDB/UniProt code(s)';
}

TaskImportPDB.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskImportPDB.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname = '';
    return;
  }

  // reserved function name
  TaskImportPDB.prototype.runButtonName = function()  { return 'Import'; }

  TaskImportPDB.prototype.collectInput = function ( inputPanel )  {

    TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (this.parameters.CODES.value.trim().length<4)
      return '<b>At least one PDB code must be specified</b>';

    if ((!this.parameters.COORDINATES_CBX.value) &&
        (!this.parameters.SEQUENCES_CBX.value)   &&
        (!this.parameters.REFLECTIONS_CBX.value))
      return '<b>At least one of "coordinates", "sequences" or ' +
             '"reflection data" must be requested</b>';

    return '';

  }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskImportPDB.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  module.exports.TaskImportPDB = TaskImportPDB;

}
