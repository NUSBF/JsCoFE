
/*
 *  =================================================================
 *
 *    24.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.nautilusmr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Nautilus Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskNautilus()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskTemplate.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type   = 'TaskNautilus';
  this.name    = 'nautilus';
  this.setOName ( 'nautilus' );  // default output file name template
  this.title   = 'Automatic Model Building of RNA/DNA with Nautilus';
  // this.helpURL = './html/jscofe_task_nautilus.html';

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':[['rna','dna'],'!asu','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',        // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'nautilus', // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Options',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
               NCYCLES : {
                      type     : 'integer',
                      keyword  : 'cycles',
                      label    : 'Number of cycles of building/refinement to run',
                      tooltip  : 'Choose a value between 1 and 500',
                      range    : [1,500],
                      value    : '5',
                      iwidth   : 40,
                      position : [0,0,1,1]
                    },
               /*
               NBUILDCYCLES : {
                      type     : 'integer',
                      keyword  : 'cycles',
                      label    : 'over',
                      tooltip  : 'Choose a value between 1 and 500',
                      range    : [1,500],
                      value    : '3',
                      iwidth   : 40,
                      label2   : 'cycles of build',
                      position : [0,5,1,1]
                    },
               NREFCYCLES : {
                      type     : 'integer',
                      keyword  : 'cycles',
                      label    : 'and',
                      tooltip  : 'Choose a value between 1 and 500',
                      range    : [1,500],
                      value    : '20',
                      iwidth   : 40,
                      label2   : 'of refinement',
                      position : [0,10,1,1]
                    },
                */
               ANISO_CBX : {
                      type      : 'checkbox',
                      label     : 'Apply anisotropy correction to input data',
                      keyword   : 'nautilus-anisotropy-correction',
                      tooltip   : 'Check to apply anisotropy correction to input data',
                      value     : true,
                      position  : [1,0,1,2]
                    },
               REFPHASES_CBX : {
                      type      : 'checkbox',
                      label     : 'Use phases in refinement',
                      keyword   : 'refmac-mlhl',
                      tooltip   : 'Select this option for MR phases in order ' +
                                  'to reduce bias',
                      value     : false,
                      translate : ['0','1'],  // for "false", "true"
                      position  : [2,0,1,2]
                    },
               REFTWIN_CBX : {
                      type      : 'checkbox',
                      label     : 'Refine against twinned data',
                      keyword   : 'refmac-twin',
                      tooltip   : 'Twin refinement can give better results if ' +
                                  'data is twinned, but disables phases',
                      value     : false,
                      translate : ['0','1'],  // for "false", "true"
                      position  : [3,0,1,2]
                    },
               AUTOWEIGH_CBX : {
                      type      : 'checkbox',
                      label     : 'Automatic weighting of restraints',
                      keyword   : 'refmac-weight',
                      tooltip   : 'Automatic weighting is safest, otherwise low ' +
                                  'values preserve geometry at the expense of ' +
                                  'R-factor',
                      value     : true,
                      position  : [4,0,1,2]
                    },
               WEIGHTVAL : {
                      type      : 'real',
                      keyword   : 'refweight',
                      label     : 'weight value',
                      tooltip   : 'Automatic weighting is safest, otherwise low ' +
                                  'values preserve geometry at the expense of ' +
                                  'R-factor',
                      range     : [0.00001,1.0],
                      value     : '0.1',
                      iwidth    : 40,
                      position  : [4,3,1,1],
                      showon    : {AUTOWEIGH_CBX:[false]}
                    }
             }

    }

  }

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskNautilus.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskNautilus.prototype = Object.create ( TaskTemplate.prototype );
TaskNautilus.prototype.constructor = TaskNautilus;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskNautilus.prototype.icon           = function()  { return 'task_nautilus'; }
TaskNautilus.prototype.clipboard_name = function()  { return '"Nautilus"';    }

TaskNautilus.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskNautilus.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'automatic building of RNA/DNA chains after MR or Experimental Phasing';
};

TaskNautilus.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['nautilus', 'model','building','mr', 'molecular', 'replacement','rna','dna', 'na'] );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
TaskNautilus.prototype.hotButtons = function() {
  return [CootMBHotButton()];
}

if (__template)  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskNautilus.prototype.makeInputData = function ( loginData,jobDir )  {

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

  TaskNautilus.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.nautilus', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskNautilus = TaskNautilus;

}
