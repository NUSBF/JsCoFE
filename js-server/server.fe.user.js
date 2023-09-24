
/*
 *  =================================================================
 *
 *    09.08.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.user.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- User Support Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2023
 *
 *
 *    function hashPassword     ( pwd )
 *    function getUserDataFName ( loginData )
 *    function makeNewUser      ( userData,callback_func )
 *    function recoverUserLogin ( userData,callback_func )
 *    class UserLoginHash()
 *    function readUserLoginHash()
 *    function getLoginEntry    ( token )
 *    function signalUser       ( login_name,signal )
 *    function userLogin        ( userData,callback_func )
 *    function checkSession     ( userData,callback_func )
 *    function readUserData     ( loginData )
 *    function getUserLoginData ( login )
 *    function readUsersData    ()
 *    function getUserData      ( loginData )
 *    function topupUserRation  ( loginData,callback_func )
 *    function getUserRation    ( loginData,data,callback_func )
 *    function saveHelpTopics   ( loginData,userData )
 *    function userLogout       ( loginData )
 *    function updateUserData   ( loginData,userData )
 *    function updateUserData_admin ( loginData,userData )
 *    function deleteUser       ( loginData,userData )
 *    function deleteUser_admin ( loginData,userData )
 *    function suspendUser      ( loginData,suspend_bool,message )
 *    function retireUser_admin ( loginData,meta )
 *    function resetUser_admin  ( loginData,userData )
 *    function sendAnnouncement ( loginData,message )
 *    function manageDormancy   ( loginData,params )
 *    function getInfo          ( inData,callback_func )
 *    function authResponse     ( server_request,server_response )
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const crypto  = require('crypto');
const fs      = require('fs-extra');
const path    = require('path');
const checkDiskSpace = require('check-disk-space').default;

//  load application modules
const emailer = require('./server.emailer');
const conf    = require('./server.configuration');
const utils   = require('./server.utils');
const prj     = require('./server.fe.projects');
const ration  = require('./server.fe.ration');
const fcl     = require('./server.fe.facilities');
const adm     = require('./server.fe.admin');
const anl     = require('./server.fe.analytics');
const ud      = require('../js-common/common.data_user');
const cmd     = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(10);


// ===========================================================================

const __userDataExt       = '.user';
const __userLoginHashFile = 'login.hash';

const day_ms              = 86400000;  // milliseconds in a day


// ===========================================================================

function hashPassword ( pwd )  {
  return crypto.createHash('md5').update(pwd).digest("hex");
}

function getUserDataFName ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + __userDataExt );
}

function _make_new_user ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password
  var pwd = '';
  if (userData.login=='devel')
    pwd = 'devel';
  else if (('localuser' in fe_server) && (userData.login==ud.__local_user_id))
    pwd = ud.__local_user_id;
  else if (userData.pwd.length>0)
    pwd = userData.pwd;
  else
    pwd = crypto.randomBytes(3).toString('hex');

  log.standard ( 1,'making new user, login: ' + userData.login );
  log.standard ( 1,'    temporary password: ' + pwd );
  userData.pwd    = hashPassword ( pwd );
  userData.action = ud.userdata_action.chpwd;

  userData.helpTopics = [];

  if (userData.login=='admin') userData.role = ud.role_code.admin;
                         else  userData.role = ud.role_code.user;
  userData.knownSince = Date.now();
  userData.lastSeen   = Date.now();

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( userData );
  log.standard ( 1,'        user data path: ' + userFilePath );

  if (utils.fileExists(userFilePath))  {

    log.error ( 1,'new user login: ' + userData.login +
                  ' -- already exists, rejected' );
    response  = new cmd.Response ( cmd.fe_retcode.existingLogin,
                                   'Login name exists','');

  } else if (utils.writeObject(userFilePath,userData))  {

    log.standard ( 2,'new user login: ' + userData.login + ' -- created' );

    response = prj.makeNewUserProjectsDir ( userData );

    if (response.status==cmd.fe_retcode.ok)  {

      var msg = '';
      if (response.message.length>0)
        msg = '<p><b><i>Note:</i></b> your login was re-used and may ' +
              'contain pre-existing projects and data.';

      response.data = emailer.sendTemplateMessage ( userData,
            cmd.appName() + ' Registration','user_registration',{
              'text1' : pwd,
              'text2' : msg
            });

    }

  } else  {

    response = new cmd.Response ( cmd.fe_retcode.writeError,
                      'Cannot write user data',
                      emailer.send ( conf.getEmailerConfig().maintainerEmail,
                        'CCP4 Registration Write Fails',
                        'Detected write failure at new user registration, ' +
                        'please investigate.'
                      )
    );

  }

  callback_func ( response );

}


function makeNewUser ( userData,callback_func )  {  // gets UserData object
var vconf = conf.getFEConfig().projectsPath;  // volumes configuration
var vdata = [];  // volumes actual data
var index = {};  // links volumes in config file and in vdata

  for (var vname in vconf)  {
    index[vname] = vdata.length;
    vdata.push ({
      'name'      : vname,
      'free'      : 0.0,
      'size'      : 0.0,
      'committed' : 0.0,
      'used'      : 0.0,
    });
  }

  function _select_disk()  {
    var users = readUsersData().userList;

    for (var i=0;i<users.length;i++)  {
      if (users[i].dormant)
            vdata[index[users[i].volume]].committed += users[i].ration.storage_used;
      else  vdata[index[users[i].volume]].committed += users[i].ration.storage;
      vdata[index[users[i].volume]].used += users[i].ration.storage_used;
    }

    var volume      = null;
    var home_volume = false;
    var pfill0      = 1000.0;

    for (var i=0;(i<vdata.length) && (!home_volume);i++)  {
      var pfill = 1.0 - ((vdata[i].free-vconf[vdata[i].name].diskReserve) -
                         (vdata[i].committed-vdata[i].used)) /
                        (vdata[i].size-vconf[vdata[i].name].diskReserve);
      if (pfill<pfill0)  {
        pfill0 = pfill;
        volume = vdata[i];
      }
      if (vconf[vdata[i].name].type=='home')  {
        var hpath = path.join ( vconf[vdata[i].name].path,userData.login );
        if (utils.dirExists(hpath))  {  // does user exist on this volume?
          home_volume = true;   // user should be put on 'home' volume
          pfill0      = pfill;
          volume      = vdata[i];
        }
      }
    }

    if (pfill0<1.0)  {  // correct statement
//    if (pfill0<100000000000.0)  {    //temporary hack before dormancy is introduced

      userData.volume = volume.name;
      _make_new_user ( userData,callback_func );

    } else  {

      var msg = 'not enough disk space to create new user';
      if (home_volume)  msg += ' on home volume "';
                  else  msg += '; most free volume is "';
      msg += volume.name + '" at\n' +
             '                                      '    + volume.path +
             '\n                                      (' +
             Math.round(volume.size)        + ' MB total, '       +
             Math.round(volume.committed)   + ' MB committed, '   +
             Math.round(volume.used)        + ' MB used, '        +
             Math.round(volume.free)        + ' MB free at '      +
             vconf[volume.name].diskReserve + ' MB reserved)';

      log.standard ( 3,msg );
      log.error    ( 3,msg );

      callback_func (
        new cmd.Response ( cmd.fe_retcode.regFailed,
          '<h3>Sorry</h3>' +
          'New User cannot be registered because of insufficient disk space.' +
          '<p><i>Server maintenance team is informed. Please come back later</i>',
          emailer.send ( conf.getEmailerConfig().maintainerEmail,
            'User Registration Failure',
            'User registration failed due to insufficient disk space, ' +
            'please investigate.' )
        )
      );

    }
  }

  function _check_disks ( n )  {
    if (n<vdata.length)  {
      vdata[n].path = path.resolve ( vconf[vdata[n].name].path );
      checkDiskSpace(vdata[n].path).then((diskSpace) => {
          vdata[n].free = diskSpace.free/(1024.0*1024.0);
          vdata[n].size = diskSpace.size/(1024.0*1024.0);
          _check_disks ( n+1 );
        }
      );
    } else
      _select_disk();
  }

  _check_disks(0);

}


// ===========================================================================

function recoverUserLogin ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password

  log.standard ( 4,'recover user login for ' + userData.email + ' at ' +
                   fe_server.userDataPath );

  var files = fs.readdirSync ( fe_server.userDataPath );

  var userName = '???';
  var logins   = [];
  var pwds     = [];
  var n = 0;
  for (var i=0;i<files.length;i++)
    if (files[i].endsWith(__userDataExt))  {
      var userFilePath = path.join ( fe_server.userDataPath,files[i] );
      var uData = utils.readObject ( userFilePath );
      if (uData)  {
        if (uData.email==userData.email)  {
          userName  = uData.name;
          logins[n] = uData.login;
          // reset password
          if (uData.login=='devel')
                pwds[n] = 'devel';
          else if (('localuser' in fe_server) && (uData.login==ud.__local_user_id))
                pwds[n] = ud.__local_user_id;
          else  pwds[n] = crypto.randomBytes(3).toString('hex');
          uData.pwd = hashPassword ( pwds[n] );
          // save file
          if (!utils.writeObject(userFilePath,uData))  {
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                      'User file cannot be written.',
                      emailer.send ( conf.getEmailerConfig().maintainerEmail,
                        'CCP4 Login Recovery Write Fails',
                        'Detected file write failure at user login recovery, ' +
                        'please investigate.' )
                  );
          }
          n++;
        }
      } else  {
        response = new cmd.Response ( cmd.fe_retcode.readError,
                      'User file cannot be read.',
                      emailer.send ( conf.getEmailerConfig().maintainerEmail,
                        'CCP4 Login Recovery Read Fails',
                        'Detected file read failure at user login recovery, ' +
                        'please investigate.' )
                  );
      }
    }

  if (!response)  {

    if (logins.length<=0)  {

      response = new cmd.Response ( cmd.fe_retcode.userNotFound,'','' );

    } else  {

      var msg = 'The following account(s) have been identified as ' +
                'registered with your e-mail address, and their passwords ' +
                'are now reset as below:<p>';
      for (var i=0;i<logins.length;i++)
        msg += 'Login: <b>' + logins[i] +
               '</b>, new password: <b>' + pwds[i] + '</b><br>';
      msg += '&nbsp;<br>';

      userData.name = userName;
      response = new cmd.Response ( cmd.fe_retcode.ok,userName,
        emailer.sendTemplateMessage ( userData,
                  cmd.appName() + ' Login Recovery',
                  'login_recovery',{ 'text1' : msg } )
      );

    }

  }

  callback_func ( response );

}


// ===========================================================================

function UserLoginHash()  {
  this._type       = 'UserLoginHash';  // do not change
  this.loggedUsers = {
    '340cef239bd34b777f3ece094ffb1ec5' : {
      'login'  : 'devel',
      'volume' : '*storage*',
      'signal' : ''
    }
  };
}

UserLoginHash.prototype.save = function()  {
  var userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
  if (!utils.writeObject(userHashPath,this))
    return emailer.send ( conf.getEmailerConfig().maintainerEmail,
                          'CCP4 Login Hash Write Fails',
                          'Detected file read failure at user login hash write, ' +
                          'please investigate.' );
  return '';
}

UserLoginHash.prototype.read = function()  {
  var userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
  var hash = utils.readObject ( userHashPath);
  if (hash)  {
    if (!hash.hasOwnProperty('_type'))  {
      // transformation for backward compatibility
      let loggedUsers = {};
      for (let token in hash)  {
        loggedUsers[token] = {
          'login'  : hash[token],
          'volume' : '***',
          'signal' : ''
        };
      }
      this.loggedUsers = loggedUsers;
      this.save();
    } else  {
      this.loggedUsers = hash.loggedUsers;
      for (let token in this.loggedUsers)
        if (!('signal' in this.loggedUsers[token]))
          this.loggedUsers[token].signal = '';
    }
    return true;
  }
  return false;
}

// UserLoginHash.prototype.read = function()  {
//   var userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
//   var hash = utils.readObject ( userHashPath);
//   if (hash)  {
//     if (!hash.hasOwnProperty('_type'))  {
//       // transformation for backward compatibility
//       let loggedUsers = {};
//       for (let token in hash)  {
//         loggedUsers[token] = {
//           'login'  : hash[token],
//           'volume' : '***'
//         };
//       }
//       this.loggedUsers = loggedUsers;
//       this.save();
//     } else
//       this.loggedUsers = hash.loggedUsers;
//     return true;
//   }
//   return false;
// }

UserLoginHash.prototype.addUser = function ( token,login_data )  {

  var logUsers = {};

  for (let key in this.loggedUsers)
    if (this.loggedUsers[key].login!=login_data.login)
      logUsers[key] = this.loggedUsers[key];

  logUsers[token]  = login_data;
  this.loggedUsers = logUsers;

  this.save();

}

/*
UserLoginHash.prototype.removeUser = function ( token )  {
  if (token in this.loggedUsers)
    delete this.loggedUsers[token];
  this.save();
}
*/

