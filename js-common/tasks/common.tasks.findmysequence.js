
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.findmysequence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  FindMySequence Task Class
 *       ~~~~~~~~~
 *
 *  (C) G. Chojnowski, E. Krissinel, A. Lebedev 2022-2024
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

function TaskFindMySequence()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskFindMySequence';
  this.name  = 'findmysequence';
  this.setOName ( 'findmysequence' );  // default 
  this.title = 'FindMySequence';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                SELSTR : {
                      type      : 'string_',   // empty string allowed
                      keyword   : 'selstr',
                      label     : 'Model fragment selection',
                      tooltip   : 'Atom selection string in a format: chain X and resi 10:100',
                      default   : 'all',
                      iwidth    : 400,
                      value     : '',
                      emitting  : true,
                      position  : [0,0,1,1]
                    },
                UPID : {
                      type      : 'string_',   // empty string allowed
                      keyword   : 'codes',
                      label     : 'UniProt proteome identifier',
                      tooltip   : 'UPID of a proteome for querying sequences, which will be downloaded automatically from UniProt. By defaulkt program will use a database of PDB sequences.',
                      iwidth    : 200,
                      value     : '',
                      emitting  : true,
                      position  : [1,0,1,1]
                    },
                TOPHITS : {
                      type      : 'integer_',   // empty string allowed
                      keyword   : 'tophits',
                      default   : 3,
                      range     : [1,'*'],
                      label     : 'Number of best sequence hits to show',
                      tooltip   : 'Number of top hits',
                      iwidth    : 20,
                      value     : '',
                      emitting  : true,
                      position  : [2,0,1,1]
                    }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskFindMySequence',TaskFindMySequence,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskFindMySequence',TaskFindMySequence,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskFindMySequence.prototype.icon           = function()  { return 'task_findmysequence'; }
TaskFindMySequence.prototype.clipboard_name = function()  { return '"findMySequence"';    }

TaskFindMySequence.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'reconstructs sequence from phases';
};

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskFindMySequence.prototype.platforms = function()  { return 'LMUW'; }

TaskFindMySequence.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskFindMySequence.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['findmysequence', 'sequence'] );
}


if (!__template)  {
  //  for client side

  TaskFindMySequence.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Protein sequence identification based on a map and backbone model';
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskFindMySequence.prototype.makeInputData = function ( loginData,jobDir )  {
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['istruct'] = [revision.Structure];
    }
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskFindMySequence.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.findmysequence', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFindMySequence = TaskFindMySequence;

}
