
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.refmac.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RefMac Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, R. Nicholls 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskRefmac()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskRefmac';
  this.name    = 'refmac5';
  this.oname   = 'refmac';  // default output file name template
  this.title   = 'Refinement with Refmac';
  this.helpURL = './html/jscofe_task_refmac.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['xyz']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'refmac',   // lay custom fields below the dropdown
      version     : 1,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataXYZ':['protein','dna','rna'] },  // data type(s) and subtype(s)
      label       : 'Homologous model',    // label for input dialog
      inputId     : 'hmodel',    // input Id for referencing input fields
      //customInput : 'chain-sel', // lay custom fields next to the selection
      min         : 0,           // minimum acceptable number of data instances
      max         : 10           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {
    sec1 : { type     : 'section',
             title    : 'Basic options',
             open     : true,
             position : [0,0,1,5],
             contains : {
                NCYC  : { type  : 'integer',
                   keyword  : 'none',
                   label    : 'Number of refinement cycles',
                   tooltip  : 'Number of refinement cycles',
                   range    : [0,'*'],
                   value    : '10',
                   position : [0,0,1,1]
                },
                WAUTO_YES : { type : 'combobox',
                   keyword  : 'none',
                   label    : 'Overall data-geometry weight',
                   tooltip  : 'Overall Data-geometry weight',
                   range    : ['yes|Auto','no|Fixed'],
                   value    : 'yes',
                   position : [1,0,1,1]
                },
                WAUTO_VAL : { type : 'real',
                   keyword  : 'none',
                   label    : 'value',
                   tooltip  : 'Weight for X-ray term',
                   range    : [0,'*'],
                   value    : '0.01',
                   showon   : {'WAUTO_YES':['no']},
                   position : [1,3,1,1]
                },
                WAUTO_VAL_AUTO : { type : 'real_',
                   keyword  : 'none',
                   label    : 'starting value',
                   tooltip  : 'Weight for X-ray term',
                   range    : [0,'*'],
                   value    : '',
                   default  : '',   // default cannot be a literal
                   showon   : {'WAUTO_YES':['yes']},
                   position : [1,3,1,1]
                },
                MKHYDR : { type : 'combobox',
                       keyword  : 'none',
                       label    : 'Generate H-atoms for refinement',
                       tooltip  : 'Select how to represent hydrogen atoms in refinement',
                       range    : ['NO|No','YES|Yes if in input file','ALL|Yes'],
                       value    : 'NO',
                       position : [2,0,1,1]
                }  /*,
                TWIN : { type : 'combobox',
                   keyword  : 'none',
                   label    : 'Crystal is twinned',
                   tooltip  : 'Switch twin refinement on/off',
                   range    : ['no|No','yes|Yes'],
                   value    : 'no',
                   position : [3,0,1,1]
                }
                */
             }
    },
     sec2 : { type     : 'section',
        title    : 'Model Parameterisation',
        open     : false,
        position : [1,0,1,5],
        contains : {
           BFAC : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Atomic B-factors',
              range    : ['ISOT|Isotropic','ANIS|Anisotropic','OVER|Overall','MIXED|Mixed'],
              value    : 'ISOT',
              position : [0,0,1,1]
           },
           TLS : { type   : 'combobox',
              keyword  : 'none',
              label    : 'TLS groups',
              tooltip  : 'Translation-Libration-Screw parameterisation',
              range    : ['none|None','auto|Automatic'],
              value    : 'none',
              position : [1,0,1,1]
           },
           TLS_CYCLES : { type   : 'integer',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Number of TLS cycles',
              tooltip  : 'Number of TLS refinement cycles',
              range    : [0,'*'],
              value    : '5',
              showon   : {'TLS':['auto']},
              position : [2,2,1,1]
           },
           RESET_B : { type   : 'combobox',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Reset all B-factors at start',
              tooltip  : 'Reset all B-factors at start',
              range    : ['yes|Yes','no|No'],
              value    : 'yes',
              showon   : {'TLS':['auto']},
              position : [3,2,1,1]
           },
           RESET_B_VAL : { type   : 'real',
              keyword  : 'none',
              label    : 'to fixed value',
              tooltip  : 'to fixed value',
              range    : [0,'*'],
              value    : '30.0',
              showon   : {'TLS':['auto'],'RESET_B':['yes']},
              position : [3,5,1,1]
           },
           TLSOUT_ADDU : { type   : 'combobox',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Add TLS contribution to B-factors',
              tooltip  : 'Add TLS contribution to output B-factors (only for analysis and deposition)',
              range    : ['yes|Yes','no|No'],
              value    : 'no',
              showon   : {'TLS':['auto']},
              position : [4,2,1,1]
           },
           TLSOUT_ADDU_1 : { type   : 'label',
              keyword  : 'none',
              label    : '(only for analysis and deposition)',
              showon   : {'TLS':['auto']},
              position : [4,5,1,3]
           },
           SCALING : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Solvent model type',
              tooltip  : 'Solvent model type',
              range    : ['SIMPLE|Simple','BULK|Bulk'],
              value    : 'SIMPLE',
              position : [5,0,1,1]
           },
           SOLVENT_MASK : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Explicit solvent mask',
              tooltip  : 'Specify whether to use an explicit solvent mask',
              range    : ['explicit|Yes','no|No'],
              value    : 'explicit',
              position : [6,0,1,1]
           },
           SOLVENT_CUSTOM : { type   : 'combobox',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Custom mask parameters',
              tooltip  : 'Use custom solvent mask parameters',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              showon   : {'SOLVENT_MASK':['explicit']},
              position : [7,2,1,1]
           },
           SOLVENT_CUSTOM_VDW : { type   : 'real',
              keyword  : 'none',
              label    : 'Increase non-ion VDW radius by',
              tooltip  : 'Increase VDW radius of non-ion atoms',
              range    : [0,'*'],
              value    : '1.4',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [7,5,1,1]
           },
           SOLVENT_CUSTOM_ION : { type   : 'real',
              keyword  : 'none',
              label    : 'Increase radius of ions by',
              tooltip  : 'Increase ionic radius of potential ion atoms',
              range    : [0,'*'],
              value    : '0.8',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [8,5,1,1]
           },
           SOLVENT_CUSTOM_SHRINK : { type   : 'real',
              keyword  : 'none',
              label    : 'Shrink the mask area by',
              tooltip  : 'Shrink the mask area after calculation',
              range    : [0,'*'],
              value    : '0.8',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [9,5,1,1]
           },
             }
     },
     sec3 : { type     : 'section',
        title    : 'Restraints',
        open     : false,
        position : [2,0,1,5],
        contains : {
           NCSR : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Use automatic NCS restraints',
              tooltip  : 'Use automatic Non-Crystallographic Symmetry restraints',
              range    : ['yes|Yes','no|No'],
              value    : 'yes`',
              position : [0,0,1,1]
           },
           NCSR_TYPE : { type   : 'combobox',
              keyword  : 'none',
              label    : '',
              tooltip  : 'Local or global Non-Crystallographic Symmetry restraints',
              range    : ['LOCAL|Local','GLOBAL|Global'],
              value    : 'LOCAL',
              showon   : {'NCSR':['yes']},
              position : [0,3,1,1]
           },
           JELLY : { type : 'combobox',
              keyword  : 'none',
              label    : 'Use jelly-body restraints',
              tooltip  : 'Use jelly-body restraints',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              position : [1,0,1,1]
           },
           JELLY_SIGMA : { type : 'real',
              keyword  : 'none',
              label    : 'weight',
              tooltip  : 'Sigma parameter for jelly-body restraints',
              range    : [0,'*'],
              value    : '0.01',
              showon   : {'JELLY':['yes']},
              position : [1,3,1,1]
           },
           JELLY_DMAX : { type : 'real',
              keyword  : 'none',
              label    : 'max distance',
              tooltip  : 'Maximum distance between jelly-body restrained atoms',
              range    : [0,'*'],
              value    : '4.2',
              showon   : {'JELLY':['yes']},
              position : [1,8,1,1]
           },
           HBOND_RESTR : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Generate backbone h-bond restraints',
              tooltip  : 'Use ProSMART to generate h-bond restraints for the protein backbone',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              position : [2,0,1,1]
           },
           EXTE : { type   : 'label',
              keyword  : 'none',
              label    : 'External restraints:',
              hideon   : {hmodel:[0,-1]},
              position : [3,0,1,1]
           },
           EXTE_WEIGHT : { type : 'real',
              keyword  : 'none',
              label    : 'weight',
              tooltip  : 'Overall strength of the external restraints (lower is stronger)',
              range    : [0,'*'],
              value    : '10.0',
              hideon   : {hmodel:[0,-1]},
              position : [3,3,1,1]
           },
           EXTE_GMWT : { type : 'real',
              keyword  : 'none',
              label    : 'robustness',
              tooltip  : 'Geman-McClure parameter, controlling robustness to outliers',
              range    : [0,'*'],
              value    : '0.01',
              hideon   : {hmodel:[0,-1]},
              position : [4,3,1,1]
           },
           EXTE_MAXD : { type : 'real',
              keyword  : 'none',
              label    : 'max distance',
              tooltip  : 'Maximum distance between externally restrained atoms',
              range    : [0,'*'],
              value    : '4.2',
              hideon   : {hmodel:[0,-1]},
              position : [5,3,1,1]
           }
        }
     },
     sec4 : { type     : 'section',
        title    : 'Output',
        open     : false,
        position : [3,0,1,5],
        contains : {
           RIDING_HYDROGENS : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Output calculated riding hydrogens',
              tooltip  : 'Output calculated riding hydrogens',
              range    : ['DEFAULT|Default','YES|Yes','NO|No'],
              value    : 'DEFAULT',
              position : [0,0,1,1]
           },
           MAP_SHARPEN : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Perform map sharpening when calculating maps',
              tooltip  : 'Perform map sharpening when calculating maps',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              position : [1,0,1,1]
           },
           MAP_SHARPEN_B : { type : 'real_',
              keyword  : 'none',
              label    : 'using sharpening B-factor',
              tooltip  : 'Custom sharpening B-factor',
              range    : ['*','*'],
              value    : '',
              default  : 'default (use overall B-factor)',
              iwidth   : 220,
              showon   : {'MAP_SHARPEN':['yes']},
              position : [1,3,1,1]
           },
        }
     },
     sec5 : { type     : 'section',
        title    : 'Advanced',
        open     : false,
        position : [4,0,1,5],
        contains : {
           EXPERIMENT : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Diffraction experiment type',
              tooltip  : 'Diffraction experiment type',
              range    : ['xray|X-ray','electron|Electron','neutron|Neutron'],
              value    : 'xray',
              position : [0,0,1,1]
           },
           FORM_FACTOR : { type   : 'combobox',
              keyword  : 'none',
              label    : 'form factor calculation method',
              tooltip  : 'Electron form factor calculation method',
              range    : ['gaussian|Sum of Gaussians','mb|Mott-Bethe'],
              value    : 'gaussian',
              showon   : {'EXPERIMENT':['electron']},
              position : [0,5,1,1]
           },
           /*
           RES_LIMIT_MIN : { type   : 'real_',
              keyword  : 'none',
              label    : 'Use resolution limits',
              tooltip  : 'low resolution limit',
              range    : [0,'*'],
              value    : '',
              default  : 'default',
              position : [1,0,1,1]
           },
           RES_LIMIT_MAX : { type   : 'real_',
              keyword  : 'none',
              label    : 'to',
              tooltip  : 'high resolution limit',
              range    : [0,'*'],
              value    : '',
              default  : 'default',
              position : [1,3,1,1]
           },
           */
           KEYWORDS: {
              type        : 'textarea_',  // can be also 'textarea'
              keyword     : 'none',       // optional
              tooltip     : 'Advanced keywords',  // mandatory
              placeholder : 'Type additional keywords here', // optional
              nrows       : 5,         // optional
              ncols       : 90,        // optional
              iwidth      : 500,       // optional
              value       : '',        // mandatory
              position    : [2,0,1,6]  // mandatory
           }
        }
     }
  };

}


if (__template)
      TaskRefmac.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRefmac.prototype = Object.create ( TaskTemplate.prototype );
TaskRefmac.prototype.constructor = TaskRefmac;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskRefmac.prototype.icon = function()  { return 'task_refmac'; }

TaskRefmac.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

//TaskRefmac.prototype.cleanJobDir = function ( jobDir )  {}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskRefmac.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskRefmac.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.refmac', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRefmac = TaskRefmac;

}
