
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.exportmaps.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Export Maps Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================
function TaskExportMaps()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskExportMaps';
  this.name   = 'exportmaps';
  this.setOName ( 'exportmap' );  // default output file name template
  this.title  = 'Export density maps';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : [  // data type(s) and subtype(s)
                      '!phases'
                    ]
                  },
    label       : 'Structure revision', // label for input dialog
    inputId     : 'revision',   // input Id for referencing input fields
    min         : 1,            // minimum acceptable number of data instances
    max         : 1             // maximum acceptable number of data instances
  }];

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskExportMaps.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskExportMaps.prototype = Object.create ( TaskTemplate.prototype );
TaskExportMaps.prototype.constructor = TaskExportMaps;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskExportMaps.prototype.icon           = function()  { return 'task_exportmaps'; }
TaskExportMaps.prototype.clipboard_name = function()  { return '"Export Maps"';   }

TaskExportMaps.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskExportMaps.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['export','map'] );
}

// TaskExportMaps.prototype.cleanJobDir = function ( keywords )  {}

if (!__template)  {
  // client side

  TaskExportMaps.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'exports electron density maps in map format (for PyMOL etc)';
  }

} else  {
  // server side

  const conf = require('../../js-server/server.configuration');

  TaskExportMaps.prototype.makeInputData = function ( loginData,jobDir )  {

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      if (revision.Substructure)
        this.input_data.data['isubstruct'] = [revision.Substructure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskExportMaps.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.exportmaps', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskExportMaps = TaskExportMaps;

}