UserLoginHash.prototype.removeUser = function ( login_name )  {
  var loggedUsers = {};
  for (var key in this.loggedUsers)
    if (this.loggedUsers[key].login!=login_name)
      loggedUsers[key] = this.loggedUsers[key];
  this.loggedUsers = loggedUsers;
  this.save();
}

UserLoginHash.prototype.getLoginEntry = function ( token )  {
  if (token in this.loggedUsers)
    return this.loggedUsers[token];
  return { 'login' : '', 'volume' : '' };
}

UserLoginHash.prototype.getToken = function ( login_name )  {
var token = null;
  for (let key in this.loggedUsers)
    if (this.loggedUsers[key].login==login_name)  {
      token = key;
      break;
    }
  return token;
}

UserLoginHash.prototype.putSignal = function ( login_name,signal )  {
  for (let key in this.loggedUsers)
    if (this.loggedUsers[key].login==login_name)  {
      this.loggedUsers[key].signal = signal;
      break;
    }
}



var __userLoginHash = new UserLoginHash();

/*
var __userLoginHash = {
  '_type'       : 'UserLoginHash',
  'loggedUsers' :  {
    '340cef239bd34b777f3ece094ffb1ec5' : {
      'login'  : 'devel',
      'volume' : '*storage*'
    }
  }
};
*/


