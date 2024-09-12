
/*
 *  =================================================================
 *
 *    28.08.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.arcimboldo.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Arcimboldo-Borges Task Class
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

function TaskArcimboldoBorges()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskArcimboldoBorges';
  this.name   = 'arcimboldo-borges';
  this.setOName ( 'arcimboldo-borges' );  // default output file name template
  this.title  = 'Fragment Molecular Replacement with Arcimboldo-Borges';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['~xyz','~phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision',  // input Id for referencing input fields
      version     : 0,           // minimum data version allowed
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataBorges':[]}, // data type(s) and subtype(s)
      label       : 'Fragment library', // label for input dialog
      inputId     : 'fragments', // input Id for referencing input fields
      tooltip     : 'Custom fragment library (optional)',
      version     : 0,           // minimum data version allowed
      min         : 0,           // minimum acceptable number of data instances
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
                  position : [0,0,1,1]
                },
                LIBRARY_SEL : {
                          type     : 'combobox',
                          keyword  : 'HELICES',
                          label    : 'Use Borges Library:',
                          tooltip  : 'Specify the number of helices to search for',
                          range    : ['HELI_lib_uu|helices uu',
                                      'HELI_lib_ud|helices ud',
                                      'BETA_lib_udu|strands udu',
                                      'BETA_lib_uud|strands uud',
                                      'BETA_lib_uuu|strands uuu',
                                      'BETA_lib_uuuu|strands uuuu',
                                      'BETA_lib_udud|strands udud'
                                    ],
                          value    : 'HELI_lib_uu',
                          iwidth  : 160,
                          label2   : 'topology: u: up, d: down',
                          position : [1,0,1,1],
                          showon   : {'fragments':[-1,0]} // from input data section
                        },
                GYRE_SEL : {
                          type     : 'combobox',
                          keyword  : 'GYRE',
                          label    : 'Phaser GYRE option:',
                          tooltip  : 'Choose GYRE option mode',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [2,0,1,1]
                        },
                GIMBLE_SEL : {
                          type     : 'combobox',
                          keyword  : 'GIMBLE',
                          label    : 'Phaser GIMBLE option:',
                          tooltip  : 'Choose GIMBLE option mode',
                          range    : ['auto|Auto',
                                      'On|On',
                                      'Off|Off'
                                    ],
                          value    : 'auto',
                          iwidth   : 100,
                          position : [3,0,1,1]
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
                  position : [4,0,1,1]
                }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskArcimboldoBorges',TaskArcimboldoBorges,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskArcimboldoBorges',TaskArcimboldoBorges,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskArcimboldoBorges.prototype.icon           = function()  { return 'task_arcimboldo';     }
TaskArcimboldoBorges.prototype.clipboard_name = function()  { return '"Arcimboldo-Borges"'; }

//TaskArcimboldoBorges.prototype.requiredEnvironment = function() { return ['CCP4','ROSETTA_DIR']; }

TaskArcimboldoBorges.prototype.currentVersion = function()  {
let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskArcimboldoBorges.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'performs ab initio phasing with nonspecific libraries of small folds';
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskArcimboldoBorges.prototype.platforms = function()  { return 'LMU'; }  // UNIX only
TaskArcimboldoBorges.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4_MASTER/BORGES_LIBS']];
}

TaskArcimboldoBorges.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['arcimboldo','arcimboldoborges', 'borges', 'molecular', 'replacement', 'mr'] );
}

if (__template)  {
  //  for server side

  const conf = require('../../js-server/server.configuration');


  TaskArcimboldoBorges.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns threds or processes bypassing the queuing system.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function.
    return ncores_available;
  }
  

  TaskArcimboldoBorges.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      //this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskArcimboldoBorges.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.arcimboldo', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskArcimboldoBorges = TaskArcimboldoBorges;

}
