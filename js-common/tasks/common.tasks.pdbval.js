
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pdbval.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PDB Valiation Class
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

function TaskPDBVal()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPDBVal';
  this.name    = 'PDB validation report';
  this.setOName ( 'deposition' );  // default output file name template
  this.title   = 'PDB Validation Report';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {
    _label : {
          type        : 'label',
          label       : '<b><i>Target sequence(s):<br>&nbsp;<br>&nbsp;<br>&nbsp;' +
                        '<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;' +
                        '<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;',
          position    : [0,0,1,1],
          showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
        },
    SEQUENCE_TA: {
          type        : 'aceditor_',
          //keyword     : 'keyword',
          tooltip     : '',
          reportas    : 'Sequence(s)',
          placeholder : 'Copy-paste your sequence(s) here, including title line(s).\n\n' +
                        'More than one sequences of the same type (protein/dna/na)\n' +
                        'can be given one after another. Example:\n\n' +
                        '>rnase_A\n' +
                        'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
                        'ATQEDYYTGDHYATFSLIDQTC\n\n' +
                        '>1dtx_A\n' +
                        'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
          iwidth      : 700,
          iheight     : 300,
          value       : '',
          position    : [0,2,1,3],
          showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
        },
        // SEQUENCE_TA: {
        //       type        : 'textarea_',
        //       //keyword     : 'keyword',
        //       tooltip     : '',
        //       reportas    : 'Sequence(s)',
        //       placeholder : 'Copy-paste your sequence(s) here, including title line(s).\n\n' +
        //                     'More than one sequences of the same type (protein/dna/na)\n' +
        //                     'can be given one after another. Example:\n\n' +
        //                     '>rnase_A\n' +
        //                     'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
        //                     'ATQEDYYTGDHYATFSLIDQTC\n\n' +
        //                     '>1dtx_A\n' +
        //                     'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
        //       nrows       : 15,
        //       ncols       : 160,
        //       iwidth      : 700,
        //       value       : '',
        //       position    : [0,2,1,3],
        //       showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
        //     },
    _label_2 : {
          type        : 'label',
          label       : '&nbsp;',
          position    : [1,0,1,1]
        },
    DEL0HYDR_CBX : {
          type     : 'checkbox',
          label    : 'Remove hydrogens with zero occupancy',
          tooltip  : 'Check to remove hydrogens with zero occupancy',
          value    : true,
          iwidth   : 340,
          position : [2,0,1,4]
        }
    // PDBREPORT_CBX : {
    //       type     : 'checkbox',
    //       label    : 'Obtain the PDB Validation Report',
    //       tooltip  : 'Check to obtain the PDB Validation Report',
    //       value    : true,
    //       iwidth   : 340,
    //       position : [3,0,1,4]
    //     }
  };

  // if ((!__template) && (this.state==job_code.new))  {
  //   if (__user_licence=='commercial')  // do not send data to the PDB by default
  //     this.parameters.PDBREPORT_CBX.value = false;
  // }

  this.checkPrivateData();

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskPDBVal',TaskPDBVal,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskPDBVal',TaskPDBVal,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

// TaskPDBVal.prototype.cleanJobDir = function ( jobDir )  {}

TaskPDBVal.prototype.icon             = function()  { return 'task_pdbval';      }
TaskPDBVal.prototype.clipboard_name   = function()  { return '"PDB Validation"'; }
TaskPDBVal.prototype.canEndGracefully = function()  { return true;               }

TaskPDBVal.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'acquires the PDB Validation report from wwPDB servers';
};

TaskPDBVal.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Acquires PDB Validation Report';
}

// TaskPDBVal.prototype.cleanJobDir = function ( jobDir )  {}

TaskPDBVal.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPDBVal.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['validation','pdb','report']);
}


// hotButtons return list of buttons added in JobDialog's toolBar.
TaskPDBVal.prototype.hotButtons = function() {
  return [PDBDepFilesHotButton()];
}

// This function is called at cloning jobs and should do copying of all
// custom class fields not found in the Template class
TaskPDBVal.prototype.customDataClone = function ( cloneMode,task )  {
  this.checkPrivateData();
  return;
}

TaskPDBVal.prototype.checkPrivateData = function()  {
let treat_private = null;
  if (!__template)  {
    treat_private = __treat_private;
  } else  {
    let fe_server = conf.getFEConfig();
    if (fe_server)
      treat_private = fe_server.treat_private;
  }
  if (treat_private)
    this.private_data = 
        (treat_private.indexOf('xyz')>=0) || 
        (treat_private.indexOf('seq')>=0) ||
        (treat_private.indexOf('lig')>=0) ||
        (treat_private.indexOf('hkl')>=0) ||
        (treat_private.indexOf('all')>=0);
  else
    this.private_data = false;
}


if (!__template)  {

  TaskPDBVal.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var msg = [];
    var s   = this.parameters.SEQUENCE_TA.value.trim();

    if ((s.length>0) && (!startsWith(s,'>')))
      msg.push ( 'Sequence data format is not valid' );

    if (msg.length>0)  {
      input_msg += '|<b>' + msg.join('</b><br><b>') + '</b>';
    }

    return input_msg;

  }


} else  {
  //  for server side

  var fs     = require('fs-extra');
  var path   = require('path');
  var conf   = require('../../js-server/server.configuration');
  var prj    = require('../../js-server/server.fe.projects');
  var utils  = require('../../js-server/server.utils');
  var task_t = require('./common.tasks.template');

  TaskPDBVal.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision    = this.input_data.data['revision'][0];
      var aimless_xml = null;
      var aimless_unm = null;
      if (('file_xml' in revision.HKL.aimless_meta) && revision.HKL.aimless_meta.file_xml)  {
        aimless_xml = revision.HKL.aimless_meta.file_xml;
        aimless_unm = revision.HKL.aimless_meta.file_unm;
      } else if (('file' in revision.HKL.aimless_meta) && revision.HKL.aimless_meta.file)  {
        aimless_xml = revision.HKL.aimless_meta.file;
      }
      if (aimless_xml)
        this.addInputFile ( revision.HKL.aimless_meta.jobId,aimless_xml,jobDir );
      if (aimless_unm)
        this.addInputFile ( revision.HKL.aimless_meta.jobId,aimless_unm,jobDir );
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
      this.input_data.data['seq']     = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

    // here, we also use this function to compose the list of all project's
    // tasks, which is used for identification of service tasks (cf.
    // pycofe/etc/citations.py)

    var allTasks = [];
    var entries  = fs.readdirSync ( path.join(jobDir,'..') );
    for (var i=0;i<entries.length;i++)
      if (entries[i].startsWith(prj.jobDirPrefix))  {
        var job_meta = utils.readObject ( path.join(jobDir,'..',entries[i],task_t.jobDataFName) );
        if (job_meta)  {
          if (job_meta.hasOwnProperty('_type')) {
            if (allTasks.indexOf(job_meta['_type'])<0)
              allTasks.push ( job_meta['_type'] );
          }
        }
      }

    var meta = { 'list' : allTasks };
    utils.writeObject ( path.join(jobDir,'input','all_tasks.json'),meta );

  }

  TaskPDBVal.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pdbval', jobManager, jobDir, 
                               this.id ];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPDBVal = TaskPDBVal;

}
