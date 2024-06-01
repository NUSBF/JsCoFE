
/*
 * !!!IN DEVELOPMENT!! Not in production list
 *
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
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
    },{
      data_type   : {'DataStructure':['protein'],
                     'DataModel'    :['protein'],
                     'DataXYZ'      :['protein']
                    },  // data type(s) and subtype(s)
      label       : 'Custom fragment', // label for input dialog
      inputId     : 'fragment',        // input Id for referencing input fields
      //customInput : 'chain-sel-protein-MR', // lay custom fields next to the selection
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    _fragments_lbl : {
            type     : 'label',
            label    : '<b>Predefined fragments</b>',
            position : [0,0,1,3],
            showon   : {'fragment':[0,-1]},
          },

    FRAGMENTS_SEL : {
            type     : 'combobox',
            keyword  : 'fragments',
            label    : '',
            lwidth   : 0,   // do not reserve columns for label
            tooltip  : 'Type of fragments to be serached for',
            range    : ['helix|Ideal helix',
                        'ensemble-anti5|Ensemble of antiparallel 5-residue strands',
                        'ensemble-para5|Ensemble of parallel 5-residue strands',
                        'ensemble-s3|Ensemble of 3-residue strands',
                        'ensemble-s4|Ensemble of 4-residue strands',
                        'ensemble-s5|Ensemble of 5-residue strands',
                        //'--fragment|Custom fragment'
                       ],
            value    : 'helix',
            iwidth   : 360,
            position : [0,1,1,1],
            showon   : {'fragment':[0,-1]}
          },

    fragments_sec :  {
            type     : 'section',
            title    : '',
            open     : true,  // true for the section to be initially open
            position : [1,3,1,1],
            showon   : {'fragment':[0,-1]},
            contains : {
              HELIX_LEN : {
                      type     : 'integer', // '_' means blank value is allowed
                      keyword  : 'helix',   // the "real" keyword for job input stream
                      label    : '<i>helix length</i> :',
                      tooltip  : 'Choose a value between 5 and 20',
                      range    : [5,20],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                      value    : 10,        // value to be paired with the keyword
                      iwidth   : 40,
                      label2   : '<i>residues</i>',
                      position : [0,0,1,1], // [row,col,rowSpan,colSpan]
                      showon   : { FRAGMENTS_SEL : ['helix'] }
                    },
              HELIX_COPIES : {
                      type     : 'integer', // '_' means blank value is allowed
                      keyword  : 'helix',   // the "real" keyword for job input stream
                      label    : '<i>N<sub>copies</sub></i> :',
                      tooltip  : 'Choose a value between 1 and 10',
                      range    : [1,10],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                      value    : 1,        // value to be paired with the keyword
                      iwidth   : 40,
                      position : [1,0,1,1], // [row,col,rowSpan,colSpan]
                      showon   : { FRAGMENTS_SEL : ['helix'] }
                    },

              STRAND_TILT : {
                      type     : 'combobox',
                      keyword  : 'tilt',
                      label    : '<i>strand tilt</i> :',
                      tooltip  : 'Strand tilt in degrees',
                      range    : ['0|0',
                                  '5|5',
                                  '10|10',
                                  '15|15',
                                  '20|20',
                                  '25|25',
                                  '30|30'
                                 ],
                      value    : '0',
                      iwidth   : 90,
                      label2   : '<i>degrees</i>',
                      position : [0,0,1,1],
                      showon   : { FRAGMENTS_SEL : ['ensemble-anti5','ensemble-para5'] }
                    },
              STRAND_COPIES : {
                      type     : 'integer', // '_' means blank value is allowed
                      keyword  : 'helix',   // the "real" keyword for job input stream
                      label    : '<i>N<sub>copies</sub></i> :',
                      tooltip  : 'Choose a value between 1 and 10',
                      range    : [1,10],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                      value    : 1,         // value to be paired with the keyword
                      iwidth   : 32,
                      position : [2,0,1,1], // [row,col,rowSpan,colSpan]
                      hideon   : { FRAGMENTS_SEL : ['helix'] }
                    }

            }
         },

    sec1 :  { type     : 'section',
              title    : 'Basic options',
              open     : false,
              position : [2,0,1,5],
              contains : {
                NSOLUTIONS : {
                        type     : 'integer', // '_' means blank value is allowed
                        keyword  : 'helix',   // the "real" keyword for job input stream
                        label    : 'Maximum number of solutions to test',
                        tooltip  : 'Choose a value between 4 and 200',
                        range    : [4,200],   // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : 10,        // value to be paired with the keyword
                        iwidth   : 50,
                        label2   : '&nbsp;&nbsp;&nbsp;',
                        position : [0,0,1,1]  // [row,col,rowSpan,colSpan]
                      },
                TESTALL_CBX  : {
                        type     : 'checkbox',
                        label    : 'Test all solutions',
                        tooltip  : 'Check for testing all candidate solutions',
                        value    : false,
                        iwidth   : 160,
                        position : [0,5,1,1]
                      },
                ACORN_CC : {
                        type     : 'real',
                        keyword  : 'ACORNCC',
                        label    : 'Stop <b>when</b> ACORN CC is above',
                        align    : 'right',
                        reportas : 'Acorn CC threshold', // to use in error reports
                                                         // instead of 'label'
                        tooltip  : 'The default value (0.3) is unlikely to need changing',
                        range    : [0.00001,0.99999],
                        value    : 0.3,
                        iwidth   : 50,
                        label2   : '&nbsp;&nbsp;&nbsp;',
                        position : [1,0,1,1]
                      },
                ACORN_DCC : {
                        type     : 'real',
                        keyword  : 'ACORNDCC',
                        label    : '<b>or</b> the difference between best<br>and worst CC is above',
                        align    : 'right',
                        reportas : 'Acorn CC difference threshold', // to use in error reports
                                                                    // instead of 'label'
                        tooltip  : 'The default value (0.15) is unlikely to need changing',
                        range    : [0.00001,0.99999],
                        value    : 0.15,
                        iwidth   : 50,
                        position : [2,0,1,1]
                      }
              }
            },
    sec2 :  { type     : 'section',
              title    : 'Advanced options',
              open     : false,
              position : [3,0,1,5],
              contains : {
                LIMITRF_CBX  : {
                        type     : 'checkbox',
                        label    : 'Limit the number of rotation functions in multi-copy search',
                        tooltip  : 'Turning this off may lead to much increased run time',
                        value    : true,
                        iwidth   : 460,
                        position : [0,0,1,4]
                      },
                MAXNRF : {
                        type     : 'integer', // '_' means blank value is allowed
                        keyword  : 'maxnrf',   // the "real" keyword for job input stream
                        label    : 'Maximum number of RFs',
                        tooltip  : 'Default number works well',
                        range    : [10,500],  // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : 100,       // value to be paired with the keyword
                        iwidth   : 50,
                        position : [1,0,1,1], // [row,col,rowSpan,colSpan]
                        showon   : { LIMITRF_CBX : [true] }
                      },
                TNCS_CBX  : {
                        type     : 'checkbox',
                        label    : 'Turn off all tNCS corrections',
                        tooltip  : 'May be necessary in some cases',
                        value    : false,
                        iwidth   : 240,
                        position : [2,0,1,4]
                      },
                RBREFINE_SEL : {
                        type     : 'combobox',
                        keyword  : 'RBREFINE',
                        label    : 'Rigid body refine mode',
                        tooltip  : 'Try default first as the other options increase the run time',
                        range    : ['T|Both strands together',
                                    'S|Each strand separately',
                                    'H|Both halves of strand separately'
                                   ],
                        value    : 'T',
                        iwidth   : 290,
                        position : [3,0,1,1]
                      }
            }
          }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskFragon.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFragon.prototype = Object.create ( TaskTemplate.prototype );
TaskFragon.prototype.constructor = TaskFragon;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskFragon.prototype.icon           = function()  { return 'task_fragon'; }
TaskFragon.prototype.clipboard_name = function()  { return '"Fragon"';    }

TaskFragon.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  TaskFragon.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'uses fragments of secondary structure as model for MR ';
  };

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
      this.input_data.data['seq'] = revision.ASU.seq;
      /*
      if (revision.Options.leading_structure=='substructure')
            this.input_data.data['istruct'] = [revision.Substructure];
      else  this.input_data.data['istruct'] = [revision.Structure];
      switch (revision.Options.ncsmodel_sel)  {
        case 'substructure':
                  this.input_data.data['ncs_struct'] = [revision.Substructure];
                break;
        case 'model'       :
                  this.input_data.data['ncs_struct'] = [revision.Structure];
                break;
        default : ;
      }
      */
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskFragon.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.fragon', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFragon = TaskFragon;

}
