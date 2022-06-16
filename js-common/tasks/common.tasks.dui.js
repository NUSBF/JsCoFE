
/*
 *  =================================================================
 *
 *    26.03.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.dui.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  DUI Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2020
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskDUI()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskDUI';
  this.name    = 'dui (image processing)';
  this.setOName ( 'dials' );  // default output file name template
  this.title   = 'Interactive Image Processing with DUI';
  //this.helpURL = './html/jscofe_task_dui.html';
  this.nc_type = 'client';  // job may be run only on client NC

  this.input_dtypes = [];   // no input data for this task

  this.parameters = {       // no input parameters, just label
    L1 : { type     : 'label',
           label    : '<h3>This task will launch DIALS GUI (DUI) on your computer.</h3>',
           position : [0,0,1,1]
         },
    L2 : { type     : 'label',
           label    : '<i>In the end of DUI session, simply save integrated MTZ in ' +
                      'default directory</i>',
           position : [1,0,1,1]
         }
  };

}


if (__template)
      TaskDUI.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDUI.prototype = Object.create ( TaskTemplate.prototype );
TaskDUI.prototype.constructor = TaskDUI;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDUI.prototype.icon = function()  { return 'task_dui'; }

TaskDUI.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskDUI.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

if (!__template)  {
  //  for client side

  TaskDUI.prototype.onJobDialogStart = function ( job_dialog )  {
    job_dialog.run_btn.click();  // start automatically
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskDUI.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.dui', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDUI = TaskDUI;

}
