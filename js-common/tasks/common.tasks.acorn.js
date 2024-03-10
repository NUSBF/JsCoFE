
/*
 *  =================================================================
 *
 *    10.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.acorn.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ACORN Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2018-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskAcorn()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskAcorn';
  this.name    = 'acorn';
  this.setOName ( 'acorn' );  // default output file name template
  this.title   = 'Phase Refinement and Dynamic Density Modification with ACORN';
  //this.helpURL = './html/jscofe_task_acorn.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!protein','!asu','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'acorn',    // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 :  { type     : 'section',
              title    : 'Main parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                EXTEND_RESOLUTION_CBX : {
                        type     : 'checkbox',
                        label    : 'Artificially extend resolution',
                        tooltip  : 'Check to extend resolution ("free lunch")',
                        value    : true,
                        position : [0,0,1,1]
                      },
                EXTRES : { type  : 'real',
                        keyword  : 'resolution',
                        label    : 'to',
                        align    : 'right',
                        lwidth   : 60,      // label width in px
                        reportas : 'Extend resolution limit', // to use in error reports
                                                              // instead of 'label'
                        tooltip  : 'Extend resolution limit of the data for ' +
                                   'use in ACORN',
                        range    : [0.0,5.0],
                        value    : '1.0',
                        iwidth   : 40,
                        label2   : '&Aring',
                        position : [0,1,1,1],
                        showon   : {'EXTEND_RESOLUTION_CBX':[true]}
                      },
                ANISOTROPY_CORRECTION_CBX : {
                        type     : 'checkbox',
                        label    : 'Anisotropy correction',
                        tooltip  : 'Check to make anisotropy correction',
                        value    : true,
                        position : [1,0,1,1]
                      }
              }
            },
    sec2 :  { type     : 'section',
              title    : 'General ACORN phase improvement parameters (advanced)',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                TRIALS_SEL : {
                        type     : 'combobox',
                        keyword  : 'TRIALS',
                        label    : 'DDM trials',
                        tooltip  : 'Choose parameters for Dynamic Density Modification ' +
                                   '(DDM) trials.',
                        range    : ['P|Preconfigured DDM trials',
                                    'C|Customised DDM trials',
                                    'D|Customised DDM trials with DDM types'
                                   ],
                        value    : 'P',
                        iwidth   : 400,
                        position : [0,0,1,14]
                      },
                NTRIALS : { type : 'integer',
                        keyword  : 'NTRIALS',
                        label    : 'Number of trials',
                        tooltip  : 'Number of trials between 1 (default) and 10',
                        range    : [1,10],
                        value    : '1',
                        position : [1,0,1,1],
                        showon   : {'TRIALS_SEL':['P']}
                      },
                SEPARATOR_LBL : {
                        type     : 'label',
                        label    : '&nbsp;',
                        position : [1,0,1,1],
                        showon   : {'TRIALS_SEL':['C','D']}
                      },
                NCYCLES_LBL : {
                        type     : 'label',  // just a separator
                        label    : '<b><i>N<sub>cycles</sub></i></b>',
                        //align    : 'center',
                        tooltip  : 'Number of DDM cycles in each trial',
                        position : [2,3,1,1],
                        hideon   : {'TRIALS_SEL':['P']}
                      },
                TYPE_LBL : {
                        type     : 'label',  // just a separator
                        label    : '<b><i>DDM type</i></b>',
                        position : [2,6,1,1],
                        hideon   : {'TRIALS_SEL':['P']}
                      },
                ADDONS_LBL : {
                        type     : 'label',  // just a separator
                        label    : '<b><i>Added Enhancement/Refinement</i></b>',
                        position : [2,9,1,7],
                        hideon   : {'TRIALS_SEL':['P']}
                      },

                //   =========  Trial 1

                TRIAL1_LBL : {
                        type     : 'label',
                        label    : '<b>&radic; Trial 1</b>',
                        position : [3,0,1,1],
                        hideon   : {'TRIALS_SEL':['P']}
                      },
                NCYCLES1 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES1',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [3,1,1,1],
                        hideon   : {'TRIALS_SEL':['P']}
                      },

                DDMTYPE1_LBL : {
                        type     : 'label',  // just a separator
                        label    : '<b>DDM</b>',
                        position : [3,6,1,3],
                        hideon   : {'TRIALS_SEL':['P','D']}
                      },
                DDMTYPE1_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [3,4,1,1],
                        hideon   : {'TRIALS_SEL':['P','C']}
                      },
                ENHREF1_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'N',
                        iwidth   : 275,
                        position : [3,7,1,7],
                        hideon   : {'TRIALS_SEL':['P']}
                      },

                //   =========  Trial 2

                DDMTRIAL2_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 2',
                        tooltip  : '',
                        value    : false,
                        position : [4,0,1,1],
                        hideon   : {'TRIALS_SEL':['P']}
                      },
                NCYCLES2 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES2',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [4,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL2_CBX':[false]}
                      },
                DDMTYPE2_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [4,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL2_CBX':[false]}
                      },
                DDMTYPE2_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [4,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL2_CBX':[false]}
                      },
                ENHREF2_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'R',
                        iwidth   : 275,
                        position : [4,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL2_CBX':[false]}
                      },

                //   =========  Trial 3

                DDMTRIAL3_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 3',
                        tooltip  : '',
                        value    : false,
                        position : [5,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL2_CBX':[false,'__not_visible__']}
                      },
                NCYCLES3 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [5,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL3_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE3_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [5,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL3_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE3_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [5,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL3_CBX':[false,'__not_visible__']}
                      },
                ENHREF3_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'R',
                        iwidth   : 275,
                        position : [5,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL3_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 4

                DDMTRIAL4_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 4',
                        tooltip  : '',
                        value    : false,
                        position : [6,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL3_CBX':[false,'__not_visible__']}
                      },
                NCYCLES4 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [6,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL4_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE4_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [6,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL4_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE4_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [6,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL4_CBX':[false,'__not_visible__']}
                      },
                ENHREF4_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'R',
                        iwidth   : 275,
                        position : [6,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL4_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 5

                DDMTRIAL5_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 5',
                        tooltip  : '',
                        value    : false,
                        position : [7,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL4_CBX':[false,'__not_visible__']}
                      },
                NCYCLES5 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [7,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL5_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE5_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [7,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL5_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE5_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [7,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL5_CBX':[false,'__not_visible__']}
                      },
                ENHREF5_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [7,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL5_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 6

                DDMTRIAL6_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 6',
                        tooltip  : '',
                        value    : false,
                        position : [8,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL5_CBX':[false,'__not_visible__']}
                      },
                NCYCLES6 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [8,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL6_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE6_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [8,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL6_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE6_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [8,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL6_CBX':[false,'__not_visible__']}
                      },
                ENHREF6_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [8,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL6_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 7

                DDMTRIAL7_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 7',
                        tooltip  : '',
                        value    : false,
                        position : [9,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL6_CBX':[false,'__not_visible__']}
                      },
                NCYCLES7 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [9,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL7_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE7_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [9,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL7_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE7_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [9,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL7_CBX':[false,'__not_visible__']}
                      },
                ENHREF7_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [9,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL7_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 8

                DDMTRIAL8_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 8',
                        tooltip  : '',
                        value    : false,
                        position : [10,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL7_CBX':[false,'__not_visible__']}
                      },
                NCYCLES8 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [10,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL8_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE8_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [10,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL8_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE8_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [10,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL8_CBX':[false,'__not_visible__']}
                      },
                ENHREF8_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [10,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL8_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 9

                DDMTRIAL9_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 9',
                        tooltip  : '',
                        value    : false,
                        position : [11,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL8_CBX':[false,'__not_visible__']}
                      },
                NCYCLES9 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [11,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL9_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE9_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [11,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL9_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE9_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [11,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL9_CBX':[false,'__not_visible__']}
                      },
                ENHREF9_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [11,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL9_CBX':[false,'__not_visible__']}
                      },

                //   =========  Trial 10

                DDMTRIAL10_CBX : {
                        type     : 'checkbox',
                        label    : 'Trial 10',
                        tooltip  : '',
                        value    : false,
                        position : [12,0,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL9_CBX':[false,'__not_visible__']}
                      },
                NCYCLES10 : {
                        type     : 'integer',
                        keyword  : 'NCYCLES3',
                        label    : '',
                        tooltip  : '',
                        range    : [1,'*'],
                        value    : 500,
                        position : [12,1,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL10_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE10_LBL : {
                        type     : 'label',
                        label    : '<b>DDM</b>',
                        position : [12,6,1,3],
                        hideon   : {'_':'||','TRIALS_SEL':['P','D'],'DDMTRIAL10_CBX':[false,'__not_visible__']}
                      },
                DDMTYPE10_SEL : {
                        type     : 'combobox',
                        keyword  : 'DDMTYPE3',
                        label    : '',
                        lwidth   : 2,
                        tooltip  : '',
                        range    : ['0|DDM0',
                                    '1|DDM1',
                                    '2|DDM2'
                                   ],
                        value    : '0',
                        position : [12,4,1,1],
                        hideon   : {'_':'||','TRIALS_SEL':['P','C'],'DDMTRIAL10_CBX':[false,'__not_visible__']}
                      },
                ENHREF10_SEL : {
                        type     : 'combobox',
                        keyword  : 'ENHREF3',
                        label    : '',
                        tooltip  : '',
                        range    : ['N|None',
                                    'E|Weak density enhancement',
                                    'R|Sayre equation refinement'
                                   ],
                        value    : 'E',
                        iwidth   : 275,
                        position : [12,7,1,7],
                        hideon   : {'_':'||','TRIALS_SEL':['P'],'DDMTRIAL10_CBX':[false,'__not_visible__']}
                      },

                SEPARATOR2_LBL : {
                        type     : 'label',
                        label    : '&nbsp;',
                        position : [13,0,1,1],
                        showon   : {'TRIALS_SEL':['C','D']}
                      },

                MINPHASESHIFT_LBL : {
                        type     : 'label',
                        label    : 'Cease DDM cycling if phase shift between cycles is less than',
                        position : [14,0,1,15]
                      },
                MINPHASESHIFT : {
                        type     : 'real',
                        keyword  : 'PSFIN',
                        label    : '',
                        lwidth   : 0,
                        reportas : 'Phase shift convergence parameter',
                        tooltip  : '',
                        range    : [0.0,6.28],
                        value    : '0.8',
                        placeholder : '0.8',
                        position : [14,1,1,1]
                      },

                MAXCORR_LBL : {
                        type     : 'label',
                        label    : 'Cease phase refinement if correlation coefficient exceeds',
                        position : [15,0,1,15]
                      },
                MAXCORR : {
                        type     : 'real',
                        keyword  : 'CCFIN',
                        label    : '',
                        lwidth   : 0,
                        reportas : 'Correlation coefficient convergence parameter',
                        tooltip  : '',
                        range    : [0.0,1.0],
                        value    : '0.25',
                        placeholder : '0.25',
                        position : [15,1,1,1]
                      }

              }
            },

    sec3 :  { type     : 'section',
              title    : 'Selection of Reflection Data (advanced)',
              open     : false,  // true for the section to be initially open
              position : [2,0,1,5],
              contains : {
                RESOLUTION_RANGE_CBX : {
                        type     : 'checkbox',
                        label    : 'Custom resolution range',
                        tooltip  : 'Check to set custom resolution range',
                        value    : false,
                        position : [0,0,1,1]
                      },
                RESMIN : { type  : 'real',
                        keyword  : 'RESMIN',
                        label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                                   '&nbsp;&nbsp;&nbsp;&nbsp;low (&Aring;):',
                        align    : 'right',
                        //lwidth   : 160,      // label width in px
                        reportas : 'Low resolution limit', // to use in error reports
                                                              // instead of 'label'
                        tooltip  : 'Low resolution cut-off',
                        range    : [0.0,200.0],
                        value    : '50.0',
                        placeholder : '50.0',
                        iwidth   : 60,
                        position : [0,1,1,1],
                        showon   : {'RESOLUTION_RANGE_CBX':[true]}
                      },
                RESMAX : { type  : 'real',
                        keyword  : 'RESMAX',
                        label    : '&nbsp;&nbsp;&nbsp;high (&Aring;):',
                        align    : 'right',
                        //lwidth   : 60,      // label width in px
                        reportas : 'High resolution limit', // to use in error reports
                                                              // instead of 'label'
                        tooltip  : 'High resolution cut-off',
                        range    : [0.0,200.0],
                        value    : '1.0',
                        placeholder : '1.0',
                        iwidth   : 60,
                        position : [0,4,1,1],
                        showon   : {'RESOLUTION_RANGE_CBX':[true]}
                      },
                EXCLUDE_LOW_SIGFP_CBX : {
                        type     : 'checkbox',
                        label    : 'Exclude low SIGFP reflections',
                        tooltip  : 'Check to exclude reflections with low SigFP ' +
                                   'and treat them as extended data',
                        value    : false,
                        position : [1,0,1,1]
                      },
                MINSIGFP : { type  : 'real',
                        keyword  : 'EXCL',
                        label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                                   '&nbsp;&nbsp;&nbsp;&nbsp;minimal SigFP:',
                        align    : 'right',
                        //lwidth   : 160,      // label width in px
                        reportas : 'SigFP rejection threshold', // to use in error reports
                                                           // instead of 'label'
                        tooltip  : 'Minimal acceptable SigFP fore reflections. ' +
                                   'Reflections with lower SigFP will be rejected ' +
                                   'and treated as extended data.',
                        range    : [0.0,200.0],
                        value    : '0.0',
                        iwidth   : 60,
                        placeholder : '0.0',
                        position : [1,1,1,1],
                        showon   : {'EXCLUDE_LOW_SIGFP_CBX':[true]}
                      },
                EXCLUDE_HIGH_EVALUE_CBX : {
                        type     : 'checkbox',
                        label    : 'Exclude high E-value reflections',
                        tooltip  : 'Check to exclude reflections with high E-values',
                        value    : false,
                        position : [2,0,1,1]
                      },
                MAXEVALUE : { type  : 'real',
                        keyword  : 'ECUT',
                        label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                                   '&nbsp;&nbsp;&nbsp;&nbsp;maximal E-value:',
                        align    : 'right',
                        //lwidth   : 160,      // label width in px
                        reportas : 'E-value rejection threshold', // to use in error reports
                                                                  // instead of 'label'
                        tooltip  : 'Maximal acceptable E-value for reflections. ' +
                                   'Reflections with higher value will be rejected.',
                        range    : [0.0,200.0],
                        value    : '5.0',
                        iwidth   : 60,
                        placeholder : '5.0',
                        position : [2,1,1,1],
                        showon   : {'EXCLUDE_HIGH_EVALUE_CBX':[true]}
                      }
              }
            },
    sec4 :  { type     : 'section',
              title    : 'Other Advanced Settings',
              open     : false,  // true for the section to be initially open
              position : [3,0,1,5],
              contains : {
                PATTERSON_SUP_FINCTION_CBX : {
                        type     : 'checkbox',
                        label    : 'Use the Patterson Superposition Function',
                        tooltip  : 'Check to use the Patterson Superposition Function',
                        value    : true,
                        position : [0,0,1,1]
                      },
                DDM_DENSITY_LIMIT : {
                        type     : 'real',
                        keyword  : 'CUTDDM',
                        label    : 'Upper density limit for Dynamic Density Modification (DDM)',
                        tooltip  : 'Upper density limit for Dynamic Density ' +
                                   'Modification (DDM) (default 3.0)',
                        range    : [0.0,10.0],
                        value    : '3.0',
                        placeholder : '3.0',
                        position : [1,0,1,1]
                      },
                CUSTOM_GRID_SIZE_CBX : {
                        type     : 'checkbox',
                        label    : 'Use custom grid size',
                        tooltip  : 'Check to choose custom grid size',
                        value    : false,
                        position : [2,0,1,1]
                      },
                GRIDSIZE : { type  : 'real',
                        keyword  : 'GRID',
                        label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Grid size:',
                        align    : 'right',
                        //lwidth   : 80,      // label width in px
                        reportas : 'Grid size', // to use in error reports
                                                              // instead of 'label'
                        tooltip  : 'Custom grid size (default 0.3333)',
                        range    : [0.0,5.0],
                        value    : '0.3333',
                        placeholder : '0.3333',
                        label2   : '&Aring',
                        position : [2,2,1,1],
                        showon   : {'CUSTOM_GRID_SIZE_CBX':[true]}
                      }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskAcorn.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAcorn.prototype = Object.create ( TaskTemplate.prototype );
TaskAcorn.prototype.constructor = TaskAcorn;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAcorn.prototype.icon           = function()  { return 'task_acorn'; }
TaskAcorn.prototype.clipboard_name = function()  { return '"Acorn"';    }

TaskAcorn.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

//TaskAcorn.prototype.cleanJobDir = function ( jobDir )  {}

// hotButtons return list of buttons added in JobDialog's toolBar.
function AcornHotButton()  {
  return {
    'task_name' : 'TaskAcorn',
    'tooltip'   : 'Phase Refinement and Dynamic Density Modification with ACORN'
  };
}

TaskAcorn.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['acorn', 'density', 'modification', 'phase refinement'] );
  }

if (!__template)  {
  //  for client side
  
  TaskAcorn.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'refine a starting set of phases using Dynamic Density Modification';
    };
  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskAcorn.prototype.hotButtons = function() {
    return [ArpWarpHotButton(),ModelCraftHotButton(),BuccaneerHotButton()];
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskAcorn.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and seq data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.Options.leading_structure=='substructure')
            this.input_data.data['istruct'] = [revision.Substructure];
      else  this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskAcorn.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.acorn', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAcorn = TaskAcorn;

}
