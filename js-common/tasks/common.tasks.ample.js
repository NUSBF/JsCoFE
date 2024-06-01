
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.ample.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ample Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
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

function TaskAmple()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskAmple';
  this.name   = 'ample';
  this.setOName ( 'ample' );  // default output file name template
  this.title  = 'Ab-Initio Molecular Replacement with Ample';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      //customInput : 'molrep',   // lay custom fields below the dropdown
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    WARNING_LBL : { type     : 'label',
                    label    : '&nbsp;<br><i><b>Note:</b> this task takes ' +
                               'significant computational resources and may ' +
                               'put you outside your monthly quota.</i>',
                    position : [0,0,1,5]
                  }
  };

}

if (__template)
  __cmd.registerClass ( 'TaskAmple',TaskAmple,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskAmple',TaskAmple,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskAmple.prototype.icon           = function()  { return 'task_ample'; }
TaskAmple.prototype.clipboard_name = function()  { return '"Ample"';    }
TaskAmple.prototype.requiredEnvironment = function() { return ['CCP4','ROSETTA_DIR']; }

TaskAmple.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskAmple.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['ample','molecular', 'replacement', 'mr'] );
  }

if (__template)  {
  //  for server side
  TaskAmple.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'use ab initio models as search models in molecular replacement';
    };

  var conf = require('../../js-server/server.configuration');

  TaskAmple.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskAmple.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ample', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAmple = TaskAmple;

}
