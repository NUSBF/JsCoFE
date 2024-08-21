
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.arcimboldolite.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Arcimboldo Task Class
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

function TaskArcimboldoLite()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskArcimboldoLite';
  this.name   = 'arcimboldo-lite';
  this.setOName ( 'arcimboldo-lite' );  // default output file name template
  this.title  = 'Fragment Molecular Replacement with Arcimboldo-Lite';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['~xyz','~phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision',  // input Id for referencing input fields
      version     : 0,           // minimum data version allowed
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{      // input data types
      data_type   : {'DataXYZ':['protein','~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Fragment',  // label for input dialog
      customInput : 'BF_correction', // lay custom fields next to the selection
      inputId     : 'xyz',       // input Id for referencing input fields
      min         : 0,           // minimum acceptable number of data instances
      max         : 10           // maximum acceptable number of data instances
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
                RMSD :  { type     : 'real',
                          keyword  : 'RMSD',
                          label    : 'Assume',
                          tooltip  : 'Assumed r.m.s.d. from target structure',
                          range    : [0.001,2.0],
                          value    : '0.2',
                          iwidth   : 40,
                          position : [0,0,1,1]
                        },
                RMSD_LBL : {
                          type     : 'label',
                          label    : '(&Aring;)&nbsp;&nbsp;&nbsp; r.m.s.d. from target',
                          //lwidth   : 100,
                          position : [0,3,1,3]
                        },
                COIL_COILED_CBX : {
                          type     : 'checkbox',
                          label    : 'Run in coil coiled mode',
                          tooltip  : 'Check to run in coil coiled mode',
                          value    : false,
                          iwidth   : 200,
                          position : [1,0,1,8]
                        },
                SEP_LBL : {
                          type     : 'label',
                          label    : '&nbsp;',
                          position : [2,0,1,1]
                        },
                HELICES_SEL : {
                          type     : 'combobox',
                          keyword  : 'HELICES',
                          label    : 'Use',
                          tooltip  : 'Specify the number of helices to search for',
                          range    : ['1|one or more copies of a helix',
                                      '2|2 different helices',
                                      '3|3 different helices',
                                      '4|4 different helices',
                                      '5|5 different helices',
                                      '6|6 different helices'
                                    ],
                          value    : '1',
                          iwidth   : 280,
                          position : [3,0,1,6],
                          showon   : {'xyz':[-1,0]} // from input data section
                        },
                HLEN1 : { type     : 'integer',
                          keyword  : 'HLEN1',
                          label    : 'Helix length',
                          lwidth   : 80,
                          tooltip  : 'Length of helix',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [4,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['1']}
                        },
                HCOPIES1 : {
                          type     : 'integer',
                          keyword  : 'HCOPIES1',
                          label    : 'number of copies',
                          tooltip  : 'Number of helix copies',
                          range    : [1,10],
                          value    : '2',
                          iwidth   : 40,
                          position : [4,5,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['1']}
                        },
                HLEN_1 : { type    : 'integer',
                          keyword  : 'HLEN_1',
                          label    : 'Helix #1 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #1',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [4,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['2','3','4','5','6']}
                        },
                HLEN_2 : { type    : 'integer',
                          keyword  : 'HLEN_2',
                          label    : 'Helix #2 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #2',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [5,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['2','3','4','5','6']}
                        },
                HLEN_3 : { type    : 'integer',
                          keyword  : 'HLEN_3',
                          label    : 'Helix #3 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #3',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [6,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['3','4','5','6']}
                        },
                HLEN_4 : { type    : 'integer',
                          keyword  : 'HLEN_4',
                          label    : 'Helix #4 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #4',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [7,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['4','5','6']}
                        },
                HLEN_5 : { type    : 'integer',
                          keyword  : 'HLEN_5',
                          label    : 'Helix #5 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #5',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [8,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['5','6']}
                        },
                HLEN_6 : { type    : 'integer',
                          keyword  : 'HLEN_6',
                          label    : 'Helix #6 length',
                          lwidth   : 100,
                          tooltip  : 'Length of helix #6',
                          range    : [4,100],
                          value    : '14',
                          iwidth   : 40,
                          position : [9,2,1,1],
                          showon   : {_:'&&','xyz':[-1,0],HELICES_SEL:['6']}
                        },
                SCOPIES1 : {
                          type     : 'integer',
                          keyword  : 'HCOPIES1',
                          label    : 'Use',
                          tooltip  : 'Number of fragment copies',
                          range    : [1,10],
                          value    : '2',
                          iwidth   : 40,
                          position : [10,0,1,1],
                          showon   : {'xyz':[1]}
                        },
                SCOPIES_LBL : {
                          type     : 'label',
                          label    : 'fragment copies',
                          //lwidth   : 100,
                          position : [10,3,1,3],
                          showon   : {'xyz':[1]}
                        }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskArcimboldoLite',TaskArcimboldoLite,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskArcimboldoLite',TaskArcimboldoLite,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskArcimboldoLite.prototype.icon           = function()  { return 'task_arcimboldo';   }
TaskArcimboldoLite.prototype.clipboard_name = function()  { return '"Arcimboldo-Lite"'; }
//TaskArcimboldoLite.prototype.requiredEnvironment = function() { return ['CCP4','ROSETTA_DIR']; }

TaskArcimboldoLite.prototype.currentVersion = function()  {
let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskArcimboldoLite.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'performs ab initio phasing using polyalanine helices or other single search fragments for MR';
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskArcimboldoLite.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskArcimboldoLite.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['arcimboldo','arcimboldolite', 'lite', 'molecular', 'replacement', 'mr'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskArcimboldoLite.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      //this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskArcimboldoLite.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.arcimboldo', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskArcimboldoLite = TaskArcimboldoLite;

}
