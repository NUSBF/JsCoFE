
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.morda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  SymMatch Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2018-2024
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

function TaskSymMatch()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSymMatch';
  this.name    = 'symmatch';
  this.setOName ( 'symmatch' );  // default output file name template
  this.title   = 'Symmetry Match to Reference Structure with CSymMatch';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision' :['xyz','substructure','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision',           // input Id for referencing input fields
      tooltip     : 'Structure that will be matched to reference structure.',
      version     : 0,                // minimum data version allowed
      min         : 1,                // minimum acceptable number of data instances
      max         : 1                 // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['xyz','substructure','~mmcif_only'],
                     'DataXYZ'      :['~mmcif_only']
                    }, // data type(s) and subtype(s)
      label       : 'Reference structure', // label for input dialog
      tooltip     : 'Structure that will be used as a reference to match the ' +
                    'structure revision to.',
      inputId     : 'refstruct', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Additional parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                ORIGINS_CBX : {
                        type     : 'checkbox',
                        label    : 'Try all possible origins and hands',
                        tooltip  : 'Check to explore all possible origins and hands ' +
                                   'when matching structures.',
                        value    : true,
                        position : [0,0,1,3]
                      },
                RADIUS : {
                        type     : 'real_',   // '_' means blank value is allowed
                        keyword  : '-connectivity-radius',  // the real keyword for job input stream
                        label    : 'Stiching radius',
                        tooltip  : 'Radius to use in stiching floating fragments ' +
                                   'to chains.',
                        range    : [0.0,20.0], // may be absent (no limits) or must
                                               // be one of the following:
                                               //   ['*',max]  : limited from top
                                               //   [min,'*']  : limited from bottom
                                               //   [min,max]  : limited from top and bottom
                        value    : '',         // value to be paired with the keyword
                        placeholder : '2.0',
                        position : [1,0,1,1]   // [row,col,rowSpan,colSpan]
                      }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskSymMatch',TaskSymMatch,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskSymMatch',TaskSymMatch,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskSymMatch.prototype.icon           = function()  { return 'task_symmatch'; }
TaskSymMatch.prototype.clipboard_name = function()  { return '"SymMatch"';    }

TaskSymMatch.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSymMatch.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'uses symmetry to match chains';
}

TaskSymMatch.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['csymmatch', 'symmatch','symmetry','match', 'comparison','analysis','tools', 'toolbox'] );
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSymMatch.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskSymMatch.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.symmatch', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSymMatch = TaskSymMatch;

}
