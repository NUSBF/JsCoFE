
/*
 *  =================================================================
 *
 *    28.01.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pairef.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PaiRef task class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev  2023
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

function TaskPaiRef()  {   // must start with Task...

  // invoke the template class constructor:
  if (__template)  __template.TaskTemplate.call ( this );
  else  TaskTemplate.call ( this );

  // define fields important for jsCoFE framework

  this._type   = 'TaskPaiRef';  // must give name of the class
  this.name    = 'pairef';      // default name to be shown in Job Tree
  this.setOName ( 'pairef' );   // default output file name template
  this.title   = 'Paired refinement with PAIREF'; // title for job dialog


  this.input_dtypes = [{  // input data types
    data_type : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
    label     : 'Structure revision',     // label for input dialog
    inputId   : 'revision', // input Id for referencing input fields
    version   : 4,          // minimum data version allowed
    min       : 1,          // minimum acceptable number of data instances
    max       : 1           // maximum acceptable number of data instances
  // },{
  //   data_type : {'DataHKL':[]},  // data type(s) and subtype(s)
  //   label     : 'Reflections',   // label for input dialog
  //   tooltip   : 'High-resolution reflection dataset, which will be used for finding ' +
  //               'the optimal resolution cut-off.',
  //   inputId   : 'hkl',           // input Id for referencing input fields
  //   min       : 1,               // minimum acceptable number of data instances
  //   max       : 1                // maximum acceptable number of data instances
  }];

  this.parameters = {
    SEP_LBL : {
      type     : 'label',
      label    : '&nbsp;',
      position : [0,0,1,5]
    },
    sec1 :  {
      type     : 'section',
      title    : 'Parameters',
      open     : true,  // true for the section to be initially open
      position : [1,0,1,5],
      contains : {
        MODE_SEL : { type     : 'combobox',
                     keyword  : 'mode',
                     label    : 'Check',
                     tooltip  : 'Select either equidistant or arbitrary placed, '     +
                               'hi-resolution shells to check for optimal  '     +
                               'resolution cut-off.',
                     range    : ['eqd|equidistant hi-resolution shells',
                                 'list|given hi-resolution shells'],
                     value    : 'eqd',
                     iwidth   : 280,
                     position : [0,0,1,4]
                   },
        NSHELLS :  { type        : 'integer_',
                     keyword     : 'nshells',
                     label       : 'number of hi-resolution shells:',
                     tooltip     : 'Number of hi-resolution shells to check or leave blank ' +
                                   'for automatic choice',
                     range       : [2,50],
                     value       : '',
                     placeholder : '20',
                     iwidth      : 40,
                     position    : [1,2,1,1],
                     showon      : {'MODE_SEL':['eqd']}
                   },
        RSTEP :    { type        : 'real_',
                     keyword     : 'rstep',
                     label       : 'of',
                     tooltip     : 'Thickness of resolution shells',
                     range       : [0.01,2.0],
                     value       : '',
                     placeholder : '0.05',
                     iwidth      : 40,
                     label2      : '&Aring; each',
                     position    : [1,6,1,1],
                     showon      : {'MODE_SEL':['eqd']}
                   },
        RLIST :    { type        : 'string',
                     keyword     : 'rlist',
                     label       : 'resolution shells (&Aring;)',
                     tooltip     : 'Comma-separated list of resolution shells',
                     value       : '',
                     placeholder : '1.5,1.6,1.75,1.90,2.10',
                     iwidth      : 450,
                     position    : [2,2,1,1],
                     showon      : {'MODE_SEL':['list']}
                   }
      }
    }
  };

}

// finish constructor definition

if (__template)
      TaskPaiRef.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPaiRef.prototype = Object.create ( TaskTemplate.prototype );
TaskPaiRef.prototype.constructor = TaskPaiRef;

// ===========================================================================

// Define task icons. 

TaskPaiRef.prototype.icon = function()  { return 'task_pairef'; }

//  Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. jsCoFE framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskPaiRef.prototype.currentVersion = function()  {
var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPaiRef.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'estimates the optimal high-resolution cut-off';
};

TaskPaiRef.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['pairef','paired','refinement',
                                           'resolution','cut-off'] );
}


// ===========================================================================

//  4. Add server-side code

if (__template)  {  //  will run only on server side

  const conf  = require('../../js-server/server.configuration');

  TaskPaiRef.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory
      
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
      if (('file_unm' in revision.HKL.aimless_meta) && revision.HKL.aimless_meta.file_unm)
        this.addInputFile ( revision.HKL.aimless_meta.jobId,revision.HKL.aimless_meta.file_unm,jobDir );
      // var hkl = this.input_data.data['hkl'][0]
      // if (('file_unm' in hkl.aimless_meta) && hkl.aimless_meta.file_unm)
      //   this.addInputFile ( hkl.aimless_meta.jobId,hkl.aimless_meta.file_unm,jobDir );
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  // form command line for server's node js to start task's python driver;
  // note that last 3 parameters are optional and task driver will not use
  // them in most cases.

  TaskPaiRef.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [  conf.pythonName(),         // will use python from configuration
              '-m',                      // will run task as a python module
              'pycofe.tasks.pairef', // path to python driver
              jobManager,                  // framework's type of run: 'SHELL', 'SGE' or 'SCRIPT'
              jobDir,                   // path to job directory given by framework
              this.id                   // task id (assigned by the framework)
          ];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in server's node js

  module.exports.TaskPaiRef = TaskPaiRef;

}
