
/*
 *  =================================================================
 *
 *    23.03.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */


var licence_code = {
  academic   : 'academic',
  commercial : 'commercial'
}


function UserData()  {
  this._type      = 'UserData';  // do not change
  this.name       = '';
  this.email      = '';
  this.login      = '';
  this.licence    = '';
  this.pwd        = '';
  this.nJobs      = 0;
  this.usedSpace  = 0;  // in MB
  this.knownSince = ''; // date
  this.lastSeen   = ''; // date
  this.helpTopics = [];
}

// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.licence_code = licence_code;
  module.exports.UserData     = UserData;
}
