
/*
 *  =================================================================
 *
 *    02.04.20   <--  Date of Last Modification.
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
  //this.helpURL = './html/jscofe_task_docdev.html';
  //this.nc_number = 0;  // forces to use specific number cruncher

  this.input_dtypes = [];   // no input data for this task

  this.parameters = {       // no input parameters, just label
    L1 : { type     : 'label',
           label    : '<h3>This task compiles and deploys documentation packages</h3>',
           position : [0,0,1,5]
         },
    DOC_SEL : {
           type     : 'combobox',
           label    : 'Documentation package:',
           tooltip  : 'Choose documentation package to compile',
           range    : ['taskref|Task Reference',
                       'userguide|User Guide',
                       'dev|Developers Reference'
                      ],
           value    : 'taskref',
           iwidth   : 260,
           position : [1,0,1,1]
         },
    THEME_SEL : {
           type     : 'combobox',
           label    : 'Documentation theme:',
           tooltip  : 'Choose documentation theme',
           range    : ['haiku|HAIKU',
                       'agogo|AGOGO'
                      ],
           value    : 'haiku',
           iwidth   : 260,
           position : [2,0,1,1]
         },
    OUTPUT_SEL : {
           type     : 'combobox',
           label    : 'Result required:',
           tooltip  : 'Choose required result',
           range    : ['compile|Compile only',
                       'deploy|Compile and deploy'
                      ],
           value    : 'compile',
           iwidth   : 260,
           position : [3,0,1,1]
         }
  };

}


if (__template)
      TaskDocDev.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDocDev.prototype = Object.create ( TaskTemplate.prototype );
TaskDocDev.prototype.constructor = TaskDocDev;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDocDev.prototype.icon = function() { return 'task_docdev'; }
TaskDocDev.prototype.requiredEnvironment = function() { return ['DOCREPO']; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskDocDev.prototype.platforms = function() { return 'LMU'; }  // UNIX only

TaskDocDev.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  function DocDevHotButton()  {
    return {
      'task'    : 'TaskDocDev',
      'tooltip' : 'Documentation Development with Sphinx'
    };
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskDocDev.prototype.hotButtons = function() {
    return [DocDevHotButton()];
  }

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
