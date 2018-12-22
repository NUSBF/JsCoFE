
/*
 *  =================================================================
 *
 *    12.12.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.dimplemr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  DimpleMR Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskDimple()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskDimple';
  this.name    = 'dimple';
  this.oname   = 'dimple';  // default output file name template
  this.title   = 'Dimple refinement';
  this.helpURL = './html/jscofe_task_dimple.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!hkl','!xyz']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Options',
             open     : false,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                TITLE1 : {
                        type     : 'label',  // just a separator
                        label    : '<h3>Refinement parameters</h3>',
                        position : [0,0,1,4]
                     },
                REFLEVEL : {
                        type     : 'combobox',
                        keyword  : 'REFLEVEL',
                        label    : 'Refinement level',
                        iwidth   : 200,      // width of input field in px
                        tooltip  : 'Higher refinement levels may produce better ' +
                                   'results at longer computation times',
                        range    : ['0|Normal',
                                    '1|Enhanced',
                                    '2|Highest'
                                   ],
                        value    : '2',
                        position : [1,0,1,1]
                      },
                NJELLY : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : '--jelly',   // the real keyword for job input stream
                        label    : 'Number of jelly-body cycles',
                        tooltip  : 'Number of jelly-body Refmac cycles (between ' +
                                   '0 and 400) to run before final refinrmrnt (leave ' +
                                   'blank for automatic choice)',
                        range    : [0,400],  // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        default  : 0,
                        position : [2,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                NRESTR : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : '--restr-cycles',  // the real keyword for job input stream
                        label    : 'Number of final cycles',
                        tooltip  : 'Number of final Refmac cycles (between ' +
                                   '0 and 400; leave blank for automatic choice)',
                        range    : [0,400],  // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        default  : 8,
                        position : [3,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                RESLIMIT : {
                        type     : 'real_', // '_' means blank value is allowed
                        keyword  : '--reso',  // the real keyword for job input stream
                        label    : 'Resolution limit (&Aring;)',
                        tooltip  : 'Specify the high resolution limit or leave ' +
                                   'blank for automatic choice',
                        range    : [0.0,'*'], // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : '',        // value to be paired with the keyword
                        position : [4,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                WEIGHT : {
                        type     : 'real_', // '_' means blank value is allowed
                        keyword  : '--weight',  // the real keyword for job input stream
                        label    : 'Refmac matrix weight',
                        tooltip  : 'Specify weight value or leave blank for automatic choice',
                        range    : [0.0,'*'], // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : '',        // value to be paired with the keyword
                        position : [5,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                TITLE2 : { type  : 'label',  // just a separator
                        label    : '<h3>Molecular Replacement parameters</h3>',
                        position : [6,0,1,4]
                      },
                MRTHRESHOLD : {
                        type     : 'real_', // '_' means blank value is allowed
                        keyword  : '--mr-when-r',  // the real keyword for job input stream
                        label    : 'Threshold R<sub>free</sub> for MR',
                        tooltip  : 'Will perform molecular replacement if ' +
                                   'R<sub>free</sub> is higher than the ' +
                                   'threshold value given',
                        range    : [0.0,1.0], // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : '',        // value to be paired with the keyword
                        default  : 0.4,
                        position : [7,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                MRPROG : {
                        type     : 'combobox',
                        keyword  : '--mr-prog',
                        label    : 'MR program to use',
                        tooltip  : 'Choose molecular replacement program',
                        range    : ['phaser|Phaser',
                                    'molrep|Molrep'
                                   ],
                        value    : 'phaser',
                        position : [8,0,1,1]
                      },
                MRNUM : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : '--mr-num',  // the real keyword for job input stream
                        label    : 'Number of molecules',
                        tooltip  : 'Specify the number of molecules for MR or ' +
                                   'leave blank for automatic choice',
                        range    : [0,400],  // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        position : [9,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                MRRESO : {
                        type     : 'real_', // '_' means blank value is allowed
                        keyword  : '--mr-reso',  // the real keyword for job input stream
                        label    : 'Resolution cut-off (&Aring;)',
                        tooltip  : 'Specify the high resolution cut-off for MR ' +
                                   'or leave blank for automatic choice',
                        range    : [0.0,'*'], // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : '',        // value to be paired with the keyword
                        default  : 3.25,
                        position : [10,0,1,1] // [row,col,rowSpan,colSpan]
                      }
             }
           }
  };

}


if (__template)
      TaskDimple.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskDimple.prototype = Object.create ( TaskTemplate.prototype );
TaskDimple.prototype.constructor = TaskDimple;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskDimple.prototype.icon_small = function()  { return 'task_dimple_20x20'; }
TaskDimple.prototype.icon_large = function()  { return 'task_dimple';       }

TaskDimple.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskDimple.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.subtype.indexOf('xyz')>=0)
        this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskDimple.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.dimple', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskDimple = TaskDimple;

}
