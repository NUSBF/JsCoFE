
/*
 *  =================================================================
 *
 *    10.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.texteditor.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Text Editor Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskTextEditor()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskTextEditor';
  this.name      = 'text editor';
  this.oname     = 'text_editor';   // asterisk here means do not use
  this.title     = 'Text editor';
  this.fasttrack = true;  // enforces immediate execution

  this.upload    = null;

  this.input_dtypes = [{  // input data types
    data_type   : { 'DataRevision' : [],    // data type(s) and subtype(s)
                    'DataSequence' : [],
                    'DataXYZ'      : [],
                    'DataModel'    : [],
                    'DataEnsemble' : [],
                    'DataLigand'   : [],
                    'DataLibrary'  : []
                  },
    unchosen_label : '[Select data]',
    label       : 'Data object',  // label for input dialog
    inputId     : 'object',       // input Id for referencing input fields
    customInput : 'texteditor',   // lay custom fields below the dropdown
    version     : 1,              // minimum data version allowed
    min         : 0,              // minimum acceptable number of data instances
    max         : 1               // maximum acceptable number of data instances
  }];

  this.parameters = {};
  
}


if (__template)
      TaskTextEditor.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskTextEditor.prototype = Object.create ( TaskTemplate.prototype );
TaskTextEditor.prototype.constructor = TaskTextEditor;


// ===========================================================================

//TaskTextEditor.prototype.cleanJobDir   = function ( jobDir )  {}

TaskTextEditor.prototype.icon           = function()  { return 'task_texteditor'; }
TaskTextEditor.prototype.clipboard_name = function()  { return '"Text Editor"';   }

TaskTextEditor.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'edit text data in data objects and revisions';
}

TaskTextEditor.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['text','editor'] );
}

TaskTextEditor.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  // only on client

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskTextEditor.prototype.customDataClone = function ( cloneMode,task )  {
    this.upload = null;
    return;
  }

  // reserved function name
  TaskTextEditor.prototype.runButtonName = function()  { return 'Save'; }


  TaskTextEditor.prototype.getSelectedFile = function ( inputPanel_grid )  {
    
    let object = this.getInputData ( inputPanel_grid.inpDataRef,'object' )[0];
    
    let fspec  = {
      name  : '',
      ftype : '',
      otype : '',
      stype : ''
    };

    if (object)  {

      let files   = object.files;
      fspec.otype = object._type;

      switch (fspec.otype)  {

        case 'DataXYZ'      :
        case 'DataModel'    :
        case 'DataEnsemble' : if (file_key.xyz in files)  {
                                fspec.name  = files[file_key.xyz];
                                fspec.ftype = file_key.xyz
                              }
                            break;

        case 'DataSequence' : if (file_key.seq in files)  {
                                fspec.name  = files[file_key.seq];
                                fspec.ftype = file_key.seq
                              }
                            break;

        case 'DataLigand'   :
        case 'DataLibrary'  : if (file_key.lib in files)  {
                                fspec.name  = files[file_key.lib];
                                fspec.ftype = file_key.lib
                              }
                          break;

        case 'DataRevision' : fspec.name  = object.Options.texteditor.fname;
                              fspec.stype = object.Options.texteditor.stype;
                              // set listener on customGrid selector
                              let item     = this.getInputItem ( inputPanel_grid.inpDataRef,'object' );
                              let dropdown = item.dropdown[0];
                              if (!('listener' in dropdown))  {
                                dropdown.listener = true;
                                (function(task){
                                  dropdown.customGrid.textedit_sel.addOnChangeListener (
                                    function(text,value){
                                      task.loadFile ( inputPanel_grid );
                                    },false );
                                }(this))
                              }
                            break;
        default : ;
      }

    }
    
    inputPanel_grid.aceditor.setVisible ( (fspec.name.length>0) );

    return fspec;

  }


  TaskTextEditor.prototype.loadFile = function ( inputPanel_grid )  {
    if (inputPanel_grid.aceinit)  {
      let fname = null;
      if (this.upload)  fname = this.upload.fspec.name;
                  else  fname = this.getSelectedFile(inputPanel_grid).name;
      if (fname)  {
        fetchJobOutputFile ( this,fname,function(ftext){
          inputPanel_grid.file_loaded = fname;
          inputPanel_grid.aceditor.setText ( ftext );
          inputPanel_grid.content_changed = false;
        },null,function(errdesc){
          inputPanel_grid.file_loaded = null;
          inputPanel_grid.aceditor.setText ( '' );
          new MessageBox ( 'Cannot load file',
            '<h2>Cannot load file from server</h2><i>Error: ' + errdesc + '</i>.',
            'msg_error'
          );
          inputPanel_grid.content_changed = false;
        });
      } else  {
        inputPanel_grid.file_loaded = null;
        inputPanel_grid.aceditor.setText ( '' );
        inputPanel_grid.content_changed = false;
      }
    }
  }


  TaskTextEditor.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
    this.loadFile ( inpParamRef.grid );
  }


  // reserved function name
  TaskTextEditor.prototype.makeInputPanel = function ( dataBox )  {

    let div = TaskTemplate.prototype.makeInputPanel.call ( this,dataBox );

    let row = div.grid.getNRows();

    div.grid.aceditor = new ACEditor ( 80,40,{
        'box-shadow'  : '6px 6px lightgray',
        'theme'       : 'chrome',
        'mode'        : 'python'
      });
    div.grid.setWidget ( div.grid.aceditor,row,0,1,5 );
    div.grid.aceinit         = false;
    div.grid.file_loaded     = null;
    div.grid.content_changed = false;
    div.grid.ace_disable     = false;

    return div;

  }

  TaskTextEditor.prototype.inputPanelResize = function ( inputPanel,panelWidth,panelHeight )  {
    if (inputPanel.job_dialog._created)  {
      // var rect  = inputPanel.grid.aceditor.getBoundingRect();
      // var rect  = inputPanel.grid.getBoundingRect();
      // var rect1 = inputPanel.job_dialog.getBoundingRect();
      if (!inputPanel.grid.aceinit)  {
        inputPanel.grid.aceditor.init ( '','' );
        inputPanel.grid.aceditor.addOnChangeListener ( function(){
          inputPanel.grid.content_changed = true;
        });
        inputPanel.grid.aceinit         = true;
        inputPanel.grid.content_changed = false;
        this.loadFile ( inputPanel.grid );
        inputPanel.grid.aceditor.setReadOnly ( inputPanel.grid.ace_disable );
      }
      // console.log ( ' >>>> ' + (panelHeight - (rect.top-rect1.top-170)) )
      // inputPanel.grid.aceditor.setSize_px ( panelWidth-12,panelHeight - (rect.top-rect1.top-170) );
      inputPanel.grid.aceditor.setSize_px ( panelWidth-12,panelHeight-86 );
    }
  }

  TaskTextEditor.prototype.disableInputWidgets = function ( inputPanel,disable_bool )  {
    TaskTemplate.prototype.disableInputWidgets.call ( this,inputPanel,disable_bool );
    inputPanel.grid.ace_disable = disable_bool;
    if (inputPanel.grid.aceinit)
      inputPanel.grid.aceditor.setReadOnly ( disable_bool );
  }

  
  // TaskTextEditor.prototype.collectInput = function ( inputPanel )  {
  
  //   var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  
  //   // send to server fspec and aceditor
  //   this.getSelectedFile ( inputPanel.grid );
  
  //   return input_msg;
  
  // }
  
  TaskTextEditor.prototype.doRun = function ( inputPanel,run_func )  {

    if (!inputPanel.grid.file_loaded)  {
      new MessageBox ( 'No data selected',
          '<h2>No data selected</h2><i>Nothing to do.</i>',
          'msg_stop' );
    } else if (!inputPanel.grid.content_changed)  {
      new MessageBox ( 'No changes',
          '<h2>Data not changed</h2><i>Nothing to do.</i>',
          'msg_stop' );
    } else  {
      let data = inputPanel.grid.aceditor.getText();
      if (!(data.trim()))  {
        new MessageBox ( 'No data',
            '<h2>Empty data</h2><i>Cannot process empty data.</i>',
            'msg_stop' );
      } else  {
        this.upload = {
          fspec : this.getSelectedFile ( inputPanel.grid ),
          data  : data
        };
        TaskTemplate.prototype.doRun.call ( this,inputPanel,run_func );
      }
    }
  
  }

  TaskTextEditor.prototype.postSubmit = function()  {
    this.upload.data = null;  // save space to optimize project logistics
  }

  TaskTextEditor.prototype.onJobDialogClose = function ( job_dialog,callback_func )  {
    if ((this.state==job_code.new) && job_dialog.inputPanel.grid.file_loaded && 
                                      job_dialog.inputPanel.grid.content_changed)  {
      new QuestionBox ( 'Close Job Dialog',
        '<h2>Warning</h2>' +
        '<i>Changes will be lost if job dialog is closed without saving data.</i>',[
            { name    : 'Close anyway',
              onclick : function(){ callback_func ( true ); }
            },{
              name    : 'Cancel',
              onclick : function(){}
            }],'msg_confirm' );
    } else  {
      callback_func ( true );
    }
  }

}


// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskTextEditor.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('object' in this.input_data.data)  {
      let object = this.input_data.data['object'][0];
      if (object._type=='DataRevision')  {
        // this.input_data.data['hkl']     = [revision.HKL];
        if (object.Structure && (this.upload.fspec.stype=='structure'))
          this.input_data.data['ixyz'] = [object.Structure];
        if (object.Substructure && (this.upload.fspec.stype=='substructure'))
          this.input_data.data['ixyz'] = [object.Substructure];
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskTextEditor.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.texteditor', jobManager, jobDir, this.id];
  }


  // -------------------------------------------------------------------------

  module.exports.TaskTextEditor = TaskTextEditor;

}
