
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.omitmap.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev 2023-2024
 *
 *  =================================================================
 *
 */

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================
function TaskOmitMap()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskOmitMap';
  this.name   = 'omitmap';
  this.oname  = 'omitmap'; // asterisk means do not use (XYZ name will be used)
  this.title  = 'Calculate omit map';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['!phases','!xyz','~mmcif_only'] },  // data type(s) and subtype(s)
    label       : 'Structure revision', // label for input dialog
    inputId     : 'revision',   // input Id for referencing input fields
    min         : 1,            // minimum acceptable number of data instances
    max         : 1             // maximum acceptable number of data instances
  }];

  this.parameters = { // input parameters
    SPACER : {
             type     : 'label',
             keyword  : 'none',
             label    : '&nbsp;',
             position : [0,0,1,5]
           },
    sec1 : { type     : 'section',
            title    : 'Parameters',
            open     : true,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {
              SCALE_FOBS : {
                      type        : 'real_',
                      keyword     : 'scale_fobs',
                      label       : 'Calculate omit map&nbsp;&nbsp;&nbsp;',
                      tooltip     : 'Specify scale factors for observed and calculated intensities.',
                      range       : [-100.0,100.0],
                      value       : '',
                      placeholder : '2.0',
                      iwidth      : 40,
                      position    : [0,0,1,1]
                    },
              SCALE_FC : {
                      type        : 'real_',
                      keyword     : 'scale_fc',
                      label       : '&times; Fobs&nbsp;&nbsp;&nbsp;&nbsp;+',
                      tooltip     : 'Specify scale factors for observed and calculated intensities.',
                      range       : [-100.0,100.0],
                      value       : '',
                      placeholder : '-1.0',
                      iwidth      : 40,
                      position    : [0,3,1,1]
                    },
              SCALE_LBL : {
                      type        : 'label',
                      keyword     : 'none',
                      label       : '&times; Fcalc',
                      position    : [0,6,1,1]
                    },
              STRETCHER_LBL : {
                      type        : 'label',
                      keyword     : 'none',
                      label       : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ',
                      lwidth      : '90%',
                      position    : [0,7,1,1]
                    },
              RES_MIN : {
                      type        : 'real_',
                      keyword     : 'res_min',
                      label       : 'In resolution range from',
                      tooltip     : 'Specify minimum and maximum resolutions or leave ' +
                                    'blank for using the whole range.',
                      range       : [0.1,10.0],
                      value       : '',
                      placeholder : 'auto',
                      iwidth      : 40,
                      position    : [1,0,1,1]
                    },
              RES_MAX : {
                      type        : 'real_',
                      keyword     : 'res_max',
                      label       : '&Aring;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;to',
                      tooltip     : 'Specify minimum and maximum resolutions or leave ' +
                                    'blank for using the whole range.',
                      range       : [0.1,10.0],
                      value       : '',
                      placeholder : 'auto',
                      iwidth      : 40,
                      position    : [1,3,1,1]
                    },
              RES_LBL : {
                      type        : 'label',
                      keyword     : 'none',
                      label       : '&Aring;',
                      position    : [1,6,1,1]
                    },
              TRUNCATE_SEL : {
                      type     : 'combobox',
                      keyword  : 'truncate',
                      label    : 'Truncate initial map:',
                      tooltip  : 'Select Yes to truncate initial map, so that the density ' +
                                 'values fall between -1.0*RMSMAP and 20.0*RMSMAP',
                      range    : ['0|No', '1|Yes'],
                      value    : '0',
                      // iwidth   : 100,
                      position : [2,0,1,3]
                    },
              HISTOGRAM_SEL : {
                      type     : 'combobox',
                      keyword  : 'hist',
                      label    : 'Apply histogram mapping:',
                      tooltip  : 'Select Yes to apply HISTOGRAM MAPPING to the omit map, ' +
                                 'so that the histogram of densities of the omit map equals ' +
                                 'that of the starting map',
                      range    : ['0|No', '1|Yes'],
                      value    : '0',
                      // iwidth   : 100,
                      position : [3,0,1,3]
                    },
              DST_LIM : {
                      type        : 'real_',
                      keyword     : 'dst_lim',
                      label       : 'Distance limit',
                      tooltip     : 'Points in the electron density map within &lt;dstlmt&gt; of ' +
                                    'a symmetry related grid point are set to -RMS density value ' +
                                    'of the map. Set &lt;dstlmt&gt; = 0.0 for no modification of ' +
                                    'input map; 3.0-3.5 Angstrom seems a good value otherwise.',
                      range       : [0.0,10.0],
                      value       : '',
                      placeholder : '3.0',
                      iwidth      : 40,
                      position    : [4,0,1,1]
                    },
              GRID : {
                      type        : 'string_',
                      keyword     : 'grid',
                      label       : 'Number of sampling points',
                      tooltip     : 'Number of map\'s samplin points in X, Y and Z.',
                      // range       : ['*','*'],
                      value       : '',
                      placeholder : 'nx ny nz',
                      iwidth      : 150,
                      position    : [5,0,1,4]
                    },
              FORMAT_SEL : {
                      type     : 'combobox',
                      keyword  : 'format',
                      label    : 'Output format',
                      tooltip  : 'Note that maps in non-CCP4 format will not be available ' +
                                 'for visual inspection',
                      range    : ['CCP4|CCP4', 'MFF|Groningen Master Fourier File format'],
                      value    : 'CCP4',
                      // iwidth   : 100,
                      position : [6,0,1,9]
                    }
            }
  
          }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskOmitMap',TaskOmitMap,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskOmitMap',TaskOmitMap,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskOmitMap.prototype.icon           = function()  { return 'task_omitmap'; }
TaskOmitMap.prototype.clipboard_name = function()  { return '"Omit Map"';   }

TaskOmitMap.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskOmitMap.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['omit','map'] );
}

if (!__template)  {
  // client side

  TaskOmitMap.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'calculates omit-maps';
  }

  TaskOmitMap.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var sfo = this.parameters.sec1.contains.SCALE_FOBS.value.trim();
    var sfc = this.parameters.sec1.contains.SCALE_FC.value.trim();
    if ((sfo && (!sfc)) || ((!sfo) && sfc))
      msg += '|<b><i>Scaling factors: both values must be given or leave blank</i></b>';

    var res_min = this.parameters.sec1.contains.RES_MIN.value.trim();
    var res_max = this.parameters.sec1.contains.RES_MAX.value.trim();
    if ((res_min && (!res_max)) || ((!res_min) && res_max))
      msg += '|<b><i>Resolution range: both values must be given or leave blank</i></b>';

    var grid = this.parameters.sec1.contains.GRID.value.trim();
    if (grid)  {
      let lst = grid.split(' ').filter(Boolean);
      if (lst.length!=3)
        msg += '|<b><i>Number of sampling points: 3 integer values must be given or leave blank</i></b>';
      else if ((!isInteger(lst[0])) || (!isInteger(lst[1])) || (!isInteger(lst[2])))
        msg += '|<b><i>Number of sampling points: wrong integer format</i></b>';
    }

    return msg;

  }

} else  {
  // server side

  var conf = require('../../js-server/server.configuration');

  TaskOmitMap.prototype.makeInputData = function ( loginData,jobDir )  {

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
      if (revision.Substructure)
        this.input_data.data['isubstruct'] = [revision.Substructure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskOmitMap.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.omitmap', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskOmitMap = TaskOmitMap;

}
