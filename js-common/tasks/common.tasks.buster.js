
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.buster.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Buster Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
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

function TaskBuster()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskBuster';
  this.name    = 'buster';
  this.setOName ( 'buster' );  // default output file name template
  this.title   = 'Buster Refinement';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!xyz','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'buster',   // lay custom fields below the dropdown
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Main parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                NBIGCYC : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : '-nbig',    // the real keyword for job input stream
                        label    : 'Perform',
                        tooltip  : 'Number of big cycles of refinement',
                        range    : [1,'*'],  // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        iwidth   : 60,
                        label2   : 'iterations',
                        placeholder : '5',
                        position : [0,0,1,1] // [row,col,rowSpan,colSpan]
                      },
                NSMALLCYC : {
                        type     : 'integer_', // '_' means blank value is allowed
                        keyword  : '-nsmall',    // the real keyword for job input stream
                        label    : 'of',
                        tooltip  : 'Number of small cycles of refinement',
                        range    : [1,'*'],  // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                        value    : '',       // value to be paired with the keyword
                        iwidth   : 60,
                        //label2   : 'refinement cycles each',
                        placeholder : '100',
                        position : [0,5,1,1] // [row,col,rowSpan,colSpan]
                      },
                CYCLLABEL_LBL : {
                        type     : 'label',
                        label    : 'refinement cycles each',
                        position : [0,8,1,5]
                      },
                SOLVENT_SEL : {
                        type     : 'combobox',
                        keyword  : '-WAT',
                        label    : 'Solvent modelling',
                        tooltip  : 'Solvent modelling mode',
                        range    : ['Auto|Auto',
                                    'All|Update every cycle',
                                    'Custom|Start updating after N first cycles',
                                    'None|Do not update',
                                   ],
                        value    : 'Auto',
                        iwidth   : 300,
                        position : [1,0,1,6]
                      },
                NWAT : {
                        type     : 'integer', // '_' means blank value is allowed
                        keyword  : '-WAT',    // the real keyword for job input stream
                        label    : 'N=',
                        align    : 'right',
                        tooltip  : 'solvent update will start after the specified ' +
                                   'number of initial cycles',
                        range    : [1,'*'],   // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                        value    : '',        // value to be paired with the keyword
                        iwidth   : 40,
                        label2   : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                        position : [1,4,1,1], // [row,col,rowSpan,colSpan]
                        showon   : {SOLVENT_SEL:['Custom']}
                      },
                AUTOTLS_CBX : {
                        type     : 'checkbox',
                        label    : 'Auto TLS',
                        tooltip  : 'Check to include TLS',
                        value    : false,
                        position : [2,0,1,3]
                      },
                AUTORB_CBX : {
                        type     : 'checkbox',
                        label    : 'Rigid Body (by chains)',
                        tooltip  : 'Check to perform initial Rigid-Body '+
                                   'refinement by chains',
                        value    : false,
                        position : [3,0,1,3]
                      },
                LIGANDED_CBX : {
                        type     : 'checkbox',
                        label    : 'Enhance Ligand Density',
                        tooltip  : 'Attempts to enhance difference density to ' +
                                   'aid in identification of potential ligand ' +
                                   'sites with unknown location (also turns ' +
                                   'on water updating)',
                        value    : false,
                        position : [4,0,1,3]
                      },
                AUTONCS_CBX : {
                        type     : 'checkbox',
                        label    : 'Auto NCS',
                        tooltip  : 'Automatically detect NCS and impose LSSR ' +
                                   'restraints',
                        value    : false,
                        position : [5,0,1,3]
                      },
                NCSPRUNE_CBX : {
                        type     : 'checkbox',
                        label    : 'Prune NCS outliers',
                        tooltip  : 'Automatic pruning of NCS outliers',
                        value    : true,
                        showon   : {AUTONCS_CBX:[true]},
                        position : [6,0,1,3],
                      },
                NCSIMPROVE_SEL : {
                        type     : 'combobox',
                        keyword  : '-sim_swap',
                        label    : 'NCS improvement',
                        tooltip  : 'Improve NCS relation of symmetrical ' +
                                    'side-chains by swapping equivalent atoms',
                        range    : ['None|None',
                                    'Group1|For Asp, Glu, Tyr, Phe and Arg',
                                    'Group2|For Asp, Glu, Tyr, Phe, Arg, Asn, Gln and His',
                                   ],
                        value    : 'None',
                        iwidth   : 400,
                        showon   : {AUTONCS_CBX:[true]},
                        position : [7,0,1,10]
                      }
             }
           },

    sec2 : { type     : 'section',
             title    : 'Gelly parameters',
             open     : false,  // true for the section to be initially open
             position : [1,0,1,5],
             contains : {
               LABEL : {
                 type     : 'label',
                 keyword  : 'none',
                 lwidth   : 800,
                 label    : '<div style="font-size:14px;">' +
                            'Set Gelly options (or copy-paste the content of .gelly file) ' +
                            'in the input field below (consult ' +
                            '<a href="https://www.globalphasing.com/buster/manual/gelly/manual/gelly0.html" ' +
                            'target="_blank"><i>Gelly reference</i></a> for more details).' +
                            '<sub>&nbsp;</sub></div>',
                 position : [0,0,1,5]
               },
               GELLY : {
                   type     : 'aceditor_',  // can be also 'textarea'
                   keyword  : 'none',       // optional
                   tooltip  : '',           // mandatory
                   iwidth   : 800,          // optional
                   iheight  : 320,          // optional
                   value    : '',           // mandatory
                   position : [1,0,1,5]     // mandatory
               }
             }
           }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskBuster',TaskBuster,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskBuster',TaskBuster,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskBuster.prototype.icon           = function()  { return 'task_buster'; }
TaskBuster.prototype.clipboard_name = function()  { return '"Buster"';    }

// TaskBuster.prototype.cleanJobDir    = function ( jobDir )  {}

TaskBuster.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'refines macromolecular structure';
};

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskBuster.prototype.platforms           = function() { return 'LMU'; }  // UNIX only
TaskBuster.prototype.requiredEnvironment = function() { return ['CCP4','BDG_home']; }
TaskBuster.prototype.authorisationID     = function() { return 'gphl-buster'; }

TaskBuster.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}



// TaskBuster.prototype.cleanJobDir = function ( jobDir )  {}

TaskBuster.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['buster','refinement', 'global', 'phasing'] );
}


if (!__template)  {
//  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskBuster.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskBuster.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskBuster.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.buster', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskBuster = TaskBuster;

}
