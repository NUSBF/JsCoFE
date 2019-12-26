
/*
 *  =================================================================
 *
 *    25.12.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCombStructure()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCombStructure';
  this.name    = 'comb structure';
  this.setOName ( 'combstruct' );  // default output file name template
  this.title   = 'Comb Structure with Coot/Refmac';
  this.helpURL = './html/jscofe_task_combstructure.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision':['xyz','protein']}, // data type(s) and subtype(s)
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
             title    : 'Basic options',
             open     : true,
             position : [0,0,1,5],
             contains : {
                PASS1_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '1<sup>st</sup> pass:',
                    tooltip  : 'Action for 1st pass',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                               ],
                    value    : 'FR',
                    iwidth   : 270,
                    position : [0,0,1,1]
                },
                PASS1_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'followed by',
                    tooltip  : 'Number of refinement cycles',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [0,4,1,1]
                },
                PASS2_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '2<sup>nd</sup> pass:',
                    tooltip  : 'Action for 1st pass',
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
                PASS2_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'followed by',
                    tooltip  : 'Number of refinement cycles',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [1,4,1,1]
                },
                PASS3_SEL : {
                    type     : 'combobox',
                    keyword  : 'none',
                    label    : '3<sup>rd</sup> pass:',
                    tooltip  : 'Action for 1st pass',
                    range    : ['FR|Fill partial residues',
                                'FP|Fit protein',
                                'SR|Stepped refine',
                                'RR|Ramachandran Plot improve',
                                'N|None'
                               ],
                    value    : 'SR',
                    iwidth   : 270,
                    position : [2,0,1,1]
                },
                PASS3_NCYC : {
                    type     : 'integer',
                    keyword  : 'none',
                    label    : 'followed by',
                    tooltip  : 'Number of refinement cycles',
                    range    : [0,'*'],
                    value    : '10',
                    iwidth   : 50,
                    label2   : 'cycles of refinement',
                    position : [2,4,1,1]
                  },
                  PASS4_SEL : {
                      type     : 'combobox',
                      keyword  : 'none',
                      label    : '4<sup>th</sup> pass:',
                      tooltip  : 'Action for 1st pass',
                      range    : ['FR|Fill partial residues',
                                  'FP|Fit protein',
                                  'SR|Stepped refine',
                                  'RR|Ramachandran Plot improve',
                                  'N|None'
                                 ],
                      value    : 'RR',
                      iwidth   : 270,
                      position : [3,0,1,1]
                  },
                  PASS4_NCYC : {
                      type     : 'integer',
                      keyword  : 'none',
                      label    : 'followed by',
                      tooltip  : 'Number of refinement cycles',
                      range    : [0,'*'],
                      value    : '10',
                      iwidth   : 50,
                      label2   : 'cycles of refinement',
                      position : [3,4,1,1]
                }
             }
    }
  };

}

if (__template)
      TaskCombStructure.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCombStructure.prototype = Object.create ( TaskTemplate.prototype );
TaskCombStructure.prototype.constructor = TaskCombStructure;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCombStructure.prototype.icon = function()  { return 'task_combstructure'; }

TaskCombStructure.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

//TaskCombStructure.prototype.cleanJobDir = function ( jobDir )  {}

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
