
/*
 *  ==========================================================================
 *
 *    07.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.data_user.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  ==========================================================================
 *
 */

'use strict';

// ===========================================================================

const licence_code = {
  academic   : 'academic',
  commercial : 'commercial'
};

const feedback_code = {
  agree1  : 'accepted (1)',
  agree2  : 'accepted (2)',
  decline : 'declined'
};

const userdata_action = {
  none    : 'none',
  chpwd   : 'chpwd',
  revise  : 'revise'
};

const role_code = {
  user      : 'user',
  localuser : 'localuser',
  admin     : 'admin',
  developer : 'developer'
};

const on_login = {
  all_projects : 'all_projects',
  my_projects  : 'my_projects',
  last_folder  : 'last_folder',
  last_project : 'last_project'
};

const __local_user_id = 'localuser';  // local user name

// ---------------------------------------------------------------------------

function UserData()  {
  this._type         = 'UserData';  // do not change
  this.name          = '';
  this.email         = '';
  this.login         = '';
  this.remote_login  = '';
  this.globusId      = '';
  this.licence       = '';
  this.feedback      = '';
  this.pwd           = '';
  this.cloudrun_id   = '';
  this.remote_cloudrun_id = '';
  this.knownSince    = '';  // date
  this.lastSeen      = '';  // date
  this.role          = role_code.user;
  this.dormant       = 0;
  this.volume        = '***';  // where users projects are kept
  this.helpTopics    = [];
  this.authorisation = {};
  this.remote_tasks  = {
    'TaskStructurePrediction' : true
  };
  this.settings      = {
    onlogin        : on_login.all_projects,  // place to land on login
    viewers_size   : [1.40,0.97],     // width, height
    jobdlg_size    : [1.25,0.85],     // width, height
    project_prefix : false,
    tasklist_state : true,
    guided_import  : true,
    notifications  : {
      end_of_job : { send : true, lapse : 24.0 }  // hours
    },
    webcoot_pref   : null
  };
  this.action = userdata_action.none;
  this.onlogin_message = '';  // shown only once at login
}

function getRandomToken()  {
  return  Math.random().toString(36).substring(2,6) + '-' +
          Math.random().toString(36).substring(2,6) + '-' +
          Math.random().toString(36).substring(2,6) + '-' +
          Math.random().toString(36).substring(2,6);
}

function checkUserData ( uData )  {
let msg = '';

  if (uData.feedback.length<=0)  {
    uData.action = userdata_action.revise;
    msg = '<li>choose suitable <b>feedback agreement</b></li>';
  }
  if ((uData.action!=userdata_action.none) && (msg.length<=0))  {
    if (uData.action==userdata_action.chpwd)
          msg = '<li>change your <b>password</b></li>';
    else  msg = '<li>confirm your account details</li>';
  }

  if (uData.login==__local_user_id)
    uData.role = role_code.localuser;

  if (('version' in uData) && (uData.version==2))
    return msg;

  uData.version = 2;  // with new checks, update this number and above

  if (!uData.hasOwnProperty('remote_login'))  {
    uData.remote_login       = '';
    uData.remote_cloudrun_id = '';
    uData.remote_tasks       = {
      'TaskStructurePrediction' : true
    };
  }

  if (!uData.hasOwnProperty('action'))    uData.action   = userdata_action.revise;
  if (!uData.hasOwnProperty('feedback'))  uData.feedback = '';

  if (!uData.hasOwnProperty('globusId'))
    uData.globusId = '';

  if (!uData.hasOwnProperty('authorisation'))
    uData.authorisation = {};

  if ((!uData.hasOwnProperty('cloudrun_id')) || (!uData.cloudrun_id))
    uData.cloudrun_id = getRandomToken();

  if (!uData.hasOwnProperty('settings'))
    uData.settings = { project_prefix : false };

  if (!uData.settings.hasOwnProperty('onlogin'))  {
    uData.settings.onlogin      = on_login.all_projects;  // 'project_list', 'last_project'
    uData.settings.viewers_size = [1.40,0.97];     // width, height
    uData.settings.jobdlg_size  = [1.25,0.85];     // width, height
  } else if (!Object.values(on_login).includes(uData.settings.onlogin))
    uData.settings.onlogin      = on_login.all_projects;

  if (!uData.settings.hasOwnProperty('notifications'))  {
    uData.settings.notifications = {
      end_of_job : { send : true, lapse : 24.0 }  // hours
    }
  }

  if (!uData.settings.hasOwnProperty('tasklist_state'))
    uData.settings.tasklist_state = true;

  if (!uData.settings.hasOwnProperty('guided_import'))
    uData.settings.guided_import = true;

  if (!uData.settings.hasOwnProperty('webcoot_pref'))
    uData.settings.webcoot_pref = null;

  if (!uData.hasOwnProperty('email'))           uData.email   = 'localuser@localhost';
  if (!uData.hasOwnProperty('volume'))          uData.volume  = '***';
  if (!uData.hasOwnProperty('dormant'))         uData.dormant = 0;
  if (!uData.hasOwnProperty('onlogin_message')) uData.onlogin_message = '';

  if (uData.hasOwnProperty('admin'))  {
    if (!uData.hasOwnProperty('role'))  {
      if (uData.admin)                        uData.role = role_code.admin;
      else if (uData.login==__local_user_id)  uData.role = role_code.localuser;
                                        else  uData.role = role_code.user;
    }
    delete uData.admin;
  }

  return msg;

}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.licence_code    = licence_code;
  module.exports.feedback_code   = feedback_code;
  module.exports.userdata_action = userdata_action;
  module.exports.role_code       = role_code;
  module.exports.__local_user_id = __local_user_id;
  module.exports.UserData        = UserData;
  module.exports.checkUserData   = checkUserData;
}
