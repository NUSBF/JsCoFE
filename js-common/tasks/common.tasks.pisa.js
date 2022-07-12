
/*
 *  =================================================================
 *
 *    02.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskPISA()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPISA';
  this.name    = 'pisa';
  this.setOName ( 'pisa' );  // default output file name template
  this.title   = 'Surface, Interfaces and Assembly Analysis with PISA';
  this.helpURL = './html/jscofe_task_pisa.html';

  this.input_dtypes = [{        // input data types
     data_type   : {'DataStructure':['!xyz'],'DataXYZ':[]},  // data type(s) and subtype(s)
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

TaskPISA.prototype.icon = function()  { return 'task_pisa'; }

TaskPISA.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPISA.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'performs the calculation of macromolecular surfaces and interfaces and their various properties, and predicts probable macromolecular assemblies';
  };


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskPISA.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pisa', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPISA = TaskPISA;

}
