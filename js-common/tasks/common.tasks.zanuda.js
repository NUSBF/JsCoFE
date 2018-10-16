
/*
 *  =================================================================
 *
 *    05.10.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */



var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskZanuda()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskZanuda';
  this.name    = 'zanuda';
  this.oname   = 'zanuda';  // default output file name template
  this.title   = 'Space Group Validation with Zanuda';
  this.helpURL = './html/jscofe_task_zanuda.html';

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
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

}


if (__template)
      TaskZanuda.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskZanuda.prototype = Object.create ( TaskTemplate.prototype );
TaskZanuda.prototype.constructor = TaskZanuda;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskZanuda.prototype.icon_small = function()  { return './images/task_zanuda_20x20.svg'; }
TaskZanuda.prototype.icon_large = function()  { return './images/task_zanuda.svg';       }

TaskZanuda.prototype.currentVersion = function()  { return 1; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskZanuda.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']    = [revision.HKL];
      this.input_data.data['struct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskZanuda.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.zanuda', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskZanuda = TaskZanuda;

}
