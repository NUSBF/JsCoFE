
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.parrot.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Parrot Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

function TaskFreeRFlag()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskFreeRFlag';
  this.name    = 'free R-flag';
  this.setOName ( 'freerflag' );  // default output file name template
  this.title   = 'Free R-flag (transfer or (re-)generate)';

  this.input_dtypes = [  // input data types
    {
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Free R-flag',  // label for input dialog
      inputId     : 'freer',        // input Id for referencing input fields
      cast        : 'free R-flag',  // will replace data type names in comboboxes
      version     : 1,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflections',  // label for input dialog
      inputId     : 'hkl',          // input Id for referencing input fields
      version     : 0,              // minimum data version allowed
      min         : 1,              // minimum acceptable number of data instances
      max         : 200             // maximum acceptable number of data instances
    },{
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 0,          // minimum acceptable number of data instances
      max         : 0           // maximum acceptable number of data instances
    }
  ];


  this.parameters = { // input parameters
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                FREERFRAC : {
                        type      : 'real_',
                        keyword   : 'FREERFRAC',
                        label     : 'Fraction of reflections in freeR set',
                        tooltip   : 'Choose a value less than 1',
                        range     : [0.001,0.999],
                        value     : '',
                        default   : '0.05',
                        position  : [0,0,1,1],
                        showon    : {freer:[-1,0]}
                      },
                SEED_CBX : {
                        type      : 'checkbox',
                        keyword   : 'SEED',
                        label     : 'Use random seed',
                        tooltip   : 'Check to randomise the freeR seed',
                        value     : true,
                        position  : [1,0,1,2]
                      }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskFreeRFlag',TaskFreeRFlag,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskFreeRFlag',TaskFreeRFlag,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskFreeRFlag.prototype.icon           = function()  { return 'task_freerflag'; }
TaskFreeRFlag.prototype.clipboard_name = function()  { return '"FreeRFlag"';    }

TaskFreeRFlag.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskFreeRFlag.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['freerflag','free', 'flag','r-flag'] );
}


if (!__template)  {
  //  for client side

  TaskFreeRFlag.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'tags each reflection in an MTZ file with a flag for cross-validation';
    };

  TaskFreeRFlag.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if (emitterId=='freer')  {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var dataState  = this.getDataState ( inpDataRef );
      var nFreeR     = dataState['freer'];

      var name = this.name;
      if (nFreeR<=0)  {
        this.title = makeSuffix ( this.title,'Regenerate' );
        this.name  = makeSuffix ( this.name ,'regenerate' );
      } else  {
        this.title = makeSuffix ( this.title,'Extend' );
        this.name  = makeSuffix ( this.name ,'extend' );
      }

      if (this.name!=name)  {
        var inputPanel = inpParamRef.grid.parent.parent;
        inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
        inputPanel.header.uname_inp.setStyle ( 'text','',
                              this.name.replace(/<(?:.|\n)*?>/gm, '') );
        this.updateInputPanel ( inputPanel );
        inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                job_dialog_reason.rename_node );
      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }


  TaskFreeRFlag.prototype.addDataDialogHints = function ( inp_item,summary )  {
    // This function may be used for adding or modifying hints in summary.hints
    // when they are dependent on task rather than, or in addition to, daat type.
    // 'inp_item' corresponds to an item in this.input_data.
    summary.hints.push (
      'Why <i>"Structure Revision"</i> is not allowed? This means that the ' +
      'task can be used only before a <i>"Structure Revision"</i> ' +
      'is created. If you are past this point in your Project, you may have ' +
      'to start, with this task, a new branch in your Project after data ' +
      'import or data processing.'
    );
    /*
    summary.hints.push (
      'Is it possible to change Space Group in <i>"Structure Revision"</i>? ' +
      'The answer is "in general, no", because such change would be incompatible ' +
      'with results of phasing and refinement. However, you can choose an ' +
      'alternative (compatible) space group in an empty ASU, before any phasing ' +
      'is done, with <i>"Change ASU Space Group"</i> task. This may require ' +
      'starting a new branch in your Project.'
    );
    */
    return summary;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskFreeRFlag.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('freer' in this.input_data.data)  {
      var freer = this.input_data.data['freer'][0];
      if (freer.freeRds)
        this.input_data.data['freer0'] = [freer.freeRds];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskFreeRFlag.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.freerflag', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFreeRFlag = TaskFreeRFlag;

}
