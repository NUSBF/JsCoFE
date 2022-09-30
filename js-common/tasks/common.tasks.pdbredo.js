
/*
 *  =================================================================
 *
 *    30.09.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pdbredo.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PDB-REDO
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev  2022
 *
 *  =================================================================
 *
 */

var __template = null;   // null __template indicates that the code runs in
// client browser

// otherwise, the code runs on a server, in which case __template references
// a module with Task Template Class:

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
__template = require ( './common.tasks.template' );

// ===========================================================================

// 1. Define task constructor

function TaskPDBREDO()  {   // must start with Task...

// invoke the template class constructor:
if (__template)  __template.TaskTemplate.call ( this );
else  TaskTemplate.call ( this );

// define fields important for jsCoFE framework

this._type   = 'TaskPDBREDO';  // must give name of the class
this.name    = 'PDB-REDO';    // default name to be shown in Job Tree
this.oname   = '*';               // default output file name template;
           // asterisk means do not use
this.title   = 'PDB-REDO';         // title for job dialog


this.input_dtypes = [{  // input data types
  data_type : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
  label     : 'Structure revision',     // label for input dialog
  inputId   : 'revision', // input Id for referencing input fields
  version   : 4,          // minimum data version allowed
  min       : 1,          // minimum acceptable number of data instances
  max       : 1           // maximum acceptable number of data instances
}
];

this.parameters = {
  _label : {
        type        : 'label',
        label       : '<b><i>Target sequence(s):<br>&nbsp;<br>&nbsp;<br>&nbsp;' +
                      '<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;' +
                      '<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;',
        position    : [0,0,1,1],
        showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
      },
  SEQUENCE_TA: {
        type        : 'textarea_',
        //keyword     : 'keyword',
        tooltip     : '',
        reportas    : 'Sequence(s)',
        placeholder : 'Copy-paste your sequence(s) here, including title line(s).\n\n' +
                      'More than one sequences of the same type (protein/dna/na)\n' +
                      'can be given one after another. Example:\n\n' +
                      '>rnase_A\n' +
                      'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
                      'ATQEDYYTGDHYATFSLIDQTC\n\n' +
                      '>1dtx_A\n' +
                      'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
        nrows       : 15,
        ncols       : 160,
        iwidth      : 700,
        value       : '',
        position    : [0,2,1,3],
        showon      : {'revision.subtype:seq':[0,-1]} // from this and input data section
      },
  _label_2 : {
        type        : 'label',
        label       : '&nbsp;',
        position    : [1,0,1,1]
      },
  DEL0HYDR_CBX : {
        type     : 'checkbox',
        label    : 'Remove hydrogens with zero occupancy',
        tooltip  : 'Check to remove hydrogens with zero occupancy',
        value    : false,
        iwidth   : 340,
        position : [2,0,1,4]
      }
}
};



// finish constructor definition

if (__template)
TaskPDBREDO.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPDBREDO.prototype = Object.create ( TaskTemplate.prototype );
TaskPDBREDO.prototype.constructor = TaskPDBREDO;

// ===========================================================================

// Define task icons. 

TaskPDBREDO.prototype.icon = function()  { return 'task_pdbredo'; }

//  Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. jsCoFE framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskPDBREDO.prototype.currentVersion = function()  {
var version = 1;
if (__template)
return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// ===========================================================================

//  4. Add server-side code

if (__template)  {  //  will run only on server side

// acquire configuration module
var conf = require('../../js-server/server.configuration');

// form command line for server's node js to start task's python driver;
// note that last 3 parameters are optional and task driver will not use
// them in most cases.

TaskPDBREDO.prototype.getCommandLine = function ( jobManager,jobDir )  {
return [ conf.pythonName(),         // will use python from configuration
'-m',                      // will run task as a python module
'pycofe.tasks.pdbredo', // path to python driver
jobManager,                  // framework's type of run: 'SHELL', 'SGE' or 'SCRIPT'
jobDir,                   // path to job directory given by framework
this.id                   // task id (assigned by the framework)
];
}

// -------------------------------------------------------------------------
// export such that it could be used in server's node js

module.exports.TaskPDBREDO = TaskPDBREDO;

}