function readUserLoginHash()  {
var fe_server  = conf.getFEConfig();
var updateHash = false;

  __userLoginHash = new UserLoginHash();

  if (!__userLoginHash.read())  {
    var userData = new ud.UserData();
    userData.name    = 'Developer';
    userData.email   = conf.getEmailerConfig().maintainerEmail;
    userData.login   = 'devel';
    userData.pwd     = 'devel';
    userData.licence = 'academic';
    userData.role    = ud.role_code.user;
    makeNewUser ( userData,function(response){} );
    updateHash = true;
  }

  if (('localuser' in fe_server) &&
      (!__userLoginHash.getToken(ud.__local_user_id)))  {
    userData = new ud.UserData();
    userData.name    = fe_server.localuser;
    // userData.email   = conf.getEmailerConfig().maintainerEmail;
    userData.email   = 'localuser@localhost';
    userData.login   = ud.__local_user_id;
    userData.pwd     = ud.__local_user_id;
    userData.licence = 'academic';
    userData.role    = ud.role_code.user;
    makeNewUser ( userData,function(response){} );
    __userLoginHash.addUser ( 'e58e28a556d2b4884cb16ba8a37775f0',{
                                'login'  : ud.__local_user_id,
                                'volume' : '*storage*'
                            });
    updateHash = false;
  }

  if (updateHash)
    __userLoginHash.save();

}

function getLoginEntry ( token )  {
  return __userLoginHash.getLoginEntry ( token );
}

function signalUser ( login_name,signal )  {
  return __userLoginHash.putSignal ( login_name,signal );
}



// ===========================================================================

const __suspend_prefix = '**suspended**';

function userLogin ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password
//  var userData = JSON.parse ( user_data_json );
  var pwd = hashPassword ( userData.pwd );
  if (userData.login=='**' + ud.__local_user_id + '**')  {
    userData.login = ud.__local_user_id;
    userData.pwd   = 'e58e28a556d2b4884cb16ba8a37775f0';
    pwd = userData.pwd;
  }
  var ulogin = userData.login;
  log.standard ( 5,'user login ' + ulogin );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( userData );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.login.startsWith(__suspend_prefix))  {
        // for example, user's data is being moved to different disk

        response  = new cmd.Response ( cmd.fe_retcode.suspendedLogin,'','' );

      } else if ((uData.login==ulogin) && (uData.pwd==pwd))  {

        var rData = { // return data object
          onlogin_message : uData.onlogin_message
        };

        uData.onlogin_message = '';  // clear up

        uData.lastSeen = Date.now();
        utils.writeObject ( userFilePath,uData );

        anl.getFEAnalytics().userLogin ( uData );
        // var rep = anl.getFEAnalytics().getReport();
        // console.log ( rep );

        var token = '';
        if (uData.login=='devel')
              token = '340cef239bd34b777f3ece094ffb1ec5';
        else  token = crypto.randomBytes(20).toString('hex');
        __userLoginHash.addUser ( token,{
          'login'  : uData.login,
          'volume' : uData.volume
        });

        if (uData.dormant && (!fe_server.dormancy_control.strict))  {
          // A non-strict dormancy only limits user disk space and is removed 
          // automatically when user logins. Therefore, remove dormancy here
          // and pass client a code indicating that dormant account has been
          // re-activated.
          uData.dormant = 0;
          if (!utils.writeObject(userFilePath,uData))
            log.error ( 44,'cannot write user data at ' + userFilePath );
          uData.dormant = 1;
        }

        // remove personal information just in case
        uData.pwd   = '';
        uData.email = '';
        rData.userData        = uData;
        rData.localSetup      = conf.isLocalSetup();
        rData.isArchive       = conf.isArchive();
        rData.cloud_storage   = (fcl.getUserCloudMounts(uData).length>0);
        rData.strict_dormancy = fe_server.dormancy_control.strict;
        rData.treat_private   = fe_server.treat_private;
        rData.jobs_safe       = (fe_server.getJobsSafePath().length>0);
        rData.demo_projects   = fe_server.getDemoProjectsMount();
        rData.auth_software   = fe_server.auth_software;
        if (fe_server.hasOwnProperty('description'))
              rData.setup_desc = fe_server.description;
        else  rData.setup_desc = null;

        adm.getNCData ( [],function(ncInfo){
          rData.environ_server = [];
          for (var i=0;i<ncInfo.length;i++)
            if (ncInfo[i] && ('environ' in ncInfo[i]))  {
              for (var j=0;j<ncInfo[i].environ.length;j++)
                if (rData.environ_server.indexOf(ncInfo[i].environ[j])<0)
                  rData.environ_server.push ( ncInfo[i].environ[j] );
            }
          callback_func ( new cmd.Response ( cmd.fe_retcode.ok,token,rData ) );
        });

      } else  {
        log.error ( 41,'Login name/password mismatch:' );
        log.error ( 41,' ' + ulogin + ':' + pwd );
        log.error ( 41,' ' + uData.login + ':' + uData.pwd );
        response = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
      }

    } else  {
      log.error ( 42,'User file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }

  } else  {
    log.error ( 43,'User file: ' + userFilePath + ' not found.' );
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  if (response)
    callback_func ( response );

}


function checkSession ( userData,callback_func )  {  // gets UserData object
  var retcode   = cmd.fe_retcode.wrongSession;
  var uLogEntry = __userLoginHash.getLoginEntry(userData.login_token);
  var signal    = '';
  if (uLogEntry.login)  {
    anl.logPresence ( uLogEntry.login );
    signal  = uLogEntry.signal;
    retcode = cmd.fe_retcode.ok;
    uLogEntry.signal = '';  // remove signal
  }
  callback_func ( new cmd.Response(retcode,'',signal) );
}


// ===========================================================================

function readUserData ( loginData )  {
  var uData = null;
  var userFilePath = getUserDataFName ( loginData );
  if (utils.fileExists(userFilePath))  {
    uData = utils.readObject ( userFilePath );
    if (uData)
      ud.checkUserData ( uData );
    else
      log.error ( 51,'cannot read user settings at ' + userFilePath );
  } else
    log.error ( 52,'user settings file not found at ' + userFilePath );
  return uData;
}

function getUserLoginData ( login )  {
  var uLoginData = { login:login, volume:null };
  var uData      = readUserData ( uLoginData );
  if (uData)  uLoginData.volume = uData.volume;
        else  uLoginData = null;
  return uLoginData;
}

function readUsersData()  {
var usersData = {};
var fe_config = conf.getFEConfig();
var udir_path = fe_config.userDataPath;

  usersData.loginHash = __userLoginHash;
  usersData.userList  = [];

  if (utils.fileExists(udir_path))  {

    let crTime   = Date.now()
    let after_ms = 0;
    if ((!fe_config.dormancy_control.strict) && fe_config.dormancy_control.after)
      after_ms = crTime - day_ms*fe_config.dormancy_control.after;

    fs.readdirSync(udir_path).forEach(function(file,index){
      if (file.endsWith(__userDataExt))  {

        let uDataFPath = path.join    ( udir_path,file );
        let uData      = utils.readObject ( uDataFPath );
        if (uData)  {
          ud.checkUserData ( uData );
        
          let update_udata   = false;
          let update_uration = false;

          if (!('knownSince' in uData) || (uData.knownSince==''))  {
            uData.knownSince = new Date("2017-09-01").valueOf();
            uData.lastSeen   = uData.knownSince;
            update_udata     = true;
          }

          let loginData = {
            'login'  : file.slice ( 0,file.length-__userDataExt.length ),
            'volume' : ''
          };
          let uration = ration.getUserRation ( loginData );

          if ((!uData.dormant) && (uData.lastSeen<after_ms))  {
            // auto-dormancy in non-strict mode
            uData.dormant   = crTime;
            uration.storage = uration.storage_used;
            update_udata    = true;
            update_uration  = true;
          }

          if (update_udata)
            utils.writeObject ( uDataFPath,uData );

          if (('nJobs' in uData) && (uration.jobs_total<uData.nJobs))  {
            // backward compatibility 07.06.2018
            uration.jobs_total = uData.nJobs;
            update_uration     = true;
          }

          if (update_uration)
            ration.saveUserRation ( loginData,uration );

          uration.clearJobs();  // just to make it slimmer for transmission
          uData.ration = uration;
          usersData.userList.push ( uData );

        }
      }
    });
  }

  return usersData;

}


function getUserData ( loginData )  {
var response = 0;  // must become a cmd.Response object to return

  //log.debug ( 5,'user get data ' + login );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      ud.checkUserData ( uData );
      response = new cmd.Response ( cmd.fe_retcode.ok,'',uData );
    } else  {
      log.error ( 5,'User file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


function topupUserRation ( loginData,callback_func )  {
var uRation = ration.getUserRation ( loginData );
var rData   = { code : 'ok', message : '', ration : uRation };
  if (!uRation)  {
    rData.code    = 'errors';
    rData.message = 'user ration file not found';
    log.error ( 80,'User ration file not found, login ' + loginData.login );
  } else if (uRation.storage_used>=uRation.storage)  {
    var uData = null;
    var userFilePath = getUserDataFName ( loginData );
    if (utils.fileExists(userFilePath))
      uData = utils.readObject ( userFilePath );
    if (!uData)  {
      rData.code    = 'errors';
      rData.message = 'user data file not found';
      log.error ( 81,'User data file not found, login ' + loginData.login );
    } else  {
      var feconf = conf.getFEConfig();
      // find new storage and topup requirement
      var storage1 = uRation.storage;
      if (uRation.storage_max>0)  {
        while ((storage1<uRation.storage_used) && (storage1<uRation.storage_max))
          storage1 += feconf.ration.storage_step;
        storage1 = Math.min(storage1,uRation.storage_max);
      } else  {
        while (storage1<uRation.storage_used)
          storage1 += feconf.ration.storage_step;
      }
      if (storage1>uRation.storage_used)  {
        var vconf  = feconf.projectsPath[uData.volume];  // volumes configuration
        var fspath = path.resolve ( vconf.path );
        rData.code = 'requesting';
        checkDiskSpace(fspath).then((diskSpace) => {
            var free = diskSpace.free/(1024.0*1024.0) - vconf.diskReserve;
            if (free<storage1-uRation.storage)  {
              rData.code    = 'no_disk';
              rData.message = 'not enough disk space';
              log.error    ( 82,'Not enough disk space for auto-topup, volume ' + uData.volume );
              log.error    ( 82,'Free space ' + free + ' MBytes, volume=' + uData.volume );
              log.standard ( 82,'Not enough disk space for auto-topup, volume ' + uData.volume );
              log.standard ( 82,'Free space ' + free + ' MBytes, volume=' + uData.volume );
            } else  {
              // console.log ( ' >>>> free     = ' + free     );
              // console.log ( ' >>>> storage  = ' + uRation.storage );
              // console.log ( ' >>>> storage1 = ' + storage1 );
              uRation.storage = storage1;
              ration.saveUserRation ( loginData,uRation );
              rData.code    = 'topup';
              rData.message = emailer.sendTemplateMessage ( uData,
                cmd.appName() + ' Disk Space Auto-Topup',
                'auto_topup',{
                  'new_allocation' : storage1
                });
              log.standard ( 83,'Auto-top successful login ' + loginData.login +
                                ', committed ' + storage1 + ' MBytes, free space ' +
                                Math.round(free) + ' MBytes, volume ' + uData.volume );
            }
            callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',rData) );
          }
        );
      } else  {
        // already at maximum allowed allocation
        rData.code    = 'limit_reached';
        rData.message = 'allocation limit reached';
      }  
    }
  }
  if (rData.code!='requesting')
    callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',rData) );
}


function getUserRation ( loginData,data,callback_func )  {
  if (data.topup && (loginData.login!=ud.__local_user_id))  {
    topupUserRation ( loginData,callback_func );
  } else  {
    callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',{
        code    : 'ok',
        message : '',
        ration  : ration.getUserRation(loginData)
      })
    );
  }
}


