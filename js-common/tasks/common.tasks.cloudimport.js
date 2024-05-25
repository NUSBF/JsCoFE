
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2018-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskCloudImport()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskCloudImport';
  this.name        = 'import from cloud storage';
  this.oname       = '*';   // asterisk here means do not use
  this.title       = 'Import from Cloud Storage';
  this.currentCloudPath = '';
  this.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
  this.fasttrack   = true;  // enforces immediate execution

  this.selected_items = [];  // list of selected file items
  this.file_mod       = {'rename':{},'annotation':[]}; // file modification and annotation

  // declare void input data for passing pre-existing revisions through the task
  this.input_dtypes = [{       // input data types
      data_type   : {'DataRevision':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 100000000, // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 100000000  // maximum acceptable number of data instances
    }
  ];

}

if (__template)
      TaskCloudImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCloudImport.prototype = Object.create ( TaskTemplate.prototype );
TaskCloudImport.prototype.constructor = TaskCloudImport;


// ===========================================================================

TaskCloudImport.prototype.clipboard_name = function()  { return '"Cloud Import"'; }

TaskCloudImport.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskCloudImport.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['cloudimport','import', 'files', 'data', 'storage'] );
  }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskCloudImport.prototype.icon = function()  {
    if (this.state==job_code.remdoc)
          return 'task_remdoc';
    else  return 'task_cimport';
  }

  TaskCloudImport.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'browse ' + appName() + ' storage and import various files from it';
  }

  // TaskCloudImport.prototype.taskDescription = function()  {
  // // this appears under task title in the Task Dialog
  //   return 'Browse ' + appName() + ' storage and import various files from it';
  //   // return 'Task description in small font which will appear under the task title in Task Dialog';
  // }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskCloudImport.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname            = '';
    this.currentCloudPath = task.currentCloudPath;
    this.selected_items   = [];
    this.file_mod         = {'rename':{},'annotation':[]}; // file modification and annotation
    return;
  }

  TaskCloudImport.prototype.onJobDialogStart = function ( job_dialog )  {
    // job_dialog.inputPanel.select_btn.click();
  }

  TaskCloudImport.prototype.onJobDialogClose = function ( job_dialog,callback_func )  {
    if ((this.selected_items.length>0) && (this.state==job_code.new))  {
      new QuestionBox ( 'Import not finished',
                        '<h3>Import not finished</h3>' +
                        'You have selected data files, however the import<br>' +
                        'is not finished yet: the files need to be processed<br>' +
                        'before they can be used in subsequent tasks.',[
          { name    : 'Finish now',
            onclick : function(){
                        callback_func ( false );
                        job_dialog.run_btn.click();
                      }
          },{
            name    : 'Finish later',
            onclick : function(){
                        callback_func ( true );
                      }
          }],'msg_question' );
    } else
      callback_func ( true );
  }

  // reserved function name
  TaskCloudImport.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for ICAT task; dataBox is not used as icat task
  // does not have any input data from the project

    let div = this.makeInputLayout();
    this.setInputDataFields ( div.grid,0,dataBox,this );

    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      // div.header.setLabel ( ' ',2,0,1,1 );
      // div.header.setLabel ( ' ',2,1,1,1 );
      div.header.setLabel ( '<hr/>Use the file selection button below to select and ' +
                          'transfer facility data to the Project (use multiple ' +
                          'file selections and repeat uploads if necessary). ' +
                          'When done, hit <b><i>Import</i></b> button to process ' +
                          'files transferred.<hr/>',
                          3,0, 1,4 ).setFontSize('80%');

    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    let grid_row = div.grid.getNRows();
    div.grid.setWidth ( '100%' );
    div.select_btn = div.grid.setButton ( 'Select file(s)',
                                          image_path('open_file'),grid_row,0,1,1 )
                                          .setNoWrap();
    div.grid.setHorizontalAlignment ( grid_row,0,'center' );

    div.fileListTitle = div.grid.setLabel ( '<b><i>Selected data</i></b>',grid_row+1,0,1,1 );
    div.fileListPanel = div.grid.setLabel ( '',grid_row+2,0,1,1 );

    this.setSelectedCloudFiles ( div,[],null );
    if (this.selected_items.length>0)
      div.select_btn.setText ( 'Select more files' );

    let task = this;
    //(function(task){
      div.select_btn.addOnClickListener ( function(){
        new CloudFileBrowser ( div,task,4,[],function(items){
          task.setSelectedCloudFiles ( div,items,function(new_items){
            if (new_items.length>0)  {
              div.select_btn.setText ( 'Upload more files' );
              new QuestionBox ( 'Files selected',
                                '<h3>Files selected:</h3><ul><li>' +
                                new_items.join('</li><li>') +
                                '</li></ul?',[
                  { name    : 'Select more files',
                    onclick : function(){ div.select_btn.click(); }
                  },{
                    name    : 'Finish import',
                    onclick : function(){ div.job_dialog.run_btn.click(); }
                  },{
                    name    : 'Close'
                  }],'msg_question' );
            }
          });
          return 1;  // close browser window
        },null );
      });
    //}(this))

    return div;

  }


  TaskCloudImport.prototype._display_selected_files = function ( inputPanel )  {
    if ('fileListPanel' in inputPanel)  {
      inputPanel.fileListTitle.setVisible ( this.selected_items.length>0 );
      if (this.selected_items.length>0)  {
        let txt = '';
        for (let i=0;i<this.selected_items.length;i++)  {
          if (i>0)  txt += '<br>';
          txt += this.selected_items[i].name;
        }
        inputPanel.fileListPanel.setText(txt).show();
      }
    }
  }


  TaskCloudImport.prototype.setSelectedCloudFiles = function (
                                  inputPanel,file_items,callback_func )  {

    if (file_items.length<=0)  {
      this._display_selected_files ( inputPanel );
      return;
    }

    let fitems = [];
    let ignore = '';
    for (let i=0;i<file_items.length;i++)
      if (file_items[i]._type!='StorageDir')  {
        let lcname = file_items[i].name.toLowerCase();
        if (endsWith(lcname,'.ccp4_demo') ||
            endsWith(lcname,'.ccp4cloud') ||
            endsWith(lcname,'.zip'))
              ignore += '<li><b>' + file_items[i].name + '</b></li>';
        else  fitems.push ( file_items[i] );
      }

    if (ignore.length>0)
      new MessageBox ( 'File(s) not importable',
                       'Archive file(s) <ul>' + ignore + '</ul> cannot be ' +
                       'imported as data files and will be ignored.<p>' +
                       'If you are trying to import ' + appName() + ' projects, ' +
                       'do this from<br><i>Project List</i> page.' );

    (function(task){

      if (fitems.length>0)  {

        let sfnames = [];
        for (let i=0;i<task.selected_items.length;i++)
          sfnames.push ( task.selected_items[i].name );

        _import_checkFiles ( fitems,task.file_mod,sfnames,function(){

          let new_items = [];
          for (let i=0;i<fitems.length;i++)  {
            if (!startsWith(fitems[i].name,'cloudstorage::/'))
              fitems[i].name = 'cloudstorage::/' + task.currentCloudPath + '/' + fitems[i].name;
            let found = false;
            for (let j=0;(j<task.selected_items.length) && (!found);j++)
              found = (task.selected_items[j].name==fitems[i].name);
            if (!found)  {
              task.selected_items.push ( fitems[i] );
              new_items.push ( fitems[i].name );
            }
          }

          task._display_selected_files ( inputPanel );

          if (callback_func)
            callback_func ( new_items );

        });

      } else
        task._display_selected_files ( inputPanel );

    }(this))

  }

  // reserved function name
  TaskCloudImport.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    //this.selected_items = inputPanel.upload.selected_items;
    //this.file_mod     = inputPanel.customData.file_mod;
    TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    if (this.selected_items.length>0)
      return '';   // input is Ok
    else
      return 'No file(s) have been uploaded';  // input is not ok
  }


  // reserved function name
  TaskCloudImport.prototype.runButtonName = function()  { return 'Import'; }


} else  {
  // for server side

  const fs      = require('fs-extra');
  const path    = require('path');

  const conf    = require('../../js-server/server.configuration');
  const utils   = require('../../js-server/server.utils');
  const uh      = require('../../js-server/server.fe.upload_handler');
  const storage = require('../../js-server/server.fe.storage');


  TaskCloudImport.prototype.icon = function()  {
    if (this.state==__template.job_code.remdoc)
          return 'task_remdoc';
    else  return 'task_cimport';
  }

  TaskCloudImport.prototype.makeInputData = function ( loginData,jobDir )  {
    let uploads_dir = path.join ( jobDir,uh.uploadDir() );

    if (!utils.writeObject(path.join(jobDir,'annotation.json'),this.file_mod))
      console.log ( ' ***** cannot write "annotation.json" in ' + uploads_dir );

    if (!utils.fileExists(uploads_dir))  {
      if (!utils.mkDir( uploads_dir))
        console.log ( ' ***** cannot create directory ' + uploads_dir );
    }

    let cloudMounts = storage.getUserCloudMounts ( loginData );
    for (let i=0;i<this.selected_items.length;i++)  {
      let lst = this.selected_items[i].name.split('/');
      if (lst.length>2)  {
        if (lst[0]=='cloudstorage::')  {
          let cfpath = null;
          for (let j=0;(j<cloudMounts.length) && (!cfpath);j++)
            if (cloudMounts[j][0]==lst[1])
              cfpath = path.join ( cloudMounts[j][1],lst.slice(2).join('/') );
          if (cfpath)  {
            let dest_file = path.join ( uploads_dir,lst[lst.length-1] );
            try {
              fs.copySync ( cfpath,dest_file );
            } catch (err) {
              console.log ( ' ***** cannot copy file ' + cfpath +
                            '\n                   to ' + dest_file );
              console.log ( '       error: ' + err) ;
            }
          } else {
            console.log ( ' ***** path ' + this.selected_items[i].name + ' not found' );
          }
        }
      }
    }

    for (let i=0;i<this.file_mod.annotation.length;i++)  {
      utils.removeFile ( path.join(uploads_dir,this.file_mod.annotation[i].file) );
      //redundant_files.push ( file_mod.annotation[i].file );
      for (let j=0;j<this.file_mod.annotation[i].items.length;j++)  {
        let fname = this.file_mod.annotation[i].items[j].rename;
        utils.writeString ( path.join(uploads_dir,fname),
                            this.file_mod.annotation[i].items[j].contents );
        //fdata.files.push ( fname );
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskCloudImport.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  module.exports.TaskCloudImport = TaskCloudImport;

}
