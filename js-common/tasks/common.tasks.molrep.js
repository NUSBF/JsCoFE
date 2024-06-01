
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.molrep.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Molrep Task Class
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

function TaskMolrep()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMolrep';
  this.name    = 'molrep';
  this.setOName ( 'molrep' );  // default output file name template
  this.title   = 'Molecular Replacement with Molrep';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'molrep1',  // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataEnsemble':['~mmcif_only'],
                     'DataModel'   :['~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Model ensemble',     // label for input dialog
      inputId     : 'model',    // input Id for referencing input fields
      customInput : 'model',    // lay custom fields below the dropdown
//**      castTo      : 'DataEnsemble', // all input types will be casted to the specified
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Search options',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
              NMON : { type    : 'integer_', // '_' means blank value is allowed
                       keyword  : 'NMON',       // the real keyword for job input stream
                       label    : 'Number of copies to find',
                       tooltip  : 'Choose a value between 1 and 200, or leave ' +
                                  'blank for automatic choice',
                       range    : [1,200],  // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                       value    : '',       // value to be paired with the keyword
                       position : [0,0,1,1] // [row,col,rowSpan,colSpan]
                     },
              NP  :  { type     : 'integer_', // '_' means blank value is allowed
                       keyword  : 'NP',       // the real keyword for job input stream
                       label    : 'Number of RF peaks to use',
                       tooltip  : 'Choose a value between 1 and 200, or leave ' +
                                  'blank for automatic choice',
                       range    : [1,200],  // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                       value    : '',       // value to be paired with the keyword
                       position : [1,0,1,1] // [row,col,rowSpan,colSpan]
                     },
              NPT :  { type     : 'integer_',
                       keyword  : 'NPT',
                       label    : 'Number of RF peaks to use in TF',
                       tooltip  : 'Choose a value between 1 and 50, or leave ' +
                                  'blank for automatic choice',
                       range    : [1,50],
                       value    : '',
                       position : [2,0,1,1]
                     },
              LOCK : { type     : 'combobox',
                       keyword  : 'LOCK',
                       label    : 'Locked rotation function',
                       tooltip  : 'Locked rotation function',
                       range    : ['N|Do not use','A|Auto','Y|Use SRF table'],
                                  // for comboboxes, 'range' lists all available
                                  // items encoded as 'value|text', where 'value'
                                  // is a valid value for the associated keyword,
                                  // and 'text' is displayed as an option in the
                                  // combobox.
                       value    : 'N',
                       position : [3,0,1,1]
                     },
              NSRF : { type     : 'integer_',
                       keyword  : 'NSRF',
                       label    : '&nbsp;&nbsp;&nbsp;&nbsp;with',
                       reportas : 'Number of top SRF peaks', // to use in error reports
                                                             // instead of 'label'
                       tooltip  : 'Number of top SRF peaks to use in Locked RF. ' +
                                  'Choose a value between 1 and 50, or leave ' +
                                  'blank for automatic choice',
                       range    : [1,50],
                       value    : '',
                       position : [3,3,1,1],
                       align    : 'right',
                       showon   : {'LOCK':['A','Y']}
                     },
              NSPL : { type     : 'label',
                       label    : 'top SRF peaks',
                       position : [3,6,1,1],
                       showon   : {'LOCK':['A','Y']}
                     },
              PST :  { type     : 'combobox',
                       keyword  : 'PST',
                       label    : 'Pseudo-translation',
                       tooltip  : 'Using pseudo-translation',
                       range    : ['A|Auto','N|Do not use'],
                       value    : 'A',
                       position : [4,0,1,1]
                     }
              //        },
              // PRF :  { type     : 'combobox',
              //          keyword  : 'PRF',
              //          label    : 'Density search protocol',
              //          tooltip  : 'Density search protocol',
              //          range    : ['N|Density Search (RF + Phased TF)',
              //                      'Y|Density Search (SAPTF + Local Phased RF + Phased TF)',
              //                      'S|Density Search (SAPTF + Local RF + Phased TF)'
              //                     ],
              //          value    : 'N',
              //          position : [5,0,1,7],
              //          hideon   : {'revision.subtype:phases':[0,-1]} // from input data section
              //        }
             }
           },
    sec2 : { type     : 'section',
             title    : 'Experimental data',
             open     : false,
             position : [1,0,1,5],
             contains : {
               TITLE2 : { type  : 'label',  // just a separator
                       label    : '<h3>Change default behaviour for</h3>',
                       position : [0,0,1,4]
                     },
               RESMAX_CBX  : { type : 'checkbox',
                       label    : 'High resolution cut-off',
                       tooltip  : 'Check for using high resolution cut-off',
                       value    : false,
                       position : [1,0,1,1]
                     },
               SEP2 : { type    : 'label',  // just a separator
                       label    : '&nbsp;&nbsp;',
                       lwidth   : 30,       // 'lwidth' is label width in px
                       position : [1,1,1,1]
                     },
               RESMAX : { type  : 'real_',
                       keyword  : 'RESMAX',
                       label    : 'R<sub>max</sub> [&Aring;]:',
                       lwidth   : 60,      // label width in px
                       reportas : 'High resolution cut-off', // to use in error reports
                                                             // instead of 'label'
                       tooltip  : 'High resolution limit to cut reflection data. ' +
                                  'Choose a value between 0 and 10 angstrom, ' +
                                  'or leave blank for automatic choice',
                       range    : [0,10],
                       value    : '',
                       position : [1,2,1,1],
                       showon   : {'RESMAX_CBX':[true]}
                     },
               SIM_CBX  : { type : 'checkbox',
                       label    : 'Down-weighting high resolution data',
                       tooltip  : 'Check for down-weighting high resolution data',
                       value    : false,
                       position : [2,0,1,1]
                     },
               SIM_MOD : { type : 'combobox',
                       keyword  : 'SIM',
                       label    : 'use',
                       align    : 'right',
                       lwidth   : 60,        // label width in px
                       reportas : 'Down-weighting model',
                       tooltip  : 'Down-weighting model',
                       range    : ['S|Similarity','B|BADD'],
                       value    : 'S',
                       position : [2,2,1,1],
                       showon   : {'SIM_CBX':[true]}
                     },
               SIM : { type     : 'real_',
                       keyword  : 'SIM',
                       label    : '&nbsp;&nbsp;&nbsp;&nbsp;equal to',
                       align    : 'right',
                       reportas : 'Similarity value', // to use in error reports
                                                      // instead of 'label'
                       tooltip  : 'Similarity value (must be given if no ' +
                                  'sequence is specified in group model)',
                       range    : [0.1,1],
                       value    : '0.35',
                       position : [2,5,1,1],
                       showon   : {'SIM_CBX':[true]}
                     },
               RESMIN_CBX  : {
                       type     : 'checkbox',
                       label    : 'Down-weighting low resolution data',
                       tooltip  : 'Check for down-weighting low resolution data',
                       value    : false,
                       position : [3,0,1,1]
                     },
               RESMIN : {
                       type     : 'real_',
                       keyword  : 'RESMIN',
                       label    : 'R<sub>min</sub> [&Aring;]:',
                       lwidth   : 60,       // label width in px
                       reportas : 'Down-weighting low resolution data',
                       tooltip  : 'Down-weighting value for low resolution data. ' +
                                  'Choose a value about the radius of model used.',
                       range    : [1,'*'],
                       value    : '',
                       position : [3,2,1,1],
                       showon   : {'RESMIN_CBX':[true]}
                     },
               SCALING_CBX  : {
                       type     : 'checkbox',
                       label    : 'Scaling',
                       tooltip  : 'Check for scaling reflection data',
                       value    : false,
                       position : [4,0,1,1]
                     },
               ANISO : {
                       type     : 'combobox',
                       keyword  : 'ANISO',
                       label    : 'use',
                       align    : 'right',
                       lwidth   : 60,       // label width in px
                       iwidth   : 240,      // width of input field in px
                       reportas : 'Scaling model',
                       tooltip  : 'Scaling model',
                       range    : ['Y|aniso scaling',
                                   'C|aniso scaling in RF only',
                                   'S|aniso scaling in TF only',
                                   'N|isotropic scaling',
                                   'K|overall scale factor only'
                                  ],
                       value    : 'Y',
                       position : [4,2,1,4],
                       showon   : {'SCALING_CBX':[true]}
                     }
             }
           },
    sec3 : { type     : 'section',
             title    : 'Model',
             open     : false,
             position : [2,0,1,5],
             contains : {
               TITLE3 : { type  : 'label',  // just a separator
                       label    : '<h3>Change default behaviour for</h3>',
                       position : [0,0,1,4]
                     },
               /*
               SEQ_CBX  : {
                       type     : 'checkbox',
                       label    : 'Use sequence for model correction',
                       tooltip  : 'Check for model correction using ' +
                                  'sequence provided with the model group',
                       value    : false,
                       position : [1,0,1,1],
                       showon   : {'model.sequnk':[0,-1]}
                     },
               */
               SURF_CBX  : {
                       type     : 'checkbox',
                       label    : 'Additional model modification',
                       tooltip  : 'Modification of search model (B-factors ' +
                                  'or using polyalanine model)',
                       value    : false,
                       position : [1,0,1,1]
                     },
               SEP3 : { type    : 'label',  // just a separator
                       label    : '&nbsp;',
                       lwidth   : 30,       // 'lwidth' is label width in px
                       position : [1,1,1,1]
                     },
               SURF : { type    : 'combobox',
                       keyword  : 'SURF',
                       label    : '',
                       lwidth   : 0,
                       iwidth   : 300,      // width of input field in px
                       tooltip  : 'Modification of search model (B-factors ' +
                                  'or using polyalanine model)',
                       range    : ['Y|Increase B-factors on surface',
                                   '2|Set all B-factors equal',
                                   'O|Use B-factors from file',
                                   'A|Use polyalanine model'
                                  ],
                       value    : 'Y',
                       position : [1,2,1,1],
                       showon   : {'SURF_CBX':[true]}
                     },
               SURF_OLBL : {
                       type     : 'label',  // just a separator
                       label    : 'and',
                       align    : 'right',
                       position : [2,0,1,1],
                       showon   : {'SURF_CBX':[true],'SURF':['O']}
                     },
               SURF_PFCBX  : {
                       type     : 'checkbox',
                       label    : 'Increase B-factors on surface for Packing Function',
                       tooltip  : 'Modify search model with increasing B-factors ' +
                                  'on surface for Packing Function calculations',
                       value    : true,
                       position : [2,2,1,1],
                       showon   : {'SURF_CBX':[true],'SURF':['O']}
                     },
               NMR_CBX : {
                       type     : 'checkbox',
                       label    : 'Ensemble model',
                       tooltip  : 'Handling input PDB containing an ensemble ' +
                                  'or NMR model',
                       value    : false,
                       position : [3,0,1,1]
                     },
               NMR : { type     : 'checkbox',
                       label    : 'average intensities for RF',
                       keyword  : 'NMR',
                       tooltip  : 'Average intensities for Rotation Function',
                       value    : true,
                       translate: ['0','1'],  // [false,true]
                       position : [3,2,1,1],
                       showon   : {'NMR_CBX':[true]}
                     }
             }
           },
    sec4 : { type     : 'section',
             title    : 'Infrequently used options',
             open     : false,
             position : [3,0,1,5],
             contains : {
               /*
               DISCARD_CBX : {
                       type     : 'checkbox',
                       label    : 'Discard fixed model',
                       tooltip  : 'Can be used to fit a different model into the current ED maps',
                       value    : false,
                       position : [0,0,1,1],
                       hideon   : {_:'||','revision.subtype:xyz':[0,-1],'phases.phases':[0,-1]} // from input data section
                     },
               */
               TITLE4 : {
                       type     : 'label',  // just a separator
                       label    : '<h3>Change default behaviour for</h3>',
                       position : [1,0,1,4]
                     },
               PACK_CBX : {
                       type     : 'checkbox',
                       label    : 'Packing function',
                       tooltip  : 'Using packing function',
                       value    : false,
                       position : [2,0,1,1]
                     },
               SEP3 : { type    : 'label',  // just a separator
                       label    : '&nbsp;',
                       lwidth   : 30,       // 'lwidth' is label width in px
                       position : [2,1,1,1]
                     },
               PACK : { type    : 'checkbox',
                       label    : 'do use PF',
                       keyword  : 'PACK',
                       tooltip  : 'check for using packing function',
                       value    : true,
                       translate: ['N','Y'], // [false,true]
                       position : [2,2,1,1],
                       showon   : {'PACK_CBX':[true]}
                     },
               SCORE_CBX  : { type : 'checkbox',
                       label    : 'Scoring function',
                       tooltip  : 'Using scoring function',
                       value    : false,
                       position : [3,0,1,1]
                     },
               SCORE : { type   : 'checkbox',
                       label    : 'stop adding monomers if score does not improve',
                       keyword  : 'SCORE',
                       tooltip  : 'Check to terminate addition of monomers if ' +
                                  'overall score does not improves',
                       value    : true,
                       translate: ['O','Y'], // [false,true]
                       position : [3,2,1,1],
                       showon   : {'SCORE_CBX':[true]}
                     }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskMolrep',TaskMolrep,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskMolrep',TaskMolrep,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskMolrep.prototype.icon           = function()  { return 'task_molrep'; }
TaskMolrep.prototype.clipboard_name = function()  { return '"Molrep"';    }

TaskMolrep.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'perform MR using defined ASU and prepared MR models and/or ensembles';
}

TaskMolrep.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}
TaskMolrep.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['molrep', 'molecular','replacement','mr', 'auto-mr'] );
}