// ===========================================================================

function saveHelpTopics ( loginData,userData )  {
var response = 0;  // must become a cmd.Response object to return

  log.standard ( 6,'user save help topics ' + loginData.login );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      ud.checkUserData ( uData );
      uData.helpTopics = userData.helpTopics;
      if (utils.writeObject(userFilePath,uData))  {
        response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
      } else  {
        log.error ( 61,'User file: ' + userFilePath + ' cannot be written' );
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                                      'User file cannot be written.','' );
      }
    } else  {
      log.error ( 62,'User file: ' + userFilePath + ' cannot be read' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


// ===========================================================================

function userLogout ( loginData )  {

  log.standard ( 7,'user logout ' + loginData.login );

  if (['devel',ud.__local_user_id].indexOf(loginData.login)<0)
    __userLoginHash.removeUser ( loginData.login );

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


// ===========================================================================

function updateUserData ( loginData,userData )  {
var response = null;  // must become a cmd.Response object to return
var notify   = false;

  var uData = userData;
  var pwd   = userData.pwd;
  if ((userData.login!=ud.__local_user_id) && pwd)  {
  // if (userData.login!='devel')  {
    uData.pwd = hashPassword ( pwd );
    notify    = true;
    log.standard ( 8,'update user data, login ' + loginData.login );
  } else  {
    // can only change some records without password 
    var uData = readUserData ( loginData );
    if (uData)  {
      if (userData.login==ud.__local_user_id)
        uData.cloudrun_id = userData.cloudrun_id;
      if ('helpTopics' in userData)
        uData.helpTopics = userData.helpTopics;
      if ('authorisation' in userData)  
        uData.authorisation = userData.authorisation;
      if ('settings' in userData)
        uData.settings = userData.settings;
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    'User file cannot be read.','' );
    }
  }

  var userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    if (utils.writeObject(userFilePath,uData))  {

      var msg = '';
      if (notify)
        msg = emailer.sendTemplateMessage ( uData,
                                            cmd.appName() + ' Account Update',
                                            'account_updated_user',{} );

      response = new cmd.Response ( cmd.fe_retcode.ok,'',msg );

    } else  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    'User file cannot be written.','' );
    }

  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


function updateUserData_admin ( loginData,userData )  {
var response     = null;  // must become a cmd.Response object to return
var userFilePath = getUserDataFName ( loginData );

  log.standard ( 9,'update ' + userData.login +
                   '\' account settings by admin, login: ' + loginData.login );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        userFilePath = getUserDataFName ( userData );
        var uData    = utils .readObject  ( userFilePath );
        var uRation  = ration.getUserRation ( userData );

        if (uData && uRation)  {

          var storage      = Number(userData.ration.storage);
          var storage_max  = Number(userData.ration.storage_max);
          var cpu_day      = Number(userData.ration.cpu_day);
          var cpu_month    = Number(userData.ration.cpu_month);
          var cloudrun_day = Number(userData.ration.cloudrun_day);
          var archive_year = Number(userData.ration.archive_year);

          var feedback  = '';
          if (userData.hasOwnProperty('feedback'))
              feedback = userData.feedback;

          if ((!uData.dormant) && userData.dormant)  {
            // new dormancy request
            userData.dormant = Date.now();  // make in sync with server time
            storage = uRation.storage_used + 1;  // release unused space, avoid
                                                 // '0' which means unlimited
          }

          if ((uRation.storage      != storage      )    ||
              (uRation.storage_max  != storage_max  )    ||
              (uRation.cpu_day      != cpu_day      )    ||
              (uRation.cpu_month    != cpu_month    )    ||
              (uRation.cloudrun_day != cloudrun_day )    ||
              (uRation.archive_year != archive_year )    ||
              (uData.role           != userData.role   ) ||
              (uData.licence        != userData.licence) ||
              (uData.dormant        != userData.dormant) ||
              (uData.feedback       != feedback ))  {

            uRation.storage      = storage;
            uRation.storage_max  = storage_max;
            uRation.cpu_day      = cpu_day;
            uRation.cpu_month    = cpu_month;
            uRation.cloudrun_day = cloudrun_day;
            uRation.archive_year = archive_year;

            ration.saveUserRation ( userData,uRation );

            uData.role     = userData.role;
            uData.licence  = userData.licence;
            uData.feedback = feedback;
            uData.dormant  = userData.dormant;

            if (utils.writeObject(userFilePath,uData))  {
              response = new cmd.Response ( cmd.fe_retcode.ok,'',
                emailer.sendTemplateMessage ( userData,
                          cmd.appName() + ' Account Update',
                          'account_updated_admin',{
                            'userProfile'  : uData.role,
                            'userStorage'  : uRation.storage,
                            'userDiskMax'  : uRation.storage_max,
                            'userCPUDay'   : uRation.cpu_day,
                            'userCPUMonth' : uRation.cpu_month,
                            'userCRunDay'  : uRation.cloudrun_day,
                            'archiveYear'  : uRation.archive_year
                          })
              );
            } else  {
              log.error ( 91,'User file: ' + userFilePath + ' cannot be written.' );
              response = new cmd.Response ( cmd.fe_retcode.writeError,
                                            'User file cannot be written.','' );
            }

          }

          if (userData.volume!=uData.volume)  {
            // change of volume; do this in the background

            // a) calculate project directory paths
            var old_path = prj.getUserProjectsDirPath ( uData );
            var new_path = prj.getUserProjectsDirPath ( userData );

            // b) log user out and suspend their account
            __userLoginHash.removeUser ( uData.login );     // logout
            uData.login = __suspend_prefix + uData.login;   // suspend
            utils.writeObject ( userFilePath,uData );       // commit

            // c) copy user's projects to new volume
            utils.copyDirAsync ( old_path,new_path,true,function(err){
              if (err)  {
                log.error ( 96,'moving user projects failed:' );
                log.error ( 96,'  from: ' + old_path );
                log.error ( 96,'    to: ' + new_path );
                console.error ( err );
              } else  {
                log.standard ( 91,'user ' + userData.login +
                                  ' is relocated to disk ' + userData.volume +
                                  ' by admin, login: ' + loginData.login );
                uData.volume = userData.volume;
                utils.removePath ( old_path );
              }
              if (uData.login.startsWith(__suspend_prefix))   // release
                uData.login = uData.login.substring(__suspend_prefix.length);
              utils.writeObject ( userFilePath,uData );       // commit
            });

          }

          if (!response)
            response = new cmd.Response ( cmd.fe_retcode.ok,'','' );

        } else  {
          log.error ( 92,'User file: ' + userFilePath + ' cannot be read.' );
          response = new cmd.Response ( cmd.fe_retcode.readError,
                                        'User file cannot be read.','' );
        }
      } else  {
        log.error ( 93,'Attempt to update user data without privileges from login ' +
                       loginData.login );
        response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                       'No admin privileges','' );
      }
    } else  {
      log.error ( 94,'Admin user file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    'Admin user file cannot be read.','' );
    }
  } else  {
    log.error ( 95,'Admin user file: ' + userFilePath + ' does not exist.' );
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                   'Wrong admin login','' );
  }

  return response;

}


