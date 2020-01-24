
/*
 *  =================================================================
 *
 *    22.01.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.morda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MoRDa Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskMorda()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMorda';
  this.name    = 'morda';
  this.setOName ( 'morda' );  // default output file name template
  this.title   = 'Morda: Model Search & Preparation + MR';
  this.helpURL = './html/jscofe_task_morda.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!asu','~xyz']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Additional parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                ALTGROUPS_CBX : {
                        type     : 'checkbox',
                        label    : 'Check alternative space groups',
                        tooltip  : 'Check to explore compatible space groups',
                        value    : false,
                        position : [0,0,1,3]
                      },
                NMODELS : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : 'NMODELS',  // the real keyword for job input stream
                        label    : 'Maximum number of models to try',
                        tooltip  : 'Choose a value between 1 and 20, or leave ' +
                                   'blank for automatic choice',
                        range    : [1,20],   // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        position : [1,0,1,1] // [row,col,rowSpan,colSpan]
                      }
             }
           }
  };

}


if (__template)
      TaskMorda.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMorda.prototype = Object.create ( TaskTemplate.prototype );
TaskMorda.prototype.constructor = TaskMorda;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskMorda.prototype.icon = function()  { return 'task_morda'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskMorda.prototype.platforms = function()  { return 'LMU'; }  // UNIX only
TaskMorda.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4/share/mrd_data/VERSION','$CCP4/lib/py2/morda/LINKED']];
}

TaskMorda.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskMorda.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and seq data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskMorda.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.morda', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMorda = TaskMorda;

}
