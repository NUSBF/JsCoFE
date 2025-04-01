
/*
 *  =================================================================
 *
 *    07.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.combstructure.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CombStructure Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2025
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

function TaskCombStructure()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCombStructure';
  this.name    = 'comb structure';
  this.setOName ( 'combstruct' );  // default output file name template
  this.title   = 'Comb Structure with Coot/Refmac';
  //this.helpURL = './html/jscofe_task_combstructure.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['!xyz','!phases','!protein','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      //customInput : 'refmac',   // lay custom fields below the dropdown
      version     : 1,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {
    sec1 : { type     : 'section',
             title    : 'Comb selections',
             open     : true,
             position : [0,0,1,5],
             contains : {

                // === 1st comb

                COMB1_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '1<sup>st</sup> comb:',
                    tooltip  : 'Choose 1st comb action',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                               ],
                    value    : 'FR',
                    iwidth   : 270,
                    position : [0,0,1,1]
                },
                COMB1_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 1st comb passes',
                    range    : [1,'*'],
                    value    : '3',
                    iwidth   : 50,
                    position : [0,4,1,1],
                    hideon   : {COMB1_SEL:['FR']}
                  },
                COMB1FR_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 1st comb passes',
                    range    : [1,1],
                    value    : '1',
                    readonly : true,
                    iwidth   : 50,
                    position : [0,4,1,1],
                    showon   : {COMB1_SEL:['FR']}
                },
                COMB1_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'pass(es), each with',
                    tooltip  : 'Number of refinement cycles for 1st comb',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [0,8,1,1]
                },

                // === 2nd comb

                COMB2_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '2<sup>nd</sup> comb:',
                    tooltip  : 'Choose 2nd comb action',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                                'N|None'
                               ],
                    value    : 'FP',
                    iwidth   : 270,
                    position : [1,0,1,1]
                },
                COMB2_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 2nd comb passes',
                    range    : [0,'*'],
                    value    : '3',
                    iwidth   : 50,
                    position : [1,4,1,1],
                    hideon   : {COMB2_SEL:['N','FR']}
                  },
                COMB2FR_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 1st comb passes',
                    range    : [1,1],
                    value    : '1',
                    readonly : true,
                    iwidth   : 50,
                    position : [1,4,1,1],
                    showon   : {COMB2_SEL:['FR']}
                },
                COMB2_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'pass(es), each with',
                    tooltip  : 'Number of refinement cycles for 2nd comb',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [1,8,1,1],
                    hideon   : {COMB2_SEL:['N']}
                },

                // === 3rd comb

                COMB3_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '3<sup>rd</sup> comb:',
                    tooltip  : 'Choose 3rd comb action',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                                'N|None'
                               ],
                    value    : 'SR',
                    iwidth   : 270,
                    position : [2,0,1,1],
                    hideon   : {COMB2_SEL:['N']}
                },
                COMB3_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 3rd comb passes',
                    range    : [0,'*'],
                    value    : '3',
                    iwidth   : 50,
                    position : [2,4,1,1],
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N','FR']}
                  },
                COMB3FR_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 1st comb passes',
                    range    : [1,1],
                    value    : '1',
                    readonly : true,
                    iwidth   : 50,
                    position : [2,4,1,1],
                    showon   : {COMB3_SEL:['FR']},
                    hideon   : {_:'||',COMB2_SEL:['N']}
                },
                COMB3_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'pass(es), each with',
                    tooltip  : 'Number of refinement cycles for 3rd comb',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [2,8,1,1],
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N']}
                  },

                // === 4th comb

                COMB4_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '4<sup>th</sup> comb:',
                    tooltip  : 'Choose 4th comb action',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                                'N|None'
                               ],
                    value    : 'RR',
                    iwidth   : 270,
                    position : [3,0,1,1],
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N']}
                },
                COMB4_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 4th comb passes',
                    range    : [0,'*'],
                    value    : '3',
                    iwidth   : 50,
                    position : [3,4,1,1],
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N'],COMB4_SEL:['N','FR']}
                  },
                COMB4FR_NPASS : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'make',
                    tooltip  : 'Number of 1st comb passes',
                    range    : [1,1],
                    value    : '1',
                    readonly : true,
                    iwidth   : 50,
                    position : [3,4,1,1],
                    showon   : {COMB4_SEL:['FR']},
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N']}
                  },
                COMB4_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'pass(es), each with',
                    tooltip  : 'Number of refinement cycles for 4th comb',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [3,8,1,1],
                    hideon   : {_:'||',COMB2_SEL:['N'],COMB3_SEL:['N'],COMB4_SEL:['N']}
                }
             }
    }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskCombStructure',TaskCombStructure,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskCombStructure',TaskCombStructure,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskCombStructure.prototype.icon           = function()  { return 'task_combstructure'; }
TaskCombStructure.prototype.clipboard_name = function()  { return '"Comb Structure"';   }
TaskCombStructure.prototype.canRunRemotely = function()  { return true;                 }

TaskCombStructure.prototype.desc_title     = function()  {
  // this appears under task title in the task list
    return 'provides an access to the model building COOT tools with the following cycles of refinement with Refmac';
  };

TaskCombStructure.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// TaskCombStructure.prototype.cleanJobDir = function ( jobDir )  {}

TaskCombStructure.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['comb','refinement', 'coot', 'refmac', 'fit'] );
  }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCombStructure.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskCombStructure.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.combstructure', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCombStructure = TaskCombStructure;

}
