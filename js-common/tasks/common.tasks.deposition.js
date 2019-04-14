
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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
  this.oname   = 'deposition';  // default output file name template
  this.title   = 'Prepare data for deposition';
  this.helpURL = './html/jscofe_task_deposition.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskDeposition.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDeposition.prototype = Object.create ( TaskTemplate.prototype );
TaskDeposition.prototype.constructor = TaskDeposition;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDeposition.prototype.icon = function()  { return 'task_deposition'; }

//TaskDeposition.prototype.icon_small = function()  { return 'task_deposition_20x20'; }
//TaskDeposition.prototype.icon_large = function()  { return 'task_deposition';       }

//TaskDeposition.prototype.cleanJobDir = function ( jobDir )  {}

TaskDeposition.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var fs     = require('fs-extra');
  var path   = require('path');
  var conf   = require('../../js-server/server.configuration');
  var prj    = require('../../js-server/server.fe.projects');
  var utils  = require('../../js-server/server.utils');
  var task_t = require('./common.tasks.template');

  TaskDeposition.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      if (revision.HKL.aimless_meta["file"])
        this.addInputFile ( revision.HKL.aimless_meta["jobId"],
                            revision.HKL.aimless_meta["file"],
                            jobDir );
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
      this.input_data.data['seq']     = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

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

  TaskDeposition.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.deposition', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDeposition = TaskDeposition;

}
