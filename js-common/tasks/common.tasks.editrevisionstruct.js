// LEGACY CODE, ONLY USED IN OLD PROJECTS   05.09.20  v.1.4.014

/*
 *  =================================================================
 *
 *    12.07.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.editrevisionstruct.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Structure Editing Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2021
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.editrevisionasu' );


// ===========================================================================

function TaskEditRevisionStruct()  {

  if (__template)  {
    __template.TaskEditRevisionASU.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskEditRevisionASU.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type     = 'TaskEditRevisionStruct';
  this.name      = 'edit revision structure';
  this.setOName ( 'edit_revision_struct' );  // default output file name template
  this.title     = 'Edit Revision: Structure';
  //this.helpURL   = './html/jscofe_task_editrevision_struct.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataRevision':['~substructure']},   // data type(s) and subtype(s)
      label       : 'Structure revision',  // label for input dialog
      tooltip     : 'Structure revision, in which the Macromolecular Structure ' +
                    'needs to be modified',
      inputId     : 'revision',     // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      //customInput : 'asumod',     // lay custom fields next to the selection
      version     : 5,              // minimum data version allowed
      min         : 1,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['!xyz'],'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Atomic coordinates', // label for input dialog
      cast        : 'xyz',
      unchosen_label : '[remove]',
      tooltip     : 'Atomic model coordinates. In order to remove existing ' +
                    'coordinates, choose [remove].',
      inputId     : 'xyz',          // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      force       : 1,
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['!phases']},  // data type(s) and subtype(s)
      label       : 'Phases',       // label for input dialog
      cast        : 'phases',
      unchosen_label : '[do not change]',
      tooltip     : 'Phases to replace or set in structure revision, the top item ' +
                    'corresponds to current phases. Phases cannot be removed, only ' +
                    'replaced or left as is.',
      inputId     : 'phases',       // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      force       : 1,
      version     : 0,              // minimum data version allowede
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[],'DataLibrary':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data',  // label for input dialog
      unchosen_label : '[do not change]',
      tooltip     : 'Ligand(s). If no changes are required, choose [do not change]. ' +
                    'Note that if ligand structures are given, they will replace ' +
                    'any pre-existing ligands in structure revision.',
      inputId     : 'ligand',       // input Id for referencing input fields
      min         : 0,              // minimum acceptable number of data instances
      max         : 20              // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskEditRevisionStruct.prototype = Object.create ( __template.TaskEditRevisionASU.prototype );
else  TaskEditRevisionStruct.prototype = Object.create ( TaskEditRevisionASU.prototype );
TaskEditRevisionStruct.prototype.constructor = TaskEditRevisionStruct;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskEditRevisionStruct.prototype.icon = function()  { return 'task_editrevision_struct'; }

TaskEditRevisionStruct.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskEditRevisionASU.prototype.currentVersion.call ( this );
  else  return  version + TaskEditRevisionASU.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  TaskEditRevisionStruct.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
    var signal = '';
    if (!this.checkObjects(inpParamRef,emitterId,['revision','xyz','phases','ligand'],['xyz','phases']))
      signal = 'hide_run_button';
    this.sendTaskStateSignal ( inpParamRef.grid.inputPanel,signal );
  }

} else  {
  //  for server side

  var conf        = require('../../js-server/server.configuration');
  var __template0 = require ( './common.tasks.template' );

  TaskEditRevisionStruct.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and sequence data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl0'] = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['struct0'] = [revision.Structure];
    }

    __template0.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskEditRevisionStruct.prototype.makeOutputData = function ( jobDir )  {
  // We modify this function such that this.input_data contains template data
  // instances for substructure and phases data when [remove] and [do not change]
  // are chosen. This will keep the corresponding controls in input panel after
  // job completion.
    __template0.TaskTemplate.prototype.makeOutputData.call ( this,jobDir );
    this.input_data.addData ( this.input_data.data['revision'][0].Structure );
  }

  TaskEditRevisionStruct.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.editrevision_struct', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEditRevisionStruct = TaskEditRevisionStruct;

}
