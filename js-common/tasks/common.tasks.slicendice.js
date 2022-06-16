/*
 *  =================================================================
 *
 *    09.06.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.mrbump.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MrBUMP Task Class
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

function TaskSliceNDice()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSliceNDice';
  this.name    = 'slicendice';
  this.setOName ( 'slicendice' ); // default output file name template
  this.title   = 'MR with model splitting using Slice-n-Dice';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!protein','!asu','!hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz','!protein'],
                     'DataModel'    :['protein'],
                     'DataXYZ'      :['protein']},  // data type(s) and subtype(s)
      label       : 'Template structure', // label for input dialog
      tooltip     : 'Specify template structure to be split into domains.',
      inputId     : 'xyz',       // input Id for referencing input fields
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    SEP_LBL : {
              type     : 'label',
              label    : '&nbsp;',
              position : [0,0,1,5]
            },
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                MIN_NSPLITS : { type     : 'integer',
                                keyword  : 'MIN_NSPLITS',
                                label    : 'Try from',
                                tooltip  : 'Minimum number of splits to try.',
                                range    : [1,'*'],
                                value    : 1,
                                iwidth   : 40,
                                label2   : '',
                                position : [0,0,1,1]
                              },
                MAX_NSPLITS : { type     : 'integer',
                                keyword  : 'MAX_NSPLITS',
                                label    : 'to',
                                tooltip  : 'Maximum number of splits to try.',
                                range    : [1,'*'],
                                value    : 3,
                                iwidth   : 40,
                                label2   : 'splits',
                                position : [0,5,1,1]
                              }
              }
            }
  };


}

if (__template)
      TaskSliceNDice.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSliceNDice.prototype = Object.create ( TaskTemplate.prototype );
TaskSliceNDice.prototype.constructor = TaskSliceNDice;


// ===========================================================================

TaskSliceNDice.prototype.icon = function()  { return 'task_slicendice'; }

TaskSliceNDice.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskSliceNDice.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'cuts given structure into domains and performs MR';
  }

  // TaskSliceNDice.prototype.taskDescription = function()  {
  // // this appears under task title in the Task Dialog
  //   return 'Finds sequence homologs, prepares search models and performs MR';
  // }

  // // hotButtons return list of buttons added in JobDialog's toolBar.
  // TaskSliceNDice.prototype.hotButtons = function() {
  //   return [CootMBHotButton()];
  // }
  //
  // TaskSliceNDice.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
  //
  //   TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
  //
  //   if (((emitterId=='revision') || (emitterId=='seq')) && (this.state==job_code.new))  {
  //
  //     var name       = this.name;
  //     var inpDataRef = inpParamRef.grid.inpDataRef;
  //     var nRev       = this.countInputData ( inpDataRef,'revision','' );
  //     if (nRev<=0)  {
  //       this.name  = 'mrbump-search';
  //       this.title = 'Search for MR Models with MrBump';
  //     } else  {
  //       this.name  = 'mrbump';
  //       this.title = 'MrBump Automated Molecular Replacement';
  //     }
  //
  //     if (this.name!=name)  {
  //       var inputPanel = inpParamRef.grid.parent.parent;
  //       inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
  //       this.updateInputPanel ( inputPanel );
  //     }
  //
  //   }
  //
  // }
  //
  // TaskSliceNDice.prototype.updateInputPanel = function ( inputPanel )  {
  //   if (this.state==job_code.new)  {
  //     var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
  //        'detail' : job_dialog_reason.rename_node
  //     });
  //     inputPanel.element.dispatchEvent(event);
  //   }
  // }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSliceNDice.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskSliceNDice.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.slicendice', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSliceNDice = TaskSliceNDice;

}
