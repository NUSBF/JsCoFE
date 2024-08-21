  /*  ------------------------------------------------------------------------
   *  file js-common/tasks/common.tasks.helloworld.js
   *  ------------------------------------------------------------------------
   */

  var __template = null;   // null __template indicates that the code runs in
                           // client browser

  // otherwise, the code runs on a server, in which case __template references
  // a module with Task Template Class:

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    __template = require ( './common.tasks.template' );

  // ===========================================================================

  // 1. Define task constructor

  function TaskHelloWorld()  {   // must start with Task...

    // invoke the template class constructor:
    if (__template)  __template.TaskTemplate.call ( this );
               else  TaskTemplate.call ( this );

    // define fields important for |jsCoFE| framework

    this._type   = 'TaskHelloWorld';  // must give name of the class
    this.name    = 'Hello World!';    // default name to be shown in Job Tree
    this.oname   = '*';               // default output file name template;
                                      // asterisk means do not use
    this.title   = 'Hello World! First Example';         // title for job dialog
    this.helpURL = './html/jscofe_task_helloworld.html'; // documentation link,
                                          // please follow file name convention

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

  TaskHelloWorld.prototype.icon_small = function()  {
    return './images/task_helloworld_20x20.png';
  }

  TaskHelloWorld.prototype.icon_large = function()  {
    return './images/task_helloworld.png';
  }

  // 3. Define task version. Whenever task changes (e.g. receives new input
  //    parameters or data), the version number must be advanced. |jsCoFE| framework
  //    forbids cloning jobs with version numbers lower than specified here.

  TaskHelloWorld.prototype.currentVersion = function()  { return 0; }

  // ===========================================================================

  //  4. Add server-side code

  if (__template)  {  //  will run only on server side

    // acquire configuration module
    var conf = require('../../js-server/server.configuration');

    // form command line for server's node js to start task's python driver;
    // note that last 3 parameters are optional and task driver will not use
    // them in most cases.

    TaskHelloWorld.prototype.getCommandLine = function ( exeType,jobDir )  {
      return [ conf.pythonName(),         // will use python from configuration
               '-m',                      // will run task as a python module
               'pycofe.tasks.helloworld', // path to python driver
                exeType,                  // framework's type of run: 'SHELL' or 'SGE'
                jobDir,                   // path to job directory given by framework
                this.id                   // task id (assigned by the framework)
              ];
    }

    // -------------------------------------------------------------------------
    // export such that it could be used in server's node js

    module.exports.TaskHelloWorld = TaskHelloWorld;

  }
