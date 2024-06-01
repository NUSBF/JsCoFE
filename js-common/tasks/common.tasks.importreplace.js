
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.importreplace.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ImportReplace Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;
var __migrate  = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
  __migrate  = require ( './common.tasks.migrate'  );
}

// ===========================================================================

function TaskImportReplace()  {

  if (__migrate)  __migrate.TaskMigrate.call ( this );
            else  TaskMigrate.call ( this );

  this._type = 'TaskImportReplace';
  this.name  = 'import-n-replace';
  this.title = 'Import & Replace';
  //this.setOName ( 'replaced' );  // default output file name template
  this.oname     = '*';   // asterisk here means do not use
  if (__template)
        this.inputMode = __template.input_mode.standard;  // can be used anywhere in the Tree
  else  this.inputMode = input_mode.standard;  // can be used anywhere in the Tree
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
  }];

}

if (__migrate)
      TaskImportReplace.prototype = Object.create ( __migrate.TaskMigrate.prototype );
else  TaskImportReplace.prototype = Object.create ( TaskMigrate.prototype );
TaskImportReplace.prototype.constructor = TaskImportReplace;


// ===========================================================================

TaskImportReplace.prototype.icon           = function()  { return 'task_migrate';       }
TaskImportReplace.prototype.clipboard_name = function()  { return '"Import & Replace"'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskImportReplace.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskImportReplace.prototype.currentVersion = function()  {
  var version = 0;
  if (__migrate)
        return  version + __migrate.TaskMigrate.prototype.currentVersion.call ( this );
  else  return  version + TaskMigrate.prototype.currentVersion.call ( this );
}



// export such that it could be used in both node and a browser

TaskImportReplace.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['import','replace','data'] );
}


if (!__template)  {
  // for client side

  TaskImportReplace.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'import data from your device or ' + appName() +
           ' storage and replace it in Structure Revision';
  }
  

  TaskImportReplace.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Import data from your device or ' + appName() +
           ' storage and replace it in Structure Revision';
  }

  // reserved function name
  TaskImportReplace.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields

    TaskMigrate.prototype.collectInput.call ( this,inputPanel );

    var msg = '';  // Ok if stays empty

    if (this.file_hkl.length + this.file_mtz.length +
        this.file_xyz.length + this.file_lib.length <= 0)
      msg += '<b><i>no data is given for import</i></b>';

    return  msg;

  }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskImportReplace.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['ihkl'] = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      if (revision.Substructure)
        this.input_data.data['isub'] = [revision.Substructure];
    }

    __migrate.TaskMigrate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskImportReplace.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_replace', jobManager, jobDir, this.id];
  }

  module.exports.TaskImportReplace = TaskImportReplace;

}
