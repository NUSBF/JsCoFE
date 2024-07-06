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
  var path   = require('path');
  var fs     = require('fs-extra');
  var conf   = require('../../js-server/server.configuration');
  var utils  = require('../../js-server/server.utils');
}


// ===========================================================================

function TaskMrBump()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMrBump';
  this.name    = 'mrbump';
  this.setOName ( 'mrbump' ); // default output file name template
  this.title   = 'Auto-MR with MrBump';

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

  this.checkPrivateData();

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskMrBump',TaskMrBump,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskMrBump',TaskMrBump,TaskTemplate.prototype );

// ===========================================================================

TaskMrBump.prototype.icon           = function()  { return 'task_mrbump'; }
TaskMrBump.prototype.clipboard_name = function()  { return '"MrBump"';    }

TaskMrBump.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskMrBump.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['mrbump', 'molecular','replacement','mr', 'auto-mr', 'alphafold','alphafold2','af', 'af2'] );
}

// This function is called at cloning jobs and should do copying of all
// custom class fields not found in the Template class
TaskMrBump.prototype.customDataClone = function ( cloneMode,task )  {
  this.checkPrivateData();
  return;
}

TaskMrBump.prototype.checkPrivateData = function()  {
  if (!__template)  {
    this.private_data = (__treat_private.indexOf('seq')>=0) || 
                        (__treat_private.indexOf('all')>=0);
  } else  {
    let fe_server = conf.getFEConfig();
    if (fe_server)
      this.private_data = (fe_server.treat_private.indexOf('seq')>=0) || 
                          (fe_server.treat_private.indexOf('all')>=0);
  }
  if (this.private_data)  {
    this.parameters.sec1.contains.AFDB_CBX.value  = false;
    this.parameters.sec1.contains.AFDB_CBX.hideon = {};
  }
}


// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskMrBump.prototype.sendsOut = function()  {
    if (__environ_server.indexOf('PDB_DIR')<0)
      return ['seq'];
    return []; 
  }

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

  TaskMrBump.prototype.cleanJobDir = function ( jobDir )  {

    __template.TaskTemplate.prototype.cleanJobDir.call ( this,jobDir );

    if ((this.state==__template.job_code.stopped) ||
        (this.state==__template.job_code.failed))  {

      fs.readdirSync(jobDir).forEach(function(file,index){
        if (([ __template.jobDataFName,    __template.jobReportDirName,
               __template.jobInputDirName, __template.jobOutputDirName,
               'output_files', 'signal', 'rvapi_document',
               'references.bib', '_job.stde', '_job.stdo' ].indexOf(file)<0) &&
            (!file.endsWith('.log')) && (!file.endsWith('.meta')) &&
            (!file.endsWith('.script')))  {
          var curPath = path.join ( jobDir,file );
          if (fs.lstatSync(curPath).isDirectory()) {
            utils.removePath ( curPath );
          } else { // delete file
            try {
              fs.unlinkSync ( curPath );
            } catch (e)  {
              console.log ( ' +++ cannot remove file ' + curPath +
                            ' from failed or terminated MrBump directory' );
            }
          }
        }
      });

    } else  {
      // paranoid piece of code, ugly
      var badDirPath = path.join ( jobDir,'search_a' );
      if (utils.fileExists(badDirPath))  {
        console.log ( ' +++ remove stray directory ' + badDirPath +
                      ' from MrBump job' );
        utils.removePath ( badDirPath );
      }
    }

  }

  TaskMrBump.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrbump', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMrBump = TaskMrBump;

}
