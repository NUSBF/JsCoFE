
/*
 *  ==========================================================================
 *
 *    16.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.refmac.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Refmac Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, R. Nicholls, O. Kovalevskyi,
 *      M. Fando 2016-2024
 *
 *  ==========================================================================
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

function TaskRefmac()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskRefmac';
  this.name    = 'refmacat';
  this.setOName ( 'refmacat' );  // default output file name template
  this.title   = 'Refinement with Refmac5 via Refmacat';

  this.input_dtypes = [{  // input data types
    data_type   : {'DataRevision':['!xyz']}, // data type(s) and subtype(s)
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
  },{
    data_type   : { 'DataStructure' : ['!phases','!EP'] }, // data type(s) and subtype(s)
    label       : 'External phases',       // label for input dialog
    cast        : 'phases',
    tooltip     : 'External phases',
    inputId     : 'phases',       // input Id for referencing input fields
    version     : 0,              // minimum data version allowed
    min         : 0,              // minimum acceptable number of data instances
    max         : 1               // maximum acceptable number of data instances
  }];

  this.parameters = {
    sec1 :  { type     : 'section',
              title    : 'Basic options',
              open     : true,
              position : [0,0,1,5],
              contains : {
                NCYC  : {
                   type     : 'integer',
                   keyword  : 'none',
                   label    : 'Number of refinement cycles',
                   tooltip  : 'Number of refinement cycles',
                   range    : [0,'*'],
                   value    : '10',
                   position : [0,0,1,1]
                },
                WAUTO_YES : {
                   type     : 'combobox',
                   keyword  : 'none',
                   label    : 'Overall data-geometry weight',
                   tooltip  : 'Overall Data-geometry weight',
                   range    : ['yes|Auto','no|Fixed'],
                   value    : 'yes',
                   position : [1,0,1,1]
                },
                WAUTO_VAL : {
                   type     : 'real',
                   keyword  : 'none',
                   label    : 'value',
                   tooltip  : 'Weight for X-ray term',
                   range    : [0,'*'],
                   value    : '0.01',
                   showon   : {'WAUTO_YES':['no']},
                   position : [1,3,1,1]
                },
                WAUTO_VAL_AUTO : {
                   type     : 'real_',
                   keyword  : 'none',
                   label    : 'starting value',
                   tooltip  : 'Weight for X-ray term',
                   range    : [0,'*'],
                   value    : '',
                   default  : '',   // default cannot be a literal
                   showon   : {'WAUTO_YES':['yes']},
                   position : [1,3,1,1]
                },
                VDW_VAL : {
                   type     : 'real_',
                   keyword  : 'none',
                   label    : 'VDW repulsion weight',
                   tooltip  : 'Weight factor for the VDW repulsion (leave blank for default value)',
                   range    : [0,'*'],
                   value    : '',
                   position : [2,0,1,1]
                },
                MKHYDR : {
                   type     : 'combobox',
                   keyword  : 'none',
                   label    : 'Generate H-atoms for refinement',
                   tooltip  : 'Select how to represent hydrogen atoms in refinement',
                   range    : ['NO|No','YES|Yes if in input file','ALL|Yes'],
                   value    : 'NO',
                   showon   : {'EXPERIMENT':['xray','electron']},
                   position : [3,0,1,3]
                }
                /*,
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
    sec2 : {
        type     : 'section',
        title    : 'Model Parameterisation',
        open     : false,
        position : [1,0,1,5],
        contains : {
            BFAC : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Atomic B-factors',
              range    : ['ISOT|Isotropic','ANIS|Anisotropic','OVER|Overall','MIXED|Mixed'],
              value    : 'ISOT',
              position : [0,0,1,1]
            },
            SCALING : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Solvent model type',
              tooltip  : 'Solvent model type',
              range    : ['SIMPLE|Simple','BULK|Bulk'],
              value    : 'SIMPLE',
              position : [1,0,1,1]
            },
            SOLVENT_MASK : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Explicit solvent mask',
              tooltip  : 'Specify whether to use an explicit solvent mask',
              range    : ['explicit|Yes','no|No'],
              value    : 'explicit',
              position : [2,0,1,1]
            },
            SOLVENT_CUSTOM : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Custom mask parameters',
              tooltip  : 'Use custom solvent mask parameters',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              showon   : {'SOLVENT_MASK':['explicit']},
              position : [3,2,1,1]
            },
            SOLVENT_CUSTOM_VDW : { 
              type     : 'real',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Increase non-ion VDW radius by',
              tooltip  : 'Increase VDW radius of non-ion atoms',
              range    : [0,'*'],
              value    : '1.4',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [4,4,1,1]
            },
            SOLVENT_CUSTOM_ION : { 
              type     : 'real',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Increase radius of ions by',
              tooltip  : 'Increase ionic radius of potential ion atoms',
              range    : [0,'*'],
              value    : '0.8',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [5,4,1,1]
            },
            SOLVENT_CUSTOM_SHRINK : { 
              type     : 'real',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Shrink the mask area by',
              tooltip  : 'Shrink the mask area after calculation',
              range    : [0,'*'],
              value    : '0.8',
              showon   : {'SOLVENT_MASK':['explicit'],'SOLVENT_CUSTOM':['yes']},
              position : [6,4,1,1]
            }
        }
    },
    sec3 : {
        type     : 'section',
        title    : 'Restraints',
        open     : false,
        position : [2,0,1,5],
        contains : {
            NCSR : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Use automatic NCS restraints',
              tooltip  : 'Use automatic Non-Crystallographic Symmetry restraints',
              range    : ['yes|Yes','no|No'],
              value    : 'yes',
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
            MKLINKS : {
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Covalent/metal link identification',
              tooltip  : 'Identify covalent/metal links automatlically and ' +
                         'make the corresponding link records',
              range    : ['NO|No','YES|Yes'],
              value    : 'NO',
              position : [2,0,1,3]
            },
            HBOND_RESTR : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Generate backbone H-bond restraints',
              tooltip  : 'Use ProSMART to generate H-bond restraints for the protein backbone',
              range    : ['no|No','yes|Yes'],
              value    : 'no',
              position : [3,0,1,1]
            },
            EXTE_GEN : { 
              type     : 'label',
              keyword  : 'none',
              label    : 'Generate external restraints<br>with following ProSMART parameters:',
              hideon   : {hmodel:[0,-1]},
              position : [4,0,1,1]
            },
            ALL_BEST : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Use these chain(s) from the reference model(s)',
              tooltip  : 'Select whether to generate restraints using all chains, or just the one that is the most structurally similar to the target, from each homologous reference model',
              range    : ['all|All','best|Most structurally similar'],
              value    : 'all',
              hideon   : {hmodel:[0,-1]},
              position : [4,3,1,1]
            },
            SEQID : { type : 'real',
              keyword  : 'none',
              label    : 'Minimum sequence identity',
              tooltip  : 'Minimum sequence identity between reference and target chains',
              range    : [0,100],
              value    : '75.0',
              hideon   : {hmodel:[0,-1]},
              position : [5,3,1,1]
            },
            SIDE_MAIN : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Generate restraints between following atom-pairs',
              tooltip  : 'Select whether to generate restraints involving both main chain and side chain atoms, or main chain atoms only',
              range    : ['side|Main and side chain','main|Only main chain'],
              value    : 'side',
              hideon   : {hmodel:[0,-1]},
              position : [6,3,1,1]
            },
            RMIN : { type : 'real',
              keyword  : 'none',
              label    : 'Minimum interatomic distance range',
              tooltip  : 'Generate restraints with minimum interatomic distance (Angstroms)',
              range    : [0,'*'],
              value    : '2.5',
              hideon   : {hmodel:[0,-1]},
              position : [7,3,1,1]
            },
            RMAX : { type : 'real',
              keyword  : 'none',
              label    : 'Maximum interatomic distance range',
              tooltip  : 'Generate restraints with maximum interatomic distance (Angstroms)',
              range    : [0,'*'],
              value    : '6.0',
              hideon   : {hmodel:[0,-1]},
              position : [8,3,1,1]
            },
            BFAC_RM : { type   : 'real',
              keyword  : 'none',
              label    : 'Remove restraints where homologue has B-factors<br>higher than median plus interquartile range multiplied<br>by a factor of',
              tooltip  : 'Remove restraints involving atoms, in the homologue, that have high B-factors relative to the rest of the model',
              range    : [0, '*'],
              value    : '2.0',
              hideon   : {hmodel:[0,-1]},
              position : [9,3,1,1]
            },
            TOGGLE_ALT : { type   : 'combobox',
              keyword  : 'none',
              label    : 'Allow restraints involving atoms with alt codes',
              tooltip  : 'Allow restraints involving atoms with alt codes',
              range    : ['yes|Yes','no|No'],
              value    : 'no',
              hideon   : {hmodel:[0,-1]},
              position : [10,3,1,1]
            },
            OCCUPANCY : { type   : 'real',
              keyword  : 'none',
              label    : 'Ignore atoms with occupancies lower than',
              tooltip  : 'Do not generate restraints involving atoms, either in the target or in homologous reference model, with occupancies lower than this value',
              range    : [0, 1],
              value    : '0.0',
              hideon   : {hmodel:[0,-1]},
              position : [11,3,1,1]
            },
            EXTE_APPLY : { type   : 'label',
              keyword  : 'none',
              label    : 'Apply external restraints<br>with following REFMAC5 parameters:',
              hideon   : {hmodel:[0,-1]},
              position : [12,0,1,1]
            },
            EXTE_WEIGHT : { type : 'real',
              keyword  : 'none',
              label    : 'Weight of external restraints',
              tooltip  : 'Overall strength of the external restraints (lower is stronger)',
              range    : [0,'*'],
              value    : '10.0',
              hideon   : {hmodel:[0,-1]},
              position : [12,3,1,1]
            },
            EXTE_ALPHA : { type : 'real',
              keyword  : 'none',
              label    : 'Robustness parameter',
              tooltip  : 'Alpha parameter - controls robustness to outliers, with lower values resulting in outliers having less of an effect. E.g. 2.0 corresponds to Least Squares, and -2.0 corresponds to the Geman-McClure loss function.',
              range    : ['*','*'],
              value    : '1.0',
              hideon   : {hmodel:[0,-1]},
              position : [13,3,1,1]
            },
            EXTE_MAXD : { type : 'real',
              keyword  : 'none',
              label    : 'Maximal distance between restrained atoms',
              tooltip  : 'Maximum distance between externally restrained atoms',
              range    : [0,'*'],
              value    : '4.2',
              hideon   : {hmodel:[0,-1]},
              position : [14,3,1,1]
            }
        }
    },
    sec4 : {
        type     : 'section',
        title    : 'TLS Refinement and B-factors',
        open     : false,
        position : [3,0,1,5],
        contains : {

            TLS : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'TLS groups',
              tooltip  : 'Translation-Libration-Screw parameterisation',
              range    : ['none|None',
                          'auto|Automatic',
                          'explicit|Explicit TLS group definitions'
                         ],
              value    : 'none',
              showon   : {'BFAC':['ISOT']},
              position : [0,0,1,1]
            },
            TLS_CYCLES : { 
              type     : 'integer',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Number of TLS cycles',
              tooltip  : 'Number of TLS refinement cycles',
              range    : [0,'*'],
              value    : '5',
              hideon   : {'TLS':['none']},
              position : [1,2,1,1]
            },

            TLSOUT_ADDU : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;Add TLS contribution to B-factors',
              tooltip  : 'Add TLS contribution to output B-factors (only for analysis and deposition)',
              range    : ['yes|Yes','no|No'],
              value    : 'no',
              hideon   : {'TLS':['none']},
              position : [2,2,1,1]
            },
            TLSOUT_ADDU_1 : { 
              type     : 'label',
              keyword  : 'none',
              label    : '(only for analysis and deposition)',
              lwidth   : '80%',
              hideon   : {'TLS':['none']},
              position : [2,5,1,3]
            },

            TLS_GROUPS_LABEL_1 : {
              type     : 'label',
              keyword  : 'none',
              lwidth   : 800,
              label    : '<div style="font-size:14px;">&nbsp;<br>' +
                        'Set TLS group definitions in the input field below (consult ' +
                        '<a href="https://www.ccp4.ac.uk/html/refmac5/files/tls.html" ' +
                        'target="_blank"><i>Refmac reference</i></a> for more details).' +
                        '<sub>&nbsp;</sub></div>',
              showon   : {'TLS':['explicit']},
              position : [3,2,1,5]
            },
            TLS_GROUPS : {
              type     : 'aceditor_',  // can be also 'textarea'
              keyword  : 'none',       // optional
              tooltip  : '',           // mandatory
              iwidth   : 800,          // optional
              iheight  : 320,          // optional
              value    : '',           // mandatory
              showon   : {'TLS':['explicit']},
              position : [4,2,1,5]     // mandatory
            },
            TLS_GROUPS_LABEL_2 : {
              type     : 'label',
              keyword  : 'none',
              label    : '&nbsp;',
              showon   : {'TLS':['explicit']},
              position : [5,2,1,5]
            },

            RESET_B : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Reset all B-factors at start',
              tooltip  : 'Reset all B-factors at start',
              range    : ['yes|Yes','no|No'],
              value    : 'no',
              showon   : {'TLS':['none']},
              position : [6,0,1,1]
            },
            RESET_B_VAL : { 
              type     : 'real',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;to fixed value',
              tooltip  : 'to fixed value',
              range    : [0,'*'],
              value    : '30.0',
              showon   : {'TLS':['none'],'RESET_B':['yes']},
              position : [7,2,1,1]
            },

            RESET_B_TLS : { 
              type     : 'combobox',
              keyword  : 'none',
              label    : 'Reset all B-factors at start',
              tooltip  : 'Reset all B-factors at start',
              range    : ['yes|Yes','no|No'],
              value    : 'yes',
              showon   : {'TLS':['auto','explicit']},
              position : [8,0,1,1]
            },
            RESET_B_TLS_VAL : { 
              type     : 'real',
              keyword  : 'none',
              label    : '&nbsp;&nbsp;&nbsp;&nbsp;to fixed value',
              tooltip  : 'to fixed value',
              range    : [0,'*'],
              value    : '30.0',
              showon   : {'TLS':['auto','explicit'],'RESET_B_TLS':['yes']},
              position : [9,2,1,1]
            }

        }
    },
    sec5 : {
        type     : 'section',
        title    : 'Output',
        open     : false,
        position : [4,0,1,5],
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
              placeholder : 'default (use overall B-factor)',
              iwidth   : 220,
              showon   : {'MAP_SHARPEN':['yes']},
              position : [1,3,1,1]
            }
        }
    },
    sec6 : {
        type     : 'section',
        title    : 'Advanced',
        open     : false,
        position : [5,0,1,5],
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
              position : [0,3,1,1]
            },
            MKHYDR_NEUTRON : {
               type     : 'combobox',
               keyword  : 'none',
               label    : 'Use hydrogen atoms during refinement',
               tooltip  : 'Select how to represent hydrogen atoms in refinement',
               range    : ['NO|No','ALL|Yes','YES|Only if present in input file'],
               value    : 'ALL',
               showon   : {'EXPERIMENT':['neutron']},
               position : [0,3,1,1]
            },
            H_REFINE : { type : 'combobox',
              keyword  : 'none',
              label    : 'Refine hydrogen positions',
              tooltip  : 'Whether to refine hydrogens, and if yes then which selection',
              range    : ['NO|No','ALL|Yes - all hydrogens','POLAR|Yes - only polar hydrogens','RPOLAR|Yes - only rotatable polar hydrogens'],
              value    : 'ALL',
              showon   : {'EXPERIMENT':['neutron'],'MKHYDR_NEUTRON':['ALL','YES']},
              position : [1,3,1,1]
            },
            H_TORSION : { type : 'combobox',
              keyword  : 'none',
              label    : 'Use hydrogen torsion angle restraints',
              tooltip  : 'Whether to use hydrogen-involving torsion angle restraints, for both positional generation and refinement.',
              range    : ['yes|Yes','no|No'],
              value    : 'yes',
              showon   : {'EXPERIMENT':['neutron'],'MKHYDR_NEUTRON':['ALL','YES']},
              position : [2,3,1,1]
            },
            H_REFINE_HD : { type : 'combobox',
              keyword  : 'none',
              label    : 'Refine H/D fractions',
              tooltip  : 'H/D fraction refinement is iteratively performed during each main refinement cycle - this results in more cycles being reported in the output.',
              range    : ['NO|No','POLAR|Yes - only polar hydrogens (for H/D exchange experiments)','ALL|Yes - all hydrogens (for perdeuterated crystals)'],
              value    : 'POLAR',
              showon   : {'EXPERIMENT':['neutron'],'MKHYDR_NEUTRON':['ALL','YES']},
              position : [3,3,1,1]
            },
            H_INIT_HD : { type : 'combobox',
              keyword  : 'none',
              label    : 'Initialise H/D fractions',
              tooltip  : 'H/D fractions should be initialised if they have not been refined before, or the model has undergone substantial changes since the last round of refinement.',
              range    : ['no|No - assumes H/D fraction has been refined before','mix|Yes - set to D for exchangable atoms; H for others (for H/D exchange experiments)','alld|Yes - set all to D (for perdeuterated crystals)'],
              value    : 'no',
              showon   : {'EXPERIMENT':['neutron'],'MKHYDR_NEUTRON':['YES'],'H_REFINE_HD':['ALL','POLAR']},
              position : [4,3,1,1]
            },
            H_INIT_HD_HALL : { type : 'combobox',
              keyword  : 'none',
              label    : 'Initialise H/D fractions',
              tooltip  : 'H/D fractions should be initialised if they have not been refined before, or the model has undergone substantial changes since the last round of refinement.',
              range    : ['mix|Set to D for exchangable atoms; H for others (for H/D exchange experiments)','alld|Set all to D (for perdeuterated crystals)'],
              value    : 'mix',
              showon   : {'EXPERIMENT':['neutron'],'MKHYDR_NEUTRON':['ALL'],'H_REFINE_HD':['ALL','POLAR']},
              position : [4,3,1,1]
            },
            KEYWORDS_LBL : {
              type     : 'label',
              keyword  : 'none',
              label    : '<div style="font-size:14px;">' +
                         '<i>Type additional keywords here</i></div>',
              position : [5,0,1,6]
            },
            KEYWORDS: {
              type        : 'aceditor_',
              //keyword     : 'keyword',
              tooltip     : '',
              reportas    : 'Keywords',
              value       : '',
              iwidth      : 500,
              iheight     : 160,
              position    : [6,0,1,6]
            }  
        }
     }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskRefmac',TaskRefmac,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskRefmac',TaskRefmac,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskRefmac.prototype.icon           = function()  { return 'task_refmac'; }
TaskRefmac.prototype.clipboard_name = function()  { return '"Refmac"';    }

TaskRefmac.prototype.currentVersion = function()  {
let version = 7;  // tls refinement
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskRefmac.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'refine macromolecular structure';
};

TaskRefmac.prototype.canShare = function()  {
  return ['xyz','mtz','lib'];
}

// TaskRefmac.prototype.cleanJobDir = function ( jobDir )  {}

// hotButtons return list of buttons added in JobDialog's toolBar.
function RefmacHotButton()  {
  return {
    'task_name' : 'TaskRefmac',
    'tooltip'   : 'Refine results using parameters of last refinement'
  };
}

TaskRefmac.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['refmac','refinement','refmac5'] );
}


if (!__template)  {
  //  for client side

  TaskRefmac.prototype.layParameters = function ( grid,row,col )  {
    if (('TLS_GROUPS' in this.parameters.sec4.contains) && 
        (!this.parameters.sec4.contains.TLS_GROUPS.value))  {
      let item = this.getInputItem ( grid.inpDataRef,'revision' );
      if (item && (item.dt.length>0) && ('tls_groups' in item.dt[0]))  {
        this.parameters.sec4.contains.TLS.value = 'explicit';
        this.parameters.sec4.contains.TLS_GROUPS.value = item.dt[0].tls_groups;
      }
    }
    TaskTemplate.prototype.layParameters.call ( this,grid,row,col );
  }

  // sets task parameters from given standard input file, represented as 
  // refkeys = { id: id, keywords: keywords } where keywords is list of lines 
  // in task's stdin
  TaskRefmac.prototype.set_refkeys_parameters = function ( refkeys )  {
  let lines  = refkeys.keywords;
  let sec1   = this.parameters.sec1.contains;
  let sec2   = this.parameters.sec2.contains;
  let sec3   = this.parameters.sec3.contains;
  let sec4   = this.parameters.sec4.contains;
  let sec5   = this.parameters.sec5.contains;
  let sec6   = this.parameters.sec6.contains;
  let ncsr   = 0;
  let advkwd = [];
    for (let i=0;i<lines.length;i++)  {
      let words = lines[i].trim().split(/\s+/);
      if ((words.length>0) && (!words[0].startsWith('#')))  {
        let w1 = '';
        if (words.length>1)
          w1 = words[1].toUpperCase().substring(0,4);2
        let w2 = '';
        if (words.length>2)
          w2 = words[2];
        switch (words[0].toUpperCase().substring(0,4))  {
          case 'NCYC' : sec1.NCYC.value = words[1];
                      break;
          case 'WEIG' : if (w1=='AUTO')  {
                          sec1.WAUTO_YES.value      = 'yes';
                          sec1.WAUTO_VAL_AUTO.value = w2;
                        } else  {
                          sec1.WAUTO_YES.value = 'no';
                          sec1.WAUTO_VAL.value = w2;
                        }
                      break;
          case 'REFI' : if (w1=='BREF')                          
                        sec4.BFAC.value = words[2].toUpperCase().substring(0,4);

                        else if (w1=='TLSC')  {
                          sec4.TLS.value = 'auto';
                          sec4.TLS_CYCLES.value = w2;
                        }
                        else advkwd.push ( lines[i] );
                        break;
          case 'BFAC' : if (w1=='SET')  {
                          if (sec4.TLS.value=='none')
                                sec4.RESET_B_VAL.value     = w2;
                          else  sec4.RESET_B_TLS_VAL.value = w2;
                        }
                      break;
          case 'TLSO' : if (w1=='ADDU')  {
                          sec4.TLS.value         = 'auto';
                          sec4.TLSOUT_ADDU.value = 'yes';
                        }
                      break;
          case 'MAPC' : if (w1=='SHAR')  {
                          sec5.MAP_SHARPEN.value = 'yes';
                          if (w2)  sec5.MAP_SHARPEN_B.value = w2;
                             else  sec5.MAP_SHARPEN_B.value = 'default';
                        }
                      break;
          case 'MAKE' : if (w1=='HYDR')  {
                          sec1.MKHYDR.value = words[2].toUpperCase(); 
                          break;}
                          // NO, YES, ALL 
  
                        if (w1=='LINK')  {
                          sec3.MKLINKS.value = words[2].toUpperCase();
                        }

                        // No, Yes
                        if (w1=='HOUT')  
                          sec5.RIDING_HYDROGENS.value == words[2].toUpperCase().substring(0,1)

                        //DEFAULT|Default','YES|Yes','NO|No

                      break;

          case 'NCSR': if (words[1].toUpperCase() == "LOCAL") {

                        sec3.NCSR.value == 'yes'
                        sec3.NCSR_TYPE.value == 'LOCAL'
                        ncsr =1
                        break;
                      };
                      if (words[1].toUpperCase() == "GLOBAL"){
                        sec3.NCSR.value == 'yes'
                        sec3.NCSR_TYPE.value == 'GLOBAL'
                        ncsr =1
                        break;
                      }
                      
                      // console.log('____________', {
                      //   words,
                      //   firstWord: words[1],
                      //   boolCheck: (words[1].toUpperCase() != "LOCAL") || (words[1].toUpperCase() != 'GLOBAL')
                      // })
                      // debugger;
                      if ((words[1].toUpperCase() != "LOCAL") && (words[1].toUpperCase() != 'GLOBAL')) {
                        advkwd.push ( lines[i] )
                      }
                        break;

                      // if str(sec3.NCSR.value) == 'yes':
                      // stdin.append ('NCSR ' + str(sec3.NCSR_TYPE.value) )
          case 'SOUR' : if (w1=='ELEC')  {
                        sec6.EXPERIMENT.value = 'electron';
                        if (w2.toUpperCase()=='MB')
                              sec6.FORM_FACTOR.value = 'mb';
                        else  sec6.FORM_FACTOR.value = 'gaussian';
                      }
                      if (w1=='NEUT')  {
                        sec6.EXPERIMENT.value = 'neutron';
                      }
                      if (w1=='XRAY')  {
                        sec6.EXPERIMENT.value = 'xray';
                      }

                    break;
          case 'SCAL' : if ((words.length==3) && (w1=='TYPE')){
                        if ((words[2].toUpperCase()== 'SIMPLE') && (words[2].toUpperCase()== 'BULK') )
                              sec2.SCALING.value = words[2].toUpperCase();
                        else advkwd.push ( lines[i] )
                            }
                        else  advkwd.push ( lines[i] );
                    break;
          case 'SOLV' : let j = 1;
                        while (j<words.length)  {
                          switch (words[j].toUpperCase().substring(0,4))  {
                            case 'NO'   : sec2.SOLVENT_MASK.value = 'no';   break;
                            case 'YES'  : sec2.SOLVENT_MASK.value = 'yes';  break;
                            case 'VDWP' : sec2.SOLVENT_CUSTOM_VDW.value = words[++j];
                                          sec2.SOLVENT_CUSTOM.value = 'yes';
                                        break;
                            case 'IONP' : sec2.SOLVENT_CUSTOM_ION.value = words[++j];
                                          sec2.SOLVENT_CUSTOM.value = 'yes';
                                        break;
                            case 'RSHR' : sec2.SOLVENT_CUSTOM_SHRINK.value = words[++j];
                                          sec2.SOLVENT_CUSTOM.value = 'yes';
                                        break;
                            default : ;
                          }
                          j++;
                        }
                    break;
          case 'TLSD' : advkwd.push ( lines[i] );       break;
          case 'VDWR' : sec1.VDW_VAL.value = words[1];  break;
          case 'VAND' : sec1.VDW_VAL.value = words[1];  break;
          case 'NONB' : sec1.VDW_VAL.value = words[1];  break;
          case 'RIDG' : sec3.JELLY.value = 'yes';
                        if ((w1 == 'DIST') && (words[2].toUpperCase().substring(0,4) == 'SIGM' ))
                        sec3.JELLY_SIGMA.value = words[3];
                        if ((w1 == 'DIST') && (words[2].toUpperCase().substring(0,4) == 'DMAX' ))
                        sec3.JELLY_DMAX.value = words[3];
                        else advkwd.push ( lines[i] );
                        break;


          case 'ANOM' : advkwd.push ( lines[i] ); break;
          case 'ANGL' : advkwd.push ( lines[i] ); break;
          case 'BINS' : advkwd.push ( lines[i] ); break;
          case 'BLIM' : advkwd.push ( lines[i] ); break;
          case 'CELL' : advkwd.push ( lines[i] ); break;
          case 'CHIR' : advkwd.push ( lines[i] ); break;
          case 'DAMP' : advkwd.push ( lines[i] ); break;
          case 'FREE' : advkwd.push ( lines[i] ); break;
          case 'SIGM' : advkwd.push ( lines[i] ); break;
          case 'LABI' : advkwd.push ( lines[i] ); break;
          case 'LABO' : advkwd.push ( lines[i] ); break;
          case 'MONI' : advkwd.push ( lines[i] ); break;
          case 'PHAS' : advkwd.push ( lines[i] ); break;
          case 'RIGI' : advkwd.push ( lines[i] ); break;
          case 'SCPA' : advkwd.push ( lines[i] ); break;
          case 'SYMM' : advkwd.push ( lines[i] ); break;
          case 'SHAN' : advkwd.push ( lines[i] ); break;
          case 'SPHE' : advkwd.push ( lines[i] ); break;
          case 'PLAN' : advkwd.push ( lines[i] ); break;
          case 'RBON' : advkwd.push ( lines[i] ); break;
          case 'TEMP' : advkwd.push ( lines[i] ); break;
          case 'TORS' : advkwd.push ( lines[i] ); break;
          case 'HOLD' : advkwd.push ( lines[i] ); break;
          default     : break;
        }
      }

      
    }
    if (ncsr === 0) {
      sec3.NCSR.value = "no" 
    };

    sec6.KEYWORDS.value = advkwd.join('\n');

    return 1;  // all Ok, else -1 (incompatibility)
  
  }

  /*

  "DataRevision": [
   "ANOM MAPONLY",
   "LABIN FP=F SIGFP=SIGF F+=F(+) SIGF+=SIGF(+) F-=F(-) SIGF-=SIGF(-) FREE=FreeR_flag",
   "NCYC 10",
   "WEIGHT AUTO",
   "MAKE HYDR ALL",
   "MAKE LINK NO",
   "REFI BREF ISOT",
   "SCALE TYPE SIMPLE",
   "SOLVENT YES",
   "NCSR LOCAL",
   "REFI RESO 34 1.79",
   "MAKE NEWLIGAND EXIT",
   "Pdbout keep true",
   "END"
  ]

  #Refmac command script from PDB-REDO 8.01
   #
   #Use of riding hydrogens
   make hydrogen ALL
   #B-factor model selection
   refi bref ISOT
   #Solvent related settings
   scal type SIMP lssc function a sigma n
   solvent YES
   solvent vdwprobe 1.1 ionprobe 0.7 rshrink 0.7
   tlsd waters exclude
   #Restraint weights
   weight  MATRIX 0.10
   temp 0.30
  */
   

  TaskRefmac.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    let phases = this.input_data.getData('phases');
    if (phases.length>0)  {
      let hkl = this.input_data.getData('revision')[0].HKL;
      if (hkl.useHKLSet!='F')
        input_msg += '<b><i>external phases cannot be used with twin or SAD refinement</i></b>';
    }

    if ((this.parameters.sec4.contains.TLS.value=='explicit') &&
        (!this.parameters.sec4.contains.TLS_GROUPS.value.trim()))
      input_msg += '<b><i>TLS group definitions must be provided</i></b>';

    return input_msg;

  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskRefmac.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskRefmac.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskRefmac.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.refmac', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRefmac = TaskRefmac;

}
