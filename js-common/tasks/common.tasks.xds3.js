
/*
 *  =================================================================
 *
 *    09.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.texteditor.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XDS Processing Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskXDS3()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskXDS3';
  this.name  = 'xds processing';
  this.oname = 'xds';   // asterisk here means do not use
  this.title = 'Image processing with XDS';

  this.input_dtypes = [];
  this.parameters   = {};
  
}

if (__template)
      TaskXDS3.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXDS3.prototype = Object.create ( TaskTemplate.prototype );
TaskXDS3.prototype.constructor = TaskXDS3;


// ===========================================================================

//TaskXDS3.prototype.cleanJobDir   = function ( jobDir )  {}

TaskXDS3.prototype.icon           = function()  { return 'task_xds3'; }
TaskXDS3.prototype.clipboard_name = function()  { return '"XDS3"';   }

TaskXDS3.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'image processing with XDS';
}

TaskXDS3.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['text','editor'] );
}

TaskXDS3.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function XDS3HotButton()  {
  return {
    'task_name' : 'TaskXDS3',
    'tooltip'   : 'Run XDS processing'
  };
}

if (!__template)  {
  // only on client

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  // TaskXDS3.prototype.customDataClone = function ( cloneMode,task )  {
  //   this.upload = null;
  //   return;
  // }

  // reserved function name
  // TaskXDS3.prototype.runButtonName = function()  { return 'Save'; }


  // TaskXDS3.prototype.getSelectedFile = function ( inputPanel_grid )  {
    
  //   var object = this.getInputData ( inputPanel_grid.inpDataRef,'object' )[0];
    
  //   var fspec  = {
  //     name  : '',
  //     ftype : '',
  //     otype : '',
  //     stype : ''
  //   };

  //   if (object)  {

  //     var files   = object.files;
  //     fspec.otype = object._type;

  //     switch (fspec.otype)  {

  //       case 'DataXYZ'      :
  //       case 'DataModel'    :
  //       case 'DataEnsemble' : if (file_key.xyz in files)  {
  //                               fspec.name  = files[file_key.xyz];
  //                               fspec.ftype = file_key.xyz
  //                             }
  //                           break;

  //       case 'DataSequence' : if (file_key.seq in files)  {
  //                               fspec.name  = files[file_key.seq];
  //                               fspec.ftype = file_key.seq
  //                             }
  //                           break;

  //       case 'DataLigand'   :
  //       case 'DataLibrary'  : if (file_key.lib in files)  {
  //                               fspec.name  = files[file_key.lib];
  //                               fspec.ftype = file_key.lib
  //                             }
  //                         break;

  //       case 'DataRevision' : fspec.name  = object.Options.texteditor.fname;
  //                             fspec.stype = object.Options.texteditor.stype;
  //                             // set listener on customGrid selector
  //                             var item     = this.getInputItem ( inputPanel_grid.inpDataRef,'object' );
  //                             var dropdown = item.dropdown[0];
  //                             if (!('listener' in dropdown))  {
  //                               dropdown.listener = true;
  //                               (function(task){
  //                                 dropdown.customGrid.textedit_sel.addOnChangeListener (
  //                                   function(text,value){
  //                                     task.loadFile ( inputPanel_grid );
  //                                   },false );
  //                               }(this))
  //                             }
  //                           break;
  //       default : ;
  //     }

  //   }
    
  //   inputPanel_grid.aceditor.setVisible ( (fspec.name.length>0) );

  //   return fspec;

  // }


  // TaskXDS3.prototype.loadFile = function ( inputPanel_grid )  {
  //   if (inputPanel_grid.aceinit)  {
  //     var fname = null;
  //     if (this.upload)  fname = this.upload.fspec.name;
  //                 else  fname = this.getSelectedFile(inputPanel_grid).name;
  //     if (fname)  {
  //       fetchJobOutputFile ( this,fname,function(ftext){
  //         inputPanel_grid.file_loaded = fname;
  //         inputPanel_grid.aceditor.setText ( ftext );
  //         inputPanel_grid.content_changed = false;
  //       },null,function(errdesc){
  //         inputPanel_grid.file_loaded = null;
  //         inputPanel_grid.aceditor.setText ( '' );
  //         new MessageBox ( 'Cannot load file',
  //           '<h2>Cannot load file from server</h2><i>Error: ' + errdesc + '</i>.',
  //           'msg_error'
  //         );
  //         inputPanel_grid.content_changed = false;
  //       });
  //     } else  {
  //       inputPanel_grid.file_loaded = null;
  //       inputPanel_grid.aceditor.setText ( '' );
  //       inputPanel_grid.content_changed = false;
  //     }
  //   }
  // }


  // TaskXDS3.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
  //   TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
  //   this.loadFile ( inpParamRef.grid );
  // }


  // reserved function name
  TaskXDS3.prototype.makeInputPanel = function ( dataBox )  {

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

  TaskXDS3.prototype.inputPanelResize = function ( inputPanel,panelWidth,panelHeight )  {
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

  TaskXDS3.prototype.disableInputWidgets = function ( inputPanel,disable_bool )  {
    TaskTemplate.prototype.disableInputWidgets.call ( this,inputPanel,disable_bool );
    inputPanel.grid.ace_disable = disable_bool;
    if (inputPanel.grid.aceinit)
      inputPanel.grid.aceditor.setReadOnly ( disable_bool );
  }

  
  // TaskXDS3.prototype.collectInput = function ( inputPanel )  {
  
  //   var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  
  //   // send to server fspec and aceditor
  //   this.getSelectedFile ( inputPanel.grid );
  
  //   return input_msg;
  
  // }
  
  // TaskXDS3.prototype.doRun = function ( inputPanel,run_func )  {

  //   if (!inputPanel.grid.file_loaded)  {
  //     new MessageBox ( 'No data selected',
  //         '<h2>No data selected</h2><i>Nothing to do.</i>',
  //         'msg_stop' );
  //   } else if (!inputPanel.grid.content_changed)  {
  //     new MessageBox ( 'No changes',
  //         '<h2>Data not changed</h2><i>Nothing to do.</i>',
  //         'msg_stop' );
  //   } else  {
  //     var data = inputPanel.grid.aceditor.getText();
  //     if (!(data.trim()))  {
  //       new MessageBox ( 'No data',
  //           '<h2>Empty data</h2><i>Cannot process empty data.</i>',
  //           'msg_stop' );
  //     } else  {
  //       this.upload = {
  //         fspec : this.getSelectedFile ( inputPanel.grid ),
  //         data  : data
  //       };
  //       TaskTemplate.prototype.doRun.call ( this,inputPanel,run_func );
  //     }
  //   }
  
  // }

  // TaskXDS3.prototype.postSubmit = function()  {
  //   this.upload.data = null;  // save space to optimize project logistics
  // }

  // TaskXDS3.prototype.onJobDialogClose = function ( job_dialog,callback_func )  {
  //   if ((this.state==job_code.new) && job_dialog.inputPanel.grid.file_loaded && 
  //                                     job_dialog.inputPanel.grid.content_changed)  {
  //     new QuestionBox ( 'Close Job Dialog',
  //       '<h2>Warning</h2>' +
  //       '<i>Changes will be lost if job dialog is closed without saving data.</i>',[
  //           { name    : 'Close anyway',
  //             onclick : function(){ callback_func ( true ); }
  //           },{
  //             name    : 'Cancel',
  //             onclick : function(){}
  //           }],'msg_confirm' );
  //   } else  {
  //     callback_func ( true );
  //   }
  // }

}


// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  // TaskXDS3.prototype.makeInputData = function ( loginData,jobDir )  {

  //   // put hkl and structure data in input databox for copying their files in
  //   // job's 'input' directory

  //   if ('object' in this.input_data.data)  {
  //     var object = this.input_data.data['object'][0];
  //     if (object._type=='DataRevision')  {
  //       // this.input_data.data['hkl']     = [revision.HKL];
  //       if (object.Structure && (this.upload.fspec.stype=='structure'))
  //         this.input_data.data['ixyz'] = [object.Structure];
  //       if (object.Substructure && (this.upload.fspec.stype=='substructure'))
  //         this.input_data.data['ixyz'] = [object.Substructure];
  //     }
  //   }

  //   __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  // }

  TaskXDS3.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xds3', jobManager, jobDir, this.id];
  }


  // -------------------------------------------------------------------------

  module.exports.TaskXDS3 = TaskXDS3;

}
