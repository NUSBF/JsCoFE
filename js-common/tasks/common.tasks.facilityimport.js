
//  LEGACY CODE, ONLY BE USED FOR COMPLIANCY WITH OLD PROJECTS
//  RETIRED ON 03.03.21


/*
 *  =================================================================
 *
 *    25.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phasermr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Facility Import Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskFacilityImport()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskTemplate.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type      = 'TaskFacilityImport';
  this.name       = 'facility import';
  this.oname      = '*';   // asterisk here means do not use
  this.title      = 'Facility Import';
  this.fasttrack  = true;  // enforces immediate execution
  this.inprogress = 0;     // indicates whether facility request is in progress

  this.upload_files = [];  // list of uploaded files

}

if (__template)
      TaskFacilityImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFacilityImport.prototype = Object.create ( TaskTemplate.prototype );
TaskFacilityImport.prototype.constructor = TaskFacilityImport;


// ===========================================================================

TaskFacilityImport.prototype.icon           = function()  { return 'task_fimport';      }
TaskFacilityImport.prototype.clipboard_name = function()  { return '"Facility Import"'; }

TaskFacilityImport.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskFacilityImport.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname = '';
    return;
  }

  // reserved function name
  TaskFacilityImport.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for ICAT task; dataBox is not used as icat task
  // does not have any input data from the project

    var div = this.makeInputLayout();

    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
      div.header.setLabel ( '<hr/>Use the file selection button below to select and ' +
                          'transfer facility data to the Project (use multiple ' +
                          'file selections and repeat uploads if necessary). ' +
                          'When done, hit <b><i>Import</i></b> button to process ' +
                          'files transferred.<hr/>',
                          3,0, 1,4 ).setFontSize('80%');

    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    div.grid.setWidth ( '100%' );
    div.select_btn = div.grid.setButton ( 'Select file(s)',
                                          image_path('open_file'),0,0,1,1 )
                                          .setNoWrap();
    div.grid.setHorizontalAlignment ( 0,0,'center' );

    div.fileListTitle = div.grid.setLabel ( '<b><i>Uploaded</i></b>',1,0,1,1 );
    div.fileListPanel = div.grid.setLabel ( '',2,0,1,1 );
    //div.fileListPanel.element.setAttribute ( 'class','upload-filelist' );

    this.setUploadedFiles ( div,[] );

    (function(task){
      div.select_btn.addOnClickListener ( function(){
        // new FacilityBrowser ( div,task );
      });

      if (task.inprogress)
        window.setTimeout ( function(){
          div.select_btn.click();
        },0 );

    }(this))

    return div;

  }


  TaskFacilityImport.prototype.setUploadedFiles = function ( inputPanel,file_list )  {
    for (var i=0;i<file_list.length;i++)
      if (this.upload_files.indexOf(file_list[i])<0)
        this.upload_files.push ( file_list[i] );
    if ('fileListPanel' in inputPanel)  {
      inputPanel.fileListTitle.setVisible ( this.upload_files.length>0 );
      if (this.upload_files.length>0)  {
        var txt = this.upload_files[0];
        for (var i=1;i<this.upload_files.length;i++)
          txt += '<br>' + this.upload_files[i];
        inputPanel.fileListPanel.setText(txt).show();
      }
    }
  }


  // reserved function name
  TaskFacilityImport.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskFacilityImport.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  module.exports.TaskFacilityImport = TaskFacilityImport;

}
