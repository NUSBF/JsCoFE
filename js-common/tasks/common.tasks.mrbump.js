
/*
 *  =================================================================
 *
 *    20.06.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
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
  this.setOName ( 'mrbump' ); // default output file name template
  this.title   = 'Auto-MR with MrBump';
  this.helpURL = './html/jscofe_task_mrbump.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['!protein','!asu','~xyz']}, // data type(s) and subtype(s)
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
                // SEP1_LBL      : {
                //         type     : 'label',
                //         label    : '<hr/>',
                //         position : [0,0,1,5]
                //       },
                ALTGROUPS_CBX : {
                        type     : 'checkbox',
                        label    : 'Check alternative space groups',
                        tooltip  : 'Check to explore compatible space groups',
                        value    : false,
                        position : [0,0,1,3]
                      },
                RLEVEL_SEL : {
                        type     : 'combobox',
                        keyword  : 'RLEVEL',
                        label    : 'Redundancy level',
                        tooltip  : 'Choose appropriate redundancy level for ' +
                                   'keeping hits in the list of matches. ',
                        range    : ['AF00100|AFDB', 'ALL|All', '100|100%','95|95%','90|90%','70|70%','50|50%'],
                        value    : '100',
                        iwidth   : 100,
                        position : [1,0,1,1]
                      },
                 MRNUM : {
                        type     : 'integer',
                        keyword  : 'MRNUM',
                        label    : 'Maximum no. of models to test',
                        tooltip  : 'Maximum number of search models to test',
                        range    : [1,'*'],
                        value    : 20,
                        iwidth   : 40,
                        position : [2,0,1,1]
                      }
                // SEP2_LBL      : {
                //         type     : 'label',
                //         label    : '&nbsp;<br>* <font style="font-size:80%">Development option -- not for regular use</font>',
                //         position : [2,0,1,3]
                //       },
                // DEVMODE_CBX  : {
                //       type      : 'checkbox',
                //       label     : 'Development mode',
                //       tooltip   : 'Switches on experimental features -- use at own risk.',
                //       value     : false,
                //       position  : [3,0,1,3]
                //     }
              }
            }
  };


}

if (__template)
      TaskMrBump.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMrBump.prototype = Object.create ( TaskTemplate.prototype );
TaskMrBump.prototype.constructor = TaskMrBump;


// ===========================================================================

TaskMrBump.prototype.icon = function()  { return 'task_mrbump'; }

TaskMrBump.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskMrBump.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'finds sequence homologs, prepares search models and performs MR';
  }

  TaskMrBump.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Finds sequence homologs, prepares search models and performs MR';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskMrBump.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

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

  TaskMrBump.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskMrBump.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrbump', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMrBump = TaskMrBump;

}
