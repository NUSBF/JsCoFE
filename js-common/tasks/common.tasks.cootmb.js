
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCootMB()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCootMB';
  this.name    = 'coot (model building)';
  this.oname   = 'coot-mb';  // default output file name template
  this.title   = 'Model Building with Coot';
  this.helpURL = './html/jscofe_task_coot.html';
  this.nc_type = 'client';  // job may be run only on client NC

  this.input_dtypes = [{      // input data types
      data_type : {'DataRevision':['xyz','substructure','!phases']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 4,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    },{
      data_type : {'DataStructure':[],'DataEnsemble':[],'DataXYZ':[]},  // data type(s) and subtype(s)
      label     : 'Additional structures', // label for input dialog
      inputId   : 'aux_struct', // input Id for referencing input fields
      version   : 0,            // minimum data version allowed
      min       : 0,            // minimum acceptable number of data instances
      max       : 20            // maximum acceptable number of data instances
    },{
      data_type : {'DataLigand':[]},  // data type(s) and subtype(s)
      label     : 'Ligand data', // label for input dialog
      inputId   : 'ligand',      // input Id for referencing input fields
      min       : 0,             // minimum acceptable number of data instances
      max       : 1              // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskCootMB.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCootMB.prototype = Object.create ( TaskTemplate.prototype );
TaskCootMB.prototype.constructor = TaskCootMB;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCootMB.prototype.icon = function()  { return 'task_coot'; }

TaskCootMB.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCootMB.prototype.makeInputData = function ( login,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskCootMB.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.coot_mb', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCootMB = TaskCootMB;

}
