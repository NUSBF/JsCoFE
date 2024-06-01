
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.buccaneermr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Buccaneer Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */


/*

Input data:


1)  Structure, with EP phases (SEP)  or without (SMR)  (mandatory)
  1.0)  HKL Dataset to refine against (HKL)  (mandatory) -- will be taken from Structure

2)  Target sequences              (SEQ)  (mandatory, possibly a list of)

3)  Fixed structure               (FS)   (optional)
4)  Structure (any) for sequencing  (HA)   (optional)


MR:
1)  Structure (SMR)  (mandatory)
  1.0)  HKL Dataset to refine against (HKL)  (mandatory) -- will be taken from Structure
  1.1)  combobox "use protein coordinates as..."

2)  Target sequences              (SEQ)  (mandatory, possibly a list of)

3)  Fixed structure               (FS)   (optional)
4)  Structure (any) for sequencing  (HA)   (optional)


EP:
1)  Structure (SEP)  (mandatory)
  1.0)  HKL Dataset to refine against (HKL)  (mandatory) -- will be taken from Structure

2)  Target sequences              (SEQ)  (mandatory, possibly a list of)

3)  Fixed structure               (FS)   (optional)
4)  Structure (any) for sequencing  (HA)   (optional)


*/

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskBuccaneer()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskTemplate.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type   = 'TaskBuccaneer';
  this.name    = 'buccaneer';
  this.setOName ( 'buccaneer' );  // default output file name template
  this.title   = 'Automatic Model Building with Buccaneer';

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['!protein','!seq','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',        // label for input dialog
      inputId     : 'revision',      // input Id for referencing input fields
      customInput : 'buccaneer-ws',  // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz','~mmcif_only']}, // data type(s) and subtype(s)
      desc        : 'fixed model',  // used in TaskDataDialog to discriminate between alike items
      label       : 'Fixed model',  // label for input dialog
      inputId     : 'xmodel',       // input Id for referencing input fields
      customInput : 'buccaneer-xm', // lay custom fields below the dropdown
      tooltip     : 'Optional part of model to be extended.',
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure-am','!xyz','~mmcif_only']}, // data type(s) and subtype(s)
      desc        : 'model to aid sequencing',  // used in TaskDataDialog to discriminate between alike items
      label       : 'Model to aid<br>sequencing',  // label for input dialog
      inputId     : 'smodel',   // input Id for referencing input fields
      tooltip     : 'Optional part(s) of model to aid sequencing.',
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Options',
             open     : false,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
               TITLE1 : {
                      type     : 'label',  // just a separator
                      label    : '<h3><i>General options</i></h3>',
                      position : [0,0,1,4]
                    },
               ANISO_CBX : {
                      type     : 'checkbox',
                      label    : 'Apply anisotropy correction to input data',
                      keyword  : 'buccaneer-anisotropy-correction',
                      tooltip  : 'Check to apply anisotropy correction to input data',
                      value    : true,
                      position : [1,0,1,3]
                    },
               SELEN_CBX : {
                      type     : 'checkbox',
                      label    : 'Build Selenomethionine (MSE instead of MET)',
                      keyword  : 'buccaneer-build-semet',
                      tooltip  : 'Check to build selenomethionine',
                      value    : false,
                      position : [2,0,1,3]
                    },
               TITLE2 : {
                      type     : 'label',  // just a separator
                      label    : '<h3><i>Calculation options</i></h3>',
                      position : [3,0,1,4]
                    },
               NCYCLES : {
                      type     : 'integer',
                      keyword  : 'cycles',
                      label    : 'Number of building/refinement cycles',
                      tooltip  : 'Choose a value between 1 and 50',
                      range    : [1,50],
                      value    : '5',
                      position : [4,0,1,1]
                    },
               FASTEST_CBX : {
                      type     : 'checkbox',
                      label    : 'Use fastest methods',
                      keyword  : 'buccaneer-fast',
                      tooltip  : 'Check to use fastests methods',
                      value    : true,
                      position : [5,0,1,3]
                    }
             }
    },

    sec2 :  { type     : 'section',
              title    : 'Model Building Parameteres',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                TITLE1 : {
                      type      : 'label',  // just a separator
                      label     : '<h3><i>Parameters for first Buccaneer cycle</i></h3>',
                      position  : [0,0,1,4]
                    },
                NICYCLES1 : {
                      type      : 'integer_',
                      keyword   : 'buccaneer-1st-cycles',
                      label     : 'Number of internal building cycles',
                      tooltip   : 'Choose a value between 1 and 50',
                      range     : [1,50],
                      value     : '3',
                      position  : [1,0,1,1]
                    },
                CORRTF1_CBX : {
                      type      : 'checkbox',
                      keyword   : 'buccaneer-1st-correlation-mode',
                      label     : 'Use correlation target function',
                      tooltip   : 'Check to use the correlation target function',
                      value     : false,
                      position  : [2,0,1,3]
                    },
                SEQASGN1_SEL : {
                      type      : 'combobox',
                      keyword   : 'buccaneer-1st-sequence-reliability',
                      label     : 'Assign sequence when found match is ',
                      tooltip   : 'Choose how to assign sequence when a match is found ',
                      range     : ['0.99|definite','0.95|probable','0.80|possible'],
                      value     : '0.95',
                      position  : [3,0,1,1]
                   },
                TITLE2 : {
                      type      : 'label',  // just a separator
                      label     : '<h3><i>Parameters for subsequent Buccaneer cycles</i></h3>',
                      position  : [4,0,1,4]
                    },
                NICYCLES2 : {
                      type      : 'integer_',
                      keyword   : 'buccaneer-nth-cycles',
                      label     : 'Number of internal building cycles',
                      tooltip   : 'Choose a value between 1 and 50',
                      range     : [1,50],
                      value     : '2',
                      position  : [5,0,1,1]
                    },
                CORRTF2_CBX : {
                      type      : 'checkbox',
                      keyword   : 'buccaneer-nth-correlation-mode',
                      label     : 'Use correlation target function',
                      tooltip   : 'Check to use the correlation target function',
                      value     : true,
                      position  : [6,0,1,3]
                    },
                SEQASGN2_SEL : {
                      type      : 'combobox',
                      keyword   : 'buccaneer-nth-sequence-reliability',
                      label     : 'Assign sequence when found match is ',
                      tooltip   : 'Choose how to assign sequence when a match is found ',
                      range     : ['0.99|definite','0.95|probable','0.80|possible'],
                      value     : '0.95',
                      position  : [7,0,1,1]
                   },
                TITLE3 : {
                      type      : 'label',  // just a separator
                      label     : '<h3><i>General parameters</i></h3>',
                      position  : [8,0,1,4]
                    },
                RESMIN : {
                      type      : 'real',
                      keyword   : 'buccaneer-resolution',
                      label     : 'Truncate data beyond resolution limit [&Aring;]',
                      tooltip   : 'Truncate resolution limit',
                      range     : [0.1,'*'],
                      value     : '2.0',
                      position  : [9,0,1,1]
                    },
                UNKRESN : {
                      type      : 'string',   // empty string not allowed
                      keyword   : 'buccaneer-new-residue-name',
                      label     : 'Residue name for unsequenced residues',
                      tooltip   : 'Substructure atom giving anomalous scattering',
                      value     : 'UNK',
                      maxlength : 3,       // maximum input length
                      position  : [10,0,1,1]
                    },
                FIX_POSITION_CBX : {
                      type      : 'checkbox',
                      label     : 'Build the new model in the same place as the input model',
                      tooltip   : 'Fix position of the model in the a.s.u.',
                      keyword   : 'buccaneer-fix-position',
                      value     : false,
                      position  : [11,0,1,3]
                    },
               TITLE5 : { type  : 'label',  // just a separator
                      label    : '<h3><i>Reference structure data</i></h3>',
                      position : [18,0,1,4]
                    },
               REFMDL_SEL : { type : 'combobox',
                      keyword  : 'REFMDL',
                      label    : 'Library reference structure to use:',
                      tooltip  : 'Choose library reference structure',
                      range    : ['1tqw|1tqw','1ajr|1ajr'],
                      value    : '1tqw',
                      position : [19,0,1,1]
                    }
             }
    },

    sec3 : { type     : 'section',
             title    : 'Refinement Parameteres',
             open     : false,  // true for the section to be initially open
             position : [2,0,1,5],
             contains : {
               REFTWIN_CBX : { type : 'checkbox',
                      label     : 'Refine against twinned data',
                      keyword   : 'refmac-twin',
                      tooltip   : 'Check to refine against twinned data',
                      value     : false,
                      translate : ['0','1'],  // for "false", "true"
                      position  : [0,0,1,3]
                    },
               USEPHI_CBX : { type : 'checkbox',
                      label     : 'Use phases in refinement',
                      keyword   : 'refmac-mlhl',
                      tooltip   : 'Check to use phases in refinement',
                      value     : false,
                      translate : ['0','1'],  // for "false", "true"
                      position  : [1,0,1,3]
                    },
                AUTOWEIGH_CBX : {
                      type      : 'checkbox',
                      label     : 'Automatic weighting of restraints',
                      tooltip   : 'Check to use automatic weighting of restraints',
                      value     : true,
                      position  : [2,0,1,3]
                    },
                WEIGHTVAL : {
                      type      : 'real',
                      keyword   : 'KEEPATMRAD',
                      label     : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;or weight value',
                      align     : 'right',
                      tooltip   : 'Weight value for restraints',
                      range     : [0.0,'*'],
                      value     : '0.1',
                      position  : [2,2,1,1],
                      showon    : {'AUTOWEIGH_CBX':[false]}
                    }
             }

    }

  }

  if (typeof __local_service !== 'undefined' && (__local_service!=''))  {
    this.parameters.sec1.contains.FASTEST_CBX.position[0] = 6;
    this.parameters.sec1.contains.NCPUS = {
      type     : 'integer_',
      keyword  : 'jobs',
      label    : 'Number of CPU cores to use',
      tooltip  : 'Choose a value between 1 and 8 but no more than the number ' +
                 'actual CPU cores in your system',
      range    : [1,8],
      value    : '2',
      position : [5,0,1,1]
    };
  }

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskBuccaneer.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskBuccaneer.prototype = Object.create ( TaskTemplate.prototype );
TaskBuccaneer.prototype.constructor = TaskBuccaneer;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskBuccaneer.prototype.icon           = function()  { return 'task_buccaneer'; }
TaskBuccaneer.prototype.clipboard_name = function()  { return '"Buccaneer"';    }
// TaskBuccaneer.prototype.desc_title = function()  {
//   return 'Automatic model building after MR or Experimental Phasing';
// }

TaskBuccaneer.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function BuccaneerHotButton()  {
  return {
    'task_name' : 'TaskBuccaneer',
    'tooltip'   : 'Automatic model building with Buccaneer'
  };
}

TaskBuccaneer.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['buccaneer','density', 'modification', 'dm'] );
  }

if (!__template)  {
  //  for client side

  TaskBuccaneer.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'automatic statistical model building after MR or Experimental Phasing';
    };

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskBuccaneer.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskBuccaneer.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Options.leading_structure=='substructure')  {
        this.input_data.data['istruct'] = [revision.Substructure];
        if (this.Structure)
          this.input_data.data['ixyz'] = [revision.Structure];
      } else
        this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskBuccaneer.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.buccaneer', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskBuccaneer = TaskBuccaneer;

}
