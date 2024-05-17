
/*
 *  =================================================================
 *
 *    16.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.pdbredo.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  PDB-REDO
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev  2022-2024
 *
 *  =================================================================
 *
 */

var __template = null;   // null __template indicates that the code runs in
// client browser

// otherwise, the code runs on a server, in which case __template references
// a module with Task Template Class:

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

// 1. Define task constructor

function TaskPDBREDO()  {   // must start with Task...

  // invoke the template class constructor:
  if (__template)  __template.TaskTemplate.call ( this );
  else  TaskTemplate.call ( this );

  // define fields important for jsCoFE framework

  this._type   = 'TaskPDBREDO';  // must give name of the class
  this.name    = 'PDB-REDO';     // default name to be shown in Job Tree
  this.setOName ( 'pdbredo' );   // default output file name template
  this.title   = 'PDB-REDO: optimise, rebuild, refine and validate';  // title for job dialog

  this.input_dtypes = [{  // input data types
    data_type : {'DataRevision':['!xyz','~mmcif_only']}, // data type(s) and subtype(s)
    label     : 'Structure revision',     // label for input dialog
    inputId   : 'revision', // input Id for referencing input fields
    version   : 4,          // minimum data version allowed
    min       : 1,          // minimum acceptable number of data instances
    max       : 1           // maximum acceptable number of data instances
  }];

  this.parameters = {

    PAIRED : {
      type     : 'checkbox',
      label    : 'Perform paired refinement',
      keyword  : '--paired',
      tooltip  : '',
      value    : false,
      iwidth   : 220,
      position : [0,0,1,7]
    },
    sec1 : { type     : 'section',
             title    : 'Refinement settings',
             open     : false,  // true for the section to be initially open
             position : [1,0,1,5],
             contains : {
              REF_RES : {
                  type     : 'combobox',
                  keyword  : '',
                  label    : 'Refinement restraints',
                  range    : ['none|auto',
                              'tighter2|much tighter',
                              'tighter|tighten',
                              'looser|loosen',
                              'looser2|much looser'
                             ],
                  value    : 'list',
                  position : [0,0,1,1]
            },
              // TIGHTER : {
              //     type     : 'integer',
              //     keyword  : 'TIGHTER',
              //     label    : 'value',
              //     range    : [0,'*'],
              //     value    : '0',
              //     showon   : {'REF_RES':['tighter']},
              //     position : [0,3,1,1]
              //   },
              // LOOSER : {
              //     type     : 'integer',
              //     keyword  : 'LOOSER',
              //     label    : 'value',
              //     range    : [0,'*'],
              //     value    : '0',
              //     showon   : {'REF_RES':['looser']},
              //     position : [0,3,1,1]
              //   },
              SEPARATOR_LBL : {
                  type     : 'label',
                  label    : '&nbsp;',
                  position : [0,6,1,1],
                  lwidth   : '90%'
                },

              ISOTROPIC : {
                  type     : 'checkbox',
                  label    : 'Force isotropic B-factors',
                  keyword  : '--isotropic',
                  tooltip  : '',
                  value    : false,
                  iwidth   : 550,
                  position : [1,0,1,7]
                },
              NOTLS : {
                  type     : 'checkbox',
                  label    : 'TLS refinement',
                  keyword  : '--notls',
                  tooltip  : 'If not checked, TLS refinement will not be performed',
                  value    : true,
                  iwidth   : 550,
                  position : [2,0,1,7]
                },
              LEGACY : {
                  type     : 'checkbox',
                  label    : 'Ignore R-factors of the input model and do more extensive refinement',
                  keyword  : '--legacy',
                  tooltip  : 'for legacy PDB entries. R-factor is not checked and the number of refinement cycles is increased (a lot)',
                  value    : false,
                  iwidth   : 550,
                  position : [3,0,1,7]
                },
              NEWMODEL : {
                  type     : 'checkbox',
                  label    : 'Use an updated model for rebuilding, even if initial refinement made it worse',
                  keyword  : '--newmodel',
                  tooltip  : 'always take an updated model from the re-refinement for the rebuilding steps. Only use this option when all else fails',
                  value    : false,
                  iwidth   : 550,
                  position : [4,0,1,7]
                }
              }
             },
      sec2 : { type     : 'section',
                title    : 'Restraint settings',
                open     : false,  // true for the section to be initially open
                position : [2,0,1,5],
                contains : {
                  NOMETAL : {
                    type     : 'checkbox',
                    label    : 'Use special metal restraints',
                    keyword  : '--nometalrest',
                    value    : true,
                    iwidth   : 400,
                    position : [3,0,1,7]
                    },
                  NONUCREST : {
                    type     : 'checkbox',
                    label    : 'Use nucleic acid restraints',
                    keyword  : '--nonucrest',
                    value    : true,
                    iwidth   : 400,
                    position : [4,0,1,7]
                    },
                  NOHOMOLOGY : {
                      type     : 'checkbox',
                      label    : 'Use homology restraints',
                      keyword  : '--nohomology',
                      value    : true,
                      iwidth   : 400,
                      position : [5,0,1,7]
                      },
                  HOMOLOGY : {
                    type     : 'checkbox',
                    label    : 'Force homology restraints even at high resolution',
                    keyword  : '--homology',
                    value    : false,
                    iwidth   : 400,
                    position : [6,0,1,7]
                    },
                  HBONDREST : {
                    type     : 'checkbox',
                    label    : 'Force hydrogen bond restraints even at high resolution',
                    keyword  : '--hbondrest',
                    value    : false,
                    iwidth   : 400,
                    position : [7,0,1,7]
                    },


              }},
      sec3 : {  type     : 'section',
                title    : 'Restraint settings',
                open     : false,  // true for the section to be initially open
                position : [3,0,1,5],
                contains : {
                  NOFIXDMC : {
                    type     : 'checkbox',
                    label    : 'Add missing backbone atoms',
                    keyword  : '--nofixdmc',
                    value    : true,
                    iwidth   : 300,
                    position : [1,0,1,7]
                    },
                  NOLOOPS : {
                    type     : 'checkbox',
                    label    : 'Add missing loops',
                    keyword  : '--noloops',
                    value    : true,
                    iwidth   : 300,
                    position : [2,0,1,7]
                    },
                  NOPEPFLIP : {
                    type     : 'checkbox',
                    label    : 'Perform peptide flips',
                    keyword  : '--nopepflip',
                    value    : true,
                    iwidth   : 300,
                    position : [3,0,1,7]
                    },
                  NOSCBUILD : {
                    type     : 'checkbox',
                    label    : '(Re)build side chains',
                    keyword  : '--noscbuild',
                    value    : true,
                    iwidth   : 300,
                    position : [4,0,1,7]
                    },
                  NOCENTRIFUGE : {
                    type     : 'checkbox',
                    label    : 'Remove poor waters',
                    keyword  : '--nocentrifuge',
                    value    : true,
                    iwidth   : 300,
                    position : [5,0,1,7]
                    },
                  NOSUGARS : {
                    type     : 'checkbox',
                    label    : '(Re)build N-glycan',
                    keyword  : '--nosugarbuild',
                    value    : true,
                    iwidth   : 300,
                    position : [6,0,1,7]
                    },
                  NOREBUILD : {
                    type     : 'checkbox',
                    label    : 'Rebuild the model at all',
                    keyword  : '--norebuild',
                    value    : true,
                    iwidth   : 300,
                    position : [7,0,1,7]
                    },
                }



}}
}

