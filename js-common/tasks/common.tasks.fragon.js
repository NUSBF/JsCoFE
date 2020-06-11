
/*
 *  =================================================================
 *
 *    11.06.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.fragon.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Fragon Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskFragon()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskFragon';
  this.name    = 'fragon';
  this.setOName ( 'fragon' );  // default output file name template
  this.title   = 'Molecular Replacement with fragments -- Fragon';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['hkl']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      //customInput : 'fragon',   // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 :  { type     : 'section',
              title    : 'Search options',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                FRAGMENTS_SEL : {
                        type     : 'combobox',
                        keyword  : 'fragments',
                        label    : 'Fragments to search with',
                        tooltip  : 'Type of fragments to be serached for',
                        range    : ['--helix|Ideal helix',
                                    '--ensemble|Ensemble of strands',
                                    '--fragment|Custom fragment'
                                   ],
                        value    : 'helix',
                        position : [0,0,1,1]
                      },
                HELIX_LEN : {
                        type     : 'integer', // '_' means blank value is allowed
                        keyword  : 'helix',   // the "real" keyword for job input stream
                        label    : 'Helix length',
                        tooltip  : 'Choose a value between 5 and 20',
                        range    : [5,20],    // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : 10,        // value to be paired with the keyword
                        position : [1,0,1,1], // [row,col,rowSpan,colSpan]
                        showon   : { FRAGMENTS_SEL : ['--helix'] }
                      },
                HELIX_COPIES : {
                        type     : 'integer', // '_' means blank value is allowed
                        keyword  : 'helix',   // the "real" keyword for job input stream
                        label    : 'copies',
                        tooltip  : 'Choose a value between 1 and 10',
                        range    : [1,10],    // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : 1,        // value to be paired with the keyword
                        position : [1,4,1,1], // [row,col,rowSpan,colSpan]
                        showon   : { FRAGMENTS_SEL : ['--helix'] }
                      }
             }
           },
    sec2 : { type     : 'section',
             title    : 'Basic options',
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
             }
           },
    sec3 : { type     : 'section',
             title    : 'Advanced options',
             open     : false,
             position : [2,0,1,5],
             contains : {
               TITLE3 : { type  : 'label',  // just a separator
                       label    : '<h3>Change default behaviour for</h3>',
                       position : [0,0,1,4]
                     },
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
          }
  };

}


if (__template)
      TaskFragon.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFragon.prototype = Object.create ( TaskTemplate.prototype );
TaskFragon.prototype.constructor = TaskFragon;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskFragon.prototype.icon = function()  { return 'task_fragon'; }

TaskFragon.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  //TaskFragon.prototype.hotButtons = function() {
  //  return [RefmacHotButton()];
  //}

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskFragon.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      if (revision.Options.leading_structure=='substructure')
        this.input_data.data['phases'] = [revision.Substructure];
      if (revision.Structure)  {
        if (revision.Options.structure_sel.indexOf('fixed-model')>=0)
          this.input_data.data['xmodel'] = [revision.Structure];
        if (revision.Options.structure_sel.indexOf('edfit')>=0)
          this.input_data.data['phases'] = [revision.Structure];
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskFragon.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.fragon', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFragon = TaskFragon;

}
