
/*
 *  =================================================================
 *
 *    20.08.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.mrparse.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MrParse Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskMrParse()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskMrParse';
  this.name  = 'mrparse';
  this.setOName ( 'mrparse' );  // default output file name template
  this.title = 'Find structural homologues with MrParse';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':[]},  // data type(s) and subtype(s)
      label       : 'Reflections',   // label for input dialog
      tooltip     : 'Optional reflection dataset which will be used for phasing ' +
                    'in following-up tasks.',
      inputId     : 'hkl',           // input Id for referencing input fields
      force       : 1,               // select by default if data object is present
      min         : 0,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    }
  ];

  // this.parameters = { // input parameters
  //   sec1 : { type     : 'section',
  //            title    : 'Parameters',
  //            open     : true,  // true for the section to be initially open
  //            position : [0,0,1,5],
  //            contains : {
  //               AFDB_CBX : {
  //                      type     : 'checkbox',
  //                      label    : 'Include structures from AFDB',
  //                      tooltip  : 'Check to include structures from AlphaFold-2 database',
  //                      value    : false,
  //                      position : [0,0,1,3]
  //                    },
  //               RLEVEL_SEL : {
  //                     type     : 'combobox',
  //                     keyword  : 'RLEVEL',
  //                     label    : 'Redundancy level',
  //                     tooltip  : 'Choose appropriate redundancy level for ' +
  //                                'keeping hits in the list of matches. ',
  //                     range    : ['ALL|All','100|100%','95|95%','90|90%','70|70%','50|50%'],
  //                     value    : 'ALL',
  //                     position : [1,0,1,1],
  //                     hideon   : {AFDB_CBX:[true]}
  //                    },
  //               MRNUM : {
  //                     type     : 'integer',
  //                     keyword  : 'MRNUM',
  //                     label    : 'Number of ensembles',
  //                     tooltip  : 'Specify the number of ensemblies to generate ' +
  //                                '(from 1 to 20).',
  //                     range    : [1,20],
  //                     value    : 5,
  //                     position : [2,0,1,1]
  //                   }
  //          }
  //        }
  //
  // };

}

if (__template)
      TaskMrParse.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMrParse.prototype = Object.create ( TaskTemplate.prototype );
TaskMrParse.prototype.constructor = TaskMrParse;


// ===========================================================================

TaskMrParse.prototype.icon = function()  { return 'task_mrparse'; }

TaskMrParse.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'Find PDB and AFDB structures for further use as MR search models';
}

TaskMrParse.prototype.taskDescription = function()  {
// return 'Task description in small font which will appear under the task title in Task Dialog';
  return 'Found PDB and AFDB structures may be used for making MR search models';
}

TaskMrParse.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskMrParse.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mrparse', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMrParse = TaskMrParse;

}
