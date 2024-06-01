
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.cootmb.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Model Building Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2022-2024
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

function TaskCootUtils()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCootUtils';
  this.name    = 'coot utilities';
  this.setOName ( 'coot-ut' );  // default output file name template
  this.title   = 'Coot Model Building Utilities';

  this.input_dtypes = [{        // input data types
      data_type   : {'DataRevision':['!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',         // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'coot-mb',  // lay custom fields below the dropdown
      version     : 4,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskCootUtils.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCootUtils.prototype = Object.create ( TaskTemplate.prototype );
TaskCootUtils.prototype.constructor = TaskCootUtils;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCootUtils.prototype.icon           = function()  { return 'task_cootut';      }
TaskCootUtils.prototype.clipboard_name = function()  { return '"Coot Utilities"'; }

TaskCootUtils.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'fit atoms and new ligands in electron density, validate and explore';
}

TaskCootUtils.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

TaskCootUtils.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

//TaskCootUtils.prototype.cleanJobDir = function ( jobDir )  {}

TaskCootUtils.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskCootUtils.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['coot','model', 'building', 'manual-mb', 'mb', 'coordinate', 'editor', 'utilities'] );
  }

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskCootUtils.prototype.hotButtons = function() {
    return [RefmacHotButton()];
  }

} else  {
  //  for server side

  var path  = require('path');

  var conf  = require('../../js-server/server.configuration');
  var prj   = require('../../js-server/server.fe.projects');
  var utils = require('../../js-server/server.utils');

  TaskCootUtils.prototype.makeInputData = function ( loginData,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    var istruct  = null;
    var istruct2 = null;
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      if (revision.Options.leading_structure=='substructure')  {
        istruct  = revision.Substructure;
        istruct2 = revision.Structure;
      } else  {
        istruct  = revision.Structure;
        istruct2 = revision.Substructure;
      }
      this.input_data.data['istruct'] = [istruct];
      if (istruct2 && ('load_all' in revision.Options) && revision.Options.load_all)
        this.input_data.data['istruct2'] = [istruct2];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

    if (istruct && ('coot_meta' in istruct) && istruct.coot_meta)  {
      var coot_meta = istruct.coot_meta;
      var srcJobDir = prj.getSiblingJobDirPath ( jobDir,coot_meta.jobId );
      /*
      for (var fname of coot_meta.files)
        utils.copyFile ( path.join(srcJobDir,fname),
                         path.join(jobDir,fname) );
      */
      for (var i=0;i<coot_meta.files.length;i++)
        utils.copyFile ( path.join(srcJobDir,coot_meta.files[i]),
                         path.join(jobDir,coot_meta.files[i]) );
      //  This is commented out because Coot creates platform-incompatible file
      //  names in backup directory
      //if (coot_meta.backup_dir)
      //  utils.copyFile ( path.join(srcJobDir,coot_meta.backup_dir),
      //                   path.join(jobDir,coot_meta.backup_dir) );
    }

  }

  TaskCootUtils.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.coot_mb', jobManager, jobDir,
            this.id, 'expire='+conf.getClientNCConfig().zombieLifeTime ];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCootUtils = TaskCootUtils;

}
