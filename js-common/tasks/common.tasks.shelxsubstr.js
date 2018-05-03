
/*
 *  =================================================================
 *
 *    05.12.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.shelxauto.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  SHELX-Auto Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.crank2' );


// ===========================================================================

function TaskShelxSubstr()  {

  if (__template)  __template.TaskCrank2.call ( this );
             else  TaskCrank2.call ( this );

  this._type   = 'TaskShelxSubstr';
  this.name    = 'shelx substructure search';
  this.oname   = 'shelx_substr';  // default output file name template
  this.title   = 'Substructure Search with SHELX';
  this.helpURL = './html/jscofe_task_shelxsubstr.html';

  this.input_dtypes[0].data_type   = {'DataRevision':['hkl']}, // data type(s) and subtype(s)
  this.input_dtypes[0].customInput = 'shelx-substr';   // lay custom fields next to the selection
  this.input_dtypes[1].customInput = 'anomData-Shelx'; // lay custom fields next to the selection

  this.parameters.sec1.value = 'shelx-substr';

}

if (__template)
      TaskShelxSubstr.prototype = Object.create ( __template.TaskCrank2.prototype );
else  TaskShelxSubstr.prototype = Object.create ( TaskCrank2.prototype );
TaskShelxSubstr.prototype.constructor = TaskShelxSubstr;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxSubstr.prototype.icon_small = function()  { return './images/task_shelx_substr_20x20.svg'; }
TaskShelxSubstr.prototype.icon_large = function()  { return './images/task_shelx_substr.svg';       }

TaskShelxSubstr.prototype.currentVersion = function()  { return 0; }

if (__template)  {
  //  for server side

  var conf         = require('../../js-server/server.configuration');
  var tsk_template = require ( './common.tasks.template' );

  TaskShelxSubstr.prototype.makeInputData = function ( jobDir )  {

    // Puts hkl data in input databox for copying their files in
    // job's 'input' directory.

    /*
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      if (revision.HKL.nativeKey!='unused')
        this.input_data.data['native'] = [revision.HKL];
      //if (revision.Structure)
      //  this.input_data.data['pmodel'] = [revision.Structure];
      //this.input_data.data['seq'] = revision.ASU.seq;
    }
    */

    tsk_template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskShelxSubstr.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxsubstr', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxSubstr = TaskShelxSubstr;

}
