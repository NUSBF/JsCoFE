
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

function TaskPISA()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPISA';
  this.name    = 'pisa';
  this.setOName ( 'pisa' );  // default output file name template
  this.title   = 'Surface, Interfaces and Assembly Analysis with PISA';

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
                     label    : 'Ligand to exclude:',
                     tooltip  : 'In most cases, exclude ligands that were added ' +
                                'as crystallisation agents. The "common agents" option ' +
                                'will automatically exclude common suspects, and ' +
                                'should be used routinely. When choose "as listed", give ' +
                                'a comma-separated list of 3-letter ligand codes.',
                     range    : ['(agents)|common crystallisation agents',
                                 '(all)|all',
                                 'none|none',
                                 'list|as listed'
                                ],
                     value    : '(agents)',
                     position : [0,0,1,1]
                   },
                LIGAND_LIST : {
                     type      : 'string_',   // empty string checked in modified collect function
                     keyword   : 'codes',
                     label     : '',
                     tooltip   : 'Comma-separated list of 3-letter ligand codes to exclude',
                     iwidth    : 380,
                     value     : '',
                     // emitting  : true,
                     position  : [0,4,1,1],
                     showon    : {LIGANDKEY_SEL:['list']}
                   },
                LIGANDMODE_SEL : {
                     type     : 'combobox',
                     keyword  : 'ligand_mode',
                     label    : 'Ligand processing mode:',
                     tooltip  : 'This option is more for testing and development, ' +
                                'yet can be used in exceptional cases. ' +
                                'For routine use, always choose "Auto", otherwise ' +
                                'check with documentation.',
                     range    : ['auto|auto',
                                 'fixed|fixed',
                                 'free|free'
                                ],
                     value    : 'auto',
                     position : [1,0,1,1]
                   }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskPISA',TaskPISA,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskPISA',TaskPISA,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskPISA.prototype.icon           = function()  { return 'task_pisa'; }
TaskPISA.prototype.clipboard_name = function()  { return '"PISA"';    }

TaskPISA.prototype.currentVersion = function()  {
  var version = 1;  // advanced on 06.12.2022
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPISA.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'calculates macromolecular surfaces, interfaces and assemblies';
}

TaskPISA.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['pisa', 'surface','interfaces','assembly',
                        'analysis','assemblies','complexes', 'toolbox','interaction'] );
}

if (!__template)  {

  TaskPISA.prototype.collectInput = function ( inputPanel )  {
  var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (this.parameters.sec1.contains.LIGANDKEY_SEL.value=='list')  {
      var ligands = this.parameters.sec1.contains.LIGAND_LIST.value.trim().split(',');
      if ((ligands.length<1) || (ligands[0]==''))
        input_msg += '|<b>List of ligands:</b> list of ligands to exclude is empty. ' +
                     'Either provide a comma-separated list of ligands to exclude ' +
                     'from analysis or choose another ligand exclusion option.';
    }

    return input_msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskPISA.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pisa', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPISA = TaskPISA;

}
