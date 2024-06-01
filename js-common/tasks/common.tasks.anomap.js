
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.omitmap.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Anomalous Map Task Class
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
function TaskAnoMap()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskAnoMap';
  this.name   = 'anomap';
  this.setOName ( 'anomap' );  // default output file name template
  this.title  = 'Calculate anomalous map with Phaser';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : [  // data type(s) and subtype(s)
                      '!phases','!xyz','!anomalous','~mmcif_only'
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
      TaskAnoMap.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAnoMap.prototype = Object.create ( TaskTemplate.prototype );
TaskAnoMap.prototype.constructor = TaskAnoMap;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAnoMap.prototype.icon           = function()  { return 'task_anomap'; }
TaskAnoMap.prototype.clipboard_name = function()  { return '"Ano Map"';   }

TaskAnoMap.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskAnoMap.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['omit','map'] );
}

// TaskAnoMap.prototype.cleanJobDir = function ( keywords )  {}

if (!__template)  {
  // client side

  TaskAnoMap.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'calculates anomalous maps given partial structure model';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskAnoMap.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  // server side

  const conf = require('../../js-server/server.configuration');

  TaskAnoMap.prototype.makeInputData = function ( loginData,jobDir )  {

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      // if (revision.Substructure)
      //   this.input_data.data['isubstruct'] = [revision.Substructure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskAnoMap.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.anomap', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAnoMap = TaskAnoMap;

}
