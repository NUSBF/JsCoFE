
/*
 *  =================================================================
 *
 *    21.01.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.omitmap.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Anomalous Map Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================
function TaskAnoMap()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskAnoMap';
  this.name   = 'anomap';
  this.setOName ( 'anomap' );  // default output file name template
  this.title  = 'Calculate anomalous map';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : [  // data type(s) and subtype(s)
                      '!phases','!xyz','!anomalous','~mmcif_only'
                    ]
                  },
    label       : 'Structure revision', // label for input dialog
    inputId     : 'revision',   // input Id for referencing input fields
    min         : 1,            // minimum acceptable number of data instances
    max         : 1             // maximum acceptable number of data instances
  }];

  // this.parameters = { // input parameters
  //   SPACER : {
  //            type     : 'label',
  //            keyword  : 'none',
  //            label    : '&nbsp;',
  //            position : [0,0,1,5]
  //          },
  //   sec1 : { type     : 'section',
  //           title    : 'Parameters',
  //           open     : true,  // true for the section to be initially open
  //           position : [1,0,1,5],
  //           contains : {
  //             SCALE_FOBS : {
  //                     type        : 'real_',
  //                     keyword     : 'scale_fobs',
  //                     label       : 'Calculate omit map&nbsp;&nbsp;&nbsp;',
  //                     tooltip     : 'Specify scale factors for observed and calculated intensities.',
  //                     range       : [-100.0,100.0],
  //                     value       : '',
  //                     placeholder : '2.0',
  //                     iwidth      : 40,
  //                     position    : [0,0,1,1]
  //                   },
  //             SCALE_FC : {
  //                     type        : 'real_',
  //                     keyword     : 'scale_fc',
  //                     label       : '&times; Fobs&nbsp;&nbsp;&nbsp;&nbsp;+',
  //                     tooltip     : 'Specify scale factors for observed and calculated intensities.',
  //                     range       : [-100.0,100.0],
  //                     value       : '',
  //                     placeholder : '-1.0',
  //                     iwidth      : 40,
  //                     position    : [0,3,1,1]
  //                   },
  //             SCALE_LBL : {
  //                     type        : 'label',
  //                     keyword     : 'none',
  //                     label       : '&times; Fcalc',
  //                     position    : [0,6,1,1]
  //                   },
  //             STRETCHER_LBL : {
  //                     type        : 'label',
  //                     keyword     : 'none',
  //                     label       : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ',
  //                     lwidth      : '90%',
  //                     position    : [0,7,1,1]
  //                   },
  //             RES_MIN : {
  //                     type        : 'real_',
  //                     keyword     : 'res_min',
  //                     label       : 'In resolution range from',
  //                     tooltip     : 'Specify minimum and maximum resolutions or leave ' +
  //                                   'blank for using the whole range.',
  //                     range       : [0.1,10.0],
  //                     value       : '',
  //                     placeholder : 'auto',
  //                     iwidth      : 40,
  //                     position    : [1,0,1,1]
  //                   },
  //             RES_MAX : {
  //                     type        : 'real_',
  //                     keyword     : 'res_max',
  //                     label       : '&Aring;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;to',
  //                     tooltip     : 'Specify minimum and maximum resolutions or leave ' +
  //                                   'blank for using the whole range.',
  //                     range       : [0.1,10.0],
  //                     value       : '',
  //                     placeholder : 'auto',
  //                     iwidth      : 40,
  //                     position    : [1,3,1,1]
  //                   },
  //             RES_LBL : {
  //                     type        : 'label',
  //                     keyword     : 'none',
  //                     label       : '&Aring;',
  //                     position    : [1,6,1,1]
  //                   },
  //             TRUNCATE_SEL : {
  //                     type     : 'combobox',
  //                     keyword  : 'truncate',
  //                     label    : 'Truncate initial map:',
  //                     tooltip  : 'Select Yes to truncate initial map, so that the density ' +
  //                                'values fall between -1.0*RMSMAP and 20.0*RMSMAP',
  //                     range    : ['0|No', '1|Yes'],
  //                     value    : '0',
  //                     // iwidth   : 100,
  //                     position : [2,0,1,3]
  //                   },
  //             HISTOGRAM_SEL : {
  //                     type     : 'combobox',
  //                     keyword  : 'hist',
  //                     label    : 'Apply histogram mapping:',
  //                     tooltip  : 'Select Yes to apply HISTOGRAM MAPPING to the omit map, ' +
  //                                'so that the histogram of densities of the omit map equals ' +
  //                                'that of the starting map',
  //                     range    : ['0|No', '1|Yes'],
  //                     value    : '0',
  //                     // iwidth   : 100,
  //                     position : [3,0,1,3]
  //                   },
  //             DST_LIM : {
  //                     type        : 'real_',
  //                     keyword     : 'dst_lim',
  //                     label       : 'Distance limit',
  //                     tooltip     : 'Points in the electron density map within &lt;dstlmt&gt; of ' +
  //                                   'a symmetry related grid point are set to -RMS density value ' +
  //                                   'of the map. Set &lt;dstlmt&gt; = 0.0 for no modification of ' +
  //                                   'input map; 3.0-3.5 Angstrom seems a good value otherwise.',
  //                     range       : [0.0,10.0],
  //                     value       : '',
  //                     placeholder : '3.0',
  //                     iwidth      : 40,
  //                     position    : [4,0,1,1]
  //                   },
  //             GRID : {
  //                     type        : 'string_',
  //                     keyword     : 'grid',
  //                     label       : 'Number of sampling points',
  //                     tooltip     : 'Number of map\'s samplin points in X, Y and Z.',
  //                     // range       : ['*','*'],
  //                     value       : '',
  //                     placeholder : 'nx ny nz',
  //                     iwidth      : 150,
  //                     position    : [5,0,1,4]
  //                   },
  //             FORMAT_SEL : {
  //                     type     : 'combobox',
  //                     keyword  : 'format',
  //                     label    : 'Output format',
  //                     tooltip  : 'Note that maps in non-CCP4 format will not be available ' +
  //                                'for visual inspection',
  //                     range    : ['CCP4|CCP4', 'MFF|Groningen Master Fourier File format'],
  //                     value    : 'CCP4',
  //                     // iwidth   : 100,
  //                     position : [6,0,1,9]
  //                   }
  //           }
  
  //         }
  // };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskAnoMap.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAnoMap.prototype = Object.create ( TaskTemplate.prototype );
TaskAnoMap.prototype.constructor = TaskAnoMap;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAnoMap.prototype.icon           = function()  { return 'task_anomap'; }
TaskAnoMap.prototype.clipboard_name = function()  { return '"Ano Map"';   }

TaskAnoMap.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskAnoMap.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['omit','map'] );
}

TaskAnoMap.prototype.cleanJobDir = function ( keywords )  {}

if (!__template)  {
  // client side

  TaskAnoMap.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'calculates anomalous maps';
  }


  // TaskAnoMap.prototype.collectInput = function ( inputPanel )  {

  //   let msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

  //   let sfo = this.parameters.sec1.contains.SCALE_FOBS.value.trim();
  //   let sfc = this.parameters.sec1.contains.SCALE_FC.value.trim();
  //   if ((sfo && (!sfc)) || ((!sfo) && sfc))
  //     msg += '|<b><i>Scaling factors: both values must be given or leave blank</i></b>';

  //   let res_min = this.parameters.sec1.contains.RES_MIN.value.trim();
  //   let res_max = this.parameters.sec1.contains.RES_MAX.value.trim();
  //   if ((res_min && (!res_max)) || ((!res_min) && res_max))
  //     msg += '|<b><i>Resolution range: both values must be given or leave blank</i></b>';

  //   let grid = this.parameters.sec1.contains.GRID.value.trim();
  //   if (grid)  {
  //     let lst = grid.split(' ').filter(Boolean);
  //     if (lst.length!=3)
  //       msg += '|<b><i>Number of sampling points: 3 integer values must be given or leave blank</i></b>';
  //     else if ((!isInteger(lst[0])) || (!isInteger(lst[1])) || (!isInteger(lst[2])))
  //       msg += '|<b><i>Number of sampling points: wrong integer format</i></b>';
  //   }

  //   return msg;

  // }

} else  {
  // server side

  const conf = require('../../js-server/server.configuration');

  TaskAnoMap.prototype.makeInputData = function ( loginData,jobDir )  {

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      if (revision.Substructure)
        this.input_data.data['isubstruct'] = [revision.Substructure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskAnoMap.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.anomap', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAnoMap = TaskAnoMap;

}
