
/*
 *  =================================================================
 *
 *    11.08.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.refmac.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Sequence Alignment Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskSeqAlign()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskSeqAlign';
  this.name      = 'seqalign';
  this.setOName ( 'seqalign' );  // default output file name template
  this.title     = 'Sequence Alignment with ClustalW';
  //this.helpURL   = './html/jscofe_task_seqalign.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['xyz'],
                     'DataEnsemble' :[],
                     'DataModel'    :[],
                     'DataSequence' :[],
                     'DataXYZ'      :[]
                    }, // data type(s) and subtype(s)
      label       : 'Sequence source',     // label for input dialog
      inputId     : 'seq',       // input Id for referencing input fields
      customInput : 'chain-sel', // lay custom fields next to the selection
      version     : 0,      // minimum data version allowed
      min         : 2,      // minimum acceptable number of data instances
      max         : 20      // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskSeqAlign.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSeqAlign.prototype = Object.create ( TaskTemplate.prototype );
TaskSeqAlign.prototype.constructor = TaskSeqAlign;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskSeqAlign.prototype.icon = function()  { return 'task_seqalign'; }

TaskSeqAlign.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSeqAlign.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.seqalign', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSeqAlign = TaskSeqAlign;

}
