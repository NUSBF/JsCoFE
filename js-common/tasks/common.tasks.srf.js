
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.srf.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Self-Rotation Function Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
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

function TaskSRF()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskSRF';
  this.name  = 'srf analysis';  // short name for job tree
  this.oname = '*';             // asterisk here means do not use
  this.title = 'Self-Rotation Function Analysis with Molrep';  // full title

  this.input_dtypes = [{    // input data types
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflection Data', // label for input dialog
      inputId     : 'hkl',      // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters
  this.parameters = { // input parameters
    SEPARATOR_LBL : {
              type     : 'label',  // just a separator
              label    : '&nbsp',
              position : [0,1,1,1]
            },
    sec1  : { type     : 'section',
              title    : 'SRF Options',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                MOLSIZE : {
                        type        : 'real_',
                        keyword     : 'rad',
                        label       : 'Expected molecule size (&Aring;)',
                        iwidth      : 60,
                        tooltip     : 'An estimate for the integration radius for SRF ' +
                                      'calculations',
                        range       : [0.0,1000.0],
                        value       : '',
                        default     : '',
                        position    : [0,0,1,1]
                      },
                CHISEC : {
                        type        : 'real_',
                        keyword     : 'chi',
                        label       : 'Select Chi sections at 180, 90, 120 and ',
                        iwidth      : 60,
                        tooltip     : 'Select Chi section or leave blank for default value',
                        range       : [0.0,360.0],
                        value       : '',
                        placeholder : '60',
                        label2      : 'degrees',
                        position    : [1,0,1,1]
                      },
                TOPISO : {
                        type        : 'real_',
                        keyword     : 'scale',
                        label       : 'Top isoline level:',
                        iwidth      : 60,
                        tooltip     : 'Specify top isoline level or leave blank ' +
                                      'for automatic choice',
                        range       : ['*','*'],
                        value       : '',
                        placeholder : '6.0',
                        label2      : 'sigmas',
                        position    : [2,0,1,1]
                      }
              }
            },
    sec2  : { type     : 'section',
              title    : 'Experimental Data',
              open     : false,  // true for the section to be initially open
              position : [2,0,1,5],
              contains : {
                HIRES : {
                        type        : 'real_',
                        keyword     : 'resmax',
                        label       : 'High resolution cut-off (&Aring;)',
                        iwidth      : 60,
                        tooltip     : 'Ignore high resolution data above the specified threshold',
                        range       : [0.0,'*'],
                        value       : '',
                        default     : '',
                        position    : [0,0,1,1]
                      },
                DWHIGH_SEL : {
                        type     : 'combobox',
                        keyword  : 'dwhigh',
                        label    : 'Down-weighting high resolution data:',
                        tooltip  : 'Select down-weighting mode',
                        range    : ['N|none',
                                    'S|by similarity',
                                    'B|by BADD'
                                   ],
                        value    : 'N',
                        position : [1,0,1,1]
                      },
                DWSIM : {
                        type        : 'real',
                        keyword     : 'sim',
                        label       : 'equal to',
                        iwidth      : 60,
                        tooltip     : 'W=1-exp(Boff*s<sup>2</sup>), where Boff=2*Resmin<sup>2</sup> and ' +
                                      'Resmin approximately equals to the dimension ' +
                                      'of the model',
                        range       : [0.0,'*'],
                        value       : '1.0',
                        default     : '1.0',
                        position    : [1,3,1,1],
                        showon      : {DWHIGH_SEL:['S']}
                      },
                DWBADD : {
                        type        : 'real',
                        keyword     : 'badd',
                        label       : 'equal to',
                        iwidth      : 60,
                        tooltip     : 'W=1-exp(-BADD*s<sup>2</sup>), where BADD can be ' +
                                      'defined via sequence similarity',
                        range       : [0.0,'*'],
                        value       : '1.0',
                        default     : '1.0',
                        position    : [1,3,1,1],
                        showon      : {DWHIGH_SEL:['B']}
                      },
                DWBLOW : {
                        type        : 'real_',
                        keyword     : 'resmin',
                        label       : 'Down-weighting low resolution data:',
                        iwidth      : 60,
                        tooltip     : 'W=1-exp(2*x<sup>2</sup>*s<sup>2</sup>) or leave blank for ' +
                                      'not down-weighting',
                        range       : [0.0,'*'],
                        value       : '',
                        default     : '',
                        position    : [2,0,1,1]
                      },
                SCALING_SEL : {
                        type     : 'combobox',
                        keyword  : 'scaling',
                        label    : 'Scaling:',
                        tooltip  : 'Select scaling mode',
                        range    : ['none|none',
                                    'Y|anisotropic',
                                    'C|anisotropic in RF only',
                                    'S|anisotropic in TF only',
                                    'N|isotropic',
                                    'K|overall scale factor only'
                                   ],
                        value    : 'none',
                        position : [3,0,1,3]
                      }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskSRF',TaskSRF,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskSRF',TaskSRF,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskSRF.prototype.icon           = function()  { return 'task_srf'; }
TaskSRF.prototype.clipboard_name = function()  { return '"SRF"';    }
TaskSRF.prototype.platforms      = function()  { return 'LMU'; }  // UNIX only

TaskSRF.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSRF.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'helps to determine the internal symmetry of the reflection data';
}

TaskSRF.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'srf', 'self','rotation','function', 'self-rotation','selfrotation','analysis',
                'tools', 'toolbox', 'symmetry'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSRF.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.srf', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSRF = TaskSRF;

}
