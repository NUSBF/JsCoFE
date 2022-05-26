/*
 *  =================================================================
 *
 *    30.07.21   <--  Date of Last Modification.
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

function TaskSlice()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSlice';
  this.name    = 'slice';
  this.setOName ( 'slice' ); // default output file name template
  this.title   = 'Slice MR model with Slice-n-Dice';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate data set(s) to be sliced into ' +
                    'domains.',
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
                        label    : 'PDB sequence redundancy level',
                        tooltip  : 'Choose appropriate redundancy level for ' +
                                   'keeping hits in the list of matches. ',
                        range    : ['ALL|All', '100|100%','95|95%','90|90%','70|70%','50|50%'],
                        value    : '100',
                        iwidth   : 100,
                        position : [1,0,1,1]
                      },
                AFDB_CBX : {
                        type     : 'checkbox',
                        label    : 'Include structures from AFDB',
                        tooltip  : 'Check to include structures from AlphaFold-2 database',
                        value    : true,
                        position : [2,0,1,3]
                      },
                AFLEVEL_SEL : {
                        type     : 'combobox',
                        keyword  : 'AFLEVEL',
                        label    : 'EBI AlphaFold database model residue confidence cut-off (higher values are more confident)',
                        tooltip  : 'Choose confidence level (pLDDT) cut-off for residues in AlphaFold predictions.' +
                                   'The higher the value the higher the confidence threshold. Residues with lower values are removed from the search models ',
                        range    : ['0|0','10|10','20|20','30|30','40|40','50|50','60|60','70|70','80|80','90|90'],
                        value    : '50',
                        position : [3,0,1,1],
                        hideon   : {AFDB_CBX:[false]}
                      },
                MRNUM : {
                        type     : 'integer',
                        keyword  : 'MRNUM',
                        label    : 'Maximum no. of models to test',
                        tooltip  : 'Maximum number of search models to test',
                        range    : [1,'*'],
                        value    : 20,
                        iwidth   : 40,
                        position : [4,0,1,1]
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
      TaskSlice.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSlice.prototype = Object.create ( TaskTemplate.prototype );
TaskSlice.prototype.constructor = TaskSlice;


// ===========================================================================

TaskSlice.prototype.icon = function()  { return 'task_mrbump'; }

TaskSlice.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskSlice.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'finds sequence homologs, prepares search models and performs MR';
  }

  TaskSlice.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Finds sequence homologs, prepares search models and performs MR';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskSlice.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

  TaskSlice.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

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

  TaskSlice.prototype.updateInputPanel = function ( inputPanel )  {
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

  TaskSlice.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskSlice.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrbump', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSlice = TaskSlice;

}
