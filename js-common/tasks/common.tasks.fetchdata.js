
/*
 *  =================================================================
 *
 *    22.04.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.crossec.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CrosSec Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, J. Wills 2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskFetchData()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );
  this._type   = 'TaskFetchData';
  this.name    = 'fetch data';
  this.oname   = '*';
  this.title   = 'Fetch diffraction images from WWW repositories';

  this.parameters = { // input parameters
    PDB_CODE : {
          type      : 'string',   // empty string not allowed
          keyword   : 'PDBCODE',
          label     : '<b>PDB code:</b>',
          tooltip   : 'PDB code of structure for which to find and fetch diffraction images',
          iwidth    : 80,
          value     : '',
          maxlength : 4,       // maximum input length
          position  : [0,0,1,1]
        }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskFetchData.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFetchData.prototype = Object.create ( TaskTemplate.prototype );
TaskFetchData.prototype.constructor = TaskFetchData;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskFetchData.prototype.icon           = function()  { return 'task_fetchdata'; }
TaskFetchData.prototype.clipboard_name = function()  { return '"Fetch-data"';   }

TaskFetchData.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'finds diffraction images for given PDB code and fetcheds them';
};

TaskFetchData.prototype.currentVersion = function()  {
let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskFetchData.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['fetch','diffraction','images'] );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');
  var user = require('../../js-server/server.fe.user');

  TaskFetchData.prototype.getCommandLine = function ( jobManager,jobDir )  {
    let uData       = user.readUserData ( { login:this.submitter, volume:null } );
    let cloudrun_id = '*** unidentified ***';
    if (uData && ('cloudrun_id' in uData))
        cloudrun_id = uData.cloudrun_id;
    // let fe_config = conf.getFEConfig();
    return [conf.pythonName(), '-m', 'pycofe.tasks.fetchdata', jobManager, jobDir, 
            this.id, cloudrun_id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFetchData = TaskFetchData;

}
