
/*
 *  =================================================================
 *
 *    11.03.24   <--  Date of Last Modification.
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

  this._type   = 'TaskXDS3';
  this.name    = 'xds processing';
  this.oname   = 'xds';   // asterisk here means do not use
  this.title   = 'Image processing with XDS';

  this.xds_inp = '';

  this.input_dtypes = [];
  this.parameters   = {}
    // XDS_INP : {
    //     type     : 'label',
    //     label    : '',
    //     position : [0,0,1,1],
    //     showon   : {'VOID':['VOID']}
    //   }
  // };
  
}

if (__template)
      TaskXDS3.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXDS3.prototype = Object.create ( TaskTemplate.prototype );
TaskXDS3.prototype.constructor = TaskXDS3;


// ===========================================================================

TaskXDS3.prototype.cleanJobDir    = function ( jobDir )  {}

TaskXDS3.prototype.icon           = function()  { return 'task_xds3'; }
TaskXDS3.prototype.clipboard_name = function()  { return ''; }  // no copy-paste

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

  TaskXDS3.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId  = '';
    this.autoRunId0 = '';
    this.xds_inp    = task.xds_inp;
    return;
  }

  // reserved function name
  TaskXDS3.prototype.makeInputPanel = function ( dataBox )  {

    let div = TaskTemplate.prototype.makeInputPanel.call ( this,dataBox );
    let row = div.grid.getNRows();

    div.grid.setLabel ( 
      '<div style="font-size:14px;height:28px;">XDS processing parameters; see details in ' +
      '<a href="https://wiki.uni-konstanz.de/xds/index.php/XDS.INP" target="_blank">' +
      '<i>XDS reference</i></a> (opens in new window)</div>',
      row++,0,1,5 );

    div.grid.aceditor = new ACEditor ( 80,40,{
        'box-shadow'  : '6px 6px lightgray',
        'theme'       : 'chrome',
        'font-size'   : '12px',
        'mode'        : 'terraform'
        // 'mode'        : 'python'
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
      inputPanel.grid.aceditor.setSize_px ( panelWidth-12,panelHeight-46 );
    }
  }

  TaskXDS3.prototype.interface_ready = function()  {
    return (this.xds_inp.length>0);  // singal 'ready'
  }

  TaskXDS3.prototype.loadFile = function ( inputPanel_grid )  {
    let self = this;
    if (inputPanel_grid.aceinit)  {
      if (this.xds_inp.trim())  {
        inputPanel_grid.file_loaded     = null;
        inputPanel_grid.aceditor.setText ( this.xds_inp );
        inputPanel_grid.content_changed = false;
      } else  {
        let furl = this.getProjectURL ( this.parentId,'output/XDS.INP');
        fetchFile ( furl,function(ftext){
          inputPanel_grid.file_loaded     = furl;
          inputPanel_grid.aceditor.setText ( ftext );
          inputPanel_grid.content_changed = false;
          self.xds_inp = '*';  // singal 'loaded'
        },null,function(errdesc){
          inputPanel_grid.file_loaded = null;
          inputPanel_grid.aceditor.setText ( '' );
          new MessageBox ( 'Cannot load file',
            '<h2>Cannot load file from server</h2><i>Error: ' + errdesc + '</i>.',
            'msg_error'
          );
          inputPanel_grid.content_changed = false;
          self.xds_inp = '*';  // singal 'loaded'
        });
      }
    } else  {
      inputPanel_grid.file_loaded     = null;
      inputPanel_grid.aceditor.setText ( '' );
      inputPanel_grid.content_changed = false;
    }
  }

  TaskXDS3.prototype.disableInputWidgets = function ( inputPanel,disable_bool )  {
    TaskTemplate.prototype.disableInputWidgets.call ( this,inputPanel,disable_bool );
    inputPanel.grid.ace_disable = disable_bool;
    if (inputPanel.grid.aceinit)
      inputPanel.grid.aceditor.setReadOnly ( disable_bool );
  }

  TaskXDS3.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    let xds_inp = inputPanel.grid.aceditor.getText();
    if (!xds_inp.trim())
      input_msg += '|<b><i>No input statements</i>:</b> XDS input statements must be provided';
    else
      this.xds_inp = xds_inp;

    return input_msg;

  }

} else  {
  //  for server side

  // ===========================================================================
  // export such that it could be used in both node and a browser

  const conf = require('../../js-server/server.configuration');

  TaskXDS3.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xds3', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskXDS3 = TaskXDS3;

}
