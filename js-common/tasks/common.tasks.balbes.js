
/*
 *  =================================================================
 *
 *    20.06.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.balbes.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  BALBES Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskBalbes()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskBalbes';
  this.name    = 'balbes';
  this.setOName ( 'balbes' );  // default output file name template
  this.title   = 'Auto-MR with Balbes';
  //this.helpURL = './html/jscofe_task_balbes.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!asu','~xyz']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

/*
  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Additional parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                FULLSPACEGROUP_CBX : {
                        type     : 'checkbox',
                        label    : 'Check full spacegroup',
                        tooltip  : 'Check to explore full space group',
                        value    : false,
                        position : [0,0,1,3]
                      }
             }
           }
  };
*/

}


if (__template)
      TaskBalbes.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskBalbes.prototype = Object.create ( TaskTemplate.prototype );
TaskBalbes.prototype.constructor = TaskBalbes;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskBalbes.prototype.icon = function()  { return 'task_balbes'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskBalbes.prototype.platforms = function()  { return 'LMU'; }  // UNIX only
TaskBalbes.prototype.requiredEnvironment = function() { return ['CCP4','BALBES_ROOT']; }

TaskBalbes.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  TaskBalbes.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'finds sequence homologs, prepares search models and performs MR';
  }

  TaskBalbes.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Finds sequence homologs, prepares search models and performs MR';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskBalbes.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskBalbes.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and seq data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskBalbes.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.balbes', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskBalbes = TaskBalbes;

}
