
/*
 *  =================================================================
 *
 *    07.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.crossec.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CrosSec Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCrosSec()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskCrosSec';
  this.name      = 'x-ray cross sections';
  this.oname     = '*';
  this.title     = 'X-ray cross sections and anomalous scattering factors';
  this.fasttrack = true;  // enforces immediate execution

  this.parameters = { // input parameters

    UNITS_SEL : {
          type     : 'combobox',
          keyword  : 'UNITS',
          label    : '<b>Work units:</b>',
          tooltip  : 'Choose work units',
          range    : ['E|Photon energy (KeV)',
                      'W|Wavelength (&Aring;)'
                     ],
          value    : 'E',
          position : [0,0,1,4]
        },

    ATOM : {
          type      : 'string',   // empty string not allowed
          keyword   : 'ATOM',
          label     : '<b>Atom type:</b>',
          tooltip   : 'Chemical element symbol, e.g., Se',
          default   : 'Se',
          iwidth    : 40,
          value     : 'Se',
          emitting  : true,
          maxlength : 2,       // maximum input length
          position  : [1,0,1,1]
        },

    _label_P : {
          type      : 'label',
          label     : '&nbsp;<br><h3>A) Make scattering factors plot</h3>',
          position  : [2,0,1,5]
        },

    //WLENGTH_N : {
    NPOINTS_W : {
          type      : 'integer',   // empty string not allowed
          label     : '<i>using</i>',
          align     : 'right',
          tooltip   : 'Number of wavelength energy points',
          default   : '50',
          iwidth    : 40,
          value     : '50',
          position  : [3,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WLENGTH_MIN : {
          type      : 'real',   // empty string not allowed
          label     : '<i>wavelength points,&nbsp;&nbsp;&nbsp;&nbsp;starting from</i>',
          tooltip   : 'Minimal wavelength in angstrom',
          default   : '0.5',
          iwidth    : 40,
          value     : '0.5',
          position  : [3,4,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WLENGTH_MAX : {
          type      : 'real',   // empty string not allowed
          label     : '<i>&Aring;</i>,&nbsp;&nbsp;&nbsp;&nbsp;<i>to</i>',
          tooltip   : 'Maximal wavelength in angstrom',
          default   : '1.5',
          iwidth    : 40,
          value     : '1.5',
          position  : [3,7,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    _label_W : {
          type      : 'label',
          label     : '<i>&Aring;</i>',
          position  : [3,10,1,1],
          showon    : {UNITS_SEL:['W']}
        },

    NPOINTS_E : {
          type      : 'integer',   // empty string not allowed
          label     : '<i>using</i>',
          align     : 'right',
          tooltip   : 'Number of photon energy points',
          default   : '50',
          iwidth    : 40,
          value     : '50',
          position  : [3,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_MIN : {
          type      : 'real',   // empty string not allowed
          label     : '<i>photon energy points,&nbsp;&nbsp;&nbsp;&nbsp;starting from</i>',
          tooltip   : 'Minimal photon energy in KeV',
          default   : '8.0',
          iwidth    : 40,
          value     : '8.0',
          position  : [3,4,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_MAX : {
          type      : 'real',   // empty string not allowed
          label     : '<i>KeV<i>,&nbsp;&nbsp;&nbsp;&nbsp;<i>to</i>',
          tooltip   : 'Maximal photon energy in KeV',
          default   : '25.0',
          iwidth    : 40,
          value     : '25.0',
          position  : [3,7,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    _label_E : {
          type      : 'label',
          label     : '<i>KeV</i>',
          position  : [3,10,1,1],
          showon    : {UNITS_SEL:['E']}
        },

    _label_PW : {
          type      : 'label',
          label     : '&nbsp;<br><h3>B) Compute scattering factors for the ' +
                      'following selected wavelengths:</h3>',
          position  : [4,0,1,15],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_01 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>1</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [5,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_02 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>2</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [6,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_03 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>3</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [7,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_04 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>4</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [8,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_05 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>5</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [9,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },
    WAVELENGTH_06 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>W<sub>6</sub>:</i>',
          align     : 'right',
          tooltip   : 'Wavelength in angstrom',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>&Aring;</i>',
          align2    : 'left',
          position  : [10,0,1,1],
          showon    : {UNITS_SEL:['W']}
        },

    _label_PE : {
          type      : 'label',
          label     : '&nbsp;<br><h3>B) Compute scattering factors for the ' +
                      'following selected photon energies:</h3>',
          position  : [4,0,1,15],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_01 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>1</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [5,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_02 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>2</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [6,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_03 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>3</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [7,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_04 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>4</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [8,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_05 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>5</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [9,0,1,1],
          showon    : {UNITS_SEL:['E']}
        },
    ENERGY_06 : {
          type      : 'real_',   // empty string is allowed
          label     : '<i>E<sub>6</sub>:</i>',
          align     : 'right',
          tooltip   : 'Photon energy in KeV',
          default   : '',
          iwidth    : 40,
          value     : '',
          label2    : '<i>KeV</i>',
          align2    : 'left',
          position  : [10,0,1,1],
          showon    : {UNITS_SEL:['E']}
        }

  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskCrosSec.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCrosSec.prototype = Object.create ( TaskTemplate.prototype );
TaskCrosSec.prototype.constructor = TaskCrosSec;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCrosSec.prototype.icon           = function()  { return 'task_crossec';     }
TaskCrosSec.prototype.clipboard_name = function()  { return '"Cross-Sections"'; }

TaskCrosSec.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'interpolates X-ray cross sections and compute anomalous scattering factors';
};


TaskCrosSec.prototype.currentVersion = function()  {
let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


TaskCrosSec.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

  function makeSuffix ( title,suffix )  {
    return title.split(' (')[0] + ' (' + suffix + ')';
  }

  if (emitterId=='ATOM')  {

    let aname = checkElementSymbol ( emitterValue );
    if (!aname)
      aname = emitterValue;

    this.title = makeSuffix ( this.title,aname );
    this.name  = makeSuffix ( this.name ,aname );

    let inputPanel = inpParamRef.grid.parent.parent;
    inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
    let name = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
    inputPanel.header.uname_inp.setStyle ( 'text','',name );
    inputPanel.job_dialog.changeTitle ( name );
    this.updateInputPanel ( inputPanel );
    inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                            job_dialog_reason.rename_node );

  }

  TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

}


TaskCrosSec.prototype.updateInputPanel = function ( inputPanel )  {
  if (this.state==job_code.new)  {
    let event = new CustomEvent ( cofe_signals.jobDlgSignal,{
       'detail' : job_dialog_reason.rename_node
    });
    inputPanel.element.dispatchEvent(event);
  }
}


TaskCrosSec.prototype.collectInput = function ( inputPanel )  {

  let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  let sc = checkElementSymbol ( this.parameters.ATOM.value );
  if (!sc)  {
    input_msg += '|<b>Invalid atom type ' + this.parameters.ATOM.value + '</b>';
  } else
    this.parameters.ATOM.value = sc;

  return input_msg;

}


TaskCrosSec.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['crossec','x-ray', 'cross', 'section', 'anomalous', 'scattering', 'factors'] );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCrosSec.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.crossec', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCrosSec = TaskCrosSec;

}