if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskMolrep.prototype.hotButtons = function() {
    return [RefmacHotButton()];
  }

  TaskMolrep.prototype.MRTypeChanged = function ( inpParamRef,value )  {
  // reacts on changing mr_type in revision's belly

    this.title = this.title.split(' (')[0];
    this.name = this.name.split(' (')[0];
    if (value!='refl')   {
      this.title += ' (density fit)';
      this.name  += ' (density fit)';
    }

    var inputPanel = inpParamRef.grid.parent.parent;
    inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
    var new_title = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
    inputPanel.header.uname_inp.setStyle ( 'text','',new_title );
    inputPanel.job_dialog.changeTitle ( new_title );
    inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                            job_dialog_reason.rename_node );

  }

} else  {
  //  for server side

  const conf   = require('../../js-server/server.configuration');
  // const sdtype = require('../../js-common/dtypes/common.dtypes.structure');

  TaskMolrep.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.Structure)  {
        if (revision.subtype.indexOf('ligands')>=0)
          this.input_data.data['ligands'] = [revision.Structure];
        if (revision.Options.mr_type=='sph')
          this.input_data.data['phases'] = [revision.Structure];
        // if (revision.Structure.subtype.indexOf(sdtype.structure_subtype.XYZ)>=0)
        if (revision.Structure.hasXYZ())
          this.input_data.data['xmodel'] = [revision.Structure];
      }
      if (revision.Substructure && 
          ((revision.Options.leading_structure=='substructure') ||
           (revision.Options.mr_type=='subph')))
        this.input_data.data['phases'] = [revision.Substructure];
      // if (revision.Structure)  {
      //   if (revision.Options.structure_sel.indexOf('fixed-model')>=0)
      //     this.input_data.data['xmodel'] = [revision.Structure];
      //   if (revision.Options.structure_sel.indexOf('edfit')>=0)
      //     this.input_data.data['phases'] = [revision.Structure];
      // }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskMolrep.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.molrep', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMolrep = TaskMolrep;

}
