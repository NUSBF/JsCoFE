
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.mrparse.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MrParse Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
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

function TaskMrParse()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskMrParse';
  this.name  = 'mrparse';
  this.setOName ( '*' );  // default output file name template
  this.title = 'Find and prepare MR models with MrParse';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':[]},  // data type(s) and subtype(s)
      label       : 'Reflections',   // label for input dialog
      tooltip     : 'Optional reflection dataset which will be used for phasing ' +
                    'in following-up tasks.',
      inputId     : 'hkl',           // input Id for referencing input fields
      force       : 1,               // select by default if data object is present
      min         : 0,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
     sec1 : { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                MAX_HITS : {
                       type     : 'integer',
                       keyword  : 'max_hits',
                       label    : 'Maximum number of models to take from each database searched',
                       tooltip  : 'Specify the number of models to generate from each database searched' +
                                  '(from 1 to 40).',
                       range    : [1,40],
                       value    : 5,
                       position : [1,0,1,1]
                     },
                 DATABASE : {
                        type     : 'combobox',
                        keyword  : 'database',
                        label    : 'Databases to search',
                        tooltip  : 'Choose from PDB, AlphaFold DB or All' +
                                   'keeping hits in the list of matches. ',
                        range    : ['all|ALL', 'pdb|PDB', 'esmfold|ESMFold', 'afdb|AFDB'],
                        value    : 'all',
                        iwidth   : 100,
                        position : [2,0,1,1]
                      },
                 PLDDT_CUTOFF : {
                       type     : 'combobox',
                       keyword  : 'plddt_cutoff',
                       label    : 'pLDDT cutoff for residue truncation',
                       tooltip  : 'Specify the pLDDT threshold to remove low confidence residues',
                       range    : ['50|50', '70|70','90|90'],
                       value    : 70,
                       iwidth   : 100,
                       position : [3,0,1,1]
                     }
            }
          }
  
  };

  this.checkPrivateData();

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskMrParse.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMrParse.prototype = Object.create ( TaskTemplate.prototype );
TaskMrParse.prototype.constructor = TaskMrParse;


// ===========================================================================

TaskMrParse.prototype.icon           = function()  { return 'task_mrparse'; }
TaskMrParse.prototype.clipboard_name = function()  { return '"MrParse"';    }

TaskMrParse.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'finds relevant PDB/AFDB structures and prepares MR search models from them';
}

// TaskMrParse.prototype.taskDescription = function()  {
// // return 'Task description in small font which will appear under the task title in Task Dialog';
//   return 'Found PDB and AFDB structures may be used for making MR search models';
// }

TaskMrParse.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskMrParse.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['mrparse', 'molecular','replacement','mr', 'model','preparation','mp', 'alphafold','alphafold2','af', 'af2'] );
}

// This function is called at cloning jobs and should do copying of all
// custom class fields not found in the Template class
TaskMrParse.prototype.customDataClone = function ( cloneMode,task )  {
  this.checkPrivateData();
  return;
}

TaskMrParse.prototype.checkPrivateData = function()  {
  if (!__template)  {
    this.private_data = (__treat_private.indexOf('seq')>=0) || 
                        (__treat_private.indexOf('all')>=0);
  } else  {
    let fe_server = conf.getFEConfig();
    if (fe_server)
      this.private_data = (fe_server.treat_private.indexOf('seq')>=0) || 
                          (fe_server.treat_private.indexOf('all')>=0);
  }
  if (this.private_data)  {
    this.parameters.sec1.contains.DATABASE.value  = 'pdb';
    this.parameters.sec1.contains.DATABASE.hideon = {};
  } else if ('hideon' in this.parameters.sec1.contains.DATABASE)  {
    this.parameters.sec1.contains.DATABASE.value  = 'all';
    delete this.parameters.sec1.contains.DATABASE.hideon;
  }
}

TaskMrParse.prototype.sendsOut = function()  {
  if (__environ_server.indexOf('PDB_DIR')<0)
    return ['seq'];
  return []; 
}

// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  // var conf = require('../../js-server/server.configuration');

  TaskMrParse.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrparse', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMrParse = TaskMrParse;

}
