
/*
 *  ==========================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.ccp4buildmr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CCP4Build Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
 *
 *  ==========================================================================
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

function TaskCCP4Build()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCCP4Build';
  this.name    = 'ccp4build';
  this.setOName ( 'ccp4build' );  // default output file name template
  this.title   = 'Automatic Model Building with CCP4Build';

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['!protein','!seq','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',   // label for input dialog
      inputId     : 'revision',   // input Id for referencing input fields
      customInput : 'ccp4build',  // lay custom fields below the dropdown
      version     : 7,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Main options',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                NCYCLES_MIN : {
                      type     : 'integer',
                      keyword  : 'cycles_min',
                      label    : 'Minimum number of building cycles',
                      tooltip  : 'Choose a value between 1 and 50',
                      range    : [1,50],
                      value    : '3',
                      position : [0,0,1,1]
                    },
                NCYCLES_MAX : {
                      type     : 'integer',
                      keyword  : 'cycles_max',
                      label    : 'Maximum number of build cycles',
                      tooltip  : 'Choose a value between 1 and 50 and not less ' +
                                 'than the minimum number of cycles',
                      range    : [1,50],
                      value    : '8',
                      position : [1,0,1,1]
                    },
                NOIMPROVE_CYCLES : {
                      type     : 'integer',
                      keyword  : 'cycles',
                      label    : 'Stop if results do not improve during',
                      tooltip  : 'Choose a value between 1 and 50',
                      range    : [1,50],
                      value    : '4',
                      label2   : 'consequitive cycles',
                      position : [2,0,1,1]
                    },
                ANISO_CBX : {
                      type     : 'checkbox',
                      label    : 'Apply anisotropy correction to input data',
                      keyword  : 'ccp4build-anisotropy-correction',
                      tooltip  : 'Check to apply anisotropy correction to input data',
                      value    : true,
                      position : [3,0,1,3]
                    },
                SELEN_CBX : {
                      type     : 'checkbox',
                      label    : 'Build Selenomethionine (MSE instead of MET)',
                      keyword  : 'ccp4build-build-semet',
                      tooltip  : 'Check to build selenomethionine',
                      value    : false,
                      position : [4,0,1,3]
                    },
                WATER_CBX : {
                      type     : 'checkbox',
                      label    : 'Model solvent for phase improvement',
                      keyword  : 'ccp4build-build-semet',
                      tooltip  : 'Check to model water molecules in course of ' +
                                 'building. This may or may not improve performance ' +
                                 'depending on data properties.',
                      value    : false,
                      position : [5,0,1,3]
                    },
                TRIM_WAT_RFREE : {
                      type     : 'real',
                      keyword  : 'trim_wat_rfree',
                      label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if R<sub>free</sub> is below',
                      tooltip  : 'Water modelling will be used only at Rfree ' +
                                 'lower than the specified.',
                      range    : [0.0,1.0],
                      value    : '0.33',
                      placeholder : '0.33',
                      position : [5,2,1,1],
                      showon   : {'WATER_CBX':[true]}
                    }
             }
    },

    sec2 : { type     : 'section',
             title    : 'Advanced Build Parameters',
             open     : false,  // true for the section to be initially open
             position : [1,0,1,5],
             contains : {

                REFLEVEL_SEL : {
                      type     : 'combobox',
                      keyword  : 'ref_level',
                      label    : 'Refinement level:',
                      tooltip  : 'Refinement level, "normal" recommended.',
                      range    : ['1|light (fast)',
                                  '2|normal (intermediate)',
                                  '3|laborious (slow)'
                                  ],
                      value    : '2',
                      position : [0,0,1,10]
                    },

                DMMODE_SEL : {
                      type     : 'combobox',
                      keyword  : 'dm_mode',
                      label    : 'Perform density modification:',
                      tooltip  : 'Density modification mode, "as required" recommended.',
                      range    : ['auto|as required',
                                  'always|always',
                                  'never|never'
                                  ],
                      value    : 'auto',
                      position : [1,0,1,10]
                    },

                FILLMODE_SEL : {
                      type     : 'combobox',
                      keyword  : 'fill_mode',
                      label    : 'Reconstruct side chains:',
                      tooltip  : 'Side chains reconstruction mode, "as required" recommended.',
                      range    : ['auto|as required',
                                  'always|always',
                                  'never|never'
                                  ],
                      value    : 'never',
                      position : [2,0,1,10]
                    },

                FITMODE_SEL : {
                      type     : 'combobox',
                      keyword  : 'fit_mode',
                      label    : 'Fit protein with Coot:',
                      tooltip  : 'Fit protein mode, "as required" recommended.',
                      range    : ['auto|as required',
                                  'always|always',
                                  'never|never'
                                  ],
                      value    : 'auto',
                      position : [3,0,1,10]
                    },

                RSRMODE_SEL : {
                      type     : 'combobox',
                      keyword  : 'fit_mode',
                      label    : 'Perform Real Space Refinement:',
                      tooltip  : 'Real Space Refinement mode, "as required" recommended.',
                      range    : ['auto|as required',
                                  'always|always',
                                  'never|never'
                                  ],
                      value    : 'never',
                      position : [4,0,1,10]
                    },

                TRIMMODE_SEL : {
                      type     : 'combobox',
                      keyword  : 'trimmode',
                      label    : 'Trim built models: ',
                      tooltip  : 'Protein trimming mode',
                      range    : ['never|never',
                                  'auto|automatically',
                                  'restricted|within restrictions',
                                  'fixed|fixed cut-offs'
                                  ],
                      value    : 'never',
                      position : [5,0,1,10]
                    },

                TRIMMIN_ZDM : {
                      type     : 'real',
                      keyword  : 'trimmin_zdm',
                      label    : 'Trim mainchains with ZEDCC varying from',
                      tooltip  : 'Minimum Electron Density Z-score threshold for ' +
                                 'trimming mainchains -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '1.8',
                      placeholder : '1.8',
                      position : [6,0,1,1],
                      showon   : {'TRIMMODE_SEL':['restricted']}
                    },
                TRIMMAX_ZDM : {
                      type     : 'real',
                      keyword  : 'trimmax_zdm',
                      label    : 'to',
                      tooltip  : 'Maximum Electron Density Z-score threshold for ' +
                                 'trimming mainchains -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '3.2',
                      placeholder : '3.2',
                      position : [6,4,1,1],
                      showon   : {'TRIMMODE_SEL':['restricted']}
                    },

                TRIMMIN_ZDS : {
                      type     : 'real',
                      keyword  : 'trimmin_zds',
                      label    : 'Trim sidechains with ZEDCC varying from',
                      tooltip  : 'Minimum Electron Density Z-score threshold for ' +
                                 'trimming sidechains -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '1.8',
                      placeholder : '1.8',
                      position : [7,0,1,1],
                      showon   : {'TRIMMODE_SEL':['restricted']}
                    },
                TRIMMAX_ZDS : {
                      type     : 'real',
                      keyword  : 'trimmax_zds',
                      label    : 'to',
                      tooltip  : 'Maximum Electron Density Z-score threshold for ' +
                                 'trimming sidechains -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '3.2',
                      placeholder : '3.2',
                      position : [7,4,1,1],
                      showon   : {'TRIMMODE_SEL':['restricted']}
                    },

                TRIM_ZDM : {
                      type     : 'real',
                      keyword  : 'trim_zdm',
                      label    : 'ZEDCC cut-off for trimming mainchains',
                      tooltip  : 'Electron Density Z-score cut-off for ' +
                                 'trimming mainchains.',
                      range    : [0.0,'*'],
                      value    : '2.5',
                      placeholder : '2.5',
                      position : [8,0,1,1],
                      showon   : {'TRIMMODE_SEL':['fixed']}
                    },
                TRIM_ZDS : {
                      type     : 'real',
                      keyword  : 'trim_zds',
                      label    : 'ZEDCC cut-off for trimming sidechains',
                      tooltip  : 'Electron Density Z-score cut-off for ' +
                                 'trimming sidechains.',
                      range    : [0.0,'*'],
                      value    : '2.5',
                      placeholder : '2.5',
                      position : [9,0,1,1],
                      showon   : {'TRIMMODE_SEL':['fixed']}
                    },

                TRIMMODE_W_SEL : {
                      type     : 'combobox',
                      keyword  : 'trimmode_w',
                      label    : 'Trim placed waters: ',
                      tooltip  : 'Water trimming mode',
                      range    : ['never|never',
                                  'auto|automatically',
                                  'restricted|within restrictions',
                                  'fixed|fixed cut-offs'
                                  ],
                       value    : 'restricted',
                       position : [10,0,1,10],
                       showon   : {'WATER_CBX':[true]}
                     },
                TRIMMIN_ZDW : {
                      type     : 'real',
                      keyword  : 'trimmin_zdw',
                      label    : 'Trim waters with ZEDCC varying from',
                      tooltip  : 'Minimum Electron Density Z-score threshold for ' +
                                 'trimming waters -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '1.5',
                      placeholder : '1.5',
                      position : [11,0,1,1],
                      showon   : {_:'&&','WATER_CBX':[true],'TRIMMODE_W_SEL':['restricted']}
                    },
                TRIMMAX_ZDW : {
                      type     : 'real',
                      keyword  : 'trimmax_zdw',
                      label    : 'to',
                      tooltip  : 'Maximum Electron Density Z-score threshold for ' +
                                 'trimming waters -- exact value will be ' +
                                 'chosen automatically',
                      range    : [0.0,'*'],
                      value    : '2.0',
                      placeholder : '2.0',
                      position : [11,4,1,1],
                      showon   : {_:'&&','WATER_CBX':[true],'TRIMMODE_W_SEL':['restricted']}
                    },
                TRIM_ZDW : {
                      type     : 'real',
                      keyword  : 'trim_zdw',
                      label    : 'ZEDCC cut-off for trimming waters',
                      tooltip  : 'Electron Density Z-score cut-off for ' +
                                 'trimming waters.',
                      range    : [0.0,'*'],
                      value    : '11.8',
                      placeholder : '1.8',
                      position : [12,0,1,1],
                      showon   : {_:'&&','WATER_CBX':[true],'TRIMMODE_W_SEL':['fixed']}
                    }

             }
           },

    sec3 : { type     : 'section',
             title    : 'Advanced Refinement Parameters',
             open     : false,  // true for the section to be initially open
             position : [2,0,1,5],
             contains : {

                EXPERIMENT : {
                      type     : 'combobox',
                      keyword  : 'none',
                      label    : 'Diffraction experiment type',
                      tooltip  : 'Diffraction experiment type',
                      range    : ['xray|X-ray',
                                  'electron|Electron',
                                  'neutron|Neutron'
                                 ],
                      value    : 'xray',
                      position : [0,0,1,1]
                    },
                FORM_FACTOR : {
                      type     : 'combobox',
                      keyword  : 'none',
                      label    : 'form factor calculation method',
                      tooltip  : 'Electron form factor calculation method',
                      range    : ['gaussian|Sum of Gaussians',
                                  'mb|Mott-Bethe'
                                 ],
                      value    : 'gaussian',
                      showon   : {'EXPERIMENT':['electron']},
                      position : [0,5,1,1]
                    }

            }
          }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskCCP4Build',TaskCCP4Build,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskCCP4Build',TaskCCP4Build,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskCCP4Build.prototype.icon           = function()  { return 'task_ccp4build'; }
TaskCCP4Build.prototype.clipboard_name = function()  { return '"CCP4Build"';    }

// TaskCCP4Build.prototype.desc_title = function()  {
//   return 'Automatic model building after MR or Experimental Phasing';
// }

TaskCCP4Build.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'automatic model building of polypeptides with a combination of several CCP4 programs';
  };

TaskCCP4Build.prototype.canEndGracefully = function() { return true; }

TaskCCP4Build.prototype.currentVersion = function()  {
  let version = 6;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskCCP4Build.prototype.platforms = function()  { return 'LMU'; }  // UNIX only


// hotButtons return list of buttons added in JobDialog's toolBar.
function CCP4BuildHotButton()  {
  return {
    'task_name' : 'TaskCCP4Build',
    'tooltip'   : 'Automated model building with CCP4Build'
  };
}

TaskCCP4Build.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['ccp4build','model', 'building', 'auto-mb'] );
  }

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskCCP4Build.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

  TaskCCP4Build.prototype.collectInput = function ( inputPanel )  {

    function addMessage ( label,message )  {
      input_msg += '|<b>' + label + ':</b> ' + message;
    }

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (this.parameters.sec1.contains.NCYCLES_MAX.value <
        this.parameters.sec1.contains.NCYCLES_MIN.value)
      addMessage ( "Maximum number of cycles",
                   "cannot be less than the minimum number of cycles" );

    if (this.parameters.sec2.contains.TRIMMODE_SEL.value=='restricted')  {
      if (this.parameters.sec2.contains.TRIMMAX_ZDM.value <
          this.parameters.sec2.contains.TRIMMIN_ZDM.value)
        addMessage ( "Trim restrictions for mainchains",
                     "maximum ZEDCC is less than minimum ZEDCC" );
      if (this.parameters.sec2.contains.TRIMMAX_ZDS.value <
          this.parameters.sec2.contains.TRIMMIN_ZDS.value)
        addMessage ( "Trim restrictions for sidechains",
                     "maximum ZEDCC is less than minimum ZEDCC" );
    }

    return input_msg;

  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskCCP4Build.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Options.leading_structure=='substructure')
            this.input_data.data['istruct'] = [revision.Substructure];
      else  this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskCCP4Build.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ccp4build_task', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCCP4Build = TaskCCP4Build;

}
