/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  THIS IS A LEGACY CODE AFTER 18.12.2019 WHICH MAY BE EVENTUALLY REMOVED
  If removed, check reference and documentation files, and also
  remove task icon from image_* directories.
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */


/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.changespg.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Change Space Group Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskChangeSpG()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskTemplate.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type     = 'TaskChangeSpG';
  this.name      = 'change space group';  // short name for job tree
  this.setOName ( 'SpG' );  // default output file name template
  this.title     = 'Change Space Group';  // full title
  //this.helpURL   = './html/jscofe_task_changespg.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['~xyz','~substructure','~phases'],
                     'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'ASU definition or<br>Reflection Data', // label for input dialog
      inputId     : 'idata',    // input Id for referencing input fields
      customInput : 'reindex',  // lay custom fields next to the selection
                                // dropdown for anomalous data
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}

if (__template)
  __cmd.registerClass ( 'TaskChangeSpG',TaskChangeSpG,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskChangeSpG',TaskChangeSpG,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeSpG.prototype.icon           = function()  { return 'task_changespg';       }
TaskChangeSpG.prototype.clipboard_name = function()  { return '"Change Space Group"'; }

TaskChangeSpG.prototype.currentVersion = function()  {
  var version = 1;  // was advanced to prevent cloning in old projects
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  // for client side

  TaskChangeSpG.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'allows changing the merged reflection dataset space group with the same point group';
    };

  TaskChangeSpG.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if ((emitterId=='idata') && (this.state==job_code.new))  {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var item       = this.getInputItem ( inpDataRef,'idata' ).dropdown[0];
      var idata      = item.dt[item.getValue()];
      var name       = this.name;
      if (idata._type=='DataHKL')  {
        this.title = makeSuffix ( this.title,'HKL' );
        this.name  = makeSuffix ( this.name ,'HKL' );
      } else  {
        this.title = makeSuffix ( this.title,'ASU' );
        this.name  = makeSuffix ( this.name ,'ASU' );
      }

      if (this.name!=name)  {
        var inputPanel = inpParamRef.grid.parent.parent;
        inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
        var new_title = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
        inputPanel.header.uname_inp.setStyle ( 'text','',new_title );
        inputPanel.job_dialog.changeTitle ( new_title );
        this.updateInputPanel ( inputPanel );
        inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                job_dialog_reason.rename_node );
      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }


  TaskChangeSpG.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskChangeSpG.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if (('idata' in this.input_data.data) &&
        (this.input_data.data['idata'][0]._type=='DataRevision') )
      this.input_data.data['hkl'] = [this.input_data.data['idata'][0].HKL];

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskChangeSpG.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changespg', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeSpG = TaskChangeSpG;

}
