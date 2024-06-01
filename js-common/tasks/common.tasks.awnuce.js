
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.awnuce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Arp/wArp NUCE Task Class
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

function TaskAWNuce()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskAWNuce';
  this.name    = 'arpwarp nuce';
  this.setOName ( 'awnuce' );  // default output file name template
  this.title   = 'NUCE: Trace Nucleic Acid Chains with Arp/wArp';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':[['rna','dna'],'!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskAWNuce.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAWNuce.prototype = Object.create ( TaskTemplate.prototype );
TaskAWNuce.prototype.constructor = TaskAWNuce;


// ===========================================================================

TaskAWNuce.prototype.icon           = function()  { return 'task_arpwarp'; }
TaskAWNuce.prototype.clipboard_name = function()  { return '"Nuce"';       }

TaskAWNuce.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'traces nucleic acid chains in electron density using original algorithm';
}

TaskAWNuce.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskAWNuce.prototype.platforms           = function() { return 'LMU'; }  // UNIX only
TaskAWNuce.prototype.requiredEnvironment = function() { return ['CCP4','warpbin']; }

TaskAWNuce.prototype.authorisationID = function() {
  if (this.nc_type=='client')  return 'arpwarp';  // check Arp/wArp authorisation
  return '';
}

// hotButtons return list of buttons added in JobDialog's toolBar.
TaskAWNuce.prototype.hotButtons = function() {
  return [RefmacHotButton(),CootMBHotButton()];
}


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAWNuce.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['awnuce','trace', 'nucleic','acid','arpwarp'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskAWNuce.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      else if (revision.Substructure)
        this.input_data.data['istruct'] = [revision.Substructure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  

  TaskAWNuce.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.awnuce', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAWNuce = TaskAWNuce;

}
