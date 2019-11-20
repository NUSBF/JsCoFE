
/*
 *  =================================================================
 *
 *    20.11.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.editrevisionsubstr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Substructure Editing Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.editrevisionasu' );


// ===========================================================================

function TaskEditRevisionSubstr()  {

  if (__template)  __template.TaskEditRevisionASU.call ( this );
             else  TaskEditRevisionASU.call ( this );

  this._type     = 'TaskEditRevisionSubstr';
  this.name      = 'edit revision substructure';
  this.setOName ( 'edit_revision_substr' );  // default output file name template
  this.title     = 'Edit Revision: Substructure';
  this.helpURL   = './html/jscofe_task_editrevision_substr.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataRevision':[]},   // data type(s) and subtype(s)
      label       : 'Structure revision',  // label for input dialog
      tooltip     : 'Structure revision, in which the Heavy-Atom Substructure ' +
                    'needs to be modified',
      inputId     : 'revision',     // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      //customInput : 'asumod',     // lay custom fields next to the selection
      version     : 5,              // minimum data version allowed
      min         : 1,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['!substructure']},  // data type(s) and subtype(s)
      label       : 'Heavy-atom substructure', // label for input dialog
      cast        : 'sub',
      unchosen_label : '[do not change]',
      tooltip     : 'Atomic model of the heavy-atom substructure. If no changes are ' +
                    'required, choose [do not change].',
      inputId     : 'sub',          // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['!phases']},  // data type(s) and subtype(s)
      label       : 'Phases',       // label for input dialog
      cast        : 'phases',
      unchosen_label : '[do not change]',
      tooltip     : 'Phases to replace or set in heavy-atom substructure. If no ' +
                    'changes are required, choose [do not change].',
      inputId     : 'phases',       // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskEditRevisionSubstr.prototype = Object.create ( __template.TaskEditRevisionASU.prototype );
else  TaskEditRevisionSubstr.prototype = Object.create ( TaskEditRevisionASU.prototype );
TaskEditRevisionSubstr.prototype.constructor = TaskEditRevisionSubstr;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskEditRevisionSubstr.prototype.icon = function()  { return 'task_editrevision_substr'; }

TaskEditRevisionSubstr.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskEditRevisionASU.prototype.currentVersion.call ( this );
  else  return  version + TaskEditRevisionASU.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  TaskEditRevisionSubstr.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
    var signal = '';
    if (!this.checkObjects(inpParamRef,emitterId,['revision','sub','phases'],['sub','phases']))
      signal = 'hide_run_button';
    this.sendTaskStateSignal ( inpParamRef.grid.inputPanel,signal );
  }



} else  {
  //  for server side

  var conf        = require('../../js-server/server.configuration');
  var __template0 = require ( './common.tasks.template' );

  TaskEditRevisionSubstr.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and sequence data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl0'] = [revision.HKL];
      if (revision.Substructure)
        this.input_data.data['substr0'] = [revision.Substructure];
    }

    __template0.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskEditRevisionSubstr.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.editrevision_substr', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEditRevisionSubstr = TaskEditRevisionSubstr;

}
