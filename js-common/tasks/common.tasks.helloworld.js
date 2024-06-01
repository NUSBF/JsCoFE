/*  ------------------------------------------------------------------------
 *  file js-common/tasks/common.tasks.helloworld.js
 *  ------------------------------------------------------------------------
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

  // ===========================================================================

  // 1. Define task constructor

  function TaskHelloWorld()  {   // must start with Task...

    // invoke the template class constructor:
    if (__template)  __template.TaskTemplate.call ( this );
               else  TaskTemplate.call ( this );

    // define fields important for jsCoFE framework

    this._type   = 'TaskHelloWorld';  // must give name of the class
    this.name    = 'Hello World!';    // default name to be shown in Job Tree
    this.oname   = '*';               // default output file name template;
                                      // asterisk means do not use
    this.title   = 'Hello World! First Example';         // title for job dialog

    this.input_dtypes = [{      // input data types
       data_type : {'DataXYZ':[]},    // data type(s) and subtype(s)
       label     : 'XYZ Coordinates', // label for input dialog
       inputId   : 'xyz',       // input Id for referencing input fields
       force     : 1,           // show 1 dataset if few are available
       version   : 0,           // minimal version data acceptable
       min       : 0,           // minimum acceptable number of data instances
       max       : 20           // maximum acceptable number of data instances
     }
    ];

    this.parameters = { // container for all input parameters

      sec1  :  // unique Section ID used for fetching parameters in Task Driver
          { type     : 'section',      // widget type
            title    : 'Main options', // Section title
            open     : true,       // true for the section to be initially open
            position : [0,0,1,5],  // must span 5 columns
            contains : {           // container for Section's parameters

              NCLUST :  // unique key for fetching parameter value in Task Driver
                   {  type      : 'integer',  // parameter type
                      label     : 'Number of clusters',
                      tooltip   : 'Specify the number of clusters between 1 and 50',
                      range     : [1,50],   // for auto-validation by the framework
                      value     : '10',
                      default   : '10',
                      position  : [0,0,1,1], // numbering starts from 0 in all sections
                      hideon    : {xyz:[-1,0]}
                    },

              HATOM :
                   {
                      type      : 'string',
                      label     : 'Atom type',
                      tooltip   : 'Substructure atom giving anomalous scattering',
                      value     : 'Se',
                      maxlength : 2,       // maximum input length
                      emitting  : true,    // allow to emit signals on change
                      position  : [1,0,1,1]
                    },

              PROGRAM :
                    {
                      type     : 'combobox',
                      label    : 'Substructure determination program',
                      tooltip  : 'The program that will be used for ' +
                                 'substructure determination',
                      range    : ['_blank_|Auto',
                                  'pgm_shelxd|ShelXD',
                                  'pgm_prasa|Prasa'
                                 ],
                      value    : '_blank_',
                      position : [2,0,1,1]
                    },

              HANDDET_DO :
                    {
                      type     : 'checkbox',
                      label    : 'Perform hand determination',
                      tooltip  : 'Unselect if you wish to skip the hand ' +
                                 'determination and directly proceed with the ' +
                                 'current hand',
                      value    : true,
                      position : [3,0,1,1],
                      showon   : {HATOM:['Se','Hg']},
                      hideon   : {PROGRAM:['pgm_prasa']}
                    }

            }
          }
    };

    this.saveDefaultValues ( this.parameters );

  }

  // finish constructor definition

  if (__template)
        TaskHelloWorld.prototype = Object.create ( __template.TaskTemplate.prototype );
  else  TaskHelloWorld.prototype = Object.create ( TaskTemplate.prototype );
  TaskHelloWorld.prototype.constructor = TaskHelloWorld;

  // ===========================================================================

  // 2. Define task icons. Any graphics formats (*.svg, *.png, *.jpg) may be used,
  //    but please follow file name convention as below. Small 20x20px icon is
  //    used in Job Tree, and the large icon is used in Job Dialog and documentation.

  TaskHelloWorld.prototype.icon           = function()  { return 'task_helloworld'; }
  TaskHelloWorld.prototype.clipboard_name = function()  { return '"HelloWorld"';    }

  // 3. Define task version. Whenever task changes (e.g. receives new input
  //    parameters or data), the version number must be advanced. jsCoFE framework
  //    forbids cloning jobs with version numbers lower than specified here.

  TaskHelloWorld.prototype.currentVersion = function()  {
    var version = 1;
    if (__template)
          return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
    else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
  }

  // ===========================================================================

  //  4. Add server-side code

  if (__template)  {  //  will run only on server side

    // acquire configuration module
    var conf = require('../../js-server/server.configuration');

    // form command line for server's node js to start task's python driver;
    // note that last 3 parameters are optional and task driver will not use
    // them in most cases.

    TaskHelloWorld.prototype.getCommandLine = function ( jobManager,jobDir )  {
      return [ conf.pythonName(),         // will use python from configuration
               '-m',                      // will run task as a python module
               'pycofe.tasks.helloworld', // path to python driver
                jobManager,                  // framework's type of run: 'SHELL', 'SGE' or 'SCRIPT'
                jobDir,                   // path to job directory given by framework
                this.id                   // task id (assigned by the framework)
              ];
    }

    // -------------------------------------------------------------------------
    // export such that it could be used in server's node js

    module.exports.TaskHelloWorld = TaskHelloWorld;

  }
