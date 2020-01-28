
/*
 *  =================================================================
 *
 *    27.01.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.data_user.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */


var licence_code = {
  academic   : 'academic',
  commercial : 'commercial'
}

var feedback_code = {
  agree1  : 'accepted (1)',
  agree2  : 'accepted (2)',
  decline : 'declined'
}

var userdata_action = {
  none   : 'none',
  chpwd  : 'chpwd',
  revise : 'revise'
}

var role_code = {
  user      : 'user',
  admin     : 'admin',
  developer : 'developer'
}

function UserData()  {
  this._type         = 'UserData';  // do not change
  this.name          = '';
  this.email         = '';
  this.login         = '';
  this.licence       = '';
  this.feedback      = '';
  this.pwd           = '';
  this.nJobs         = 0;
  this.usedSpace     = 0;  // in MB
  this.usedCPU       = 0;  // in hours
  this.knownSince    = ''; // date
  this.lastSeen      = ''; // date
//  this.admin         = false;
  this.role          = role_code.user;
  this.dormant       = 0;
  this.volume        = '***';  // where users projects are kept
  this.helpTopics    = [];
  this.authorisation = {};
  this.settings      = {};
  this.settings.project_prefix = false;
  this.action        = userdata_action.none;
}

function checkUserData ( uData )  {
  var msg = '';
  if (!uData.hasOwnProperty('action'))    uData.action   = userdata_action.revise;
  if (!uData.hasOwnProperty('feedback'))  uData.feedback = '';
  if (uData.feedback.length<=0)  {
    uData.action   = userdata_action.revise;
    msg = '<li>choose suitable <b>feedback agreement</b></li>';
  }
  if ((uData.action!=userdata_action.none) && (msg.length<=0))  {
    if (uData.action==userdata_action.chpwd)
      msg = '<li>change your <b>password</b></li>';
    else
      msg = '<li>confirm your account details</li>';
  }
  if (!uData.hasOwnProperty('authorisation'))  uData.authorisation = {};
  if (!uData.hasOwnProperty('settings'))       uData.settings      = {};
  if (!uData.hasOwnProperty('volume'))         uData.volume        = '***';
  if (!uData.hasOwnProperty('dormant'))        uData.dormant       = 0;
  if (uData.hasOwnProperty('admin'))  {
    if (!uData.hasOwnProperty('role'))  {
      if (uData.admin)  uData.role = role_code.admin;
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
  module.exports.UserData        = UserData;
  module.exports.checkUserData   = checkUserData;
}
