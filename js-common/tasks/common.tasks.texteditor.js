
/*
 *  =================================================================
 *
 *    23.09.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2022
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

  this._type       = 'TaskTextEditor';
  this.name        = 'text editor';
  this.oname       = 'text_editor';   // asterisk here means do not use
  this.title       = 'Text editor';
//   if (__template)
//         this.state = __template.job_code.remark;
//   else  this.state = job_code.remark;

  this.input_dtypes = [{  // input data types
    data_type   : { 'DataRevision' : [],    // data type(s) and subtype(s)
                    'DataSequence' : [],
                    'DataXYZ'      : [],
                    'DataModel'    : [],
                    'DataEnsemble' : []
                    // 'DataLigand'   : []
                    // 'DataLibrary'  : []
                  },
    label       : 'Data object',  // label for input dialog
    inputId     : 'object',       // input Id for referencing input fields
    customInput : 'texteditor',   // lay custom fields below the dropdown
    version     : 1,              // minimum data version allowed
    min         : 1,              // minimum acceptable number of data instances
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

TaskTextEditor.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'edit text data in data objects and revisions';
};

TaskTextEditor.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['text','editor'] );
}
        
if (!__template)  {
  // only on client

  TaskTextEditor.prototype.icon = function()  { return 'task_texteditor';  }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
//   TaskTextEditor.prototype.customDataClone = function ( cloneMode,task )  {
//     return;
//   }


  // reserved function name
  TaskTextEditor.prototype.runButtonName = function()  { return 'Save'; }


  // reserved function name
  TaskTextEditor.prototype.makeInputPanel = function ( dataBox )  {

    var div = TaskTemplate.prototype.makeInputPanel.call ( this,dataBox );

    var row = div.grid.getNRows();

    div.aceditor = new ACEditor ( 80,40,{
        'box-shadow'  : '6px 6px lightgray',
        'theme'       : 'chrome',
        'mode'        : 'python'
      });
    div.grid.setWidget ( div.aceditor,row,0,1,5 );
    div.aceinit = false;

    return div;

  }

}

TaskTextEditor.prototype.getSelectedFile = function ( inputPanel_grid )  {
var object = this.getInputData ( inputPanel_grid.inpDataRef,'object' )[0];
var files  = object.files;

  var fspec  = {
    name  : '',
    ftype : '',
    otype : object._type,
    stype : ''
  };

  switch (fspec.otype)  {
    case 'DataXYZ'      :
    case 'DataModel'    :
    case 'DataEnsmeble' : if (file_key.xyz in files)  {
                            fspec.name  = files[file_key.xyz];
                            fspec.ftype = file_key.xyz
                          }
                          break;
    case 'DataSequence' : if (file_key.seq in files)  {
                            fspec.name  = files[file_key.seq];
                            fspec.ftype = file_key.seq
                          }
                          break;
    default : ;
  }

  return fspec;

  // if ('xyz' in files)         return files.xyz;
  // else if ('mmcif' in files)  return files.mmcif;
  // else if ('sol'   in files)  return files.sol;
  // else if ('sub'   in files)  return files.sub;
  // else if ('seq'   in files)  return files.seq;
  // else if ('lib'   in files)  return files.lib;
  // return files;

}

TaskTextEditor.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
  TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
  console.log ( ' >>>>> file = ' + this.getSelectedFile(inpParamRef.grid).name );
  // here call server and load file into aceditor
}

TaskTextEditor.prototype.inputPanelResize = function ( inputPanel,panelWidth,panelHeight )  {
  if (inputPanel.job_dialog._created)  {
    var rect  = inputPanel.aceditor.getBoundingRect();
    var rect1 = inputPanel.job_dialog.getBoundingRect();
    if (!inputPanel.aceinit)  {
      inputPanel.aceditor.init ( '','' );
      inputPanel.aceinit = true;
      console.log ( this.getInputData ( inputPanel.grid.inpDataRef,'object' ) );
    }
    inputPanel.aceditor.setSize_px ( panelWidth-12,panelHeight - (rect.top-rect1.top-170) );
  }
}


TaskTextEditor.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


TaskTextEditor.prototype.collectInput = function ( inputPanel )  {

  var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

  // send to server fspec and aceditor
  this.getSelectedFile ( inpParamRef.grid )

  return input_msg;

}


// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  TaskTextEditor.prototype.getCommandLine = function ( jobManager,jobDir )  { return null; }

  // -------------------------------------------------------------------------

  module.exports.TaskTextEditor = TaskTextEditor;

}
