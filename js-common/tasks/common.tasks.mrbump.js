
/*
 *  =================================================================
 *
 *    25.06.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskMrBump()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMrBump';
  this.name    = 'mrbump';
  this.oname   = 'mrbump';  // default output file name template
  this.title   = 'MrBump: Model Search & Preparation + MR + Model Building';
  this.helpURL = './html/jscofe_task_mrbump.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['!protein','!asu']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      force     : 1,          // meaning choose, by default, 1 hkl dataset if
                              // available; otherwise, 0 (== do not use) will
                              // be selected
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
    /*
    },{
      data_type : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label     : 'Sequence',          // label for input dialog
      inputId   : 'seq',      // input Id for referencing input fields
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
    */
  ];

}

if (__template)
      TaskMrBump.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMrBump.prototype = Object.create ( TaskTemplate.prototype );
TaskMrBump.prototype.constructor = TaskMrBump;


// ===========================================================================

TaskMrBump.prototype.icon_small = function()  { return './images/task_mrbump_20x20.svg'; }
TaskMrBump.prototype.icon_large = function()  { return './images/task_mrbump.svg';       }

TaskMrBump.prototype.currentVersion = function()  { return 0; }

// export such that it could be used in both node and a browser

if (!__template)  {

  TaskMrBump.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if (((emitterId=='revision') || (emitterId=='seq')) && (this.state==job_code.new))  {

      var name       = this.name;
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var nRev       = this.countInputData ( inpDataRef,'revision','' );
      if (nRev<=0)  {
        this.name  = 'mrbump-search';
        this.title = 'Search for MR Models with MrBump';
      } else  {
        this.name  = 'mrbump';
        this.title = 'MrBump Automated Molecular Replacement';
      }

      if (this.name!=name)  {
        var inputPanel = inpParamRef.grid.parent.parent;
        inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
        this.updateInputPanel ( inputPanel );
      }

    }

  }


  TaskMrBump.prototype.updateInputPanel = function ( inputPanel )  {
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

  TaskMrBump.prototype.makeInputData = function ( jobDir )  {

    // put hkl data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskMrBump.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrbump', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMrBump = TaskMrBump;

}
