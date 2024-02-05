
/*
 *  =================================================================
 *
 *    05.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.aimless.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Aimless Task Class
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

function TaskAimless()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskAimless';
  this.name    = 'aimless';
  this.setOName ( 'aimless' );  // default output file name template
  this.title   = 'Merging and Scaling with Aimless';
  //this.helpURL = './html/jscofe_task_aimless.html';

  this.input_dtypes = [{      // input data types
    data_type   : {'DataUnmerged':[]}, // data type(s) and subtype(s)
    desc        : 'dataset to merge',
    label       : 'Unmerged<br>reflections',       // label for input dialog
    inputId     : 'unmerged',   // input Id for referencing input fields
    customInput : 'unmerged',   // lay custom fields next to the selection
                                // dropdown for unmerged data
    min         : 1,            // minimum acceptable number of data instances
    max         : 50            // maximum acceptable number of data instances
   },{
    data_type   : {'DataHKL':[],'DataUnmerged':[]}, // data type(s) and subtype(s)
    desc        : 'symmetry reference',
    cast        : 'symmetry',     // will replace data type names in comboboxes
    label       : 'Crystal<br>Symmetry', // label for input dialog
    inputId     : 'ds0',          // input Id for referencing input fields
    customInput : 'unmerged-ref', // lay custom fields next to the selection
                                  // dropdown for unmerged reference data
    min         : 1,              // minimum acceptable number of data instances
    max         : 1               // maximum acceptable number of data instances
   }
   /*
   ,{ // DO NOT DELETE THIS MAY BE USED AS DOCUMENTATION
     // This entry is void and provided only to ensure that at least one unmerged
     // dataset is provided. Note that this condition does not follow from the
     // actual entries above, which will be satisfied with just a single HKL
     // dataset
     data_type   : {'DataUnmerged':[]}, // data type required
     label       : '',           // empty label for void entry
     inputId     : 'void1',      // input Id must be unique and start with 'void'
     min         : 1,            // minimum acceptable number of datasets
     max         : 1             // maximum acceptable number of datasets
   }
   */
  ];

  this.parameters =
    {
        secMain:
        {
            type     : 'section',
            title    : 'Basic Options',
            open     : false,
            position : [0,0,1,8],
            contains :
            {
                PERFORM_SCALING:
                {
                    position : [0, 0, 1, 8],
                    label    : 'Perform symmetry assignment,',
                    keyword  : 'PERFORM_SCALING',
                    type     : 'combobox',
                    range    :
                    [
                        'YES|scaling and merging',
                        'NO|no scaling only merge'
                    ],
                    tooltip  : 'Switch off scaling for scaled unmerged ' +
                               'input data e.g. for INTEGRATED.HKL from ' +
                               'XDS.',
                    value    : 'YES'
                },
                LABEL01:
                {
                    position : [1,0,1,8],
                    type     : 'label',
                    label    : 'For (scaling and) merging, use',
                    tooltip  : 'Low and high Resolution cut-offs (&Aring;) ' +
                               ' for scaling, merging and output dataset(s).'
                },
                RESO_LOW:
                {
                    position : [2,0,1,1],
                    align    : 'right',
                    type     : 'real_',
                    keyword  : 'RESO_LOW',
                    label    : 'low resolution cut-off (&Aring;)',
                               // 'reportas' replaces 'label' in error reports
                    reportas : 'Low resolution cut-off',
                    tooltip  : 'Low resolution cut-off (&Aring;) ' +
                               'for scaling, merging and output dataset(s). ' +
                               'Leave blank to keep all low resolution data.',
                    min      : '0',
                    value    : ''
                },
                RESO_HIGH:
                {
                    position : [3,0,1,1],
                    align    : 'right',
                    type     : 'real_',
                    keyword  : 'RESO_HIGH',
                    label    : 'high resolution cut-off (&Aring;)',
                               // 'reportas' replaces 'label' in error reports
                    reportas : 'High resolution cut-off',
                    tooltip  : 'High resolution cut-off (&Aring;) ' +
                               'for scaling, merging and output dataset(s). ' +
                               'Leave blank to keep all high resolution data.',
                    min      : '0',
                    value    : ''
                },
                LABEL02:
                {
                    position : [4,0,1,8],
                    hideon   :
                    {
                        'unmerged': [-1, 0, 1]
                    },
                    type     : 'label',
                    label    : 'Scale all input datasets together',
                    tooltip  : 'Use the option to merge separately for e.g. MAD ' +
                               'experiment to scale together the input datasets ' +
                               'from different wavelengths, but to merge them ' +
                               'in separate output datasets'
                },
                MERGE_DATASETS:
                {
                    position : [5,0,1,8],
                    hideon   :
                    {
                        'unmerged': [-1, 0, 1]
                    },
                    align    : 'right',
                    keyword  : 'MERGE_DATASETS',
                    type     : 'combobox',
                    range    :
                    [
                        'TOGETHER|together',
                        'SEPARATELY|separately'
                    ],
                    label    : 'and merge',
                    tooltip  : 'Use the option to merge separately for e.g. MAD ' +
                               'experiment to scale together the input datasets ' +
                               'from different wavelengths, but to merge them ' +
                               'into separate output datasets',
                    value    : 'TOGETHER'
                }
            }
        },
        secSymm:
        {
            type     : 'section',
            title    : 'Symmetry Analysis',
            open     : false,
            position : [1,0,1,8],
            contains :
            {
                TOLERANCE:
                {
                    //line   : (20, 0),
                    position : [0, 0, 1, 8],
                    keyword  : 'TOLERANCE',
                    type     : 'real_',
                    label    : 'Tolerance for comparing lattices (&deg;)',
                    tooltip  : 'Tolerance for comparing lattices (degrees or ' +
                               'equivalent on lengths; default 2.0)',
                    min      : '0',
                    value    : ''
                },
                RESOLUTION_SYMM:
                {
                    position : [1, 0, 1, 8],
                    keyword  : 'RESOLUTION_SYMM',
                    type     : 'combobox',
                    range    :
                    [
                        'AUTO|automatic',
                        'EXPLICIT|as for scaling and merging'
                    ],
                    tooltip  : 'Use the same resolution for output and ' +
                               'symmetry analysis only if automatic ' +
                               'results are not conclusive; then use ' +
                               'manual symmetry assignment in the final ' +
                               'job',
                    value    : 'AUTO',
                    label    : 'High resolution limit for symmetry analysis'
                },
                CCHALFLIMIT:
                {
                    //line   : (18, 0),
                    position : [2, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'RESOLUTION_SYMM': ['AUTO']
                    },
                    keyword  : 'CCHALFLIMIT',
                    type     : 'real_',
                    label    : 'CC(1/2) threshold (main method)',
                    tooltip  : 'Maximum resolution for scoring set is ' +
                               'defined by CC(1/2) threshold ' +
                               '(default 0.6)',
                    min      : '0',
                    max      : '1',
                    value    : ''
                },
                ISIGLIMIT:
                {
                    //line   : (19, 0),
                    position : [3, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'RESOLUTION_SYMM': ['AUTO']
                    },
                    keyword  : 'ISIGLIMIT',
                    type     : 'real_',
                    label    : ' I/sig(I) threshold (fall-back method)',
                    tooltip  : 'Maximum resolution for scoring set is ' +
                               'defined by I/sig(I) threshold ' +
                               '(default 6)',
                    min      : '0',
                    value    : ''
                }
            }
        },
        secObs:
        {
            type     : 'section',
            title    : 'Observations Used',
            open     : false,
            position : [2,0,1,8],
            contains :
            {
                LABEL03:
                {
                    //line   : (25, 0),
                    position : [0, 0, 1, 8],
                    tooltip  : 'Accept partials with total fraction between ' +
                               'limits below',
                    label    : 'Only accept partials with total fraction',
                    type     : 'label'
                },
                PARTIALS_FRACLOW:
                {
                    position : [1, 0, 1, 8],
                    keyword  : 'PARTIALS_FRACLOW',
                    type     : 'real_',
                    label    : 'higher than',
                    align    : 'right',
                    tooltip  : 'Only accept partials with total fraction ' +
                               'higher than this limit (default 0.95)',
                    min      : '0',
                    max      : '2',
                    value    : ''
                },
                PARTIALS_FRACHIGH:
                {
                    position : [2, 0, 1, 8],
                    keyword  : 'PARTIALS_FRACHIGH',
                    type     : 'real_',
                    label    : 'and lower than',
                    align    : 'right',
                    tooltip  : 'Only accept partials with total fraction ' +
                               'lower than this limit (default 1.05)',
                    min      : '0',
                    max      : '2',
                    value    : ''
                },
                ACCEPT_OVERLOADS:
                {
                    //line   : (27, 0),
                    position : [3, 0, 1, 8],
                    keyword  : 'ACCEPT_OVERLOADS',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Maybe keep overloads if many reflections ' +
                               'are missing',
                    value    : 'False',
                    label    : 'Accept overloaded observations'
                },
                ACCEPT_EDGES:
                {
                    //line   : (28, 0),
                    position : [4, 0, 1, 8],
                    keyword  : 'ACCEPT_EDGES',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Accepting edge observations may increase ' +
                               'completeness if needed',
                    value    : 'False',
                    label    : 'Accept observations on edge of tile or ' +
                               'detector'
                },
                ACCEPT_XDS_MISFITS:
                {
                    //line   : (29, 0),
                    position : [5, 0, 1, 8],
                    keyword  : 'ACCEPT_XDS_MISFITS',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Accept or reject reflections ' +
                               'flagged as outliers (MISFIT) ' +
                               'by XDS (default: no)',
                    value    : 'False',
                    label    : 'Accept observations flagged by XDS as outliers'
                },
                LABEL04:
                {
                    position : [6, 0, 1, 8],
                    tooltip  : '&nbsp;',
                    label    : '&nbsp;',
                    type     : 'label'
                },
                LABEL05:
                {
                    //line   : (22, 0),
                    position : [7, 0, 1, 8],
                    label    : 'If both summation and profile-fitted ' +
                               'intensities',
                    tooltip  : 'If both integrated and profile-fitted ' +
                               'observations are available, choose how to ' +
                               'use partially-recorded observations ' +
                               '(Default: combine, e.g. use profile-fitted ' +
                               'for weak intensities and summation for strong)',
                    type     : 'label'
                },
                INTENSITIES_OPTIONS:
                {
                    //line   : (24, 0),
                    position : [8, 0, 1, 8],
                    label    : 'are avalable, use',
                    align    : 'right',
                    keyword  : 'INTENSITIES_OPTIONS',
                    type     : 'combobox',
                    range    :
                    [
                        'COMBINE|combined intensities',
                        'PROFILE|profile-fitted intensities',
                        'SUMMATION|summation intensities'
                    ],
                    tooltip  : 'If both integrated and profile-fitted ' +
                               'observations are available, choose how to ' +
                               'use partially-recorded observations ' +
                               '(Default: combine, e.g. use profile-fitted ' +
                               'for weak intensities and summation for strong)',
                    value    : 'COMBINE'
                }
            }
        },
        secSDCorr:
        {
            type     : 'section',
            title    : 'SD Correction',
            open     : false,
            position : [3,0,1,8],
            contains :
            {
                SDCORRECTION_REFINE:
                {
                    //line   : (31, 0),
                    position : [0, 0, 1, 8],
                    lwidth   : 260,
                    keyword  : 'SDCORRECTION_REFINE',
                    type     : 'combobox',
                    range    : ['True|refined', 'False|set manually'],
                    tooltip  : 'Refine SDcorrection parameters',
                    value    : 'True',
                    label    : 'SD correction parameters to be'
                },
                SDCORRECTION_SDFAC:
                {
                    position : [1, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['False']
                    },
                    label    : 'parameter sdFac',
                    keyword  : 'SDCORRECTION_SDFAC',
                    type     : 'real_',
                    tooltip  : 'Parameter sdFac (default 1.0)',
                    min      : '0',
                    value    : ''
                },
                SDCORRECTION_SDB:
                {
                    position : [2, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['False']
                    },
                    label    : 'parameter sdB',
                    keyword  : 'SDCORRECTION_SDB',
                    type     : 'real_',
                    tooltip  : 'Parameter sdB (default 0.0)',
                    min      : '0',
                    value    : ''
                },
                SDCORRECTION_SDADD:
                {
                    position : [3, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['False']
                    },
                    label    : 'parameter sdAdd',
                    keyword  : 'SDCORRECTION_SDADD',
                    type     : 'real_',
                    tooltip  : 'Parameter sdAdd (default 0.03)',
                    min      : '0',
                    value    : ''
                },
                SDCORRECTION_FIXSDB:
                {
                    //line   : (34, 0),
                    position : [4, 0, 1, 8],
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['True']
                    },
                    keyword  : 'SDCORRECTION_FIXSDB',
                    type     : 'combobox',
                    range    :
                    [
                        'False|no restrains',
                        'Tie|tie to zero',
                        'True|fix to zero'
                    ],
                    tooltip  : 'Treatment of the sdB parameter',
                    value    : 'False',
                    label    : 'Treatment of the sdB parameter:'
                },
                SDCORRECTION_TIESDB_SD:
                {
                    //line   : (34, 1),
                    position : [5, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SDCORRECTION_REFINE': ['True'],
                        'SDCORRECTION_FIXSDB': ['Tie']
                    },
                    label    : 'restraint on sdB value',
                    keyword  : 'SDCORRECTION_TIESDB_SD',
                    type     : 'real_',
                    tooltip  : 'restraint on sdB value (default 10.0)',
                    min      : '0',
                    value    : ''
                },
                LABEL06:
                {
                    type     : 'label',
                    //line   : (35, 0),
                    position : [6, 0, 1, 8],
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['True']
                    },
                    tooltip  : '&nbsp;',
                    label    : '&nbsp;'
                },
                LABEL07:
                {
                    type     : 'label',
                    //line   : (35, 0),
                    position : [7, 0, 1, 8],
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['True']
                    },
                    tooltip  : 'If processing more than one run, define how ' +
                               'SD parameters for different runs are linked',
                    label    : 'If processing more than one run,'
                },
                SDCORRECTION_OPTIONS:
                {
                    //line   : (33, 0),
                    position : [8, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        'SDCORRECTION_REFINE': ['True']
                    },
                    keyword  : 'SDCORRECTION_OPTIONS',
                    type     : 'combobox',
                    range    :
                    [
                        'INDIVIDUAL|individual',
                        'SAME|same',
                        'SIMILAR|similar'
                    ],
                    tooltip  : 'Use different, same or similar SDfactors for ' +
                               'each run',
                    value    : 'INDIVIDUAL',
                    label    : 'SD parameters for each run are'
                },
                SDCORRECTION_SIMILARITY_SDFAC:
                {
                    //line   : (35, 1),
                    position : [9, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SDCORRECTION_REFINE': ['True'],
                        'SDCORRECTION_OPTIONS': ['SIMILAR']
                    },
                    label    : 'sigma for restrains on sdFac',
                    keyword  : 'SDCORRECTION_SIMILARITY_SDFAC',
                    type     : 'real_',
                    tooltip  : 'SD(sdFac) for similarity restraints (default 0.05)',
                    min      : '0',
                    value    : ''
                },
                SDCORRECTION_SIMILARITY_SDB:
                {
                    //line   : (35, 2),
                    position : [10, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SDCORRECTION_REFINE': ['True'],
                        'SDCORRECTION_OPTIONS': ['SIMILAR']
                    },
                    label    : 'sigma for restrains on sdB',
                    keyword  : 'SDCORRECTION_SIMILARITY_SDB',
                    type     : 'real_',
                    tooltip  : 'SD(sdB) for similarity restraints (default 3.0)',
                    min      : '0',
                    value    : ''
                },
                SDCORRECTION_SIMILARITY_SDADD:
                {
                    //line   : (35, 3),
                    position : [11, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SDCORRECTION_REFINE': ['True'],
                        'SDCORRECTION_OPTIONS': ['SIMILAR']
                    },
                    label    : 'sigma for restrains on sdAdd',
                    keyword  : 'SDCORRECTION_SIMILARITY_SDADD',
                    type     : 'real_',
                    tooltip  : 'SD(sdAdd) for similarity restraints (default 0.04)',
                    min      : '0',
                    value    : ''
                }
            }
        },
        secReject:
        {
            type     : 'section',
            title    : 'Outlier Rejection',
            open     : false,
            position : [4,0,1,8],
            contains :
            {
                LABEL08:
                {
                    //line   : (63, 0),
                    position : [0, 0, 1, 8],
                    tooltip  : 'Reject an obserbvation if deviates from mean ' +
                               'by more tham threshold value',
                    label    : 'Thresholds deviation from mean (SDs)',
                    type     : 'label'
                },
                OUTLIER_SDMAX:
                {
                    //line   : (64, 0),
                    position : [1, 0, 1, 8],
                    align    : 'right',
                    label    : 'for three or more equivalent observations',
                    keyword  : 'OUTLIER_SDMAX',
                    type     : 'real_',
                    tooltip  : 'for >2 observations, reject if more than this ' +
                               'SDs (default 6.0)',
                    min      : '0',
                    value    : ''
                },
                OUTLIER_SDMAX2:
                {
                    position : [2, 0, 1, 8],
                    align    : 'right',
                    label    : 'for two equivalent observations',
                    keyword  : 'OUTLIER_SDMAX2',
                    type     : 'real_',
                    tooltip  : 'for 2 observations, reject if more than this ' +
                               'SDs (default 6.0)',
                    min      : '0',
                    value    : ''
                },
                OUTLIER_SDMAXALL:
                {
                    //line   : (65, 0),
                    position : [3, 0, 1, 8],
                    align    : 'right',
                    label    : 'for differences between I+ and I-',
                    keyword  : 'OUTLIER_SDMAXALL',
                    type     : 'real_',
                    tooltip  : 'for differences between I+ and I-, reject if ' +
                               'more than this (SDs default 8.0)',
                    min      : '0',
                    value    : ''
                },
                OUTLIER_SDMAXALL_ADJUST:
                {
                    position : [4, 0, 1, 8],
                    align    : 'right',
                    keyword  : 'OUTLIER_SDMAXALL_ADJUST',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Increase rejection threshold for large ' +
                               'anomalous differences',
                    value    : 'True',
                    label    : 'increase for large anomalous differences'
                },
                OUTLIER_COMBINE:
                {
                    //line   : (66, 0),
                    position : [5, 0, 1, 8],
                    label    : '',
                    keyword  : 'OUTLIER_COMBINE',
                    label    : 'For more than one dataset, compare outliers',
                    type     : 'combobox',
                    range    :
                    [
                        'True|across all datasets',
                        'False|within datasets'
                    ],
                    tooltip  : 'test for rejections across all datasets ' +
                               'or within individual datasets',
                    value    : 'True'
                },
                OUTLIER_EMAX:
                {
                    //line   : (67, 0),
                    position : [6, 0, 1, 8],
                    label    : 'Set maximum E to reject unreasonably large ' +
                               'intensities',
                    keyword  : 'OUTLIER_EMAX',
                    type     : 'real_',
                    tooltip  : 'Maximum allowed E to exclude unreasonably ' +
                               'large intensities (default 5.0)',
                    min      : '0',
                    value    : ''
                }
            }
        },
        secScOpt:
        {
            type     : 'section',
            showon   : {'PERFORM_SCALING': ['YES']},
            title    : 'Scaling Protocols',
            open     : false,
            position : [5,0,1,8],
            contains :
            {
                SCALING_PROTOCOL:
                {
                    //line   : (57, 0),
                    position : [0, 0, 1, 8],
                    lwidth   : 320,
                    label    : 'Scale',
                    keyword  : 'SCALING_PROTOCOL',
                    type     : 'combobox',
                    range    :
                    [
                        'ROTATION|on rotation axis',
                        'CONSTANT|constant',
                        'BATCH|by batch (deprecated)'
                    ],
                    tooltip  : 'define scaling protocol for all runs',
                    value    : 'ROTATION'
                },
                SCALES_ROTATION_TYPE:
                {
                    //line   : (58, 0),
                    position : [1, 0, 1, 8],
                    showon   :
                    {
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    label    : 'Define scale ranges along rotation axis by',
                    keyword  : 'SCALES_ROTATION_TYPE',
                    type     : 'combobox',
                    range    :
                    [
                        'SPACING|rotation interval',
                        'NBINS|number of bins'
                    ],
                    tooltip  : 'spacing for scales along primary beam',
                    value    : 'SPACING'
                },
                SCALES_ROTATION_SPACING:
                {
                    //line   : (58, 1),
                    position : [2, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'SCALES_ROTATION_TYPE': ['SPACING']
                    },
                    keyword  : 'SCALES_ROTATION_SPACING',
                    type     : 'real_',
                    tooltip  : 'spacing in degrees (default 5.0)',
                    value    : '',
                    min      : '0',
                    label    : 'spacing in degrees'
                },
                SCALES_ROTATION_NBINS:
                {
                    //line   : (58, 2),
                    position : [3, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'SCALES_ROTATION_TYPE': ['NBINS']
                    },
                    keyword  : 'SCALES_ROTATION_NBINS',
                    label    : 'number of bins',
                    type     : 'integer_',
                    tooltip  : 'number of primary scales (default 1)',
                    min      : '0',
                    value    : ''
                },
                LABEL09:
                {
                    //line   : (60, 0),
                    position : [4, 0, 1, 8],
                    showon   :
                    {
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    label    : '&nbsp;',
                    tooltip  : '&nbsp;',
                    type     : 'label'
                },
                BFACTOR_SCALE:
                {
                    //line   : (57, 1),
                    position : [5, 0, 1, 8],
                    showon   :
                    {
                        'SCALING_PROTOCOL': ['ROTATION', 'BATCH']
                    },
                    label    : 'Refine relative B-factors',
                    keyword  : 'BFACTOR_SCALE',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'switch relative B-factor scaling on',
                    value    : 'True'
                },
                SCALES_BROTATION_TYPE:
                {
                    //line   : (59, 0),
                    position : [6, 0, 1, 8],
                    showon   :
                    {
                        '_': '&&',
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'BFACTOR_SCALE': ['True']
                    },
                    label    : 'Define B-factor ranges along rotation axis by',
                    keyword  : 'SCALES_BROTATION_TYPE',
                    type     : 'combobox',
                    range    :
                    [
                        'SPACING|rotation interval',
                        'NBINS|number of bins'
                    ],
                    tooltip  : 'spacing for B-factors along primary beam',
                    value    : 'SPACING'
                },
                SCALES_BROTATION_SPACING:
                {
                    //line   : (59, 1),
                    position : [7, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'BFACTOR_SCALE': ['True'],
                        'SCALES_BROTATION_TYPE': ['SPACING']
                    },
                    keyword  : 'SCALES_BROTATION_SPACING',
                    type     : 'real_',
                    tooltip  : 'spacing in degrees (default 20.0)',
                    value    : '',
                    min      : '0',
                    label    : 'spacing in degrees'
                },
                SCALES_BROTATION_NBINS:
                {
                    //line   : (59, 2),
                    position : [8, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'BFACTOR_SCALE': ['True'],
                        'SCALES_BROTATION_TYPE': ['NBINS']
                    },
                    keyword  : 'SCALES_BROTATION_NBINS',
                    label    : 'number of bins',
                    type     : 'integer_',
                    tooltip  : 'number of primary scales (default 1)',
                    min      : '0',
                    value    : ''
                },
                LABEL10:
                {
                    //line   : (60, 0),
                    position : [9, 0, 1, 8],
                    showon   :
                    {
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    label    : '&nbsp;',
                    tooltip  : '&nbsp;',
                    type     : 'label'
                },
                SCALES_SECONDARY_CORRECTION:
                {
                    //line   : (60, 0),
                    position : [10, 0, 1, 8],
                    showon   :
                    {
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    label    : 'Apply secondary beam correction',
                    keyword  : 'SCALES_SECONDARY_CORRECTION',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Apply and refine parameters of secondary beam correction',
                    value    : 'True'
                },
                SCALES_SECONDARY_NSPHHARMONICS:
                {
                    position : [11, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALES_SECONDARY_CORRECTION': ['True'],
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    label    : 'maximum order of spherical harmonics',
                    keyword  : 'SCALES_SECONDARY_NSPHHARMONICS',
                    type     : 'integer_',
                    tooltip  : 'Number of spherical harmonic terms (eg 4 - 6, default 4)',
                    min      : '0',
                    value    : ''
                },
                SCALES_TILETYPE:
                {
                    //line   : (61, 0),
                    position : [12, 0, 1, 8],
                    label    : 'Tile scaling for CCD detectors',
                    showon   :
                    {
                        '_': '&&',
                        'SCALES_SECONDARY_CORRECTION': ['True'],
                        'SCALING_PROTOCOL': ['ROTATION']
                    },
                    keyword  : 'SCALES_TILETYPE',
                    type     : 'combobox',
                    range    :
                    [
                        'DEFAULT|automatic',
                        'NONE|no tile correction',
                        'CCD|tile correction'
                    ],
                    tooltip  : 'automatically on for 3x3 ADSC detectors',
                    value    : 'DEFAULT'
                },
                SCALES_NTILEX:
                {
                    //line   : (62, 0),
                    position : [13, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALES_SECONDARY_CORRECTION': ['True'],
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'SCALES_TILETYPE': ['CCD']
                    },
                    label    : 'number of tiles on X',
                    keyword  : 'SCALES_NTILEX',
                    type     : 'integer_',
                    tooltip  : 'number of tiles on X (default 3)',
                    min      : '0',
                    value    : ''
                },
                SCALES_NTILEY:
                {
                    position : [14, 0, 1, 8],
                    align    : 'right',
                    showon   :
                    {
                        '_': '&&',
                        'SCALES_SECONDARY_CORRECTION': ['True'],
                        'SCALING_PROTOCOL': ['ROTATION'],
                        'SCALES_TILETYPE': ['CCD']
                    },
                    label    : 'number of tiles on Y',
                    keyword  : 'SCALES_NTILEY',
                    type     : 'integer_',
                    tooltip  : 'number of tiles on Y (default 3)',
                    min      : '0',
                    value    : ''
                }
            }
        },
        secScDtl:
        {
            type     : 'section',
            showon   : {'PERFORM_SCALING': ['YES']},
            title    : 'Scaling Details',
            open     : false,
            position : [6,0,1,8],
            contains :
            {
                LABEL11:
                {
                    //line   : (37, 0),
                    position : [0, 0, 1, 8],
                    type     : 'label',
                    tooltip  : 'Set scale refinement parameters',
                    label    : 'Set scale refinement parameters'
                },
                CYCLES_N:
                {
                    position : [1, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    keyword  : 'CYCLES_N',
                    type     : 'integer_',
                    tooltip  : 'Set number of cycles for scale refinement ' +
                               '(default 10)',
                    value    : '',
                    min      : '0',
                    label    : 'number of refinement cycles'
                },
                SELECT_IOVSDMIN:
                {
                    position : [2, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    keyword  : 'SELECT_IOVSDMIN',
                    type     : 'real_',
                    tooltip  : 'Set minimum I/sd for 1st round scaling ' +
                               '(default 3.0)',
                    value    : '',
                    min      : '0',
                    label    : 'minimum I/sd for 1st round scaling'
                },
                SELECT_EMIN:
                {
                    position : [3, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    keyword  : 'SELECT_EMIN',
                    type     : 'real_',
                    tooltip  : 'set minimum E for 2nd round scaling ' +
                               '(default 1.0)',
                    value    : '',
                    min      : '0',
                    label    : 'minimum E for 2nd round scaling'
                },
                LABEL12:
                {
                    position : [4, 0, 1, 8],
                    type     : 'label',
                    tooltip  : '&nbsp;',
                    label    : '&nbsp;'
                },
                TIE_DETAILS:
                {
                    position : [5, 0, 1, 8],
                    label    : 'Restarints for scale refinement:',
                    lwidth   : 372,
                    keyword  : 'TIE_DETAILS',
                    type     : 'combobox',
                    range    :
                    [
                        'DEFAULT|automatic',
                        'ADJUST|adjust settings'
                    ],
                    value    : 'DEFAULT',
                    tooltip  : 'Adjust or use automatic settings for ' +
                               'restarints for scale refinement'
                },
                TIE_ROTATION:
                {
                    //line   : (40, 0),
                    position : [6, 0, 1, 8],
                    showon   :
                    {
                        'TIE_DETAILS': ['ADJUST']
                    },
                    keyword  : 'TIE_ROTATION',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Restrain successive primary beam scales ' +
                               'together',
                    value    : 'False',
                    label    : 'Restrain neighbouring scale factors on ' +
                               'rotation axis'
                },
                TIE_ROTATION_SD:
                {
                    position : [7, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    showon   :
                    {
                        '_': '&&',
                        'TIE_DETAILS': ['ADJUST'],
                        'TIE_ROTATION': ['True']
                    },
                    keyword  : 'TIE_ROTATION_SD',
                    label    : 'SD',
                    type     : 'real_',
                    tooltip  : 'SD for restraints on successive primary beam ' +
                               'scales (default 0.05)',
                    min      : '0',
                    value    : ''
                },
                TIE_SURFACE:
                {
                    //line   : (41, 0),
                    position : [8, 0, 1, 8],
                    showon   :
                    {
                        'TIE_DETAILS': ['ADJUST']
                    },
                    keyword  : 'TIE_SURFACE',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    tooltip  : 'Restrain secondary beam scales to sphere',
                    value    : 'True',
                    label    : 'Restrain surface parameters to a sphere'
                },
                TIE_SURFACE_SD:
                {
                    position : [9, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    showon   :
                    {
                        '_': '&&',
                        'TIE_DETAILS': ['ADJUST'],
                        'TIE_SURFACE': ['True']
                    },
                    keyword  : 'TIE_SURFACE_SD',
                    label    : 'SD',
                    type     : 'real_',
                    tooltip  : 'SD for restraints on secondary beam scales to ' +
                               'sphere (default 0.005)',
                    min      : '0',
                    value    : ''
                },
                TIE_BFACTOR:
                {
                    //line   : (42, 0),
                    position : [10, 0, 1, 8],
                    showon   :
                    {
                        'TIE_DETAILS': ['ADJUST']
                    },
                    keyword  : 'TIE_BFACTOR',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    label    : 'Restrain successive B-factors together',
                    value    : 'False',
                    tooltip  : 'Restrain neighbouring B-factors on rotation ' +
                               'axis'
                },
                TIE_BFACTOR_SD:
                {
                    position : [11, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    showon   :
                    {
                        '_': '&&',
                        'TIE_DETAILS': ['ADJUST'],
                        'TIE_BFACTOR': ['True']
                    },
                    keyword  : 'TIE_BFACTOR_SD',
                    label    : 'SD',
                    type     : 'real_',
                    tooltip  : 'SD for restraints on neighbouring B-factors ' +
                               'on rotation axis (default 0.05)',
                    min      : '0',
                    value    : ''
                },
                TIE_BZERO:
                {
                    //line   : (43, 0),
                    position : [12, 0, 1, 8],
                    showon   :
                    {
                        'TIE_DETAILS': ['ADJUST']
                    },
                    keyword  : 'TIE_BZERO',
                    type     : 'combobox',
                    range    : ['True|yes', 'False|no'],
                    iwidth   : 82,
                    label    : 'Tie B-factors to zero',
                    value    : 'True',
                    tooltip  : 'Restrain B-factors to zero'
                },
                TIE_BZERO_SD:
                {
                    position : [13, 0, 1, 8],
                    align    : 'right',
                    iwidth   : 72,
                    showon   :
                    {
                        '_': '&&',
                        'TIE_DETAILS': ['ADJUST'],
                        'TIE_BZERO': ['True']
                    },
                    keyword  : 'TIE_BZERO_SD',
                    label    : 'SD',
                    type     : 'real_',
                    tooltip  : 'SD for restrain on B-factors tied to zero ' +
                               '(default 10.0)',
                    min      : '0',
                    value    : ''
                }
            }
        }
    };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskAimless.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAimless.prototype = Object.create ( TaskTemplate.prototype );
TaskAimless.prototype.constructor = TaskAimless;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAimless.prototype.icon           = function()  { return 'task_aimless'; }
TaskAimless.prototype.clipboard_name = function()  { return '"Aimless"';    }

TaskAimless.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskAimless.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['aimless','image', 'processing', 'data', 
                                           'reduction', 'merge', 'merging', 'scale', 
                                           'scaling'] );
}

TaskAimless.prototype.getWorkflowScript = function ( serialNo )  {
let wscript = [];
  if (__template)
        wscript = __template.TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  else  wscript = TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  wscript.splice ( 1,0,'    DATA      ds0  unmerged' );
  return wscript;
}

if (!__template)  {
  //  for client side

  TaskAimless.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'scale together multiple observations of reflections';
    };

  TaskAimless.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    function addMessage ( label,message )  {
      input_msg += '|<b><i>' + label + '</i>:</b> ' + message;
    }

    let unmerged = this.input_data.getData ( 'unmerged' );

    for (let i=0;i<unmerged.length;i++)  {
      for (let j=i+1;j<unmerged.length;j++)
        if (unmerged[i].dataId==unmerged[j].dataId)
          addMessage ( 'Reflection data','dataset ' + unmerged[i].dname +
                       ' is used in more than one input positions, which is not ' +
                       'allowed' );
    }

    return input_msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskAimless.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.aimless', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAimless = TaskAimless;

}
