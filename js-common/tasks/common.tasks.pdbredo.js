
/*
 *  =================================================================
 *
 *    30.09.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pdbredo.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PDB-REDO
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev  2022
 *
 *  =================================================================
 *
 */

var __template = null;   // null __template indicates that the code runs in
// client browser

// otherwise, the code runs on a server, in which case __template references
// a module with Task Template Class:

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
__template = require ( './common.tasks.template' );

// ===========================================================================

// 1. Define task constructor

function TaskPDBREDO()  {   // must start with Task...

  // invoke the template class constructor:
  if (__template)  __template.TaskTemplate.call ( this );
  else  TaskTemplate.call ( this );

  // define fields important for jsCoFE framework

  this._type   = 'TaskPDBREDO';  // must give name of the class
  this.name    = 'PDB-REDO';     // default name to be shown in Job Tree
  this.setOName ( 'pdbredo' );   // default output file name template
  this.title   = 'PDB-REDO';     // title for job dialog


  this.input_dtypes = [{  // input data types
    data_type : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
    label     : 'Structure revision',     // label for input dialog
    inputId   : 'revision', // input Id for referencing input fields
    version   : 4,          // minimum data version allowed
    min       : 1,          // minimum acceptable number of data instances
    max       : 1           // maximum acceptable number of data instances
  }];

  this.parameters = {};

}

// finish constructor definition

if (__template)
      TaskPDBREDO.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPDBREDO.prototype = Object.create ( TaskTemplate.prototype );
TaskPDBREDO.prototype.constructor = TaskPDBREDO;

// ===========================================================================

// Define task icons. 

TaskPDBREDO.prototype.icon = function()  { return 'task_pdbredo'; }

//  Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. jsCoFE framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskPDBREDO.prototype.currentVersion = function()  {
var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPDBREDO.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'automatically optimise, rebuild, refine and validate structure model';
};

TaskPDBREDO.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['pdbredo','pdb-redo','refinement','rebuild',
                                           'rebuilding','optimise','optimisation',
                                           'validate','validation'] );
}


// ===========================================================================

//  4. Add server-side code

if (__template)  {  //  will run only on server side

  // acquire configuration module
  var conf = require('../../js-server/server.configuration');

  TaskPDBREDO.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  // form command line for server's node js to start task's python driver;
  // note that last 3 parameters are optional and task driver will not use
  // them in most cases.

  TaskPDBREDO.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [  conf.pythonName(),         // will use python from configuration
              '-m',                      // will run task as a python module
              'pycofe.tasks.pdbredo', // path to python driver
              jobManager,                  // framework's type of run: 'SHELL', 'SGE' or 'SCRIPT'
              jobDir,                   // path to job directory given by framework
              this.id                   // task id (assigned by the framework)
          ];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in server's node js

  module.exports.TaskPDBREDO = TaskPDBREDO;

}