// ===========================================================================

function deleteUser ( loginData,userData )  {
var response = null;  // must become a cmd.Response object to return

  log.standard ( 10,'delete user, login ' + loginData.login );

  var pwd = userData.pwd;
  userData.pwd = hashPassword ( pwd );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (userData.pwd==uData.pwd)  {

        var rationFilePath = ration.getUserRationFPath ( loginData );
        if (!utils.removeFile(rationFilePath))
          log.error ( 101,'User ration file: ' + rationFilePath + ' cannot be removed.' );

        var userProjectsDir = prj.getUserProjectsDirPath ( loginData );
        if (!utils.removePath(userProjectsDir))
          log.error ( 102,'User directory: ' + userProjectsDir + ' cannot be removed.' );

        if (utils.removeFile(userFilePath))  {

          response = new cmd.Response ( cmd.fe_retcode.ok,'',
            emailer.sendTemplateMessage ( uData,
                      cmd.appName() + ' Account Deleted',
                      'account_deleted_user',{})
          );

          __userLoginHash.removeUser ( loginData.login );

        } else  {
          response = new cmd.Response ( cmd.fe_retcode.userNotDeleted,
                                        'Cannot delete user data.','' );
        }

      } else  {
        response = new cmd.Response ( cmd.fe_retcode.wrongPassword,
                                      'Incorrect password.','' );
      }
    } else  {
      log.error ( 101,'User file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


function deleteUser_admin ( loginData,userData )  {
var response     = null;  // must become a cmd.Response object to return
var userFilePath = getUserDataFName ( loginData );

  log.standard ( 11,'delete user ' + userData.login +
                    ' by admin, login ' + loginData.login );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        userFilePath = getUserDataFName ( userData );

        if (utils.fileExists(userFilePath))  {

          var rationFilePath = ration.getUserRationFPath ( userData );
          if (!utils.removeFile(rationFilePath))
            log.error ( 111,'User ration file: ' + rationFilePath + ' cannot be removed.' );

          var userProjectsDir = prj.getUserProjectsDirPath ( userData );
          if (!utils.removePath(userProjectsDir))
            log.error ( 112,'User directory: ' + userProjectsDir + ' cannot be removed.' );

          if (utils.removeFile(userFilePath))  {

            response = new cmd.Response ( cmd.fe_retcode.ok,'',
              emailer.sendTemplateMessage ( userData,
                        cmd.appName() + ' Account Deleted',
                        'account_deleted_admin',{})
            );

            //removeUserFromHash ( userData.login );
            __userLoginHash.removeUser ( userData.login );

          } else  {
            response = new cmd.Response ( cmd.fe_retcode.userNotDeleted,
                                          'Cannot delete user data.','' );
          }

        } else  {
          response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
        }

      } else  {
        log.error ( 113,'Attempt to delete user data without privileges from login ' +
                        loginData.login );
        response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                       'No admin privileges','' );
      }
    } else  {
      log.error ( 114,'Admin user file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    'Admin user file cannot be read.','' );
    }
  } else  {
    log.error ( 115,'Admin user file: ' + userFilePath + ' does not exist.' );
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                   'Wrong admin login','' );
  }

  return response;

}


