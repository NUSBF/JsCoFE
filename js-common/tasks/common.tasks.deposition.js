
/*
 *  =================================================================
 *
 *    11.12.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.deposition.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RefMac Task Class
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

function TaskDeposition()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskDeposition';
  this.name    = 'deposition';
  this.setOName ( 'deposition' );  // default output file name template
  this.title   = 'Prepare data for deposition';
  //this.helpURL = './html/jscofe_task_deposition.html';

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
          type        : 'textarea_',
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
          nrows       : 15,
          ncols       : 160,
          iwidth      : 700,
          value       : '',
          position    : [0,2,1,3],
          showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
        },
    _label_2 : {
          type        : 'label',
          label       : '&nbsp;',
          position    : [1,0,1,1]
        },
    DEL0HYDR_CBX : {
          type     : 'checkbox',
          label    : 'Remove hydrogens with zero occupancy',
          tooltip  : 'Check to remove hydrogens with zero occupancy',
          value    : false,
          iwidth   : 340,
          position : [2,0,1,4]
        }

    // SEQUENCE : {
    //     type        : 'aceditor_',  // can be also 'textarea'
    //     keyword     : 'none',       // optional
    //     tooltip     : '',           // mandatory
    //     iwidth      : 800,          // optional
    //     iheight     : 320,          // optional
    //     value       : '',           // mandatory
    //     position    : [1,0,1,5],    // mandatory
    //     showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
    // }
  };

}


if (__template)
      TaskDeposition.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDeposition.prototype = Object.create ( TaskTemplate.prototype );
TaskDeposition.prototype.constructor = TaskDeposition;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDeposition.prototype.icon = function()  { return 'task_deposition'; }

TaskDeposition.prototype.cleanJobDir = function ( jobDir )  {}

TaskDeposition.prototype.currentVersion = function()  {
  var version = 3;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {

  TaskDeposition.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'prepares mmCIF files for PDB deposition and acquires PDB Validation Report';
  }

  TaskDeposition.prototype.taskDescription = function()  {
  // this appears under task title in the Task Dialog
    return 'Prepares mmCIF files for PDB deposition and acquires PDB Validation Report';
  }

  TaskDeposition.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var msg = [];
    var s   = this.parameters.SEQUENCE_TA.value.trim()
    // if (!s)
    //   msg.push ( 'Sequence data is not given' );
    // else
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

  TaskDeposition.prototype.makeInputData = function ( loginData,jobDir )  {

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

  TaskDeposition.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.deposition', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDeposition = TaskDeposition;

}
