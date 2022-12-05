
/*
 *  =================================================================
 *
 *    20.07.22   <--  Date of Last Modification.
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
 *  (C) G. Chojnowski, E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskFindMySequence()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskFindMySequence';
  this.name    = 'morda';
  this.setOName ( 'findmysequence' );  // default output file name template
  this.title   = 'FindMySequence';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!asu','!phases']}, // data type(s) and subtype(s)
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
                TAXONOMIC_ID : {
                      type      : 'string',   // empty string not allowed
                      keyword   : 'codes',
                      label     : '<i><b>PDB/UniProt code(s)</b></i>',
                      tooltip   : 'Comma-separated list of PDB and/or UniProt codes to import data from',
                      iwidth    : 680,
                      value     : '',
                      emitting  : true,
                      position  : [0,0,1,4]
                    }
             }
           }
  };

}


if (__template)
      TaskFindMySequence.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFindMySequence.prototype = Object.create ( TaskTemplate.prototype );
TaskFindMySequence.prototype.constructor = TaskFindMySequence;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskFindMySequence.prototype.icon = function()  { return 'task_morda'; }

TaskFindMySequence.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'reconstructs sequence from phases';
};


// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskFindMySequence.prototype.platforms = function()  { return 'LMUW'; }

// TaskFindMySequence.prototype.requiredEnvironment = function() {
//   return ['CCP4',['$CCP4/share/mrd_data/VERSION','$CCP4/lib/py2/morda/LINKED']];
// }

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
    return 'You will write it';
  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskFindMySequence.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and seq data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      // this.input_data.data['hkl'] = [revision.HKL];
      // this.input_data.data['seq'] = revision.ASU.seq;
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
