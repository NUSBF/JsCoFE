
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.zanuda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Zanuda Task Class
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

function TaskZanuda()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskZanuda';
  this.name    = 'zanuda';
  this.setOName ( 'zanuda' );  // default output file name template
  this.title   = 'Space Group Validation with Zanuda';

  this.input_dtypes = [{      // input data types
      data_type : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                MODE  : { type     : 'combobox',
                          keyword  : 'cloudmode',
                          label    : 'Work mode',
                          tooltip  : 'Work mode and results handling',
                          range    : ['refine_clear|Refine in all space groups, keep the best one',
                                      'refine_keep|Refine in all space groups, keep all results',
                                      'transform|Only transform to all space groups, don\'t refine'
                                     ],
                          value    : 'refine_clear',
                          position : [0,0,1,5]
                        }
             }
           },
    sec2 : { type     : 'section',
             title    : 'Advanced parameters',
             open     : false,  // true for the section to be initially open
             position : [1,0,1,5],
             contains : {
                AVER_CBX : {
                        type     : 'checkbox',
                        label    : 'Start from structure transformed into pseudosymmetry space group',
                        tooltip  : 'Check to start from structure transformed into pseudosymmetry space group',
                        value    : false,
                        position : [0,0,1,3]
                      },
                NOTWIN_CBX : {
                        type     : 'checkbox',
                        label    : 'Check only space group with the same point group as input structure',
                        tooltip  : 'Check to limit to space group with the same point group as input structure',
                        value    : false,
                        position : [1,0,1,3]
                      }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskZanuda',TaskZanuda,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskZanuda',TaskZanuda,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskZanuda.prototype.icon           = function()  { return 'task_zanuda'; }
TaskZanuda.prototype.clipboard_name = function()  { return '"Zanuda"';    }

TaskZanuda.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskZanuda.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'validates space group in case of the presence of pseudosymmetry and twinning';
}

TaskZanuda.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'zanuda', 'space','group','validation', 'pseudosymmetry','pseudo-symmetry','pseudo',
                'symmetry','analysis'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskZanuda.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']    = [revision.HKL];
      this.input_data.data['struct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskZanuda.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.zanuda', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskZanuda = TaskZanuda;

}
