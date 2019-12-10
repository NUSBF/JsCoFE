
/*
 *  =================================================================
 *
 *    23.11.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.changereso.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Change Space Group Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskChangeReso()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskChangeReso';
  this.name      = 'change dataset resolution';  // short name for job tree
  this.setOName ( 'SpG' );  // default output file name template
  this.title     = 'Change Dataset Resolution';  // full title
  this.helpURL   = './html/jscofe_task_changereso.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['hkl'],
                     'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision or<br>Reflection data', // label for input dialog
      inputId     : 'idata',      // input Id for referencing input fields
      customInput : 'changereso', // lay custom fields next to the selection
                                  // dropdown for anomalous data
      version     : 0,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}


if (__template)
      TaskChangeReso.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskChangeReso.prototype = Object.create ( TaskTemplate.prototype );
TaskChangeReso.prototype.constructor = TaskChangeReso;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeReso.prototype.icon = function()  { return 'task_changereso'; }

TaskChangeReso.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskChangeReso.prototype.makeInputData = function ( loginData,jobDir )  {
    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if (('idata' in this.input_data.data) &&
        (this.input_data.data['idata'][0]._type=='DataRevision') )
      this.input_data.data['hkl'] = [this.input_data.data['idata'][0].HKL];

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskChangeReso.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changereso', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeReso = TaskChangeReso;

}
