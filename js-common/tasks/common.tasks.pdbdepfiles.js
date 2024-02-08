
/*
 *  =================================================================
 *
 *    07.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pdbdepfiles.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PDB Files for deposition Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2023-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskPDBDepFiles()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskPDBDepFiles';
  this.name      = 'PDB deposition files';
  this.setOName ( '*' );  // default output file name template
  this.title     = 'PDB Deposition Files';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {};

}


if (__template)
      TaskPDBDepFiles.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPDBDepFiles.prototype = Object.create ( TaskTemplate.prototype );
TaskPDBDepFiles.prototype.constructor = TaskPDBDepFiles;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskPDBDepFiles.prototype.icon           = function()  { return 'task_pdbdepfiles'; }
TaskPDBDepFiles.prototype.clipboard_name = function()  { return ''; }  // means no copy-paste & dock

TaskPDBDepFiles.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'prepares mmCIF files for PDB deposition';
};

TaskPDBDepFiles.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Prepares mmCIF files for PDB deposition';
}

TaskPDBDepFiles.prototype.canClone = function ( node,jobTree )  {
  return false;
}

// TaskPDBDepFiles.prototype.cleanJobDir = function ( jobDir )  {}

TaskPDBDepFiles.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPDBDepFiles.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['pdb','deposition']);
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function PDBDepFilesHotButton()  {
  return {
    'task'    : 'TaskPDBDepFiles',
    'tooltip' : 'Prepare files for PDB deposition'
  };
}


if (__template)  {

  var conf = require('../../js-server/server.configuration');

  TaskPDBDepFiles.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pdbdepfiles', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPDBDepFiles = TaskPDBDepFiles;

}

/*
if (!__template)  {

  TaskPDBDepFiles.prototype.collectInput = function ( inputPanel )  {

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

  TaskPDBDepFiles.prototype.makeInputData = function ( loginData,jobDir )  {

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

  TaskPDBDepFiles.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pdbdepfiles', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPDBDepFiles = TaskPDBDepFiles;

}
*/
