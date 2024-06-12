
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.refmac.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RefMac Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

function TaskLorestr()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskLorestr';
  this.name    = 'lorestr';
  this.setOName ( 'lorestr' );  // default output file name template
  this.title   = 'Low-Resolution Refinement with Lorestr';
  //this.helpURL = './html/jscofe_task_lorestr.html';

  this.input_dtypes = [{      // input data types
      data_type : {'DataRevision':['xyz','~mmcif_only']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    },{
      data_type : {'DataXYZ'      :['~mmcif_only'],
                   'DataStructure':['~mmcif_only']}, // data type(s) and subtype(s)
      desc      : 'reference structure',
      label     : 'Reference structure',    // label for input dialog
      inputId   : 'rstruct',  // input Id for referencing input fields
      min       : 0,          // minimum acceptable number of data instances
      max       : 10          // maximum acceptable number of data instances
    }
  ];

  this.parameters = {
    sec1 : {  type     : 'section',
              title    : 'Basic options',
              open     : true,
              position : [0,0,1,5],
              contains : {
                  AUTO : { type    : 'combobox',
                          keyword  : 'none',
                          label    : 'Use following databases to search for homologues',
                          tooltip  : 'Select databases to search for homologous structures',
                          range    : ['all|PDB and AlphaFold','pdb|PDB only', 'af|AlphaFold only', 'none|Do not search'],
                          value    : 'all',
                          position : [0,0,1,4]
                       },
                MINRES : { type  : 'real_',
                        keyword  : 'none',
                        label    : 'Minimum resolution for PDB structural homologues',
                        tooltip  : 'Minimum resolution for PDB structural homologues',
                        range    : [0.1,'*'],
                        value    : '',
                        showon   : {'AUTO':['all', 'pdb']},
                        position : [1,0,1,1]
                      },
                OVB_CBX : { type : 'checkbox',
                        label    : 'Refine overall B-factors (for very low resolution)',
                        tooltip  : 'Force overall B-factors refinement (for very low resolution)',
//                         iwidth   : 280,
                        value    : false,
                        position : [2,0,1,4],
                      },
                DNA_CBX : { type : 'checkbox',
                        label    : 'Generate restraints for DNA/RNA chains',
                        tooltip  : 'Generate restraints for DNA/RNA chains',
//                         iwidth   : 280,
                        value    : false,
                        position : [3,0,1,4],
                      },
                MR_CBX : { type  : 'checkbox',
                        label    : 'Run pre-refinement (after MR only)',
                        tooltip  : 'Run pre-refinement (after MR only)',
//                          iwidth   : 280,
                        value    : false,
                        position : [4,0,1,4],
                       }
              }
           }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskLorestr',TaskLorestr,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskLorestr',TaskLorestr,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskLorestr.prototype.icon           = function()  { return 'task_lorestr'; }
TaskLorestr.prototype.clipboard_name = function()  { return '"Lorestr"';    }

TaskLorestr.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskLorestr.prototype.cleanJobDir = function ( jobDir )  {}

TaskLorestr.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'performs low resolution (lower than around 3 Å) refinement';
}

TaskLorestr.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['lorestr', 'low','resolution', 'refinement', 'lr'] );
}

TaskLorestr.prototype.sendsOut = function()  {
  return ['seq']; 
}

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskLorestr.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskLorestr.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.lorestr', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskLorestr = TaskLorestr;

}
