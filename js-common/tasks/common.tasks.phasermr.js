
/*
 *  =================================================================
 *
 *    19.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phasermr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Phaser-MR Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskPhaserMR()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskPhaserMR';
  this.name    = 'phaser MR';
  this.setOName ( 'phaser-mr' );  // default output file name template
  this.title   = 'Molecular Replacement with Phaser';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision',   // input Id for referencing input fields
      customInput : 'phaser-mr1', // lay custom fields below the dropdown
      version     : 0,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    /*
    },{
      data_type   : {'DataStructure':['phases']}, // data type(s) and subtype(s)
      label       : 'Phases',  // label for input dialog
      inputId     : 'phases',       // input Id for referencing input fields
      tooltip     : 'The phases to be used in Translation Function.',
      version     : 0,          // minimum data version allowed
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    */
    },{
      data_type   : {'DataEnsemble':['~mmcif_only'],
                     'DataModel'   :['~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Model ensemble', // label for input dialog
      inputId     : 'model',      // input Id for referencing input fields
      customInput : 'phaser-mr',  // lay custom fields below the dropdown (Ncopies, R.m.s.d.)
//**      castTo      : 'DataEnsemble', // all input types will be casted to the specified
      min         : 1,            // minimum acceptable number of data instances
      max         : 1000          // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sep0: { type     : 'label',   // just a separator
            label    : '&nbsp;',
            position : [0,0,1,5]
          },

    sec0: { type     : 'section',
            title    : 'Rotation and translation target function parameters',
            open     : false,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {

              RF_TARGET_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'TARGET ROT',
                    label    : 'Rotation function search target',
                    tooltip  : 'TARGET: Select the rotation target function to be used',
                    iwidth   : 180,      // width of input field in px
                    range    : ['FAST|Fast',
                                'BRUTE|Brute'
                               ],
                    value    : 'FAST',
                    position : [0,0,1,1]
                  },

              RF_ANGLE_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'ROTATE VOLUME',
                    label    : 'Search',
                    align    : 'right',
                    tooltip  : 'Select angular search mode',
                    iwidth   : 180,      // width of input field in px
                    range    : ['AROUND|Around an angle',
                                'FULL|All angles'
                               ],
                    value    : 'AROUND',
                    position : [1,0,1,1],
                    showon   : { RF_TARGET_SEL:['BRUTE'] }
                  },

              RF_ALPHA : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'EULER',    // the real keyword for job input stream
                    label    : '&alpha;:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [1,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', RF_TARGET_SEL:['BRUTE'], RF_ANGLE_SEL:['AROUND'] }
                  },

              RF_BETA : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'BETA',    // the real keyword for job input stream
                    label    : '&beta;:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [1,6,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', RF_TARGET_SEL:['BRUTE'], RF_ANGLE_SEL:['AROUND'] }
                  },

              RF_GAMMA : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'GAMMA',    // the real keyword for job input stream
                    label    : '&gamma;:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [1,9,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', RF_TARGET_SEL:['BRUTE'], RF_ANGLE_SEL:['AROUND'] }
                  },

              RF_RANGE : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'RANGE',    // the real keyword for job input stream
                    label    : 'Range:',
                    lwidth   : 50,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '10.0',     // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 360',
                    range    : [0,360],    // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value    : '10.0',     // value to be paired with the keyword
                    position : [1,12,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', RF_TARGET_SEL:['BRUTE'], RF_ANGLE_SEL:['AROUND'] }
                  },

              RF_CLUSTER_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'PEAKS ROT CLUSTER',
                    label    : 'Cluster rotation peaks before passing to TF',
                    tooltip  : 'Select whether clustered or raw peaks are saved',
                    iwidth   : 180,      // width of input field in px
                    range    : ['ON|On',
                                'OFF|Off'
                               ],
                    value    : 'ON',
                    position : [2,0,1,1],
                    showon   : { RF_TARGET_SEL:['FAST'] }
                  },

              TF_TARGET_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'TARGET TRA',
                    label    : 'Translation function search target',
                    tooltip  : 'TARGET: Select the translation target function to be used',
                    iwidth   : 180,      // width of input field in px
                    range    : ['FAST|Fast',
                                'BRUTE|Brute'
                               ],
                    value    : 'FAST',
                    position : [3,0,1,1]
                  },

              TF_POINT_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'TRANSLATE VOLUME',
                    label    : 'Search',
                    align    : 'right',
                    tooltip  : 'Select translation search mode',
                    iwidth   : 180,      // width of input field in px
                    range    : ['AROUND|Around a point',
                                'FULL|All points'
                               ],
                    value    : 'AROUND',
                    position : [4,0,1,1],
                    showon   : { TF_TARGET_SEL:['BRUTE'] }
                  },

              TF_SPACE_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'TRANSLATE',
                    label    : 'Space',
                    align    : 'right',
                    tooltip  : 'Select orthogonal or fractional space',
                    iwidth   : 180,      // width of input field in px
                    range    : ['ORTH|Orthogonal',
                                'FRAC|Fractional'
                               ],
                    value    : 'ORTH',
                    position : [5,0,1,1],
                    showon   : { _:'&&', TF_TARGET_SEL:['BRUTE'], TF_POINT_SEL:['AROUND'] }
                  },

              TF_X : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'POINT',    // the real keyword for job input stream
                    label    : 'X:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [5,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', TF_TARGET_SEL:['BRUTE'], TF_POINT_SEL:['AROUND'] }
                  },

              TF_Y : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'BETA',    // the real keyword for job input stream
                    label    : 'Y:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [5,6,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', TF_TARGET_SEL:['BRUTE'], TF_POINT_SEL:['AROUND'] }
                  },

              TF_Z : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'GAMMA',    // the real keyword for job input stream
                    label    : 'Z:',
                    lwidth   : 30,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '0.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 180',
                    range    : [0,180],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '0.0',     // value to be paired with the keyword
                    position : [5,9,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', TF_TARGET_SEL:['BRUTE'], TF_POINT_SEL:['AROUND'] }
                  },

              TF_RANGE : {
                    type     : 'real',     // '_' means blank value is allowed
                    keyword  : 'RANGE',    // the real keyword for job input stream
                    label    : 'Range:',
                    lwidth   : 50,
                    align    : 'right',
                    iwidth   : 50,
                    default  : '10.0',     // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 360',
                    range    : [0,360],    // may be absent (no limits) or must
                                           // be one of the following:
                                           //   ['*',max]  : limited from top
                                           //   [min,'*']  : limited from bottom
                                           //   [min,max]  : limited from top and bottom
                    value    : '10.0',     // value to be paired with the keyword
                    position : [5,12,1,1], // [row,col,rowSpan,colSpan]
                    showon   : { _:'&&', TF_TARGET_SEL:['BRUTE'], TF_POINT_SEL:['AROUND'] }
                  }


            }
          },

    sec1: { type     : 'section',
            title    : 'Search options',
            open     : false,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {

              //  ------ Translational NCS use --------------------------------

              TNCS_SEL : {
                    type     : 'combobox',  // the real keyword for job input stream
                    keyword  : 'TNCS USE',
                    label    : 'Use translational NCS if present',
                    tooltip  : 'Check to use translational NCS if present',
                    iwidth   : 220,      // width of input field in px
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'OFF',
                    position : [0,0,1,1]
                  },
              TNCS_LABEL : {
                    type     : 'label',  // just a separator
                    label    : 'Number of TNCS-related assemblies',
                    position : [0,3,1,5],
                    showon   : {TNCS_SEL:['ON']}
                  },
              TNCS_NA : {
                    type     : 'integer_',  // '_' means blank value is allowed
                    keyword  : 'TNCS NMOL', // the real keyword for job input stream
                    label    : '',
                    lwidth   : 0,
                    iwidth   : 50,
                    default  : '2',         // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 200, or leave ' +
                               'blank for automatic choice',
                    range    : [1,200],   // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '2',       // value to be paired with the keyword
                    position : [0,4,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {TNCS_SEL:['ON']}
                  },

              //  ------ Packing criterion ------------------------------------

              PACK_SEL : {
                    type     : 'combobox',
                    keyword  : 'PACK SELECT',
                    label    : 'Packing criterion',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Packing criterion',
                    range    : ['PERCENT|pairwise percent',
                                'ALL|accept all solutions'
                               ],
                    value    : 'PERCENT',
                    position : [1,0,1,1]
                  },
              PACK_CUTOFF : {
                    type     : 'integer_',  // '_' means blank value is allowed
                    keyword  : 'PACK CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '7',    // to be displayed in grey
                    tooltip  : 'Default value is 7%; increase for low-homology searches',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '7',      // value to be paired with the keyword
                    position : [1,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PACK_SEL:['PERCENT']}
                  },

              //  ------ Rotation search peaks cutoff specification -----------

              RS_PEAKS_SEL : {
                    type     : 'combobox',
                    keyword  : 'PEAKS ROT SELECT',
                    label    : 'Rotation search peak selection',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Peaks selection',
                    range    : ['PERCENT|percentage of top peak',
                                'SIGMA|sigma (Z-score) cutoff',
                                'NUMBER|number of peaks',
                                'ALL|all peaks'
                               ],
                    value    : 'PERCENT',
                    position : [2,0,1,1]
                  },
              RS_PEAKS_P_CUTOFF : {
                    type     : 'integer_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS ROT CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '75',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '75',      // value to be paired with the keyword
                    position : [2,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {RS_PEAKS_SEL:['PERCENT']}
                  },
              RS_PEAKS_S_CUTOFF : {
                    type     : 'real_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS ROT CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '2.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 10, or leave ' +
                               'blank for automatic choice',
                    range    : [1,10],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '2.0',     // value to be paired with the keyword
                    position : [2,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {RS_PEAKS_SEL:['SIGMA']}
                  },
              RS_PEAKS_N_CUTOFF : {
                    type     : 'integer_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS ROT CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff (N<sub>peaks</sub>)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '30',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 200, or leave ' +
                               'blank for automatic choice',
                    range    : [1,200],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '30',      // value to be paired with the keyword
                    position : [2,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {RS_PEAKS_SEL:['NUMBER']}
                  },

              //  ------ Translation search peaks cutoff specification --------

              TS_PEAKS_SEL : {
                    type     : 'combobox',
                    keyword  : 'PEAKS TRA SELECT',
                    label    : 'Translation search peak selection',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Peaks selection',
                    range    : ['PERCENT|percentage of top peak',
                                'SIGMA|sigma (Z-score) cutoff',
                                'NUMBER|number of peaks',
                                'ALL|all peaks'
                               ],
                    value    : 'PERCENT',
                    position : [3,0,1,1]
                  },
              TS_PEAKS_P_CUTOFF : {
                    type     : 'integer_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS TRA CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '75',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '75',      // value to be paired with the keyword
                    position : [3,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {TS_PEAKS_SEL:['PERCENT']}
                  },
              TS_PEAKS_S_CUTOFF : {
                    type     : 'real_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS TRA CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '2.0',           // to be displayed in grey
                    tooltip  : 'Choose a value between 0 and 10, or leave ' +
                               'blank for automatic choice',
                    range    : [1,10],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '2.0',     // value to be paired with the keyword
                    position : [3,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {TS_PEAKS_SEL:['SIGMA']}
                  },
              TS_PEAKS_N_CUTOFF : {
                    type     : 'integer_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS TRA CUTOFF', // the real keyword for job input stream
                    label    : 'Cutoff (N<sub>peaks</sub>)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '30',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 200, or leave ' +
                               'blank for automatic choice',
                    range    : [1,200],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '30',      // value to be paired with the keyword
                    position : [3,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {TS_PEAKS_SEL:['NUMBER']}
                  },

              //  ------ Deep rotation search parameter --------

              DR_SEARCH_SEL : {
                    type     : 'combobox',
                    keyword  : '',
                    label    : 'Deep rotation search',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Second pass through rotation peaks for translation search',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [4,0,1,1]
                  },
              DR_SEARCH_DOWN : {
                    type     : 'integer_',        // '_' means blank value is allowed
                    keyword  : 'PEAKS ROT DOWN', // the real keyword for job input stream
                    label    : 'Down (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '15',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '15',      // value to be paired with the keyword
                    position : [4,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {DR_SEARCH_SEL:['ON']}
                  },

              //  ------ Purge rotation peaks ---------------------------------

              PURGE_ROT_SEL : {
                    type     : 'combobox',
                    keyword  : 'PURGE ROT ENABLE',
                    label    : 'Purge rotation peaks',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Choose whether to purge the solutions from RF ' +
                               '(Rotation Function)',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [5,0,1,1]
                  },
              PURGE_ROT_CUTOFF : {
                    type     : 'integer_',          // '_' means blank value is allowed
                    keyword  : 'PURGE ROT PERCENT', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '75',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '75',      // value to be paired with the keyword
                    position : [5,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_ROT_SEL:['ON']}
                  },
              PURGE_ROT_NUMBER : {
                    type     : 'integer_',         // '_' means blank value is allowed
                    keyword  : 'PURGE ROT NUMBER', // the real keyword for job input stream
                    label    : 'Max number',
                    align    : 'right',
                    lwidth   : 85,
                    iwidth   : 50,
                    default  : '100',              // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,100],   // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '',        // value to be paired with the keyword
                    position : [5,6,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_ROT_SEL:['ON']}
                  },

              //  ------ Purge translation peaks ------------------------------

              PURGE_TRA_SEL : {
                    type     : 'combobox',
                    keyword  : 'PURGE TRA ENABLE',
                    label    : 'Purge translation peaks',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Choose whether to purge the solutions from TF ' +
                               '(Translation Function)',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [6,0,1,1]
                  },
              PURGE_TRA_CUTOFF : {
                    type     : 'integer_',          // '_' means blank value is allowed
                    keyword  : 'PURGE TRA PERCENT', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '75',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '75',      // value to be paired with the keyword
                    position : [6,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_TRA_SEL:['ON']}
                  },
              PURGE_TRA_NUMBER : {
                    type     : 'integer_',         // '_' means blank value is allowed
                    keyword  : 'PURGE TRA NUMBER', // the real keyword for job input stream
                    label    : 'Max number',
                    align    : 'right',
                    lwidth   : 85,
                    iwidth   : 50,
                    default  : '40',               // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 40, or leave ' +
                               'blank for automatic choice',
                    range    : [1,40],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '',        // value to be paired with the keyword
                    position : [6,6,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_TRA_SEL:['ON']}
                  },


              //  ------ Purge refinement peaks ------------------------------

              PURGE_RNP_SEL : {
                    type     : 'combobox',
                    keyword  : 'PURGE RNP ENABLE',
                    label    : 'Purge refinement peaks',
                    iwidth   : 220,      // width of input field in px
                    tooltip  : 'Choose whether to purge the solutions from RNP ' +
                               '(Translation Function)',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [7,0,1,1]
                  },
              PURGE_RNP_CUTOFF : {
                    type     : 'integer_',          // '_' means blank value is allowed
                    keyword  : 'PURGE RNP PERCENT', // the real keyword for job input stream
                    label    : 'Cutoff (%)',
                    //lwidth   : 60,
                    iwidth   : 50,
                    default  : '75',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '75',      // value to be paired with the keyword
                    position : [7,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_RNP_SEL:['ON']}
                  },
              PURGE_RNP_NUMBER : {
                    type     : 'integer_',         // '_' means blank value is allowed
                    keyword  : 'PURGE RNP NUMBER', // the real keyword for job input stream
                    label    : 'Max number',
                    align    : 'right',
                    lwidth   : 85,
                    iwidth   : 50,
                    default  : '20',               // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 20, or leave ' +
                               'blank for automatic choice',
                    range    : [1,20],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '',        // value to be paired with the keyword
                    position : [7,6,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {PURGE_RNP_SEL:['ON']}
                  }


            }
          },

    sec2: { type     : 'section',
            title    : 'Output control',
            open     : false,  // true for the section to be initially open
            position : [2,0,1,5],
            contains : {
              TOPFILES : {
                    type     : 'integer_',          // '_' means blank value is allowed
                    keyword  : 'TOPFILES', // the real keyword for job input stream
                    label    : 'Number of top solutions to output',
                    default  : '1',           // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 20, or leave ' +
                               'blank for automatic choice',
                    range    : [1,20],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '',        // value to be paired with the keyword
                    position : [0,0,1,1]  // [row,col,rowSpan,colSpan]
                  }
            }
          },

    sec3: { type     : 'section',
            title    : 'Expert parameters',
            open     : false,  // true for the section to be initially open
            position : [3,0,1,5],
            contains : {
              SEARCH_METHOD_SEL : {
                    type     : 'combobox',
                    keyword  : 'SEARCH METHOD',
                    label    : 'Search method for many copies in ASU',
                    iwidth   : 80,      // width of input field in px
                    tooltip  : 'Use FAST if you expect the TFZ to be high ' +
                               'for each copy',
                    range    : ['FAST|fast',
                                'FULL|full'
                               ],
                    value    : 'FAST',
                    position : [0,0,1,1]
                  },
              PERMUTE_SEL : {
                    type     : 'combobox',
                    keyword  : 'PERMUTATIONS',
                    label    : 'Permute search order',
                    iwidth   : 80,      // width of input field in px
                    tooltip  : 'Permute search order',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'OFF',
                    position : [0,3,1,1],
                    showon   : {SEARCH_METHOD_SEL:['FULL']}
                  },
              SEARCH_PRUNE_SEL : {
                    type     : 'combobox',
                    keyword  : 'SEARCH PRUNE',
                    label    : 'Prune high TFZ packing rejects',
                    iwidth   : 80,      // width of input field in px
                    tooltip  : 'High TFZ prunning parameter',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [1,0,1,1]
                  },
              TRA_PACKING_SEL : {
                    type     : 'combobox',
                    keyword  : 'TRANSLATION PACKING USE',
                    label    : 'Check for packing in translation function',
                    iwidth   : 80,      // width of input field in px
                    tooltip  : 'Translation function packing',
                    range    : ['ON|on',
                                'OFF|off'
                               ],
                    value    : 'ON',
                    position : [2,0,1,1]
                  },
              TRA_PACKING_OVERLAP : {
                    type     : 'integer_',         // '_' means blank value is allowed
                    keyword  : 'TRANSLATION PACKING CUTOFF', // the real keyword for job input stream
                    label    : 'Overlap percent allowed',
                    default  : '50',               // to be displayed in grey
                    tooltip  : 'Choose a value between 1 and 99, or leave ' +
                               'blank for automatic choice',
                    range    : [1,99],    // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '',        // value to be paired with the keyword
                    position : [2,3,1,1], // [row,col,rowSpan,colSpan]
                    showon   : {TRA_PACKING_SEL:['ON']}
                  },
              FORMFACTORS_SEL : {
                    type     : 'combobox',
                    keyword  : 'FORMFACTORS',
                    label    : 'Formfactors from',
                    //iwidth   : 200,      // width of input field in px
                    tooltip  : 'Choose source for scattering factors',
                    range    : ['XRAY|x-ray scattering',
                                'ELECTRON|electron scattering',
                                'NEUTRON|neutron scattering'
                               ],
                    value    : 'XRAY',
                    position : [3,0,1,2]
                  }
            }
          }

  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskPhaserMR.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPhaserMR.prototype = Object.create ( TaskTemplate.prototype );
TaskPhaserMR.prototype.constructor = TaskPhaserMR;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskPhaserMR.prototype.icon           = function()  { return 'task_phasermr'; }
TaskPhaserMR.prototype.clipboard_name = function()  { return '"Phaser-MR"';   }

TaskPhaserMR.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'perform MR using a defined ASU and prepared MR models and/or ensembles';
}

// TaskPhaserMR.prototype.cleanJobDir = function ( jobDir ) {}

TaskPhaserMR.prototype.currentVersion = function()  {
  let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPhaserMR.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['phaser', 'molecular','replacement','mr'] );
}

if (!__template)  {

  TaskPhaserMR.prototype.getHelpURL = function()  {
    return __task_reference_base_url + 'doc.task.Phaser.html';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskPhaserMR.prototype.hotButtons = function() {
    return [RefmacHotButton()];
  }

  TaskPhaserMR.prototype.MRTypeChanged = function ( inpParamRef,value )  {
  // reacts on changing mr_type in revision's belly

    this.title = this.title.split(' (')[0];
    this.name = this.name.split(' (')[0];
    if (value != 'refl') {
      this.title += ' (density fit)';
      this.name += ' (density fit)';
    }

    let inputPanel = inpParamRef.grid.parent.parent;
    inputPanel.header.title.setText('<b>' + this.title + '</b>');
    let new_title = this.name.replace(/<(?:.|\n)*?>/gm,'');
    inputPanel.header.uname_inp.setStyle('text','',new_title);
    inputPanel.job_dialog.changeTitle(new_title);
    inputPanel.emitSignal(cofe_signals.jobDlgSignal,
      job_dialog_reason.rename_node);

  }

  /*
  TaskPhaserMR.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId == 'phases') {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let item = this.getInputItem ( inpDataRef,'revision' );
      let dropdown = item.dropdown[0];
      let dt = item.dt[dropdown.getValue()];
      if ( dt.subtype.indexOf(structure_subtype.XYZ)<0 ) {
        let dataState = this.getDataState ( inpDataRef );
        let customGrid = dropdown.customGrid;
        customGrid.clear();
        if ( dataState['phases']>0 ) {
          dropdown.layCustom = 'phaser-mr-ptf';
          customGrid.setLabel ( 'Try Space Group(s):',0,0,1,1 )
                                .setFontItalic(true).setNoWrap();
          customGrid.setLabel ( 'from phases',0,1,1,4 )
                                .setNoWrap();
          customGrid.setCellSize ( '','25pt',0,0 );
          customGrid.setCellSize ( '','25pt',0,1 );
          customGrid.setVerticalAlignment( 0,0,'middle' );
          customGrid.setVerticalAlignment( 0,1,'middle' );
          dropdown.layCustom = 'phaser-mr-fixed';
        } else {
          dropdown.layCustom = 'phaser-mr';
        }
        dt.layCustomDropdownInput ( dropdown );
      }
    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
  }
  */

} else  {
  //  for server side

  const conf    = require('../../js-server/server.configuration');
  const dstruct = require('../../js-common/dtypes/common.dtypes.structure');

  TaskPhaserMR.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;

      if (('phaser_meta' in revision) &&
          (["edfit","ignore"].indexOf(revision.Options.structure_sel)<0))  {
        // prepare all ensemble data
        let ensembles = revision.phaser_meta.ensembles;
        for (let ensname in ensembles)
          this.input_data.data[ensname] = [ensembles[ensname]['data']];
        this.input_data.data['sol'] = [revision.phaser_meta.sol];
      }// else if (revision.subtype.indexOf('xyz')>=0)
       // this.input_data.data['xmodel'] = [revision.Structure];

      if (revision.Structure)  {
        if (revision.hasLigands())
          this.input_data.data['ligands'] = [revision.Structure];
        if (revision.Options.mr_type=='sph')
          this.input_data.data['phases'] = [revision.Structure];
        // if (revision.Structure.subtype.indexOf(dstruct.structure_subtype.XYZ)>=0)
        if (revision.Structure.hasXYZ())
          this.input_data.data['xmodel'] = [revision.Structure];
      }
      if (revision.Substructure && 
          ((revision.Options.leading_structure=='substructure') ||
           (revision.Options.mr_type=='subph')))
        this.input_data.data['phases'] = [revision.Substructure];

    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskPhaserMR.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.phasermr', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskPhaserMR = TaskPhaserMR;

}