function suspendUser ( loginData,suspend_bool,message )  {
var uData = readUserData ( loginData );
  if (uData)  {
    var ulogin = uData.login;
    if (suspend_bool)  {
      __userLoginHash.removeUser ( ulogin );     // logout
      uData.login = __suspend_prefix + uData.login;   // suspend
    } else if (uData.login.startsWith(__suspend_prefix)) // remove suspend flag
      uData.login = uData.login.replace ( __suspend_prefix,'' );
    if (message)
      uData.onlogin_message = message;
    utils.writeObject ( getUserDataFName(loginData),uData );  // commit
  }
  return uData;
}


function retireUser_admin ( loginData,meta )  {
var admData    = readUserData ( loginData );
var userData   = meta.userData;
var uData      = readUserData ( userData );
var sLoginData = getUserLoginData ( meta.successor );

  log.standard ( 16,'retire user ' + userData.login +
                    ' by admin, login ' + loginData.login );

  // sanity checks

  if (userData.login==meta.successor)  {
    var msg = 'User and successor cannot be the same (' + userData.login + ').';
    log.error ( 17,msg );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code    : 'duplicate_users',
      message : msg
    });
  }

  if (!admData)  {
    log.error ( 18,'Admin user file cannot be read, login='+loginData.login );
    return new cmd.Response ( cmd.fe_retcode.readError,
                              'Admin user data cannot be read.','' );
  }
  if (admData.role!=ud.role_code.admin)  {
    log.error ( 19,'Attempt to retire a user without privileges from login ' +
                   loginData.login );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code    : 'no_privileges',
      message : 'Attempt to retire a user without having privileges'
    });
  }

  if (!uData)  {
    var msg = 'User data cannot be read, login=' + userData.login;
    log.error ( 20,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }

  if (!sLoginData)  {
    var msg = 'Successor data file cannot be found (' + sLoginData.login +')';
    log.error ( 21,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }
  var sData = readUserData ( sLoginData );
  if (!sData)  {
    var msg = 'Successor data file cannot be read (' + sLoginData.login +')';
    log.error ( 22,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }

  // check that there are no duplicate project ids

  var userPrjList = prj.readProjectList ( userData );
  var succPrjList = prj.readProjectList ( sLoginData );
  var duplPrjIDs  = [];

  for (var i=0;i<userPrjList.projects.length;i++)  {
    var userPrjDesc = userPrjList.projects[i];
    var projectNo   = succPrjList.getProjectNo ( userPrjDesc.name );
    // if ((projectNo>=0) && (userPrjDesc.owner.login!=sLoginData.login))  {
    if (projectNo>=0)  {
      // Project is owned by user and clashes with one of successor's projects.
      // We do not check here if clashing project is also shared or is in fact
      // the same. All conflicts to be resolved by admin, successor and user.
      duplPrjIDs.push ( userPrjDesc.name );
    }
  }

  if (duplPrjIDs.length>0)  {
    log.error ( 23,duplPrjIDs.length + ' project ID(s) clashing.' );
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      code    : 'duplicate_ids',
      message : 'Project(s) with ID(s):<p><i>' + duplPrjIDs.join(', ') +
                '</i><p>are found in Successor\'s account and cannot be ' +
                'moved. Rename these projects in either account'
    });
  }

  setTimeout ( function(){   // move projects to successor

    // log out user and successor and suspend their accounts

    var uDataFile = getUserDataFName ( uData );
    var sDataFile = getUserDataFName ( sData );

    var ulogin = uData.login;
    __userLoginHash.removeUser ( ulogin );     // logout
    uData.login = __suspend_prefix + uData.login;   // suspend
    utils.writeObject ( uDataFile,uData );  // commit
    uData.login = ulogin;

    var slogin = sData.login;
    __userLoginHash.removeUser ( slogin );     // logout
    sData.login = __suspend_prefix + sData.login;   // suspend
    utils.writeObject ( sDataFile,sData );  // commit
    sData.login = slogin;

    // loop and move
    // var folder_name = ulogin + '\'s projects';
    var failed_move = [];
    var were_shared = [];
    for (var i=0;i<userPrjList.projects.length;i++)  {
      var pName = userPrjList.projects[i].name;
      var uProjectDir = prj.getProjectDirPath ( uData,pName );
      if (!utils.isSymbolicLink(uProjectDir))  {
        var sProjectDir = prj.getProjectDirPath ( sData,pName );
        if (utils.moveDir(uProjectDir,sProjectDir,false))  {
          var pData = prj.readProjectData ( sData,pName );
          if ((!('author' in pData.desc.owner)) ||
              (pData.desc.owner.author==ud.__local_user_id))
            pData.desc.owner.author = pData.desc.owner.login;
          pData.desc.owner.login = sData.login;
          prj.writeProjectData ( sData,pData,true );
        } else
          failed_move.push ( pName );
      } else
        were_shared.push ( pName );
    }

    // update rations and activate user and successor accounts

    var uRation = ration.getUserRation ( uData );
    var sRation = ration.getUserRation ( sData );

    sRation.storage      += uRation.storage;
    sRation.storage_used += uRation.storage_used;
    uRation.storage       = 0.1;  // block user by outquoting
    sRation.storage_used  = 1.0;

    ration.saveUserRation ( sData,sRation );
    ration.saveUserRation ( uData,uRation );

    utils.writeObject ( uDataFile,uData );  // commit
    utils.writeObject ( sDataFile,sData );  // commit

    var msg = '';
    if (failed_move.length>0)
      msg = 'The following project(s) could not be moved due to errors:<p>' +
            failed_move.join(', ');
    if (were_shared.length>0)  {
      if (msg)  msg += '<p>';
      msg += 'The following project(s) were not moved because they are ' +
             'shared with the user:<p>' +
             were_shared.join(', ');
    }
    if (!msg)
      msg = 'Operation finished successfully.';

    emailer.sendTemplateMessage ( uData,
              cmd.appName() + ' User Retired',
              'user_retired_admin',{
                  message : msg
              });
    emailer.sendTemplateMessage ( sData,
              cmd.appName() + ' User Retired',
              'succ_retired_admin',{
                  retLogin    : uData.login,
                  message     : msg,
                  folder_name : folder_name
              });

  },2000);

  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    code : 'started'
  });

}


