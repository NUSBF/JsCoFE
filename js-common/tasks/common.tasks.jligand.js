
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
 *  **** Content :  jLigand Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
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

function TaskJLigand()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskJLigand';
  this.name    = 'jligand (ligands and links)';
  this.oname   = 'jligand';  // output file name template (this or ligand name if empty)
  this.title   = 'Make Ligand and Covalent Links with jLigand';
  this.nc_type = 'client';   // the job may be run only on client NC

  this.input_dtypes = [{
      data_type   : {'DataRevision':[]},  // any revision will be passed
      label       : 'Structure revision', // check label
      inputId     : 'revision', // prefix 'void' will hide entry in import dialog
      customInput : 'jligand',  // lay custom fields below the dropdown
      version     : 0,          // minimum data version allowed
      force       : 1,          // "show" all revisions available
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataLibrary':[],'DataLigand':[]}, //,'DataStructure':['ligands']
      label       : 'Ligand or Library', // label for input dialog
      inputId     : 'ligand',      // input Id for referencing input fields
//    cast        : 'library',     // will replace data type names in comboboxes
      min         : 0,             // minimum acceptable number of data instances
      max         : 19             // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskJLigand.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskJLigand.prototype = Object.create ( TaskTemplate.prototype );
TaskJLigand.prototype.constructor = TaskJLigand;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskJLigand.prototype.icon           = function()  { return 'task_jligand'; }
TaskJLigand.prototype.clipboard_name = function()  { return '"jLigand"';    }

TaskJLigand.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

//TaskJLigand.prototype.cleanJobDir = function ( jobDir )  {}

TaskJLigand.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskJLigand.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'generates new ligand entries';
  };

  TaskJLigand.prototype.checkKeywords = function ( keywords )  {
    // keywords supposed to be in low register
      return this.__check_keywords ( keywords,['jligand', 'ligand','ligands'] );
  }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskJLigand.prototype.makeInputData = function ( loginData,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskJLigand.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.jligand', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskJLigand = TaskJLigand;

}
