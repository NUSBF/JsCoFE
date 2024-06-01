
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phaserep.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Phaser-EP Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskPhaserEP()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPhaserEP';
  this.name    = 'phaser EP';
  this.setOName ( 'phaser-ep' );  // default output file name template
  this.title   = 'Experimental Phasing with Phaser-EP';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!anomalous','!asu','~mmcif_only',
                                     ['xyz','substructure']]},
                                              // data type(s) and subtype(s)
                                              // '!' means "mandatory"
                                              // [] means one or both mandatory
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision',  // input Id for referencing input fields
      customInput : 'phaser-ep', // lay custom fields next to the selection
                                 // dropdown for 'native' dataset
      version     : 7,           // minimum data version allowed
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    /*
    },{
      data_type   : {'DataStructure':['!substructure']}, // data type(s) and subtype(s)
      label       : 'Anomalous scatterers', // label for input dialog
      inputId     : 'substructure',   // input Id for referencing input fields
      force       : 1,           // will display [do not use] by default
      min         : 0,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['!xyz']}, // data type(s) and subtype(s)
      label       : 'Initial phases from', // label for input dialog
      inputId     : 'xmodel',    // input Id for referencing input fields
      customInput : 'phaser-ep', // lay custom fields below the dropdown
      version     : 0,           // minimum data version allowed
      force       : 1,           // meaning choose, by default, 1 structure if
                                 // available; otherwise, 0 (do not use) will
                                 // be selected
      min         : 0,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      // enforce having at least 1 Structure in the branch
      data_type   : {'DataStructure':[]}, // data type(s) and subtype(s)
      label       : '',         // label for input dialog
      inputId     : 'void1',    // void input Id for not showing the item
      min         : 1,          // minimum acceptable number of data instances
      max         : 100000      // maximum acceptable number of data instances
      */
    }
  ];

  this.parameters = { // input parameters
    SEP0_LABEL : {
          type     : 'label',  // just a separator
          label    : '&nbsp;',
          position : [0,0,1,5]
        },
    sec1: { type     : 'section',
            title    : 'Main options',
            open     : true,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {
              LLG_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'LLG',
                    label    : 'LLG map completion',
                    tooltip  : 'Choose LLG map completion mode',
                    iwidth   : 250,      // width of input field in px
                    range    : ['ON|on: all atom types',
                                'OFF|off',
                                'SEL|on: selected atom types'
                               ],
                    value    : 'SEL',
                    position : [0,0,1,3]
                  },
              LLG_REAL_CBX : {
                    type      : 'checkbox',
                    label     : 'complete with purely real scatterers',
                    tooltip   : 'Check to complete LLG map with purely real scatterers.',
                    iwidth    : 350,
                    value     : false,
                    position  : [1,2,1,3],
                    showon    : {LLG_SEL:['SEL']}  // from this and input data section
                  },
              LLG_ANOM_CBX : {
                    type      : 'checkbox',
                    label     : 'complete with purely anomalous scatterers',
                    tooltip   : 'Check to complete LLG map with purely real scatterers.',
                    iwidth    : 350,
                    value     : false,
                    position  : [2,2,1,3],
                    showon    : {LLG_SEL:['SEL']}  // from this and input data section
                  },
              LLG_ATYPE : {
                    type      : 'string_',   // empty string allowed
                    keyword   : 'atomtype=',
                    label     : 'complete with atom type(s)',
                    tooltip   : 'Give a comma-separated list of atom types to ' +
                                'be used to complete the LLG map.',
                    iwidth    : 160,
                    value     : '',
                    //emitting  : true,    // will emit 'onchange' signal
                    //maxlength : 2,       // maximum input length
                    position  : [3,2,1,1],
                    showon    : {LLG_SEL:['SEL']}  // from this and input data section
                  }
            }
          },

    sec2: { type     : 'section',
            title    : 'Accessory parameters',
            open     : false,  // true for the section to be initially open
            position : [2,0,1,5],
            contains : {
              RESTRAIN_F11_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'RESTRAIN_F11',
                    label    : 'Restrain f" to starting value',
                    tooltip  : 'Choose f" restrain mode',
                    iwidth   : 80,      // width of input field in px
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [0,0,1,1]
                  },
              RESTRAIN_F11_SIGMA : {
                    type     : 'real',    // '_' means blank value is allowed
                    keyword  : 'RESTRAIN_F11_SIGMA', // the real keyword for job input stream
                    label    : '&nbsp;&nbsp;&nbsp;Sigma of restraint',
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.2',     // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 1, or leave ' +
                               'blank for automatic choice',
                    range    : [0.001,1], // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.2',     // value to be paired with the keyword
                    label2   : '(times initial f")',
                    position : [0,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {RESTRAIN_F11_SEL:['ON']}
                  },
              LLG_MAP_SIGMA : {
                    type     : 'real',    // '_' means blank value is allowed
                    keyword  : 'LLG_MAP_SIGMA', // the real keyword for job input stream
                    label    : 'LLG map sigma cut-off for adding new atom sites',
                    iwidth   : 50,
                    default  : '6.0',     // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 100, or leave ' +
                               'blank for automatic choice',
                    range    : [0.001,100], // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '6.0',     // value to be paired with the keyword
                    position : [1,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              LLG_MAP_DIST_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'LLG_MAP_DIST_SEL',
                    label    : 'LLG map inter-atom distance cut-off default',
                    tooltip  : 'Choose inter-atom distance cut-off mode',
                    iwidth   : 80,      // width of input field in px
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [2,0,1,1]
                  },
              LLG_MAP_DIST : {
                    type     : 'real',    // '_' means blank value is allowed
                    keyword  : 'LLG_MAP_DIST', // the real keyword for job input stream
                    label    : '&nbsp;&nbsp;&nbsp;distance',
                    align    : 'right',
                    iwidth   : 50,
                    default  : '2.0',     // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 100, or leave ' +
                               'blank for automatic choice',
                    range    : [0.001,100], // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '2.0',     // value to be paired with the keyword
                    position : [2,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {LLG_MAP_DIST_SEL:['OFF']}
                  },
              LLG_NCYCLES : {
                    type     : 'integer',  // '_' means blank value is allowed
                    keyword  : 'LLG_NCYCLES', // the real keyword for job input stream
                    label    : 'Maximum number of LLG-map completion cycles',
                    iwidth   : 50,
                    default  : '50',         // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 200, or leave ' +
                               'blank for automatic choice',
                    range    : [1,200],   // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '50',      // value to be paired with the keyword
                    position : [3,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              LLG_MAP_PEAKS_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'LLG_MAP_PEAKS_SEL',
                    label    : 'LLG-map completion picks peaks from',
                    tooltip  : 'Choose the source of peaks',
                    iwidth   : 240,      // width of input field in px
                    range    : ['ATOMTYPE|all atom type LLG-maps',
                                'IMAGINARY|imaginary LLG-map only'
                               ],
                    value    : 'ATOMTYPE',
                    position : [4,0,1,3]
                  }
            }
          },

    sec3: { type     : 'section',
            title    : 'Expert parameters',
            open     : false,  // true for the section to be initially open
            position : [3,0,1,5],
            contains : {
              WILSON_BFACTOR_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'WILSON_BFACTOR_SEL',
                    label    : 'Set B-factors to Wilson B-factor',
                    tooltip  : 'Choose the B-factors treatment mode',
                    iwidth   : 80,      // width of input field in px
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [0,0,1,1]
                  }
            }
          }

  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskPhaserEP.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPhaserEP.prototype = Object.create ( TaskTemplate.prototype );
TaskPhaserEP.prototype.constructor = TaskPhaserEP;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskPhaserEP.prototype.icon           = function()  { return 'task_phaserep'; }
TaskPhaserEP.prototype.clipboard_name = function()  { return '"Phaser-EP"';   }

TaskPhaserEP.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'perform EP using a defined ASU and heavy-atom substructure';
}

TaskPhaserEP.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function PhaserEPHotButton()  {
  return {
    'task_name' : 'TaskPhaserEP',
    'tooltip'   : 'Calculate Experimental Phases with Phaser-EP'
  };
}

TaskPhaserEP.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['phaser', 'experimental', 'phasing', 'auto-ep', 'ep', 'substructure'] );
}