function resetUser_admin ( loginData,userData )  {
var response     = null;  // must become a cmd.Response object to return
var fe_server    = conf.getFEConfig();
var userFilePath = getUserDataFName ( loginData );

  log.standard ( 141,'reset pasword for user ' + userData.login +
                     ' by admin, login ' + loginData.login );

  if (utils.fileExists(userFilePath))  {
    var uaData = utils.readObject ( userFilePath );
    if (uaData)  {
      ud.checkUserData ( uaData );
      if (uaData.role==ud.role_code.admin)  {
        // admin privileges confirmed

        userFilePath = getUserDataFName ( userData );
        var uData = utils.readObject ( userFilePath );
        if (uData)  {
          // reset password
          var pwd = '';
          if (uData.login=='devel')
                pwd = 'devel';
          else if (('localuser' in fe_server) && (uData.login==ud.__local_user_id))
                pwd = ud.__local_user_id;
          else  pwd = crypto.randomBytes(3).toString('hex');
          uData.pwd    = hashPassword ( pwd );
          uData.action = ud.userdata_action.chpwd;
          // save file
          if (!utils.writeObject(userFilePath,uData))  {
            log.error ( 142,'User file: ' + userFilePath + ' cannot be written' );
            log.error ( 142,'Password reset for user ' + userData.login + ' failed.' );
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                          'User file cannot be written.',
                          emailer.send ( conf.getEmailerConfig().maintainerEmail,
                            'CCP4 Password Reset Write Fails',
                            'Detected file write failure at user password reset, ' +
                            'please investigate.' )
                      );
          } else  {
            log.standard ( 143,'Password for user ' + userData.login +
                               ' reset by admin, pwd=' + pwd );
            response = new cmd.Response ( cmd.fe_retcode.ok,uData.name,
              emailer.sendTemplateMessage ( uData,
                        cmd.appName() + ' Login Password Reset',
                        'password_reset_admin',{ 'text1' : pwd } )
            );
          }
        } else  {
          response = new cmd.Response ( cmd.fe_retcode.readError,
                        'User file cannot be read.',
                        emailer.send ( conf.getEmailerConfig().maintainerEmail,
                          'CCP4 Login Recovery Read Fails',
                          'Detected file read failure at user login recovery, ' +
                          'please investigate.' )
                    );
        }

      } else  {
        log.error ( 144,'Attempt to reset user password without privileges ' +
                        'from login ' + loginData.login );
        response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                       'No admin privileges','' );
      }
    } else  {
      log.error ( 145,'Admin user file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    'Admin user file cannot be read.','' );
    }
  } else  {
    log.error ( 146,'Admin user file: ' + userFilePath + ' does not exist.' );
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,
                                   'Wrong admin login','' );
  }

  return response;

}


// ===========================================================================

function _send_announcement ( subject,message,user_list,count )  {
  if (count<user_list.length)  {

    //if (user_list[count].email!='ccp4_cloud@listserv.stfc.ac.uk')  {
    //  setTimeout ( function(){
    //    _send_announcement ( subject,message,user_list,count+1 );
    //  },1);
    //  return;
    //}

    emailer.send ( user_list[count].email,subject,
                   message.replace('&lt;User Name&gt;',user_list[count].name) );
    log.standard ( 12,'Announcement sent to ' + user_list[count].name + ' at ' +
                     user_list[count].email );
    if (count<user_list.length-1)
      setTimeout ( function(){
        _send_announcement ( subject,message,user_list,count+1 );
      },2000);
  }
}

function sendAnnouncement ( loginData,message )  {

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );
    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        var usersData = readUsersData();
        var users     = usersData.userList;
        //for (var i=0;i<users.length;i++)  {
        //  emailer.send ( users[i].email,cmd.appName() + ' Announcement',
        //                 message.replace( '&lt;User Name&gt;',users[i].name ) );
        //  log.standard ( 12,'Announcement sent to ' + users[i].name + ' at ' +
        //                   users[i].email );
        //}
        _send_announcement ( cmd.appName() + ' Announcement',message,users,0 );

      } else
        log.error ( 121,'Attempt to broadcast from a non-admin login -- stop.' );

    } else
      log.error ( 122,'User file: ' + userFilePath + ' cannot be read -- ' +
                    'cannot verify identity for broadcasting.' );

  } else
    log.error ( 123,'User file: ' + userFilePath + ' does not exist -- ' +
                   'cannot verify identity for broadcasting.' );

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


// ===========================================================================

function manageDormancy ( loginData,params )  {
var userFilePath = getUserDataFName ( loginData );
var ddata = { 'status' : 'ok' };

  // Check that we're having a new login name

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );
    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        var usersData = readUsersData();
        var users     = usersData.userList;

        ddata.total_users   = users.length;
        ddata.dormant_users = 0;
        ddata.disk_released = 0;  // in case of dormancy
        ddata.deleted_users = 0;
        ddata.disk_freed    = 0;  // in case of deletion
        ddata.check_date    = Date.now();

        for (var key in params)
          ddata[key] = params[key];

        var timer_delay = 0; // ms
        var tnorm = 1000 * 60 * 60 * 24;
        for (var i=0;i<users.length;i++)
          if (users[i].dormant)  {
            // THIS IS NOT FINISHED !!!!!
            var ndays = (ddata.check_date-users[i].dormant) / tnorm;
            if (ndays>ddata.period3)  {
              ddata.deleted_users++;
              ddata.disk_freed += users[i].ration.storage_used;
              if (!ddata.checkOnly)  {
                log.standard ( 131,'dormant user ' + users[i].login + ' deleted' );
              }
            }
          } else  {
            var ndays = (ddata.check_date-users[i].lastSeen) / tnorm;
//ndays = 10000;
            if ((ndays>ddata.period1) ||
                ((users[i].ration.jobs_total<=ddata.njobs) && (ndays>ddata.period2)))  {
              ddata.dormant_users++;
              ddata.disk_released += users[i].ration.storage - users[i].ration.storage_used;
              if (!ddata.checkOnly)  {
                var uiFilePath = getUserDataFName ( users[i] );
                var uiData     = utils.readObject ( uiFilePath );
                if (uiData)  {
                  ud.checkUserData ( uiData );
                  uiData.dormant = ddata.check_date;
//uiData.dormant = 0;
                  if (utils.writeObject(uiFilePath,uiData))  {
                    var reason_msg = '';
                    if (ndays>ddata.period1)
                      reason_msg = 'you have not used your account during last ' +
                                   ddata.period1 + ' days';
                    else
                      reason_msg = 'you have not used your account during last ' +
                                   ddata.period2 + ' days, having run fewer than ' +
                                   (ddata.njobs+1) + ' jobs in total';
                    timer_delay += 100; // ms
                    (function(udata,reason_line,delay){
                      setTimeout ( function(){
                        emailer.sendTemplateMessage ( udata,
                                  'Your ' + cmd.appName() + ' account made dormant',
                                  'made_dormant',{
                                    'reason' : reason_line
                                  });
                      },delay);
                    }(uiData,reason_msg,timer_delay))
                    log.standard ( 132,'user ' + users[i].login + ' made dormant (' +
                                       ndays + ' days inactivity, ' +
                                       users[i].ration.jobs_total + ' jobs)' );
                  } else  {
                    log.error ( 134,'User file: ' + uiFilePath + ' cannot be written.' );
                    ddata.status = 'cannot write user data';
                    //response = new cmd.Response ( cmd.fe_retcode.writeError,
                    //                              'User file cannot be written.','' );
                  }
                } else  {
                  log.error ( 135,'User file: ' + uiFilePath + ' cannot be read.' );
                  ddata.status = 'cannot read user data';
                  //response = new cmd.Response ( cmd.fe_retcode.readError,
                  //                              'User file cannot be read.','' );
                }
              }
            }
          }

      } else  {
        ddata.status = 'request from non-admin account';
        log.error ( 131,'Attempt to manage dormancy from a non-admin login -- stop.' );
      }

    } else  {
      ddata.status = 'cannot read admin account data';
      log.error ( 132,'User file: ' + userFilePath + ' cannot be read -- ' +
                      'cannot verify identity for dormancy management.' );
    }

  } else  {
    ddata.status = 'cannot find admin account data';
    log.error ( 133,'User file: ' + userFilePath + ' does not exist -- ' +
                    'cannot verify identity for dormancy management.' );
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',ddata );

}


