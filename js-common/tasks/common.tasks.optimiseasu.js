
/*
 *
 *  mmCIF ready
 * 
 *  =================================================================
 *
 *    07.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.optimiseasu.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Optimise ASU Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2023-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskOptimiseASU()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskOptimiseASU';
  this.name      = 'optimise ASU';
  this.setOName ( 'optimiseasu' );  // default output file name template
  this.title     = 'Optimise Asymmetric Unit';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{  // input data types
      data_type : { 'DataRevision' : ['!xyz'],  // data type(s) and subtype(s)
                    'DataXYZ'      : []
                  },
      label     : 'ASU coordinates', // label for input dialog
      cast      : 'asu',
      inputId   : 'idata',    // input Id for referencing input fields
      version   : 1,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

}

if (__template)
      TaskOptimiseASU.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskOptimiseASU.prototype = Object.create ( TaskTemplate.prototype );
TaskOptimiseASU.prototype.constructor = TaskOptimiseASU;


// ===========================================================================

TaskOptimiseASU.prototype.icon           = function()  { return 'task_optimiseasu'; }
TaskOptimiseASU.prototype.clipboard_name = function()  { return '"Optimise ASU"';   }

TaskOptimiseASU.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'makes ASU compact by moving chains via symmetry operations';
}

TaskOptimiseASU.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskOptimiseASU.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['optimize','optimise','asu','rearrange'] );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
TaskOptimiseASU.prototype.hotButtons = function() {
  return [CootMBHotButton()];
}


// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskOptimiseASU.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('idata' in this.input_data.data)  {
      var idata = this.input_data.data['idata'][0];
      // this.input_data.data['hkl']     = [revision.HKL];
      if ('Structure' in idata)
        this.input_data.data['istruct'] = [idata.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskOptimiseASU.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.optimiseasu', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskOptimiseASU = TaskOptimiseASU;

}
