
/*
 *  =================================================================
 *
 *    28.08.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.arcimboldoshredder.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ArcimboldoShredder Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
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

function TaskArcimboldoShredder()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskArcimboldoShredder';
  this.name   = 'arcimboldo-shredder';
  this.setOName ( 'arcimboldo-shredder' );  // default output file name template
  this.title  = 'Fragment Molecular Replacement with Arcimboldo-Shredder';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['~xyz','~phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision',  // input Id for referencing input fields
      version     : 0,           // minimum data version allowed
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{      // input data types
      data_type   : {'DataXYZ':['protein','~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Homology model', // label for input dialog
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'BF_correction', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    // WARNING_LBL : { type     : 'label',
    //                 label    : '&nbsp;<br><i><b>Note:</b> this task may take ' +
    //                            'significant computational resources and ' +
    //                            'put you outside your monthly quota.</i>',
    //                 position : [0,0,1,5]
    //               },
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                COIL_COILED_CBX : {
                  type     : 'checkbox',
                  label    : 'Run in coil coiled mode',
                  tooltip  : 'Check to run in coil coiled mode',
                  value    : false,
                  iwidth   : 200,
                  position : [0,0,1,3]
                },
                PREDICTED_MODEL : {
                  type     : 'checkbox',
                  label    : 'Run in predicted model mode',
                  tooltip  : 'Check to run in predicted model mode',
                  value    : false,
                  iwidth   : 220,
                  position : [1,0,1,3]
                },
                RMSD :  { type     : 'real',
                          keyword  : 'RMSD',
                          label    : 'Assume',
                          tooltip  : 'Assumed r.m.s.d. from target structure',
                          range    : [0.001,2.0],
                          value    : '1.2',
                          iwidth   : 40,
                          position : [2,0,1,1]
                        },
                RMSD_LBL : {
                          type     : 'label',
                          label    : '(&Aring;)&nbsp;&nbsp;&nbsp; r.m.s.d. from target',
                          //lwidth   : 100,
                          position : [2,3,1,3]
                        },
                POLYALA_SEL : {
                          type     : 'combobox',
                          keyword  : 'POLYALA',
                          label    : 'Convert to polyalanine:',
                          tooltip  : 'Mode for converting input model to polyalanine',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [3,0,1,3]
                        },
                BFACTORS_SEL : {
                          type     : 'combobox',
                          keyword  : 'BFACTORS',
                          label    : 'Make all B-factors equal:',
                          tooltip  : 'Mode for equalising B-factors',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [4,0,1,3]
                        },
                SHRMODE_SEL : {
                          type     : 'combobox',
                          keyword  : 'SHRMODE',
                          label    : 'Shredder mode:',
                          tooltip  : 'Shredder working mode',
                          range    : ['sequential|sequential',
                                      'spherical|spherical'
                                    ],
                          value    : 'spherical',
                          iwidth   : 140,
                          position : [5,0,1,3]
                        },
                MULTICOPY: {
                          type     : 'combobox',
                          keyword  : 'MULTICOPY',
                          label    : 'Multicopy search:',
                          tooltip  : 'Choose multicopy search option mode',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [6,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                          
                        },
                COIL_SEL : {
                          type     : 'combobox',
                          keyword  : 'COIL',
                          label    : 'Maintain coil in the model:',
                          tooltip  : 'Mode for maintaining coils in the model',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [7,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                        },
                GYRE_SEL : {
                          type     : 'combobox',
                          keyword  : 'GYRE',
                          label    : 'Perform gyre refinement:',
                          tooltip  : 'GYRE refinement mode',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [8,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                        },
                GIMBLE_SEL : {
                          type     : 'combobox',
                          keyword  : 'GIMBLE',
                          label    : 'Perform gimble refinement:',
                          tooltip  : 'GIMBLE refinement mode',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [9,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                        },
                LLG_SEL : {
                          type     : 'combobox',
                          keyword  : 'LLG',
                          label    : 'Perform LLG-guided pruning:',
                          tooltip  : 'Mode for LLG-guided pruning',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [10,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                        },
                PHASES_SEL : {
                          type     : 'combobox',
                          keyword  : 'PHASES',
                          label    : 'Combine phases with alixe:',
                          tooltip  : 'Combine partial solutions using ALIXE - ' +
                                     'better phases but runs longer',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [11,0,1,3],
                          showon   : {SHRMODE_SEL:['spherical']}
                        },

                
                        
              }
            },
    sec2 :  { type     : 'section',
              title    : 'Advanced parameters',
              open     : false,  // true for the section to be initially open
              position : [2,0,1,5],
              contains : {
                FRAGMENT_SIZE : {
                          type     : 'integer_',
                          keyword   : 'FRAGMENT_SIZE', // the real keyword for job input stream
                          label     : 'Fragment size',
                          tooltip   : 'Number of amoinoacids in a fragment.',
                          iwidth    : 50,
                          range     : [1,'*'],  // may be absent (no limits) or must
                                                // be one of the following:
                                                //   ['*',max]  : limited from top
                                                //   [min,'*']  : limited from bottom
                                                //   [min,max]  : limited from top and bottom
                          value     : '',       // value to be paired with the keyword
                          position  : [0,0,1,1] // [row,col,rowSpan,colSpan]
                        }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskArcimboldoShredder',TaskArcimboldoShredder,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskArcimboldoShredder',TaskArcimboldoShredder,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskArcimboldoShredder.prototype.icon           = function()  { return 'task_arcimboldo';       }
TaskArcimboldoShredder.prototype.clipboard_name = function()  { return '"Arcimboldo-Shredder"'; }
//TaskArcimboldoShredder.prototype.requiredEnvironment = function() { return ['CCP4','ROSETTA_DIR']; }

TaskArcimboldoShredder.prototype.currentVersion = function()  {
let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskArcimboldoShredder.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'uses fragments derived from a distant homologue template for MR';
}

TaskArcimboldoShredder.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['arcimboldo','arcimboldoshredder', 'shredder', 'molecular', 'replacement', 'mr'] );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskArcimboldoShredder.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

if (__template)  {
  //  for server side

  const conf = require('../../js-server/server.configuration');


  TaskArcimboldoShredder.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns threds or processes bypassing the queuing system.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function.
    return ncores_available;
  }
  
  TaskArcimboldoShredder.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      //this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskArcimboldoShredder.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.arcimboldo', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskArcimboldoShredder = TaskArcimboldoShredder;

}
