
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.auspex.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Auspex Plots Task Class
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

function TaskAuspex()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskAuspex';
  this.name    = 'Auspex';     // short name for job tree
  this.oname   = '*';          // asterisk here means do not use
  this.title   = 'Reflection data diagnostics with Auspex plots'; // full title

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
              title    : 'Plot generation parameters',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                YRANGE_SEL : {
                        type     : 'combobox',
                        keyword  : 'yrange',
                        label    : 'Range along Y-axis:',
                        //lwidth   : 60,        // label width in px
                        //reportas : 'Down-weighting model',
                        tooltip  : 'Range mode along Y-axis',
                        range    : ['minmax|plot all data',
                                    'auto|core of distribution',
                                    'auto_low|core distribution with focus on low values',
                                    'low|only values below the mean'
                                   ],
                        value    : 'auto',
                        position : [0,0,1,1]
                      },
                DMIN : {
                        type      : 'real_',
                        keyword   : '--dmin',
                        label     : 'High resolution cut-off',
                        iwidth    : 60,
                        tooltip   : 'No cut-off (empty box) includes all data',
                        range     : [0.0,100.0],
                        value     : '',
                        default   : '',
                        position  : [1,0,1,1]
                      },
                PLOTS_CBX : {
                        type      : 'checkbox',
                        keyword   : '--single-figure',
                        label     : 'Put all plots in one figure',
                        tooltip   : 'Check if separate plot figures are required',
                        iwidth    : 350,
                        value     : false,
                        position  : [2,0,1,3]
                      },
                REDFLAG_CBX : {
                        type      : 'checkbox',
                        keyword   : '--no-automatic',
                        label     : 'Flag suspected ice rings red',
                        tooltip   : 'If unchecked, no automatic ice ring detection will be performed',
                        iwidth    : 350,
                        value     : true,
                        position  : [3,0,1,3]
                      }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskAuspex',TaskAuspex,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskAuspex',TaskAuspex,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskAuspex.prototype.icon           = function()  { return 'task_auspex'; }
TaskAuspex.prototype.clipboard_name = function()  { return '"Auspex"';    }

TaskAuspex.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskAuspex.prototype.platforms  = function() { return 'LMU'; }

TaskAuspex.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'detects problems and artifacts in the reflection data';
  };

TaskAuspex.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['auspex','toolbox', 'diagnostic', 'reflection', 'data', 'images'] );
  }

if (!__template)  {

  TaskAuspex.prototype.collectInput = function ( inputPanel )  {
    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    var hkl = this.input_data.getData('hkl')[0];

    if (!hkl.isImean())
      input_msg += '|<b>Reflection data:</b> Auspex can work only with ' +
                   'reflection datasets that include mean intensities, ' +
                   'and they are not found in the dataset from the selected ' +
                   'structure revision';

    return input_msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskAuspex.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.auspex', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAuspex = TaskAuspex;

}
