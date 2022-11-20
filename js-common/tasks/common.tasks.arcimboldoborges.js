
/*
 *  =================================================================
 *
 *    20.11.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

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
                          position : [0,0,1,1],
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
                          position : [1,0,1,1]
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
                          position : [2,0,1,1]
                        }
              }
            }
  };

}


if (__template)
      TaskArcimboldoBorges.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskArcimboldoBorges.prototype = Object.create ( TaskTemplate.prototype );
TaskArcimboldoBorges.prototype.constructor = TaskArcimboldoBorges;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskArcimboldoBorges.prototype.icon = function()  { return 'task_arcimboldo'; }
//TaskArcimboldoBorges.prototype.requiredEnvironment = function() { return ['CCP4','ROSETTA_DIR']; }

TaskArcimboldoBorges.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskArcimboldoBorges.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'performs ab initio phasing with nonspecific libraries of small folds';
  };

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

  var conf = require('../../js-server/server.configuration');

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
