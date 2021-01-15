
/*
 *  =================================================================
 *
 *    14.01.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.migrate' );


// ===========================================================================

function TaskImportReplace()  {

  if (__template)  __template.TaskMigrate.call ( this );
             else  TaskMigrate.call ( this );

  this._type = 'TaskImportReplace';
  this.name  = 'import-n-replace';
  this.title = 'Import & Replace';
  //this.setOName ( 'migrated' );  // default output file name template
  //this.oname     = '*';   // asterisk here means do not use
  //this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
  }];

}

if (__template)
      TaskImportReplace.prototype = Object.create ( __template.TaskMigrate.prototype );
else  TaskImportReplace.prototype = Object.create ( TaskMigrate.prototype );
TaskImportReplace.prototype.constructor = TaskImportReplace;


// ===========================================================================

TaskImportReplace.prototype.icon = function()  { return 'task_migrate'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskImportReplace.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskImportReplace.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskMigrate.prototype.currentVersion.call ( this );
  else  return  version + TaskMigrate.prototype.currentVersion.call ( this );
}

/*
// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  //  This function is called when task is finally sent to FE to run. Should
  // execute function given as argument, or issue an error message if run
  // should not be done.
  TaskImportReplace.prototype.doRun = function ( inputPanel,run_func )  {
  var files = [];
  var file_hkl = inputPanel.select_hkl['fsel'].getFiles();
  var file_mtz = inputPanel.select_mtz['fsel'].getFiles();
  var file_xyz = inputPanel.select_xyz['fsel'].getFiles();
  var file_lib = inputPanel.select_lib['fsel'].getFiles();

    if (file_hkl.length<=0)  {
      files.push ( file_hkl );
      this.file_hkl = file_hkl[0].name;
    }
    if (file_mtz.length>0)  {
      files.push ( file_mtz );
      this.file_mtz = file_mtz[0].name;
    }
    if (file_xyz.length>0)  {
      files.push ( file_xyz );
      this.file_xyz = file_xyz[0].name;
    }
    if (file_lib.length>0)  {
      files.push ( file_lib );
      this.file_lib = file_lib[0].name;
    }

    if (files.length<0)  {
      new MessageBox ( 'Stop run','Task cannot be run as no structure<br>' +
                                  'data are given' );
    } else  {
      new UploadDialog ( 'Upload data',files,inputPanel.customData,true,
                          function(returnCode){
        if (!returnCode)
          run_func();
        else
          new MessageBox ( 'Stop run','Task cannot be run due to upload ' +
                                'errors:<p><b><i>' + returnCode + '</i></b>' );
      });
    }

  }

  // reserved function name
  TaskImportReplace.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskImportReplace.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.migrate', jobManager, jobDir, this.id];
  }

  module.exports.TaskImportReplace = TaskImportReplace;

}
*/
