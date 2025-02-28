/*
 *  =================================================================
 *
 *    07.02.25    <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2022-2025
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

function TaskSliceNDice()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSliceNDice';
  this.name    = 'slicendice';
  this.setOName ( 'slicendice' ); // default output file name template
  this.title   = "MR with model splitting using Slice'N'Dice";

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!protein','!asu','!hkl','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
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
                MIN_NSPLITS : { type     : 'integer',
                                keyword  : 'MIN_NSPLITS',
                                label    : 'Try from',
                                tooltip  : 'Minimum number of splits to try.',
                                range    : [1,'*'],
                                value    : 1,
                                iwidth   : 40,
                                label2   : '',
                                position : [1,0,1,1]
                              },
                MAX_NSPLITS : { type     : 'integer',
                                keyword  : 'MAX_NSPLITS',
                                label    : 'to',
                                tooltip  : 'Maximum number of splits to try.',
                                range    : [1,'*'],
                                value    : 3,
                                iwidth   : 40,
                                label2   : 'splits',
                                position : [1,5,1,1]
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
                              },
                MR_PROG : {
                            type     : 'combobox',
                            keyword  : 'mr_program',
                            label    : 'MR program to use',
                            tooltip  : 'Select which MR program to use. The hybrid option'+ 'will use a combination of Phaser and Molrep (default: phaser)',
                            range    : ['phaser|Phaser','molrep|Molrep','hybrid|Hybrid'],
                            value    : 'phaser',
                            iwidth   : 120,
                            position : [4,0,1,1]
                              },
                NO_MOLS : { 
                            type     : 'real_',
                            keyword  : 'NO_MOLS',
                            label    : 'Number of copies to search for',
                            tooltip  : 'Number of copies of template structure to search for in ASU',
                            range    : [1,'*'],
                            value    : "",
                            iwidth   : 40,
                            position : [5,0,1,1]
                              },
                
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskSliceNDice',TaskSliceNDice,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskSliceNDice',TaskSliceNDice,TaskTemplate.prototype );

// ===========================================================================

TaskSliceNDice.prototype.icon           = function()  { return 'task_slicendice';  }
TaskSliceNDice.prototype.clipboard_name = function()  { return '"Slice\'N\'Dice"'; }
TaskSliceNDice.prototype.canRunRemotely = function()  { return true;               }

TaskSliceNDice.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSliceNDice.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'slicendice', 'molecular','replacement','mr', 'model','preparation',
                'auto','auto-mr'] );
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
