
/*
 *  =================================================================
 *
 *   23.10.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.pisa.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PISA Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskPISA()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPISA';
  this.name    = 'pisa';
  this.oname   = 'pisa';  // default output file name template
  this.title   = 'Surface, Interfaces and Assembly Analysis with PISA';
  this.helpURL = './html/jscofe_task_pisa.html';

  this.input_dtypes = [{        // input data types
     data_type   : {'DataStructure':[],'DataXYZ':[]},  // data type(s) and subtype(s)
     label       : 'Structure', // label for input dialog
     inputId     : 'xyz',       // input Id for referencing input fields
     customInput : 'pisa',      // lay custom fields next to the selection
                                // dropdown for anomalous data
     min         : 1,           // minimum acceptable number of data instances
     max         : 1            // maximum acceptable number of data instances
   }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Advanced parameters',
             open     : false,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                LIGANDKEY_SEL : {
                     type     : 'combobox',
                     keyword  : 'ligand_key',
                     label    : 'ligand processing mode',
                     tooltip  : 'These options are for testing and development. ' +
                                'For routine use, always choose "Auto".',
                     range    : ['auto|Auto',
                                 'fixed|Fixed',
                                 'free|Free'
                                ],
                     value    : 'auto',
                     position : [0,0,1,1]
                   }
             }
           }
  };

}


if (__template)
      TaskPISA.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPISA.prototype = Object.create ( TaskTemplate.prototype );
TaskPISA.prototype.constructor = TaskPISA;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskPISA.prototype.icon_small = function()  { return './images/task_pisa_20x20.svg'; }
TaskPISA.prototype.icon_large = function()  { return './images/task_pisa.svg';       }

TaskPISA.prototype.currentVersion = function()  { return 0; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskPISA.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pisa', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPISA = TaskPISA;

}
