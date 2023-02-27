
/*
 *  =================================================================
 *
 *    27.02.23   <--  Date of Last Modification.
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

'use strict';

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
                     position : [0,0,1,5]
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
                     placeholder : 'e.g., 1.5,1.6,1.75,1.90,2.10',
                     iwidth      : 450,
                     position    : [2,2,1,1],
                     showon      : {'MODE_SEL':['list']}
                    },
        PRENCYC :   { type        : 'integer_',
                      keyword     : 'prencyc',
                      label       : 'Start with',
                      tooltip     : 'Number of pre-refinement cycles to run at the initial low ' +
                                    'resolution. Put zero for if you do not wish to run them, or ' +
                                    'leave blank for automatic choice.',
                      range       : [0,50],
                      value       : '',
                      placeholder : '20',
                      iwidth      : 40,
                      // label2      : 'refinement cycles at the intial low resolution',
                      position    : [3,0,1,1]
                    },
        label   :   { type        : 'label',  // just a separator
                      label       : 'refinement cycles',
                      position    : [3,3,1,6]
                    },

        WAUTO_YES : {
                      type     : 'combobox',
                      keyword  : 'none',
                      label    : 'Overall data-geometry weight',
                      tooltip  : 'Overall Data-geometry weight',
                      range    : ['yes|Auto','no|Fixed'],
                      value    : 'yes',
                      position : [5,0,1,1]
                   },
        WAUTO_VAL : {
                     type     : 'real',
                     keyword  : 'none',
                     label    : 'value',
                     tooltip  : 'Weight for X-ray term',
                     range    : [0,'*'],
                     value    : '0.01',
                     showon   : {'WAUTO_YES':['no']},
                     position : [5,3,1,1]
                  },
        // WAUTO_VAL_AUTO : {
        //              type     : 'real_',
        //              keyword  : 'none',
        //              label    : 'starting value',
        //              tooltip  : 'Weight for X-ray term',
        //              range    : [0,'*'],
        //              value    : '',
        //              default  : '',   // default cannot be a literal
        //              showon   : {'WAUTO_YES':['yes']},
        //              position : [4,3,1,1]
        //           },
        CMP_CBX : {
                      type     : 'checkbox',
                      label    : 'Complete cross validation',
                      tooltip  : 'To run the paired refinement protocol for each individual free reflections set',
                      value    : false,
                      position : [6,0,1,1]
                    }
   }
    },

    sec2 : {
      type     : 'section',
      title    : 'Advanced',
      open     : false,
      position : [4,0,1,5],
      contains : {
         KEYWORDS_LBL : {
           type     : 'label',
           keyword  : 'none',
           label    : '<div style="font-size:14px;">' +
                      '<i>Type additional keywords here</i></div>',
           position : [2,0,1,6]
         },
         KEYWORDS: {
          type        : 'aceditor_',
          //keyword     : 'keyword',
          tooltip     : '',
          reportas    : 'Keywords',
          tooltip     : 'Keywords for Refmac',
          value       : '',
          iwidth      : 500,
          iheight     : 160,
          position    : [3,0,1,6]
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
var version = 2;
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

if (!__template)  {  //  will run only on client side

  TaskPaiRef.prototype.collectInput = function ( inputPanel )  {
  var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (this.parameters.sec1.contains.MODE_SEL.value=='list')  {
      var rlist = this.parameters.sec1.contains.RLIST.value.trim().split(',');
      if (rlist.length<3)
        input_msg += '|<b>resolution shells:</b> minimum 3 shells must be specified.';
      else  {
        var ok = true;
        for (var i=0;(i<rlist.length) && ok;i++)
          if ((!rlist[i].trim()) || (!isFloat(rlist[i])))
            ok = false;
        if (!ok)
          input_msg += '|<b>resolution shells:</b> format violations or empty items.';
      }
    }

    return input_msg;

  }

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
