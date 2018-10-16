
/*
 *  =================================================================
 *
 *    05.10.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2018
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskCloudImport()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskCloudImport';
  this.name        = 'cloud import';
  this.oname       = '*';   // asterisk here means do not use
  this.title       = 'Cloud Import';
  this.helpURL     = './html/jscofe_task_cimport.html';
  this.currentCloudPath = '';
  this.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
  this.fasttrack   = true;  // enforces immediate execution

  this.upload_files = [];  // list of uploaded files

}

if (__template)
      TaskCloudImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCloudImport.prototype = Object.create ( TaskTemplate.prototype );
TaskCloudImport.prototype.constructor = TaskCloudImport;


// ===========================================================================

TaskCloudImport.prototype.icon_small = function()  { return './images/task_cimport_20x20.svg'; }
TaskCloudImport.prototype.icon_large = function()  { return './images/task_cimport.svg';       }

TaskCloudImport.prototype.currentVersion = function()  { return 0; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskCloudImport.prototype.customDataClone = function ( task )  {
    this.uname = '';
    this.currentCloudPath = task.currentCloudPath;
    return;
  }

  // reserved function name
  TaskCloudImport.prototype.makeInputPanel = function ( dataBox )  {
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
                                          './images/open_file.svg',0,0,1,1 )
                                          .setNoWrap();
    div.grid.setHorizontalAlignment ( 0,0,'center' );

    div.fileListTitle = div.grid.setLabel ( '<b><i>Selected data</i></b>',1,0,1,1 );
    div.fileListPanel = div.grid.setLabel ( '',2,0,1,1 );

    /*
    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = this.file_mod;
    */

    this.setSelectedCloudFiles ( div,[] );

    (function(task){
      div.select_btn.addOnClickListener ( function(){
        new CloudFileBrowser ( div,task,0,null );
      });
    }(this))

    return div;

  }

  TaskCloudImport.prototype.setSelectedCloudFiles = function ( inputPanel,file_items )  {

    (function(task){

      _import_checkFiles ( file_items,task.file_mod,task.upload_files,function(){

        for (var i=0;i<file_items.length;i++)  {
          var cfpath = 'cloudstorage::/' + task.currentCloudPath + '/' + file_items[i].name;
          if (task.upload_files.indexOf(cfpath)<0)
            task.upload_files.push ( cfpath );
        }

        if ('fileListPanel' in inputPanel)  {
          inputPanel.fileListTitle.setVisible ( task.upload_files.length>0 );
          if (task.upload_files.length>0)  {
            var txt = '';
            for (var i=0;i<task.upload_files.length;i++)  {
              if (i>0)  txt += '<br>';
              txt += task.upload_files[i];
            }
            inputPanel.fileListPanel.setText(txt).show();
          }
        }

      });

    }(this))

  }

  // reserved function name
  TaskCloudImport.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    //this.upload_files = inputPanel.upload.upload_files;
    //this.file_mod     = inputPanel.customData.file_mod;
    if (this.upload_files.length>0)
      return '';   // input is Ok
    else
      return 'No file(s) have been uploaded';  // input is not ok
  }

  // reserved function name
  TaskCloudImport.prototype.runButtonName = function()  { return 'Import'; }


} else  {
  // for server side

  var fs    = require('fs-extra');
  var path  = require('path');

  var conf  = require('../../js-server/server.configuration');
  var utils = require('../../js-server/server.utils');
  var uh    = require('../../js-server/server.fe.upload_handler');
  var fcl   = require('../../js-server/server.fe.facilities');

  TaskCloudImport.prototype.makeInputData = function ( login,jobDir )  {
    var uploads_dir = path.join ( jobDir,uh.uploadDir() );

    if (!utils.writeObject(path.join(jobDir,'annotation.json'),this.file_mod))
      console.log ( ' ***** cannot write "annotation.json" in ' + uploads_dir );

    if (!utils.fileExists(uploads_dir))  {
      if (!utils.mkDir( uploads_dir))
        console.log ( ' ***** cannot create directory ' + uploads_dir );
    }

    var cloudMounts = fcl.getUserCloudMounts ( login );
    for (var i=0;i<this.upload_files.length;i++)  {
      var lst = this.upload_files[i].split('/');
      if (lst.length>2)  {
        if (lst[0]=='cloudstorage::')  {
          var cfpath = null;
          for (var j=0;(j<cloudMounts.length) && (!cfpath);j++)
            if (cloudMounts[j][0]==lst[1])
              cfpath = path.join ( cloudMounts[j][1],lst.slice(2).join('/') );
          if (cfpath)  {
            var dest_file = path.join ( uploads_dir,lst[lst.length-1] );
            try {
              fs.copySync ( cfpath,dest_file );
            } catch (err) {
              console.log ( ' ***** cannot copy file ' + cfpath +
                            '\n                   to ' + dest_file );
              console.log ( '       error: ' + err) ;
            }
          } else {
            console.log ( ' ***** path ' + this.upload_files[i] + ' not found' );
          }
        }
      }
    }

    for (var i=0;i<this.file_mod.annotation.length;i++)  {
      utils.removeFile ( path.join(uploads_dir,this.file_mod.annotation[i].file) );
      //redundant_files.push ( file_mod.annotation[i].file );
      for (var j=0;j<this.file_mod.annotation[i].items.length;j++)  {
        var fname = this.file_mod.annotation[i].items[j].rename;
        utils.writeString ( path.join(uploads_dir,fname),
                            this.file_mod.annotation[i].items[j].contents );
        //fdata.files.push ( fname );
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskCloudImport.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', exeType, jobDir, this.id];
  }

  module.exports.TaskCloudImport = TaskCloudImport;

}