if (!__template)  {
  //  for client side

  TaskPhaserEP.prototype.getHelpURL = function()  {
    return __task_reference_base_url + 'doc.task.Phaser.html';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskPhaserEP.prototype.hotButtons = function() {
    return [ParrotHotButton(),AcornHotButton(),ShelxEMRHotButton(),CCP4BuildHotButton()];
  }

  TaskPhaserEP.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if ((emitterId=='revision') || (emitterId=='substructure') || (emitterId=='xmodel')) {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var revision   = this.getInputItem ( inpDataRef,'revision'     ).dropdown[0];
      var dt         = revision.dt[revision.getValue()];
      var substr     = this.getInputItem ( inpDataRef,'substructure' );
      //var xmodel     = this.getInputItem ( inpDataRef,'xmodel'       );

      //console.log ( JSON.stringify(dt) );
      var main_substructure = (dt.subtype.indexOf('substructure')>=0);
      var main_xyz          = (dt.subtype.indexOf('xyz')>=0);

      var name = this.name;

      var llg_atype = inpParamRef.parameters['LLG_ATYPE'].input;
      if (!llg_atype.getValue())
        llg_atype.setValue ( dt.ASU.ha_type );

      if (substr)  {
        substr = substr.dropdown[0];
        inpParamRef.grid.setRowVisible ( substr.row,!main_substructure );
      }
      /*
      if (xmodel)  {
        xmodel = xmodel.dropdown[0];
        inpParamRef.grid.setRowVisible ( xmodel.row  ,!main_xyz );
        inpParamRef.grid.setRowVisible ( xmodel.row+1,!main_xyz );
        this.title = makeSuffix ( this.title,'MR-SAD' );
        this.name  = makeSuffix ( this.name ,'MR-SAD' );
      */
      if (main_xyz)  {
        this.title = makeSuffix ( this.title,'MR-SAD' );
        this.name  = makeSuffix ( this.name ,'MR-SAD' );
      } else  {
        this.title = makeSuffix ( this.title,'SAD' );
        this.name  = makeSuffix ( this.name ,'SAD' );
      }

      if (this.name!=name)  {
        var inputPanel = inpParamRef.grid.parent.parent;
        inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
        inputPanel.header.uname_inp.setStyle ( 'text','',
                              this.name.replace(/<(?:.|\n)*?>/gm, '') );
        this.updateInputPanel ( inputPanel );
        inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                job_dialog_reason.rename_node );
      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }

  TaskPhaserEP.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    function addMessage ( label,message )  {
      input_msg += '|<b>' + label + ':</b> ' + message;
    }

    var sec1 = this.parameters.sec1.contains;
    if ((sec1.LLG_SEL.value=='SEL') && (!sec1.LLG_REAL_CBX.value)  &&
        (!sec1.LLG_ANOM_CBX.value)  && (sec1.LLG_ATYPE.value.trim()==''))
          addMessage ( sec1.LLG_SEL.label,
               'Value of ' + sec1.LLG_SEL.label +
               ' in "<i>' + this.parameters.sec1.title + '</i>" does not ' +
               'specify any atom types to complete the map, which is not ' +
               'allowed' );

    return input_msg;

  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskPhaserEP.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Options.phasing_sel=='substructure')
            this.input_data.data['substructure'] = [revision.Substructure];
      else  this.input_data.data['xmodel'] = [revision.Structure];
      /*
      if (revision.subtype.indexOf('substructure')>=0)
        this.input_data.data['substructure'] = [revision.Substructure];
      else if (revision.subtype.indexOf('xyz')>=0)
        this.input_data.data['xmodel'] = [revision.Structure];
      */
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

//  TaskPhaserEP.prototype.cleanJobDir = function ( jobDir )  {}


  TaskPhaserEP.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.phaserep', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPhaserEP = TaskPhaserEP;

}