// ===========================================================================

function getInfo ( inData,callback_func )  {
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  if (fe_server)  {

    var rData = {};
    rData.localuser       = null;
    rData.logintoken      = null;
    rData.helpTopics      = [];
    rData.exclude_tasks   = conf.getExcludedTasks();
    rData.licensed_tasks  = fe_server.licensed_tasks;
    rData.cloud_storage   = false;
    rData.demo_projects   = fe_server.getDemoProjectsMount();
    rData.auth_software   = fe_server.auth_software;
    rData.strict_dormancy = fe_server.dormancy_control.strict;
    rData.treat_private   = fe_server.treat_private;
    if ('localuser' in fe_server)  {
      rData.localuser  = fe_server.localuser;
      rData.logintoken = __userLoginHash.getToken ( ud.__local_user_id );
      var loginData    = __userLoginHash.getLoginEntry ( rData.logintoken );
      if (loginData.login)  {
        var userFilePath = getUserDataFName ( loginData );
        if (utils.fileExists(userFilePath))  {
          var uData = utils.readObject ( userFilePath );
          if (uData)
            rData.helpTopics = uData.helpTopics;
        }
      } else  {
        rData.helpTopics = [];
      }
      rData.cloud_storage = (fcl.getUserCloudMounts(loginData).length>0);
    }
    rData.localSetup = conf.isLocalSetup();
    rData.isArchive  = conf.isArchive   ();
    rData.regMode    = conf.getRegMode  ();
    if (fe_server.hasOwnProperty('description'))
          rData.setup_desc = fe_server.description;
    else  rData.setup_desc = null;
    rData.check_session_period = fe_server.sessionCheckPeriod;  // ms
    rData.ccp4_version    = conf.CCP4Version();
    rData.maintainerEmail = conf.getEmailerConfig().maintainerEmail;
    rData.jscofe_version  = cmd.appVersion();

    var client_conf = conf.getClientNCConfig();
    if (client_conf) rData.local_service = client_conf.externalURL;
                else rData.local_service = null;

    response = new cmd.Response ( cmd.fe_retcode.ok,'',rData );

  } else  {

    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );

  }

  callback_func ( response );

}


// ===========================================================================

function authResponse ( server_request,server_response )  {
// process response from authorisation server
// /?token=WyIxLjIuMy40Iiw1MTM1XQ%3A1i4BlU%3AEyXX0QzMoWCGZqNwPZ5QabHToO8&code=ok&reqid=authorisation-arpwarp-340cef239bd34b777f3ece094ffb1ec5

  var params = {
    'token' : '',
    'code'  : '',
    'reqid' : ''
  };

  var pstr  = server_request.url;
  var plist = [];
  if (pstr.length>0)  {
    if (pstr.startsWith('/?'))     pstr = pstr.substr(2);
    else if (pstr.startsWith('?')) pstr = pstr.substr(1);
    plist = pstr.split('&');
    for (var i=0;i<plist.length;i++)  {
      var pair = plist[i].split('=');
      params[pair[0]] = pair[1];
    }
  }

  var auth_result  = 'ok';
  var software_key = '';

  if ((params.reqid=='') || (params.code==''))
    auth_result = 'bad_reply';
  else if (params.code=='declined')
    auth_result = 'denied';
  else if (params.code!='ok')
    auth_result = 'errors';
  else if (params.token=='')
    auth_result = 'denied';

  if (params.reqid) {
    var rlist = params.reqid.split('-');
    if (rlist.length>2)  {
      params.reqid  = [rlist[0],rlist.slice(1,rlist.length-1).join('-'),rlist[rlist.length-1]];
      software_key  = params.reqid[1];
      var loginData = __userLoginHash.getLoginEntry ( params.reqid[2] );
      if (loginData.login.length>0)  {
        var userFilePath = getUserDataFName ( loginData );
        var uData  = utils.readObject ( userFilePath );
        if (uData)  {
          ud.checkUserData ( uData );
          if (!uData.authorisation.hasOwnProperty(params.reqid[1]))
            uData.authorisation[params.reqid[1]] = {};
          if (auth_result=='ok')  {
            uData.authorisation[params.reqid[1]].token     = params.token;
            uData.authorisation[params.reqid[1]].auth_date = new Date().toUTCString();
          } else  {
            uData.authorisation[params.reqid[1]].token     = new Date().toUTCString();
            uData.authorisation[params.reqid[1]].auth_date = '';
          }
          utils.writeObject ( userFilePath,uData );
//          auth_result = 'ok';
        } else
          auth_result = 'no_user_data';
      } else
        auth_result = 'user_logout';
    } else
      auth_result = 'bad_reqid';
  }

  //  read page into msg
  var html = utils.readString ( path.join('bootstrap','authend.html') );
  if (html.length>0)  {
    var fe_server  = conf.getFEConfig();
    var setup_name = '';
    var setup_icon = '';
    if (fe_server.hasOwnProperty('description'))  {
      setup_name = fe_server.description.name;
      setup_icon = fe_server.description.icon;
    } else if (conf.isLocalSetup())  {
      setup_name = 'Home setup';
      setup_icon = 'images_png/setup_home.png';
    } else  {
      setup_name = 'Unnamed setup';
      setup_icon = 'images_png/setup_unknown.png';
    }
    html = html.replace('$setup_name'  ,setup_name  )
               .replace('$setup_icon'  ,setup_icon  )
               .replace('$software_key',software_key)
               .replace('$auth_result' ,auth_result );
  } else
    html = '<!DOCTYPE html>\n<html><body class="main-page">' +
           '<h2>Authorisation response template is missing</h2>' +
           '<h3>Please file a bug report</h3></body></html>';

  cmd.sendResponseMessage ( server_response,html,'text/html' );

}


// ==========================================================================
// export for use in node
module.exports.userLogin            = userLogin;
module.exports.checkSession         = checkSession;
module.exports.userLogout           = userLogout;
module.exports.makeNewUser          = makeNewUser;
module.exports.recoverUserLogin     = recoverUserLogin;
module.exports.readUserLoginHash    = readUserLoginHash;
module.exports.getLoginEntry         = getLoginEntry;
module.exports.signalUser           = signalUser;
module.exports.readUserData         = readUserData;
module.exports.getUserLoginData     = getUserLoginData;
module.exports.getUserRation        = getUserRation;
module.exports.readUsersData        = readUsersData;
module.exports.getUserData          = getUserData;
//module.exports.getUserDataFName     = getUserDataFName;
module.exports.saveHelpTopics       = saveHelpTopics;
module.exports.updateUserData       = updateUserData;
module.exports.updateUserData_admin = updateUserData_admin;
module.exports.topupUserRation      = topupUserRation;
module.exports.suspendUser          = suspendUser;
module.exports.deleteUser           = deleteUser;
module.exports.deleteUser_admin     = deleteUser_admin;
module.exports.retireUser_admin     = retireUser_admin;
module.exports.resetUser_admin      = resetUser_admin;
module.exports.sendAnnouncement     = sendAnnouncement;
module.exports.manageDormancy       = manageDormancy;
module.exports.getInfo              = getInfo;
module.exports.authResponse         = authResponse;
