
/*
 *  =================================================================
 *
 *    15.02.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.docdev.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Documentation Development Task
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskDocDev()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskDocDev';
  this.name    = 'documentation development';
  this.setOName ( '*' );  // default output file name template
  this.title   = 'Documentation Development with Sphinx';
  this.helpURL = './html/jscofe_task_docdev.html';

  this.input_dtypes = [];   // no input data for this task

  this.parameters = {       // no input parameters, just label
    L1 : { type     : 'label',
           label    : '<h3>This task is available only from developer\'s account</h3>',
           position : [0,0,1,1]
         }
  };

}


if (__template)
      TaskDocDev.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDocDev.prototype = Object.create ( TaskTemplate.prototype );
TaskDocDev.prototype.constructor = TaskDocDev;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDocDev.prototype.icon                = function()  { return 'task_docdev'; }
//TaskDocDev.prototype.requiredEnvironment = function() { return ['CCP4','XDS_home','XDSGUI_home']; }

TaskDocDev.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

if (!__template)  {
  //  for client side

  TaskDocDev.prototype.onJobDialogStart = function ( job_dialog )  {
    //job_dialog.run_btn.click();  // start automatically
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskDocDev.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.docdev', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDocDev = TaskDocDev;

}
