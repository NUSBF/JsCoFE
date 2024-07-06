
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phaserrb.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Phaser-RB Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2023-2024
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

function TaskPhaserRB()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPhaserRB';
  this.name    = 'phaser RB';
  this.setOName ( 'phaser-rb' );  // default output file name template
  this.title   = 'Rigid-Body Refinement with Phaser';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!hkl','!asu','!xyz','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision',   // input Id for referencing input fields
      // customInput : 'phaser-mr1', // lay custom fields below the dropdown
      version     : 0,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}// input parameters

}

if (__template)
  __cmd.registerClass ( 'TaskPhaserRB',TaskPhaserRB,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskPhaserRB',TaskPhaserRB,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskPhaserRB.prototype.icon           = function()  { return 'task_phaserrb'; }
TaskPhaserRB.prototype.clipboard_name = function()  { return '"Phaser-RB"';   }

TaskPhaserRB.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'optimises position of macromolecular chains';
}

// TaskPhaserRB.prototype.cleanJobDir = function ( jobDir ) {}

TaskPhaserRB.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPhaserRB.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['phaser', 'rigid','body','refinement'] );
}

if (!__template)  {

  // TaskPhaserRB.prototype.getHelpURL = function()  {
  //   return __task_reference_base_url + 'doc.task.Phaser.html';
  // }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskPhaserRB.prototype.hotButtons = function() {
    return [RefmacHotButton()];
  }

  // TaskPhaserRB.prototype.MRTypeChanged = function ( inpParamRef,value )  {
  // // reacts on changing mr_type in revision's belly

  //   this.title = this.title.split(' (')[0];
  //   this.name = this.name.split(' (')[0];
  //   if (value != 'refl') {
  //     this.title += ' (density fit)';
  //     this.name += ' (density fit)';
  //   }

  //   var inputPanel = inpParamRef.grid.parent.parent;
  //   inputPanel.header.title.setText('<b>' + this.title + '</b>');
  //   var new_title = this.name.replace(/<(?:.|\n)*?>/gm,'');
  //   inputPanel.header.uname_inp.setStyle('text','',new_title);
  //   inputPanel.job_dialog.changeTitle(new_title);
  //   inputPanel.emitSignal(cofe_signals.jobDlgSignal,
  //     job_dialog_reason.rename_node);

  // }

  /*
  TaskPhaserRB.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId == 'phases') {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var item = this.getInputItem ( inpDataRef,'revision' );
      var dropdown = item.dropdown[0];
      var dt = item.dt[dropdown.getValue()];
      if ( dt.subtype.indexOf(structure_subtype.XYZ)<0 ) {
        var dataState = this.getDataState ( inpDataRef );
        var customGrid = dropdown.customGrid;
        customGrid.clear();
        if ( dataState['phases']>0 ) {
          dropdown.layCustom = 'phaser-mr-ptf';
          customGrid.setLabel ( 'Try Space Group(s):',0,0,1,1 )
                                .setFontItalic(true).setNoWrap();
          customGrid.setLabel ( 'from phases',0,1,1,4 )
                                .setNoWrap();
          customGrid.setCellSize ( '','25pt',0,0 );
          customGrid.setCellSize ( '','25pt',0,1 );
          customGrid.setVerticalAlignment( 0,0,'middle' );
          customGrid.setVerticalAlignment( 0,1,'middle' );
          dropdown.layCustom = 'phaser-mr-fixed';
        } else {
          dropdown.layCustom = 'phaser-mr';
        }
        dt.layCustomDropdownInput ( dropdown );
      }
    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
  }
  */

} else  {
  //  for server side

  const conf    = require('../../js-server/server.configuration');
  const dstruct = require('../../js-common/dtypes/common.dtypes.structure');

  TaskPhaserRB.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Structure &&
          (revision.Structure.subtype.indexOf(dstruct.structure_subtype.XYZ)>=0))
        this.input_data.data['xyz'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskPhaserRB.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.phaserrb', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPhaserRB = TaskPhaserRB;

}
