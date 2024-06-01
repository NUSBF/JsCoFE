/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2022-2024
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

function TaskSlice()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSlice';
  this.name    = 'slice';
  this.setOName ( 'slice' ); // default output file name template
  this.title   = 'Split MR model with Slice-n-Dice';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz','!protein','~mmcif_only'],
                     'DataModel'    :['protein','~mmcif_only'],
                     'DataXYZ'      :['protein','~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Template structure', // label for input dialog
      tooltip     : 'Specify template structure to be split into domains.',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'BF_correction', // lay custom fields next to the selection
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
                NSPLITS : { type     : 'integer',
                            keyword  : 'NSPLITS',
                            label    : 'Number of splits',
                            tooltip  : 'Number of splits to produce.',
                            range    : [1,'*'],
                            value    : 1,
                            iwidth   : 40,
                            position : [0,0,1,1]
                          },
                PLDDT_THRESHOLD : {
                            type     : 'combobox',
                            keyword  : 'plddt_threshold',
                            label    : 'pLDDT threshold',
                            tooltip  : 'Removes residues from Alphafold models below this pLDDT threshold (default: 70)',
                            range    : ['0|Off','90|90','85|85', '80|80', '75|75','70|70','65|65','60|60', '50|50', '40|40', '30|30', '20|20', '10|10', '5|5'],
                            value    : 70,
                            iwidth   : 100,
                            position : [3,0,1,1]
                }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskSlice.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSlice.prototype = Object.create ( TaskTemplate.prototype );
TaskSlice.prototype.constructor = TaskSlice;


// ===========================================================================

TaskSlice.prototype.icon           = function()  { return 'task_slice'; }
TaskSlice.prototype.clipboard_name = function()  { return '"Slice"';    }

TaskSlice.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSlice.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'slice', 'split', 'mr','molecular','replacement','model','preparation'
              ] );
}

// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskSlice.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'cuts given structure into domains and make MR models';
  }

  // TaskSlice.prototype.taskDescription = function()  {
  // // this appears under task title in the Task Dialog
  //   return 'Finds sequence homologs, prepares search models and performs MR';
  // }

  // // hotButtons return list of buttons added in JobDialog's toolBar.
  // TaskSlice.prototype.hotButtons = function() {
  //   return [CootMBHotButton()];
  // }
  //
  // TaskSlice.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
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
  // TaskSlice.prototype.updateInputPanel = function ( inputPanel )  {
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

  // TaskSlice.prototype.makeInputData = function ( loginData,jobDir )  {
  //
  //   // put hkl data in input databox for copying their files in
  //   // job's 'input' directory
  //
  //   if ('revision' in this.input_data.data)  {
  //     var revision = this.input_data.data['revision'][0];
  //     this.input_data.data['hkl'] = [revision.HKL];
  //     this.input_data.data['seq'] = revision.ASU.seq;
  //   }
  //
  //   __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  //
  // }

  TaskSlice.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.slice', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSlice = TaskSlice;

}
