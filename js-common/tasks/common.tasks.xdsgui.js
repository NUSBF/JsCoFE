
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.xdsgui.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XDSGUI Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
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

function TaskXDSGUI()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskXDSGUI';
  this.name    = 'xds (image processing)';
  this.setOName ( 'xds' );  // default output file name template
  this.title   = 'Interactive Image Processing with XDS';
  this.nc_type = 'client';  // job may be run only on client NC

  this.input_dtypes = [];   // no input data for this task

  this.parameters = {       // no input parameters, just label
    L1 : { type     : 'label',
           label    : '<h3>This task will launch XDS GUI on your computer.</h3>',
           position : [0,0,1,1]
         },
    L2 : { type     : 'label',
           label    : '<i>In the end of XDS GUI session, simply save integrated MTZ in ' +
                      'default directory</i>',
           position : [1,0,1,1]
         }
  };

}

if (__template)
  __cmd.registerClass ( 'TaskXDSGUI',TaskXDSGUI,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskXDSGUI',TaskXDSGUI,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskXDSGUI.prototype.icon                = function() { return 'task_xdsgui'; }
TaskXDSGUI.prototype.clipboard_name      = function() { return '"XDS GUI"';   }
TaskXDSGUI.prototype.requiredEnvironment = function() { return ['CCP4','XDS_home','XDSGUI_home']; }
TaskXDSGUI.prototype.lowestClientVersion = function() { return '1.6.005 [29.01.2019]'; }
TaskXDSGUI.prototype.cloneItems          = function() { return ['xds_dir']; }

TaskXDSGUI.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskXDSGUI.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xds','gui', 'image', 'processing'] );
}

if (!__template)  {
  //  for client side
  TaskXDSGUI.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return '';
    };


  TaskXDSGUI.prototype.onJobDialogStart = function ( job_dialog )  {
    job_dialog.run_btn.click();  // start automatically
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskXDSGUI.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xdsgui', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskXDSGUI = TaskXDSGUI;

}
