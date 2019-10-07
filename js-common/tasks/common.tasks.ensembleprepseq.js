
/*
 *  =================================================================
 *
 *    02.10.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.ensembleprepseq.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Sequence Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskEnsemblePrepSeq()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsemblePrepSeq';
  this.name    = 'ensemble preparation (seq)';
  this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Ensemble Preparation for MR from Sequence';
  this.helpURL = './html/jscofe_task_ensembleprepseq.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label     : 'Sequence',          // label for input dialog
      inputId   : 'seq',      // input Id for referencing input fields
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                RLEVEL_SEL : {
                      type     : 'combobox',
                      keyword  : 'RLEVEL',
                      label    : 'Redundancy level',
                      tooltip  : 'Choose appropriate redundancy level for ' +
                                 'keeping hits in the list of matches. ',
                      range    : ['ALL|All','100|100%','95|95%','90|90%','70|70%','50|50%'],
                      value    : 'ALL',
                      position : [0,0,1,1]
                     },
                MRNUM : {
                      type     : 'integer',
                      keyword  : 'MRNUM',
                      label    : 'Number of ensembles',
                      tooltip  : 'Specify the number of ensemblies to generate ' +
                                 '(from 1 to 20).',
                      range    : [1,20],
                      value    : 5,
                      position : [1,0,1,1]
                    }
           }
         }

  }


}

if (__template)
      TaskEnsemblePrepSeq.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsemblePrepSeq.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsemblePrepSeq.prototype.constructor = TaskEnsemblePrepSeq;


// ===========================================================================

TaskEnsemblePrepSeq.prototype.icon = function()  { return 'task_ensembleprepseq'; }

TaskEnsemblePrepSeq.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {

  /*
  TaskEnsemblePrepSeq.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if ((emitterId=='hkl') && (this.state==job_code.new))  {

      var name = this.name;
      if (emitterValue<=0)  {
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

  TaskEnsemblePrepSeq.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }
  */


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEnsemblePrepSeq.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembleprepseq', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsemblePrepSeq = TaskEnsemblePrepSeq;

}
