
/*
 *  =================================================================
 *
 *    26.04.24   <--  Date of Last Modification.
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

TaskFetchData.prototype.isTaskAvailable = function()  {

  if (__has_datalink)
    return TaskTemplate.prototype.isTaskAvailable.call ( this );
  else
    return ['environment-server',
            'task software is not configured on ' + appName() + ' server',
            '<h3>Task software is not configured on server</h3>' +
            'Software, needed to run the task, is not configured on ' +
            appName() + ' server, which you use.<br>Contact server ' +
            'maintainer for further details.'];

}


if (__template)  {
  //  for server side

  const path  = require('path');
  const conf  = require('../../js-server/server.configuration');
  const user  = require('../../js-server/server.fe.user');
  const utils = require('../../js-server/server.utils');


  TaskFetchData.prototype.makeInputData = function ( loginData,jobDir )  {
  // this function prepares fetch metadata for NC
    
    let fetch_meta = {
      login       : loginData.login,
      cloudrun_id : '',
      api_url     : '',
      mount_name  : ''
    };
    
    let uData = user.readUserData ( loginData );
    if (uData && ('cloudrun_id' in uData))
        fetch_meta.cloudrun_id = uData.cloudrun_id;

    let fe_config = conf.getFEConfig();
    fetch_meta.api_url = fe_config.getDataLinkUrl();
    fetch_meta.mount_name = fe_config.getDataLinkMountName();
    
    // write fetch_meta in jobd directory on FE; it will travel to NC along
    // with all other data
    utils.writeObject ( path.join(jobDir,'__fetch_meta.json'),fetch_meta );

    // do not forget to call the original function
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskFetchData.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.fetchdata', jobManager, jobDir, 
            this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFetchData = TaskFetchData;

}
