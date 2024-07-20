
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.crank2.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Crank-2 Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

function TaskCrank2()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCrank2';
  this.name    = 'EP with Crank2';
  this.setOName ( 'crank2' );  // default output file name template
  this.title   = 'Crank-2 Automated Experimental Phasing';
  //this.helpURL = './html/jscofe_task_crank2.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!anomalous','!asu','~mmcif_only']},
      //data_type   : {'DataRevision':['!protein','!asu','~substructure','!anomalous']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'crank2',   // lay custom fields next to the selection
                                // dropdown for 'native' dataset
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':['anomalous']}, // data type(s) and subtype(s)
      label       : 'Anomalous reflection<br>data (MAD)',  // label for input dialog
      inputId     : 'hkl',       // input Id for referencing input fields
      customInput : 'anomData',  // lay custom fields next to the selection
                                 // dropdown for anomalous data
      tooltip     : 'Only anomalous reflection datasets from all imported ' +
                    'may be chosen here. Note that neither of reflection '  +
                    'datasets may coincide with the native dataset, if one is ' +
                    'specified above.',
      min         : 0,           // minimum acceptable number of data instances
      max         : 3,           // maximum acceptable number of data instances
      force       : 0            // SAD by default
    },{
      data_type   : {'DataHKL':[]},   // data type(s) and subtype(s)
      desc        : 'native dataset',
      label       : 'Native dataset', // label for input dialog
      inputId     : 'native',     // input Id for referencing input fields
      customInput : 'native',     // lay custom fields next to the selection
                                  // dropdown for 'native' dataset
      tooltip     : 'Native dataset is optional and may be chosen from both ' +
                    'non-anomalous (typical case) and anomalous diffraction ' +
                    'datasets. Native dataset must not coincide with any of ' +
                    'the reflection datasets chosen above.',
      min         : 0,            // minimum acceptable number of data instances
      max         : 1,            // maximum acceptable number of data instances
      force       : 0             // native dataset off by default
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
      inputId     : 'pmodel',    // input Id for referencing input fields
      //customInput : 'phaser-ep', // lay custom fields below the dropdown
      version     : 0,           // minimum data version allowed
      force       : 1,           // meaning choose, by default, 1 structure if
                                 // available; otherwise, 0 (do not use) will
                                 // be selected
      min         : 0,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    */
    }
  ];

  this.parameters = { // input parameters
    sec1: { type     : 'section',
            title    : 'Main Parameters',
            open     : true,  // true for the section to be initially open
            position : [0,0,1,5],
            value    : 'crank2', // used to hide elements in SHELX pipeline
            contains : {
              NATOMS : {
                    type      : 'integer_',       // '_' means blank value is allowed
                    keyword   : 'exp_num_atoms=', // the real keyword for job input stream
                    label     : 'No. of substructure atoms in a.s.u.',
                    tooltip   : 'Optional number of substructure atoms in ' +
                                'asymmetric unit. Leave blank for automatic ' +
                                'choice.',
                    lwidth    : 230,
                    iwidth    : 80,
                    range     : [1,'*'],  // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value     : '',       // value to be paired with the keyword
                    //label2    : ' ',
                    //lwidth2   : 100,
                    position  : [0,0,1,1] // [row,col,rowSpan,colSpan]
                  },
              /*
              PARTIAL_AS_SUBSTR : {
                    type      : 'checkbox',
                    label     : 'Remove all non-anomalous atoms before rebuilding',
                    tooltip   : 'Check to rebuild solely from maps phased from ' +
                                'the anomalous signal. This removes any potential ' +
                                'initial model bias but may not work or be slower ' +
                                'in some cases.',
                    iwidth    : 400,
                    value     : false,
                    position  : [2,0,1,5],
                    hideon    : {_:'||','revision.subtype:xyz':[0,-1],sec1:['shelx-substr']}    // from this and input data section
                  },
              */
              SOLVENT_CONTENT : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'solvent_content=', // the real keyword for job input stream
                    label     : 'Effective solvent content',
                    tooltip   : 'Solvent content to be used in calculations (must ' +
                                'be between 0.01 and 0.99). If left blank, ' +
                                'solvent fraction from asymmetric unit definition ' +
                                'will be used.',
                    iwidth    : 80,
                    range     : [0.01,0.99], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [1,0,1,1],   // [row,col,rowSpan,colSpan]
                    hideon    : {sec1:['shelx-substr']} // from this and input data section
                  }
            }
    },
    sec2: { type     : 'section',
            title    : 'Advanced options for substructure detection',
            open     : false,  // true for the section to be initially open
            showon   : {_:'||','revision.subtype:xyz':[0,-1],sec1:['shelx-substr']}, // from this and input data section
            position : [1,0,1,5],
            contains : {
              SUBSTRDET_NUM_TRIALS : {
                    type      : 'integer_',     // blank value is allowed
                    keyword   : 'num_trials::', // the real keyword for job input stream
                    label     : 'Number of trials',
                    tooltip   : 'The number of substructure determination ' +
                                'trials performed if the specified CFOM or ' +
                                'CC threshold is not reached.',
                    range     : [1,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [0,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              SUBSTRDET_HIGH_RES_CUTOFF_SHELXD : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'high_res_cutoff::', // the real keyword for job input stream
                    label     : 'High resolution cutoff [&Aring]',
                    tooltip   : 'The high resolution cutoff for substructure ' +
                                'determination.',
                    range     : [0.01,'*'], // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [1,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : {_:'||',sec1:['shelx-substr'],SUBSTRDET_PROGRAM:['shelxd']}
                  },
              SUBSTRDET_HIGH_RES_CUTOFF : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'high_res_cutoff::', // the real keyword for job input stream
                    label     : 'Initial high resolution cutoff [&Aring]',
                    tooltip   : 'The initially tested high resolution cutoff ' +
                                'for substructure determination.',
                    range     : [0.01,'*'], // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [1,0,1,1],  // [row,col,rowSpan,colSpan]
                    hideon    : {_:'||',sec1:['shelx-substr'],SUBSTRDET_PROGRAM:['shelxd']}
                  },
              SUBSTRDET_NUM_ATOMS : {
                    type      : 'integer_',    // blank value is allowed
                    keyword   : 'num_atoms::', // the real keyword for job input stream
                    label     : 'Number of searched peaks in the ASU',
                    tooltip   : 'The number of searched peaks typically '     +
                                'corresponds to the expected number of '      +
                                'substructure atoms in the asymmetric unit. ' +
                                'A value of 0 for program PRASA specifies '   +
                                'that this restraint will not be used in '    +
                                'substructure detection',
                    range     : [0,'*'], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    position  : [2,0,1,1]    // [row,col,rowSpan,colSpan]
                  },
              SUBSTRDET_PROGRAM : {
                    type     : 'combobox',
                    keyword  : 'SUBSTRDET_PROGRAM',
                    label    : 'Substructure determination program',
                    tooltip  : 'The program that will be used for ' +
                               'substructure determination',
                    range    : ['_blank_|Auto',
                                'shelxd|ShelXD',
                                'prasa|Prasa'
                               ],
                    value    : '_blank_',
                    position : [3,0,1,1],
                    showon   : {sec1:['crank2']}
                  },
              FAEST_PROGRAM : {
                    type     : 'combobox',
                    keyword  : 'FAEST_PROGRAM',
                    label    : 'FA values estimation program',
                    tooltip  : 'The program that will be used for estimation ' +
                               'of FA respective E values, inputted to ' +
                               'substructure determination program',
                    range    : ['_blank_|Auto',
                                'afro|Afro',
                                'shelxc|ShelXC',
                                'ecalc|ECalc'
                               ],
                    value    : '_blank_',
                    position : [4,0,1,1],
                    showon   : {sec1:['crank2']},
                    hideon   : {SUBSTRDET_PROGRAM:['shelxd']}
                  },
              SUBSTRDET_THRESHOLD_STOP_SHELXD : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'threshold_stop::', // the real keyword for job input stream
                    label     : 'CFOM threshold for early stop',
                    tooltip   : 'If the threshold is reached, the substructure ' +
                                'detection will stop, assuming a solution was ' +
                                'obtained that will be used for phasing. Saves ' +
                                'time for the "easy" datasets.',
                    range     : [0.0,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [5,0,1,1], // [row,col,rowSpan,colSpan]
                    showon    : {_:'||',sec1:['shelx-substr'],SUBSTRDET_PROGRAM:['shelxd']}
                  },
              SUBSTRDET_THRESHOLD_STOP : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'threshold_stop::', // the real keyword for job input stream
                    label     : 'CC threshold for early stop',
                    tooltip   : 'If the threshold is reached, the substructure ' +
                                'detection will stop, assuming a solution was ' +
                                'obtained that will be used for phasing. Saves ' +
                                'time for the "easy" datasets.',
                    range     : [0.0,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [5,0,1,1], // [row,col,rowSpan,colSpan]
                    hideon    : {_:'||',sec1:['shelx-substr'],SUBSTRDET_PROGRAM:['shelxd']}
                  },
              SUBSTRDET_THRESHOLD_WEAK : {
                    type      : 'real_',  // blank value is allowed
                    keyword   : 'threshold_weak::', // the real keyword for job input stream
                    label     : 'CFOM threshold',
                    tooltip   : 'Use thorough building if CFOM from substructure ' +
                                'detection is smaller than specified. The thorough ' +
                                'building consists of more tracing ' +
                                'cycles, search for helices and a larger search ' +
                                'time factor. Setting the value to 1000 forces ' +
                                'the thorough building.',
                    range     : [0.001,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [6,0,1,1], // [row,col,rowSpan,colSpan]
                    showon    : {sec1:['shelx-auto']}
                  },
              SUBSTRDET_HIGH_RES_CUTOFF_RADIUS : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'high_res_cutoff_radius::', // the real keyword for job input stream
                    label     : 'Radius of tested cutoffs [&Aring]',
                    tooltip   : 'High resolution cutoffs will be tested in ' +
                                'this radius around the specified initial ' +
                                'cutoff. A radius of +-0.5Å - thus scanning ' +
                                'over 1Å range - is typically sufficient.',
                    range     : [0.01,'*'], // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [7,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : {_:'&&',SUBSTRDET_PROGRAM:['prasa'],sec1:['crank2']}
                  },
              SUBSTRDET_HIGH_RES_CUTOFF_STEP : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'high_res_cutoff_step::', // the real keyword for job input stream
                    label     : 'Incremental step for cutoff testing [&Aring]',
                    tooltip   : 'The slicing of the cutoff testing: the lower ' +
                                'the value, the more cutoffs will be tested in ' +
                                'the chosen resolution cutoff range.',
                    range     : [0.001,'*'], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    position  : [8,0,1,1],   // [row,col,rowSpan,colSpan]
                    showon    : {_:'&&',SUBSTRDET_PROGRAM:['prasa'],sec1:['crank2']}
                  },
              SUBSTRDET_MIN_DIST_SYMM_ATOMS : {
                    type     : 'combobox',
                    keyword  : 'min_dist_symm_atoms::',
                    label     : 'Atoms in special positions allowed',
                    tooltip   : 'Select this option if (part of) the anomalous ' +
                                'substructure atoms can be in special positions: ' +
                                'positions related by more than one space group ' +
                                'symmetry operator.',
                    range    : ['_blank_|Auto',
                                '-0.1|Yes',
                                '3|No',
                               ],
                    value    : '_blank_',
                    position : [9,0,1,2]
                  },
              SUBSTRDET_MIN_DIST_ATOMS : {
                    type      : 'real_',     // blank value is allowed
                    keyword   : 'min_dist_atoms::', // the real keyword for job input stream
                    label     : 'Minimal distance between atoms [&Aring]',
                    tooltip   : 'The (expected) minimal distance between ' +
                                'anomalous substructure atoms.',
                    range     : [0.001,'*'], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    position  : [10,0,1,1]    // [row,col,rowSpan,colSpan]
                  }
            }
    },
    sec3: { type     : 'section',
            title    : 'Advanced options for substructure improvement',
            open     : false,  // true for the section to be initially open
            showon   : {_:'||',sec1:['crank2','shelx-substr']}, // from this and input data section
//            showon   : {sec1:['crank2']},
            position : [2,0,1,5],
            contains : {
              REFATOMPICK_NUM_ITER : {
                    type      : 'integer_',   // blank value is allowed
                    keyword   : 'num_iter::', // the real keyword for job input stream
                    label     : 'Number of iterations',
                    tooltip   : 'Picking of new substructure atoms from ' +
                                'anomalous maps and refinement will be ' +
                                'iterated for the selected number of cycles. ' +
                                'Leave blank for automatic choice.',
                    range     : [0,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [0,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              REFATOMPICK_REFCYC : {
                    type      : 'integer_',  // blank value is allowed
                    keyword   : 'refcyc::',  // the real keyword for job input stream
                    label     : 'Number of refinement cycles per iteration',
                    tooltip   : 'Number of refinement cycles in each iteration ' +
                                'of substructure atom picking. Leave blank for ' +
                                'automatic choice.',
                    range     : [0,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [1,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              REFATOMPICK_RMS_THRESHOLD : {
                    type      : 'real_',  // blank value is allowed
                    keyword   : 'rms_threshold::', // the real keyword for job input stream
                    label     : 'RMS threshold for addition of new atoms',
                    tooltip   : 'Peaks above the specified RMS threshold in ' +
                                'the anomalous difference map will be added ' +
                                'to the anomalous substructure. Leave blank ' +
                                'for automatic choice.',
                    range     : [1,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [2,0,1,1]  // [row,col,rowSpan,colSpan]
                  }
            }
    },
    sec4: { type     : 'section',
            title    : 'Advanced options for hand determination',
            open     : false,  // true for the section to be initially open
            position : [3,0,1,5],
            showon   : {'revision.subtype:xyz':[0,-1],sec1:['crank2']}, // from this and input data section
            contains : {
              HANDDET_DO : {
                    type     : 'checkbox',
                    label    : 'Perform hand determination',
                    tooltip  : 'Unselect if you wish to skip the hand ' +
                               'determination and directly proceed with the ' +
                               'current hand',
                    value    : true,
                    position : [0,0,1,1],
                    showon   : {'revision.subtype:xyz':[0,-1]} // from this and input data section
                  }
            }
    },
    sec5: { type     : 'section',
            title    : 'Advanced options for density modification',
            open     : false,  // true for the section to be initially open
            position : [4,0,1,5],
            showon   : {sec1:['crank2']},
            hideon   : {_:'&&','revision.subtype:xyz':[1],PARTIAL_AS_SUBSTR:[false]},
            contains : {
              DMFULL_DM_PROGRAM : {
                    type     : 'combobox',
                    keyword  : 'dm',
                    label    : 'Density modification program',
                    tooltip  : 'The program that will be used for the real ' +
                               'space density modification.',
                    range    : ['_blank_|Auto',
                                'parrot|Parrot',
                                'solomon|Solomon'
                               ],
                    value    : '_blank_',
                    position : [0,0,1,1],
                    showon   : {sec1:['crank2']}
                  },
              DMFULL_PHCOMB_PROGRAM : {
                    type     : 'combobox',
                    keyword  : 'phcomb',
                    label    : 'Phase combination program',
                    tooltip  : 'The program that will be used for the real ' +
                               'space density modification.',
                    range    : ['_blank_|Auto',
                                'refmac|Refmac',
                                'multicomb|MultiComb'
                               ],
                    value    : '_blank_',
                    position : [1,0,1,1],
                    showon   : {sec1:['crank2'],hkl:[1]}
                  },
              DMFULL_DMCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'dmcyc::',  // the real keyword for job input stream
                    label     : 'Number of cycles',
                    tooltip   : 'Number of density modification iterations.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [2,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon   : {sec1:['crank2']}
                  },
              DMFULL_THRESHOLD_STOP : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'threshold_stop::',  // the real keyword for job input stream
                    label     : 'FOM threshold for early stop',
                    tooltip   : 'If this figure of merit is reached, density ' +
                                'modification will stop early, assuming a well ' +
                                'phased map suitable for model building. Saves ' +
                                'some time for the "easy" datasets.',
                    range     : [0.001,'*'], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    position  : [3,0,1,1],   // [row,col,rowSpan,colSpan]
                    showon    : {sec1:['crank2']}
                  }
            }
    },
    sec6: { type     : 'section',
            title    : 'Advanced options for model building',
            open     : false,  // true for the section to be initially open
            showon   : {sec1:['crank2']},
            position : [5,0,1,5],
            contains : {
              COMB_PHDMMB_DO : {
                    type      : 'checkbox',
                    label     : 'Use the "combined" algorithm',
                    iwidth    : 300,
                    tooltip   : 'Unclick the option if you do not wish to use ' +
                                'the "combined" Crank2 algorithm. For example, ' +
                                'it may rarely happen that density modification ' +
                                'makes the phases worse.',
                    value     : true,
                    position  : [0,0,1,3],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',     // apply logical 'or' to all items
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              BUILD_LEVEL : {
                    type      : 'combobox',
                    keyword   : 'num_parallel::',
                    label     : 'Parallel model building depth',
                    lwidth    : 250,
                    tooltip   : 'The level of thoroughness of the model building ' +
                                'algorithm. Higher levels may deliver better ' +
                                'results as a trade-off for speed.',
                    range     : ['1|Basic',
                                 '3|Hightened',
                                 '6|Advanced',
                                 '10|Enforced',
                                 '15|Superior'
                                ],
                    value     : '1',
                    position  : [1,0,1,1]
                  },

              //  =========== PARAMETERS FOR ITERATIVE MODEL BUILDING =========

              TITLE1 : {
                    type      : 'label',  // just a separator
                    label     : '<h3>Parameters for iterative model building</h3>',
                    position  : [2,0,1,4],
                    showon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              MBREF_MB_PROGRAM : {
                    type      : 'combobox',
                    keyword   : 'mb',
                    label     : 'Model building program',
                    lwidth    : 250,
                    tooltip   : 'The program that will be used for building of ' +
                                'the protein model.',
                    range     : ['_blank_|Auto',
                                 'buccaneer|Buccaneer',
                                 'arpwarp|Arp/wArp',
                                 'shelxe|ShelXE'
                                ],
                    value     : '_blank_',
                    position  : [4,0,1,1],
                    showon    : { _:'&&',sec1:['crank2'],
                                  comb: { _:'||',
                                          COMB_PHDMMB_DO:[false],
                                          native:[1],
                                          hkl   :[2,3,4]
                                        }
                                }
                  },
              /*
              SELEN_CBX : {
                    type     : 'checkbox',
                    label    : 'Build Selenomethionine (MSE instead of MET)',
                    keyword  : '-build-semet',
                    tooltip  : 'Check to build selenomethionine',
                    value    : false,
                    position : [5,0,1,3],
                    showon   : {MBREF_MB_PROGRAM:['buccaneer']}
                  },
              */
              MBREF_BIGCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'bigcyc::', // the real keyword for job input stream
                    label     : 'Number of building cycles',
                    lwidth    : 250,
                    tooltip   : 'Number of the model building iterations.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [6,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              MBREF_EXCLUDE_FREE : {
                    type      : 'combobox',
                    keyword   : '',
                    label     : 'Exclude free reflections in building',
                    tooltip   : 'Specify whether the free reflections should ' +
                                'be excluded.',
                    range     : ['_blank_|Auto',
                                 'True|Yes',
                                 'False|No',
                                ],
                    value     : '_blank_',
                    position  : [8,0,1,1],
                    showon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },


              //  =========== PARAMETERS FOR ITERATIVE MODEL BUILDING =========

              TITLE2 : {
                    type      : 'label',  // just a separator
                    label     : '<h3>Parameters for combined model building</h3>',
                    position  : [3,0,1,4],
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_DMFULL_DM_PROGRAM : {
                    type      : 'combobox',
                    keyword   : 'dmfull dm',
                    label     : 'Density modification program',
                    tooltip   : 'The program that will be used for crystal ' +
                                'space density modification.',
                    range     : ['_blank_|Auto',
                                 'parrot|Parrot',
                                 'solomon|Solomon'
                                ],
                    value     : '_blank_',
                    position  : [5,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_START_SHELXE : {
                    type      : 'combobox',
                    keyword   : 'start_shelxe::',
                    label     : 'Start with a few SHELXE tracing cycles',
                    tooltip   : 'If "yes" is chosen then a few initial model tracing ' +
                                'cycles will be performed by ShelxE\'s backbone ' +
                                'tracing algorithm, followed by the usual ' +
                                'Buccaneer model building cycles. The "combined" ' +
                                'algorithm will be still used throughout. This ' +
                                'option is sometimes useful at higher resolutions.',
                    range     : ['_blank_|Auto',
                                 'True|Yes',
                                 'False|No',
                                ],
                    value     : '_blank_',
                    position  : [7,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_MINBIGCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'minbigcyc::',  // the real keyword for job input stream
                    label     : 'Minimal number of building cycles',
                    tooltip   : 'The minimal number of building cycles will be ' +
                                'performed in case of "easy" tracing. For a ' +
                                'more difficult tracing, more cycles will be ' +
                                'performed, up to the specified maximal number ' +
                                'of building cycles.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [9,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_MAXBIGCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'maxbigcyc::',  // the real keyword for job input stream
                    label     : 'Maximal number of building cycles',
                    tooltip   : 'The model building will stop after the ' +
                                'specified number of building cycles, even ' +
                                'if the model is not built yet.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [11,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_SKIP_INITIAL_BUILD : {
                    type      : 'combobox',
                    keyword   : 'skip_initial_build::',
                    label     : 'Skip the first model building cycle',
                    tooltip   : 'Use this option to skip the initial (re)' +
                                'building, thus starting with phase restrained ' +
                                'refinement. If not skipped then the model is ' +
                                'first (re)built and then subjected to phase ' +
                                'restrained refinement.',
                    range     : ['_blank_|Auto',
                                 'True|Yes',
                                 'False|No',
                                ],
                    value     : '_blank_',
                    position  : [13,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_REBUILD_ONLY : {
                    type      : 'combobox',
                    keyword   : 'rebuild_only::',
                    label     : 'Soft rebuilding',
                    tooltip   : 'In case of soft rebuilding, the actual model ' +
                                'is inputted to each model building cycle. If ' +
                                'soft building is not used then Crank2 alternates ' +
                                'cycles of rebuilding inputting and not inputting ' +
                                'the model. Soft rebuilding may be useful when ' +
                                'rebuilding an already good model where model ' +
                                'bias is not a major concern.',
                    range     : ['_blank_|Auto',
                                 'True|Yes',
                                 'False|No',
                                ],
                    value     : '_blank_',
                    position  : [15,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_ALWAYS_EXCLUDE_FREE : {
                    type      : 'combobox',
                    keyword   : 'always_exclude_free::',
                    label     : 'Exclude free reflections',
                    tooltip   : 'Specify when the free reflections should be excluded.',
                    range     : ['_blank_|Auto',
                                 'True|always',
                                 'False|in last cycles',
                                 'never|never'
                                ],
                    value     : '_blank_',
                    position  : [17,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DO:[false],
                                  native:[1],
                                  hkl   :[2,3,4]
                                }
                  },
              COMB_PHDMMB_NCS_DET : {
                    type      : 'combobox',
                    keyword   : 'ncs_det::',
                    label     : 'Try to determine NCS',
                    tooltip   : 'Option to try to determine NCS operators and ' +
                                'use them for density averaging. By defalt, ' +
                                'the NCS operators will be obtained from the ' +
                                'anomalous substructure which may be time ' +
                                'consuming with a large substructure.',
                    range     : ['_blank_|Auto',
                                 'True|Yes',
                                 'False|No',
                                ],
                    value     : '_blank_',
                    position  : [19,0,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DMFULL_DM_PROGRAM:['solomon'],
                                  MONOMERS_ASYM :['1'],
                                  COMB_PHDMMB_DO:[false],
                                  native : [1],
                                  hkl    : [2,3,4]
                                }
                  },
              COMB_PHDMMB_NCS_DET_MR : {
                    type      : 'checkbox',
                    keyword   : 'ncs_det_mr::',
                    label     : 'from partial model (rather than heavy atoms)',
                    tooltip   : 'The NCS operators for NCS averaging will be ' +
                                'obtained from the initial partial model. ' +
                                'Requires a reasonably good input partial model.',
                    value     : false,
                    translate : ['False','True'], // needed for getKWItem() in basic.py
                    position  : [20,4,1,1],
                    showon    : {sec1:['crank2']},
                    hideon    : { _:'||',
                                  COMB_PHDMMB_DMFULL_DM_PROGRAM:['solomon'],
                                  MONOMERS_ASYM          : ['1'],
                                  COMB_PHDMMB_NCS_DET    : ['_blank_','False'],
                                  COMB_PHDMMB_DO         : [false],
                                  'revision.subtype:xyz' : [0,-1],
                                  native : [1],
                                  hkl    : [2,3,4]
                                }
                  }

            }
    },
    sec7: { type     : 'section',
            title    : 'Advanced options for density modification and model building',
            open     : false,  // true for the section to be initially open
            position : [6,0,1,5],
            showon   : {sec1:['shelx-auto']},
            hideon   : {_:'&&','revision.subtype:xyz':[1],PARTIAL_AS_SUBSTR:[false]},
            contains : {
              PHDMMB_BIGCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'bigcyc::',  // the real keyword for job input stream
                    label     : 'Number of poly-Ala tracing cycles',
                    tooltip   : 'Number of model tracing cycles.',
                    range     : [0,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [0,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon   : {sec1:['shelx-auto']}
                  },
              PHDMMB_DMCYC : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'dmcyc::',  // the real keyword for job input stream
                    label     : 'Number of density modification cycles',
                    tooltip   : 'Number of density modification iterations per each model building cycle.',
                    range     : [0,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    position  : [1,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon   : {sec1:['shelx-auto']}
                  },
              PHDMMB_THRESHOLD_STOP : {
                    type      : 'real_',  // blank value is allowed
                    keyword   : 'threshold_stop::', // the real keyword for job input stream
                    label     : 'CC threshold for early stop',
                    tooltip   : 'If this threshold is reached, model tracing ' +
                                'will stop, assuming a good quality model has ' +
                                'been built. Saves time for the "easy" to build ' +
                                'cases. At least 3 tracing cycles are always ' +
                                'performed before the early stop is applied.',
                    range     : [0.001,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [2,0,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {sec1:['shelx-auto']}
                  },
              PHDMMB_THRESHOLD_HAND_STOP : {
                    type      : 'real_',  // blank value is allowed
                    keyword   : 'threshold_hand_stop::', // the real keyword for job input stream
                    label     : 'CC threshold for the "other" hand early stop',
                    tooltip   : 'If this correlation coefficient is reached, ' +
                                'the hand is considered correct and tracing ' +
                                'with the other hand is stopped.',
                    range     : [0.001,'*'],   // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value     : '',        // value to be paired with the keyword
                    position  : [3,0,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {sec1:['shelx-auto']}
                  },
              PHDMMB_PROGRAM_KEYWORDS : {
                    type      : 'string_',   // empty string allowed
                    keyword   : 'shelxe ',
                    label     : 'SHELXE program arguments',
                    tooltip   : 'Custom arguments that will be passed directly to SHELXE',
                    iwidth    : '500',
                    value     : '',
                    position  : [5,0,1,1],
                    showon    : {sec1:['shelx-auto']}
                  }
            }
    }

  }

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskCrank2',TaskCrank2,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskCrank2',TaskCrank2,TaskTemplate.prototype );

// ===========================================================================

TaskCrank2.prototype.icon           = function()  { return 'task_crank2'; }
TaskCrank2.prototype.clipboard_name = function()  { return '"Crank-2"';   }

TaskCrank2.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'finds heavy-atom substructure, performs EP and builds atomic model';
}

TaskCrank2.prototype.currentVersion = function()  {
let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskCrank2.prototype.canEndGracefully = function() { return true; }

TaskCrank2.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['crank2','experimental', 'phasing',
                                           'auto-ep', 'ep', 'substructure'] );
}

if (!__template)  {

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskCrank2.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

/*
  TaskCrank2.prototype.addCustomDataState = function ( inpDataRef,dataState ) {

    //let nHKL = dataState['hkl'];
    let item = this.getInputItem ( inpDataRef,'revision' );
    if (item)  {
      let dropdown = item.dropdown[0];
      let dt = item.dt[dropdown.getValue()];
      if (dt.Structure)  dataState['pmodel'] =  1;
                   else  dataState['pmodel'] = -1;
      if (dropdown.customGrid.hasOwnProperty('nfind'))
        dataState['MONOMERS_ASYM'] = dropdown.customGrid.nfind.getValue();
    }

    return;

  }
*/

/*
  TaskCrank2.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if ((emitterId=='hkl') || (emitterId=='native') || (emitterId=='pmodel')) {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let dataState  = this.getDataState ( inpDataRef );
      let nHKL       = dataState['hkl'];
      let nNative    = dataState['native'];
      let nPModel    = dataState['pmodel'];
      let IR         = false;

      if (nNative>0)  {
        let native = this.getInputItem ( inpDataRef,'native' );
        if (native)  {
          if (native.dropdown[0].hasOwnProperty('customGrid'))  {
            let customGrid    = native.dropdown[0].customGrid;
            let showUFP_cbx   = (nNative>0) && (nHKL<=1);
            useForPhasing_cbx = customGrid.useForPhasing;
            IR                = useForPhasing_cbx.getValue();
            useForPhasing_cbx.setVisible ( showUFP_cbx );
            customGrid       .setVisible ( showUFP_cbx );
          }
        }
      }

      let pmodel   = this.getInputItem ( inpDataRef,'pmodel' );
      let isPModel = false;
      if (pmodel)  {
        inpParamRef.grid.setRowVisible ( pmodel.dropdown[0].row,
                                         (nHKL==1) && (!IR) );
        isPModel = (nHKL==1) && (!IR) && (pmodel.dropdown[0].getValue()>=0);
      }

      if (this.state==job_code.new)  {

        let name = this.name;
        if (nHKL<=1)  {
          if (nNative<=0)  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD' );
              this.name  = makeSuffix ( this.name ,'MR-SAD' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD' );
              this.name  = makeSuffix ( this.name ,'SAD' );
            }
          } else if (IR)  {
            this.title = makeSuffix ( this.title,'SIRAS' );
            this.name  = makeSuffix ( this.name ,'SIRAS' );
          } else  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD + Native' );
              this.name  = makeSuffix ( this.name ,'MR-SAD + Native' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD + Native' );
              this.name  = makeSuffix ( this.name ,'SAD + Native' );
            }
          }
        } else  {
          if (nNative<=0)  {
            this.title = makeSuffix ( this.title,'MAD' );
            this.name  = makeSuffix ( this.name ,'MAD' );
          } else  {
            this.title = makeSuffix ( this.title,'MAD + Native' );
            this.name  = makeSuffix ( this.name ,'MAD + Native' );
          }
        }

        if (this.name!=name)  {
          let inputPanel = inpParamRef.grid.parent.parent;
          inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
          inputPanel.header.uname_inp.setStyle ( 'text','',
                                this.name.replace(/<(?:.|\n)*?>/gm, '') );
          this.updateInputPanel ( inputPanel );
          inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                  job_dialog_reason.rename_node );
        }

      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }
*/

/*
  TaskCrank2.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    //if ((emitterId=='hkl') || (emitterId=='native') || (emitterId=='pmodel')) {
    if (['revision','hkl','native','substructure','pmodel'].indexOf(emitterId)>=0)  {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let dataState  = this.getDataState ( inpDataRef );
      let nHKL       = dataState['hkl'];
      let nNative    = dataState['native'];
      let isPModel   = (dataState['pmodel']>0);
      let IR         = false;
      let native     = this.getInputItem ( inpDataRef,'native' );
      let hkl        = this.getInputItem ( inpDataRef,'hkl'    );

      if ((nNative>0) && native)  {
        if (native.dropdown[0].hasOwnProperty('customGrid'))  {
          let customGrid    = native.dropdown[0].customGrid;
          let showUFP_cbx   = (nNative>0) && (nHKL<=0);
          useForPhasing_cbx = customGrid.useForPhasing;
          IR                = useForPhasing_cbx.getValue();
          useForPhasing_cbx.setVisible ( showUFP_cbx );
          customGrid       .setVisible ( showUFP_cbx );
        }
      }

      if (this.state==job_code.new)  {

        let name = this.name;
        if (nHKL<=0)  {
          if (nNative<=0)  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD' );
              this.name  = makeSuffix ( this.name ,'MR-SAD' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD' );
              this.name  = makeSuffix ( this.name ,'SAD' );
            }
          } else if (IR)  {
            this.title = makeSuffix ( this.title,'SIRAS' );
            this.name  = makeSuffix ( this.name ,'SIRAS' );
          } else  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD + Native' );
              this.name  = makeSuffix ( this.name ,'MR-SAD + Native' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD + Native' );
              this.name  = makeSuffix ( this.name ,'SAD + Native' );
            }
          }
        } else  {
          if (nNative<=0)  {
            this.title = makeSuffix ( this.title,'MAD' );
            this.name  = makeSuffix ( this.name ,'MAD' );
          } else  {
            this.title = makeSuffix ( this.title,'MAD + Native' );
            this.name  = makeSuffix ( this.name ,'MAD + Native' );
          }
        }

        if (this.name!=name)  {
          let inputPanel = inpParamRef.grid.parent.parent;
          inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
          let new_title = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
          inputPanel.header.uname_inp.setStyle ( 'text','',new_title );
          inputPanel.job_dialog.changeTitle ( new_title );
          //this.updateInputPanel ( inputPanel );
          inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                  job_dialog_reason.rename_node );
        }

      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if (hkl && native && isPModel)  {
      let row_hkl    = hkl.dropdown[0].row;
      inpParamRef.grid.setRowVisible ( row_hkl,false );
      let row_native = native.dropdown[0].row;
      for (let r=row_hkl;r<row_native;r++)
        inpParamRef.grid.setRowVisible ( r,false );
    }

  }
*/

  TaskCrank2.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

//    if (['revision','hkl','native','substructure','pmodel'].indexOf(emitterId)>=0)  {

    let hkl      = null;
    let native   = null;
    let isPModel = false;

    if (['revision','hkl','native'].indexOf(emitterId)>=0)  {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let revision   = this.getInputItem ( inpDataRef,'revision' ).dropdown[0];
      native         = this.getInputItem ( inpDataRef,'native' );
      hkl            = this.getInputItem ( inpDataRef,'hkl'    );
      //let substr     = this.getInputItem ( inpDataRef,'substructure' );
      //let pmodel     = this.getInputItem ( inpDataRef,'pmodel'       );

      //console.log ( JSON.stringify(dt) );
      //let dt         = revision.dt[revision.getValue()];
      //let substr     = (dt.Options.phasing_sel!='model');
      //let pmodel     = (dt.Options.phasing_sel!='substructure');
      //let main_substructure = (dt.subtype.indexOf('substructure')>=0);
      //let main_xyz          = (dt.subtype.indexOf('xyz')>=0);

      let dataState  = this.getDataState ( inpDataRef );
      let nHKL       = dataState['hkl'];
      let nNative    = dataState['native'];
      //let dt         = revision.dt[revision.getValue()];
      // isPModel   = false;
      if (revision.customGrid.phasing_sel)
        isPModel = (revision.customGrid.phasing_sel.getValue()!='substructure');
      //let isPModel   = (dt.Options.phasing_sel!='substructure');
      //let isPModel   = main_xyz || (dataState['pmodel']>0);
      let IR         = false;

      if ((nNative>0) && native)  {
        if (native.dropdown[0].hasOwnProperty('customGrid'))  {
          let customGrid        = native.dropdown[0].customGrid;
          let showUFP_cbx       = (nNative>0) && (nHKL<=0);
          let useForPhasing_cbx = customGrid.useForPhasing;
          IR                    = useForPhasing_cbx.getValue();
          useForPhasing_cbx.setVisible ( showUFP_cbx );
          customGrid       .setVisible ( showUFP_cbx );
        }
      }

      if (this.state==job_code.new)  {

        let name = this.name;

        if (nHKL<=0)  {
          if (nNative<=0)  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD' );
              this.name  = makeSuffix ( this.name ,'MR-SAD' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD' );
              this.name  = makeSuffix ( this.name ,'SAD' );
            }
          } else if (IR)  {
            this.title = makeSuffix ( this.title,'SIRAS' );
            this.name  = makeSuffix ( this.name ,'SIRAS' );
          } else  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD + Native' );
              this.name  = makeSuffix ( this.name ,'MR-SAD + Native' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD + Native' );
              this.name  = makeSuffix ( this.name ,'SAD + Native' );
            }
          }
        } else  {
          if (nNative<=0)  {
            this.title = makeSuffix ( this.title,'MAD' );
            this.name  = makeSuffix ( this.name ,'MAD' );
          } else  {
            this.title = makeSuffix ( this.title,'MAD + Native' );
            this.name  = makeSuffix ( this.name ,'MAD + Native' );
          }
        }

        if (this.name!=name)  {
          let inputPanel = inpParamRef.grid.parent.parent;
          inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
          let new_title = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
          inputPanel.header.uname_inp.setStyle ( 'text','',new_title );
          inputPanel.job_dialog.changeTitle ( new_title );
          //this.updateInputPanel ( inputPanel );
          inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                  job_dialog_reason.rename_node );
        }

      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  //   /*
  //   if (substr)
  //     inpParamRef.grid.setRowVisible ( substr.dropdown[0].row,(nHKL<=0) && (!main_substructure) );
  //   if (pmodel)
  //     inpParamRef.grid.setRowVisible ( pmodel.dropdown[0].row,(nHKL<=0) && (!main_xyz) );
  //   */

    if (hkl && native && isPModel)  {
      // make sure that HKL comboboxes are hidden for MR-SAD
      let row_hkl    = hkl.dropdown[0].row;
      let row_native = native.dropdown[0].row;
      for (let r=row_hkl;r<row_native;r++)
        inpParamRef.grid.setRowVisible ( r,false );
    }

  }


  TaskCrank2.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      let event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }

  TaskCrank2.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    function addMessage ( label,dsname,message )  {
      input_msg += '|<b>' + label + ':</b> ' + 
                   'dataset<sub>&nbsp;</sub><br><span style="white-space:nowrap;">' +
                   dsname + '<sub>&nbsp;</sub></span><br>' + message + '<p>';
    }

    let hkl0   = this.input_data.getData ('revision' )[0].HKL;
    let hkl    = this.input_data.getData ( 'hkl'     );
    let native = this.input_data.getData ( 'native'  );

    for (let i=0;i<hkl.length;i++)  {
      let ok = true;
      if (hkl[i].dataId==hkl0.dataId)  {
        addMessage ( 'Reflection data',hkl[i].dname,
                     'duplicates one given in Structure revision, which is not ' +
                     'allowed. If you are trying SAD, do not specify any additional ' +
                     'datasets' );
        ok = false;
      }
      for (let j=i+1;(j<hkl.length) && ok;j++)
        if (hkl[i].dataId==hkl[j].dataId)  {
          addMessage ( 'Reflection data',hkl[i].dname,
                      'is used in more than one input positions, which is not ' +
                      'allowed' );
          ok = false;
        }
      if ((native.length>0) && ok)  {
        if (hkl[i].dataId==native[0].dataId)
          addMessage ( 'Native dataset',hkl[i].dname,
                      'as both anomalous data and native dataset, which is ' +
                      'not allowed' );
      }
    }

    return input_msg;

  }


} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskCrank2.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hklrev'] = [revision.HKL];
      //if (revision.Structure)  {
      //  if (revision.Structure.isSubstructure())
      //        this.input_data.data['substructure'] = [revision.Structure];
      //  else  this.input_data.data['pmodel']       = [revision.Structure];
      //}
      switch (revision.Options.phasing_sel)  {
        case 'substructure'     :
                if (revision.Substructure)
                  this.input_data.data['substructure'] = [revision.Substructure];
                break;
        case 'model'            :
                if (revision.Structure)
                  this.input_data.data['pmodel']       = [revision.Structure];
                break;
        case 'model-and-substr' :
                if (revision.Substructure)
                  this.input_data.data['substructure'] = [revision.Substructure];
                if (revision.Structure)
                  this.input_data.data['pmodel']       = [revision.Structure];
        default : ;
      }
      this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskCrank2.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.crank2', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in both node and a browser

  module.exports.TaskCrank2 = TaskCrank2;

}