// finish constructor definition

if (__template)
      TaskPDBREDO.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskPDBREDO.prototype = Object.create ( TaskTemplate.prototype );
TaskPDBREDO.prototype.constructor = TaskPDBREDO;

// ===========================================================================

// Define task icons. 

TaskPDBREDO.prototype.icon           = function()  { return 'task_pdbredo'; }
TaskPDBREDO.prototype.clipboard_name = function()  { return '"PDB-Redo"';   }

// request authorisation checks
TaskPDBREDO.prototype.authorisationID = function() { return 'pdb-redo'; }

//  Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. jsCoFE framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskPDBREDO.prototype.currentVersion = function()  {
let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskPDBREDO.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'automatically optimise, rebuild, refine and validate structure model';
};

TaskPDBREDO.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['pdbredo','pdb-redo','refinement','rebuild',
                                           'rebuilding','optimise','optimisation',
                                           'validate','validation'] );
}

TaskPDBREDO.prototype.sendsOut = function()  {
  return ['seq','xyz','lig','hkl']; 
}


// ===========================================================================

//  4. Add server-side code

if (__template)  {  //  will run only on server side

  const path  = require('path');
  const conf  = require('../../js-server/server.configuration');
  const user  = require('../../js-server/server.fe.user');
  const utils = require('../../js-server/server.utils');

  TaskPDBREDO.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory
      
    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['seq']     = revision.ASU.seq;
      this.input_data.data['istruct'] = [revision.Structure];
    }

    let uData = user.readUserData ( loginData );
    let auth_json = { status : 'ok' };
    if (uData)  {
      if (('authorisation' in uData) && ('pdb-redo' in uData.authorisation))  {
        auth_json.auth_data = uData.authorisation['pdb-redo'];
        let d1 = new Date(auth_json.auth_data.expiry_date);
        if (d1.getTime()<Date.now())
          auth_json.status = 'expired';
      } else
        auth_json.status = 'no authorisation data';
    } else
      auth_json.status = 'no user data';

    utils.writeObject ( path.join(jobDir,'input','authorisation.json'),auth_json );

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  // form command line for server's node js to start task's python driver;
  // note that last 3 parameters are optional and task driver will not use
  // them in most cases.

  TaskPDBREDO.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [  conf.pythonName(),         // will use python from configuration
              '-m',                      // will run task as a python module
              'pycofe.tasks.pdbredo', // path to python driver
              jobManager,                  // framework's type of run: 'SHELL', 'SGE' or 'SCRIPT'
              jobDir,                   // path to job directory given by framework
              this.id                   // task id (assigned by the framework)
          ];
  }

  // -------------------------------------------------------------------------
  // export such that it could be used in server's node js

  module.exports.TaskPDBREDO = TaskPDBREDO;

}
