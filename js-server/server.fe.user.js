
/*
 *  =================================================================
 *
 *    16.02.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
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
 *    function remoteCheckIn    ( userData,callback_func )
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
 *    function sendMailToAllUsers ( loginData,message )
 *    function makeAnnouncement ( loginData,params )
 *    function manageDormancy   ( loginData,params )
 *    function saveMyWorkflows  ( loginData,params )
 *    function getInfo          ( inData,callback_func )
 *    function authResponse     ( server_request,server_response )
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const os      = require('os');
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
const storage = require('./server.fe.storage');
// const adm     = require('./server.fe.admin');
const anl     = require('./server.fe.analytics');
const ud      = require('../js-common/common.data_user');
const cmd     = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(10);


// ===========================================================================

const __userDataExt       = '.user';
const __workflowsDataExt  = '.workflows';
const __userLoginHashFile = 'login.hash';
const __announcementFile  = 'announcement.html';

const day_ms              = 86400000;  // milliseconds in a day


// ===========================================================================

function hashPassword ( pwd )  {
  return crypto.createHash('md5').update(pwd).digest("hex");
}

function getUserDataFName ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + __userDataExt );
}

function getWorkflowsFName ( loginData )  {
  return path.join ( conf.getFEConfig().userDataPath,loginData.login + __workflowsDataExt );
}

function _make_new_user ( userData,callback_func )  {  // gets UserData object
  let response  = null;  // must become a cmd.Response object to return
  let fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password
  let pwd = '';
  if (userData.login=='devel')
    pwd = 'devel';  // default initial password at first start
  else if (userData.login=='admin')
    pwd = 'admin';  // default initial password at first start
  else if (('localuser' in fe_server) && (userData.login==ud.__local_user_id))
    pwd = ud.__local_user_id;
  else if (userData.pwd.length>0)
    pwd = userData.pwd;
  else
    pwd = crypto.randomBytes(3).toString('hex');

  log.standard ( 1,'making new user, login: ' + userData.login );
  log.standard ( 1,'    temporary password: ' + pwd );
  userData.pwd    = hashPassword ( pwd );
  userData.action = ud.userdata_action.chpwd;  // request to change password at login

  userData.helpTopics = [];

  if (userData.login=='devel')                  userData.role = ud.role_code.developer;
  else if (userData.login=='admin')             userData.role = ud.role_code.admin;
  else if (userData.login==ud.__local_user_id)  userData.role = ud.role_code.localuser;
                                          else  userData.role = ud.role_code.user;
  userData.knownSince = Date.now();
  userData.lastSeen   = Date.now();

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( userData );
  log.standard ( 2,'        user data path: ' + userFilePath );

  if (utils.fileExists(userFilePath))  {

    log.error ( 1,'new user login: ' + userData.login +
                  ' -- already exists, rejected' );
    response  = new cmd.Response ( cmd.fe_retcode.existingLogin,
                                   'Login name exists','');

  } else if (utils.writeObject(userFilePath,userData))  {

    log.standard ( 3,'new user login: ' + userData.login + ' -- created' );

    response = prj.makeNewUserProjectsDir ( userData );

    if (response.status==cmd.fe_retcode.ok)  {

      let msg = '';
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

    log.error ( 11,'file write error at user registration (' + userData.login +
                   ') ' + userFilePath );

    response = new cmd.Response ( cmd.fe_retcode.writeError,
                      'Cannot write user data',
                      emailer.send ( conf.getEmailerConfig().maintainerEmail,
                        'CCP4 Registration Write Fails',
                        'Detected write failure at new user registration (' +
                        userData.login + '), please investigate.'
                      )
    );

  }

  callback_func ( response );

}


function makeNewUser ( userData,callback_func )  {  // gets UserData object
  let vconf = conf.getFEConfig().projectsPath;  // volumes configuration
  let vdata = [];  // volumes actual data
  let index = {};  // links volumes in config file and in vdata

  for (let vname in vconf)  {
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
    let users = readUsersData().userList;

    for (let i=0;i<users.length;i++)  {
      if (users[i].dormant)
            vdata[index[users[i].volume]].committed += users[i].ration.storage_used;
      else  vdata[index[users[i].volume]].committed += users[i].ration.storage;
      vdata[index[users[i].volume]].used += users[i].ration.storage_used;
    }

    let volume      = null;
    let home_volume = false;
    let pfill0      = 1000.0;

    for (let i=0;(i<vdata.length) && (!home_volume);i++)  {
      let pfill = 1.0 - ((vdata[i].free-vconf[vdata[i].name].diskReserve) -
                         (vdata[i].committed-vdata[i].used)) /
                        (vdata[i].size-vconf[vdata[i].name].diskReserve);
      if (pfill<pfill0)  {
        pfill0 = pfill;
        volume = vdata[i];
      }
      if (vconf[vdata[i].name].type=='home')  {
        let hpath = path.join ( vconf[vdata[i].name].path,userData.login );
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

      let msg = 'not enough disk space to create new user';
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

      log.standard ( 4,msg );
      log.error    ( 4,msg );

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
  let response  = null;  // must become a cmd.Response object to return
  let fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password

  log.standard ( 5,'recover user login for ' + userData.email + ' at ' +
                   fe_server.userDataPath );

  let files = fs.readdirSync ( fe_server.userDataPath );

  let userName = '???';
  let logins   = [];
  let pwds     = [];
  let n = 0;
  for (let i=0;i<files.length;i++)
    if (files[i].endsWith(__userDataExt))  {
      let userFilePath = path.join ( fe_server.userDataPath,files[i] );
      let uData = utils.readObject ( userFilePath );
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

      let msg = 'The following account(s) have been identified as ' +
                'registered with your e-mail address, and their passwords ' +
                'are now reset as below:<p>';
      for (let i=0;i<logins.length;i++)
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
      login    : 'devel',
      volume   : '*storage*',
      signal   : '',
      lastSeen : Date.now()
    }
  };
  this.umap = {
    'devel' : '340cef239bd34b777f3ece094ffb1ec5'
  }
}

UserLoginHash.prototype.map_users = function()  {
  this.umap = {};
  for (let token in this.loggedUsers)
    this.umap[this.loggedUsers[token].login] = token;
}

UserLoginHash.prototype.save = function()  {
  let userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
  if (!utils.writeObject(userHashPath,this))
    return emailer.send ( conf.getEmailerConfig().maintainerEmail,
                          'CCP4 Login Hash Write Fails',
                          'Detected file read failure at user login hash write, ' +
                          'please investigate.' );
  // callback not implemented
  // utils.writeObject ( userHashPath,this,false,function(err){
  //   if (err)
  //     emailer.send ( conf.getEmailerConfig().maintainerEmail,
  //                    'CCP4 Login Hash Write Fails',
  //                    'Detected file read failure at user login hash write, ' +
  //                    'please investigate.' );
  // });
  // this.cached = true;
  return '';
}

UserLoginHash.prototype.read = function()  {

  // if (this.cached)
  //   return true;

  let userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
  let hash = utils.readObject ( userHashPath);
  if (hash)  {
    if (!hash.hasOwnProperty('_type'))  {
      // transformation for backward compatibility, probably redundant
      let loggedUsers = {};
      for (let token in hash)  {
        loggedUsers[token] = {
          login    : hash[token],
          volume   : '***',
          signal   : '',
          lastSeen : Date.now()
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
    this.map_users();
    return true;
  }

  return false;

}

// UserLoginHash.prototype.read = function()  {
//   let userHashPath = path.join ( conf.getFEConfig().userDataPath,__userLoginHashFile );
//   let hash = utils.readObject ( userHashPath);
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

  let loggedUsers = {};

  for (let key in this.loggedUsers)
    if (this.loggedUsers[key].login!=login_data.login)
      loggedUsers[key] = this.loggedUsers[key];

  loggedUsers[token]          = JSON.parse ( JSON.stringify(login_data) );
  loggedUsers[token].lastSeen = Date.now();
  this.umap[login_data.login] = token;

  this.loggedUsers = loggedUsers;

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
  
  let loggedUsers = {};
  
  for (let key in this.loggedUsers)
    if (this.loggedUsers[key].login!=login_name)
      loggedUsers[key] = this.loggedUsers[key];

  delete this.umap[login_name];

  this.loggedUsers = loggedUsers;

  this.save();

}

UserLoginHash.prototype.getLoginEntry = function ( token )  {
  if (token in this.loggedUsers)
    return this.loggedUsers[token];
  return { 'login' : '', 'volume' : '' };
}

UserLoginHash.prototype.getToken = function ( login_name )  {
  // let token = null;
  // for (let key in this.loggedUsers)
  //   if (this.loggedUsers[key].login==login_name)  {
  //     token = key;
  //     break;
  //   }
  // return token;
  if (login_name in this.umap)
    return this.umap[login_name];
  return null;
}

UserLoginHash.prototype.putSignal = function ( login_name,signal )  {
  // for (let key in this.loggedUsers)
  //   if (this.loggedUsers[key].login==login_name)  {
  //     this.loggedUsers[key].signal = signal;
  //     break;
  //   }
  if (login_name in this.umap)
    this.loggedUsers[this.umap[login_name]].signal = signal;
}

UserLoginHash.prototype.logPresence = function ( token )  {
  if (token in this.loggedUsers)
    this.loggedUsers[token].lastSeen = Date.now();
}

const __day_ms = 86400000;  // 24 hours login expire

UserLoginHash.prototype.loginExpire = function()  {
  // let loggedUsers = {};
  // let t = Date.now();
  // let activity = anl.getFEAnalytics().activity;
  // for (let key in this.loggedUsers)  {
  //   let ulogin = this.loggedUsers[key].login;
  //   console.log ( ' >>>> ' + ulogin + '  ' + activity[ulogin].lastSeen + ' ' + t );
  //   if ((['devel',ud.__local_user_id].indexOf(ulogin)>=0) ||
  //       ((ulogin in activity) && ((t-activity[ulogin].lastSeen)<__day_ms)))
  //     loggedUsers[key] = this.loggedUsers[key];
  // }
  // this.loggedUsers = loggedUsers;
  let t = Date.now();
  let tokens = Object.keys(this.loggedUsers);
  for (let i=0;i<tokens.length;i++)  {
    let token  = tokens[i]
    let ulogin = this.loggedUsers[token].login;
    // console.log ( ' >>>> ' + ulogin + '  ' + activity[ulogin].lastSeen + ' ' + t );
    if ((['devel',ud.__local_user_id].indexOf(ulogin)<0) &&
        ((!('lastSeen' in this.loggedUsers[token])) || 
         ((t-this.loggedUsers[token].lastSeen)>__day_ms)))  {
      delete this.loggedUsers[token];
      delete this.umap[ulogin];
    }
  }
  this.save();
}


var __userLoginHash = new UserLoginHash();

/*
let __userLoginHash = {
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
  let fe_server  = conf.getFEConfig();
  let updateHash = false;

  __userLoginHash = new UserLoginHash();

  if (!__userLoginHash.read())  {
    if (!('localuser' in fe_server))  {
      // make first user(s) in server (not local) setup
      let userData = new ud.UserData();
      if (('make_devel' in fe_server) && 
          (fe_server.make_devel.toUpperCase()=='YES'))  {
        userData.name    = 'Developer';
        userData.email   = conf.getEmailerConfig().maintainerEmail;
        userData.login   = 'devel';
        userData.pwd     = 'devel';
        userData.licence = 'academic';
        // userData.role    = ud.role_code.user;
        userData.role    = ud.role_code.developer;
        makeNewUser ( userData,function(response){} );
        userData = new ud.UserData();
      }
      userData.name    = 'Admin';
      userData.email   = conf.getEmailerConfig().maintainerEmail;
      userData.login   = 'admin';
      userData.pwd     = 'admin';
      userData.licence = 'academic';
      userData.role    = ud.role_code.admin;
      makeNewUser ( userData,function(response){} );
    }
    updateHash = true;
  }

  if (('localuser' in fe_server) &&
      (!__userLoginHash.getToken(ud.__local_user_id)))  {
    let userData = new ud.UserData();
    userData.name    = fe_server.localuser;
    // userData.email   = conf.getEmailerConfig().maintainerEmail;
    userData.email   = 'localuser@localhost';
    userData.login   = ud.__local_user_id;
    userData.pwd     = ud.__local_user_id;
    userData.licence = 'academic';
    userData.role    = ud.role_code.localuser;
    makeNewUser ( userData,function(response){} );
    __userLoginHash.addUser ( 'e58e28a556d2b4884cb16ba8a37775f0',{
                                'login'  : ud.__local_user_id,
                                'volume' : '*storage*'
                            });
    updateHash = true;
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
  let response  = null;  // must become a cmd.Response object to return
  let fe_server = conf.getFEConfig();

  __userLoginHash.loginExpire();

  // Get user data object and generate a temporary password
//  let userData = JSON.parse ( user_data_json );
  let pwd = hashPassword ( userData.pwd );
  if (userData.login=='**' + ud.__local_user_id + '**')  {
    userData.login = ud.__local_user_id;
    userData.pwd   = 'e58e28a556d2b4884cb16ba8a37775f0';
    pwd = userData.pwd;
  }
  let ulogin = userData.login;
  log.standard ( 6,'user login ' + ulogin );

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( userData );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.login.startsWith(__suspend_prefix))  {
        // for example, user's data is being moved to different disk

        response  = new cmd.Response ( cmd.fe_retcode.suspendedLogin,'','' );

      } else if ((uData.login==ulogin) && (uData.pwd==pwd))  {

        let rData = { // return data object
          onlogin_message : uData.onlogin_message
        };

        uData.onlogin_message = '';  // clear up

        uData.lastSeen = Date.now();
        utils.writeObject ( userFilePath,uData );

        anl.getFEAnalytics().userLogin ( uData );
        // let rep = anl.getFEAnalytics().getReport();
        // console.log ( rep );

        let token = '';
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
        rData.cloud_storage   = (storage.getUserCloudMounts(uData).length>0);
        rData.strict_dormancy = fe_server.dormancy_control.strict;
        rData.treat_private   = fe_server.treat_private;
        rData.jobs_safe       = (fe_server.getJobsSafePath().length>0);
        rData.has_datalink    = fe_server.hasDataLink();
        rData.demo_projects   = fe_server.getDemoProjectsMount();
        rData.auth_software   = fe_server.auth_software;
        if (fe_server.hasOwnProperty('description'))
              rData.setup_desc = fe_server.description;
        else  rData.setup_desc = null;

        rData.my_workflows = utils.readObject ( getWorkflowsFName(userData) );
        if (!rData.my_workflows)
          rData.my_workflows = [];

        // adm.getNCData ( [],function(ncInfo){
        //   rData.environ_server = [];
        //   for (let i=0;i<ncInfo.length;i++)
        //     if (ncInfo[i] && ('environ' in ncInfo[i]))  {
        //       for (let j=0;j<ncInfo[i].environ.length;j++)
        //         if (rData.environ_server.indexOf(ncInfo[i].environ[j])<0)
        //           rData.environ_server.push ( ncInfo[i].environ[j] );
        //     }
        //   callback_func ( new cmd.Response ( cmd.fe_retcode.ok,token,rData ) );
        // });

        conf.getServerEnvironment ( function(environ_server){
          rData.environ_server = environ_server;
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


// ===========================================================================
// Remote job framework

function remoteCheckIn ( userData,callback_func )  {
// This function is called by external request, once at Cloud Local login.
// It returns FE data necessary for running remote jobs, into Cloud Local's 
// session.
// Expected userData = { login: login, cloudrun_id: cloudrun_id } 
  let response     = null;  // must become a cmd.Response object to return
  let fe_server    = conf.getFEConfig();
  let userFilePath = getUserDataFName ( userData );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );

    let ulogin      = userData.login;
    let cloudrun_id = userData.cloudrun_id;

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.login.startsWith(__suspend_prefix))  {
        // for example, user's data is being moved to different disk
        // don't confirm

        response  = new cmd.Response ( cmd.fe_retcode.suspendedLogin,'','' );

      } else if ((uData.login==ulogin) && (uData.cloudrun_id==cloudrun_id))  {

        let rData = {}; // return data object

        // record that user was there
        uData.lastSeen = Date.now();

        // do not log user login event though
        // anl.getFEAnalytics().userLogin ( uData );

        if (uData.dormant && (!fe_server.dormancy_control.strict))  {
          // A non-strict dormancy only limits user disk space and is removed 
          // automatically when user logins. Therefore, remove dormancy here.
          uData.dormant = 0;
        }

        if (!utils.writeObject(userFilePath,uData))
          log.error ( 44,'cannot write user data at ' + userFilePath );

        if (fe_server.hasOwnProperty('description'))
              rData.setup_desc = fe_server.description;
        else  rData.setup_desc = null;

        conf.getServerEnvironment ( function(environ_server){
          rData.environ_server = environ_server;
          callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rData ) );
        });  

      } else  {
        log.error ( 41,'Login name/cloudrun_id mismatch:' );
        log.error ( 41,' ' + ulogin + ':' + cloudrun_id );
        log.error ( 41,' ' + uData.login + ':' + uData.cloudrun_id );
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

// ===========================================================================


function checkSession ( userData,callback_func )  {  // gets UserData object
  let retcode   = cmd.fe_retcode.wrongSession;
  let uLogEntry = __userLoginHash.getLoginEntry ( userData.login_token );
  let signal    = '';
  __userLoginHash.logPresence ( userData.login_token );
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
  let uData = null;
  let userFilePath = getUserDataFName ( loginData );
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
  let uLoginData = { login:login, volume:null };
  let uData      = readUserData ( uLoginData );
  if (uData)  uLoginData.volume = uData.volume;
        else  uLoginData = null;
  return uLoginData;
}

function readUsersData()  {
  let usersData = {};
  let fe_config = conf.getFEConfig();
  let udir_path = fe_config.userDataPath;

  usersData.loginHash = __userLoginHash;
  usersData.userList  = [];

  if (utils.fileExists(udir_path))  {

    let crTime   = Date.now()
    let after_ms = 0;
    if ((!fe_config.dormancy_control.strict) && fe_config.dormancy_control.after)
      after_ms = crTime - day_ms*fe_config.dormancy_control.after;

    // reading directory with 5K users takes ~8ms on NFS
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
  let response = null;  // must become a cmd.Response object to return

  //log.debug ( 5,'user get data ' + login );

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {
    let uData = utils.readObject ( userFilePath );
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
  let uRation = ration.getUserRation ( loginData );
  let rData   = { code : 'ok', message : '', ration : uRation };

  // console.log ( ' >>>> storage      = ' + uRation.storage );
  // console.log ( ' >>>> storage_used = ' + uRation.storage_used );

  if (!uRation)  {
  
    rData.code    = 'errors';
    rData.message = 'user ration file not found';
    log.error ( 80,'User ration file not found, login ' + loginData.login );
  
  } else if ((uRation.storage>0) && (uRation.storage_max>0) &&
             (uRation.storage_used>=uRation.storage))  {
  
    let uData = null;
    let userFilePath = getUserDataFName ( loginData );
  
    if (utils.fileExists(userFilePath))
      uData = utils.readObject ( userFilePath );
  
    if (!uData)  {
  
      rData.code    = 'errors';
      rData.message = 'user data file not found';
      log.error ( 81,'User data file not found, login ' + loginData.login );
  
    } else  {
  
      let feconf = conf.getFEConfig();
      // find new storage and topup requirement
      let storage1 = uRation.storage;  // current allocation
  
      if (uRation.storage_max>0)  {
        while ((storage1<uRation.storage_used) && (storage1<uRation.storage_max))
          storage1 += feconf.ration.storage_step;
        storage1 = Math.min(storage1,uRation.storage_max);
      } else  {
        while (storage1<uRation.storage_used)
          storage1 += feconf.ration.storage_step;
      }

      // console.log ( ' >>>> storage1     = ' + storage1 );

      if (storage1>uRation.storage_used)  {  // otherwise limited by uRation.storage_max
        let vconf  = feconf.projectsPath[uData.volume];  // volumes configuration
        let fspath = path.resolve ( vconf.path );
        rData.code = 'requesting';
        checkDiskSpace(fspath).then((diskSpace) => {
            let free = diskSpace.free/(1024.0*1024.0) - vconf.diskReserve;
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
  let userLoginData = loginData;
  let login_id      = loginData.login;
  if ('user' in data)
    login_id = data.user;
  if (login_id!=loginData.login)
    userLoginData = getUserLoginData ( login_id );
  if (data.topup && (login_id!=ud.__local_user_id))  {
    topupUserRation ( userLoginData,callback_func );
  } else  {
    callback_func ( new cmd.Response(cmd.fe_retcode.ok,'',{
        code    : 'ok',
        message : '',
        ration  : ration.getUserRation ( userLoginData )
      })
    );
  }
}


// ===========================================================================

function saveHelpTopics ( loginData,userData )  {
  let response = null;  // must become a cmd.Response object to return

  log.standard ( 7,'user save help topics ' + loginData.login );

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {
    let uData = utils.readObject ( userFilePath );
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

  log.standard ( 8,'user logout ' + loginData.login );

  if (['devel',ud.__local_user_id].indexOf(loginData.login)<0)
    __userLoginHash.removeUser ( loginData.login );

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


// ===========================================================================

function updateUserData ( loginData,userData )  {
  let response = null;  // must become a cmd.Response object to return
  let notify   = false;

  let uData = userData;
  let pwd   = userData.pwd;
  if ((userData.login!=ud.__local_user_id) && pwd)  {
  // if (userData.login!='devel')  {
    uData.pwd = hashPassword ( pwd );
    notify    = true;
    log.standard ( 9,'update user data, login ' + loginData.login );
  } else  {
    // can only change some records without password 
    uData = readUserData ( loginData );
    if (uData)  {
      ud.checkUserData ( uData );
      if (userData.login==ud.__local_user_id)  {
        uData.remote_login       = userData.remote_login;
        uData.remote_cloudrun_id = userData.remote_cloudrun_id;
        // uData.remote_tasks       = userData.remote_tasks;
      }
      if ('helpTopics' in userData)
        uData.helpTopics = userData.helpTopics;
      if ('authorisation' in userData)  
        uData.authorisation = userData.authorisation;
      if ('settings' in userData)
        uData.settings = userData.settings;
      if ('remote_tasks' in userData)
        uData.remote_tasks = userData.remote_tasks;
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    'User file cannot be read.','' );
    }
  }

  let userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    if (utils.writeObject(userFilePath,uData))  {

      let msg = '';
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
  let response     = null;  // must become a cmd.Response object to return
  let userFilePath = getUserDataFName ( loginData );

  log.standard ( 10,'update ' + userData.login +
                    '\' account settings by admin, login: ' + loginData.login );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        userFilePath = getUserDataFName ( userData );
        uData        = utils .readObject  ( userFilePath );
        let uRation  = ration.getUserRation ( userData );

        if (uData && uRation)  {

          let storage      = Number(userData.ration.storage);
          let storage_max  = Number(userData.ration.storage_max);
          let cpu_day      = Number(userData.ration.cpu_day);
          let cpu_month    = Number(userData.ration.cpu_month);
          let cloudrun_day = Number(userData.ration.cloudrun_day);
          let archive_year = Number(userData.ration.archive_year);

          let feedback  = '';
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
            let old_path = prj.getUserProjectsDirPath ( uData );
            let new_path = prj.getUserProjectsDirPath ( userData );

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
                utils.removePathAsync ( old_path );
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
  let response = null;  // must become a cmd.Response object to return

  log.standard ( 11,'delete user, login ' + loginData.login );

  let pwd = userData.pwd;
  userData.pwd = hashPassword ( pwd );

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (userData.pwd==uData.pwd)  {

        let rationFilePath = ration.getUserRationFPath ( loginData );
        if (!utils.removeFile(rationFilePath))
          log.error ( 101,'User ration file: ' + rationFilePath + ' cannot be removed.' );

        let userProjectsDir = prj.getUserProjectsDirPath ( loginData );
        if (!utils.removePathAsync(userProjectsDir))
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
  let response     = null;  // must become a cmd.Response object to return
  let userFilePath = getUserDataFName ( loginData );

  log.standard ( 12,'delete user ' + userData.login +
                    ' by admin, login ' + loginData.login );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );

    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        userFilePath = getUserDataFName ( userData );

        if (utils.fileExists(userFilePath))  {

          let rationFilePath = ration.getUserRationFPath ( userData );
          if (!utils.removeFile(rationFilePath))
            log.error ( 111,'User ration file: ' + rationFilePath + ' cannot be removed.' );

          let userProjectsDir = prj.getUserProjectsDirPath ( userData );
          if (!utils.removePathAsync(userProjectsDir))
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
  let uData = readUserData ( loginData );
  if (uData)  {
    let ulogin = uData.login;
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
  let admData    = readUserData ( loginData );
  let userData   = meta.userData;
  let uData      = readUserData ( userData );
  let sLoginData = getUserLoginData ( meta.successor );

  log.standard ( 13,'retire user ' + userData.login +
                    ' by admin, login ' + loginData.login );

  // sanity checks

  if (userData.login==meta.successor)  {
    let msg = 'User and successor cannot be the same (' + userData.login + ').';
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
    let msg = 'User data cannot be read, login=' + userData.login;
    log.error ( 20,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }

  if (!sLoginData)  {
    let msg = 'Successor data file cannot be found (' + sLoginData.login +')';
    log.error ( 21,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }
  let sData = readUserData ( sLoginData );
  if (!sData)  {
    let msg = 'Successor data file cannot be read (' + sLoginData.login +')';
    log.error ( 22,msg );
    return new cmd.Response ( cmd.fe_retcode.readError,msg,'' );
  }

  // check that there are no duplicate project ids

  let userPrjList = prj.readProjectList ( userData   );
  let succPrjList = prj.readProjectList ( sLoginData );
  let duplPrjIDs  = [];

  for (let i=0;i<userPrjList.projects.length;i++)  {
    let userPrjDesc = userPrjList.projects[i];
    let projectNo   = succPrjList.getProjectNo ( userPrjDesc.name );
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

    let uDataFile = getUserDataFName ( uData );
    let sDataFile = getUserDataFName ( sData );

    let ulogin = uData.login;
    __userLoginHash.removeUser ( ulogin );     // logout
    uData.login = __suspend_prefix + uData.login;   // suspend
    utils.writeObject ( uDataFile,uData );  // commit
    uData.login = ulogin;

    let slogin = sData.login;
    __userLoginHash.removeUser ( slogin );     // logout
    sData.login = __suspend_prefix + sData.login;   // suspend
    utils.writeObject ( sDataFile,sData );  // commit
    sData.login = slogin;

    // loop and move
    // let folder_name = ulogin + '\'s projects';
    let failed_move = [];
    let were_shared = [];
    for (let i=0;i<userPrjList.projects.length;i++)  {
      let pName = userPrjList.projects[i].name;
      let uProjectDir = prj.getProjectDirPath ( uData,pName );
      if (!utils.isSymbolicLink(uProjectDir))  {
        let sProjectDir = prj.getProjectDirPath ( sData,pName );
        if (utils.moveDir(uProjectDir,sProjectDir,false))  {
          let pData = prj.readProjectData ( sData,pName );
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

    let uRation = ration.getUserRation ( uData );
    let sRation = ration.getUserRation ( sData );

    sRation.storage      += uRation.storage;
    sRation.storage_used += uRation.storage_used;
    uRation.storage       = 0.1;  // block user by outquoting
    sRation.storage_used  = 1.0;

    ration.saveUserRation ( sData,sRation );
    ration.saveUserRation ( uData,uRation );

    utils.writeObject ( uDataFile,uData );  // commit
    utils.writeObject ( sDataFile,sData );  // commit

    let msg = '';
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
  let response     = null;  // must become a cmd.Response object to return
  let fe_server    = conf.getFEConfig();
  let userFilePath = getUserDataFName ( loginData );

  log.standard ( 16,'reset pasword for user ' + userData.login +
                    ' by admin, login ' + loginData.login );

  if (utils.fileExists(userFilePath))  {
    let uaData = utils.readObject ( userFilePath );
    if (uaData)  {
      ud.checkUserData ( uaData );
      if (uaData.role==ud.role_code.admin)  {
        // admin privileges confirmed

        userFilePath = getUserDataFName ( userData );
        let uData = utils.readObject ( userFilePath );
        if (uData)  {
          // reset password
          let pwd = '';
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
            log.standard ( 17,'Password for user ' + userData.login +
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

function _send_mail_to_all_users ( subject,message,user_list,count )  {
  if (count<user_list.length)  {

    //if (user_list[count].email!='ccp4_cloud@listserv.stfc.ac.uk')  {
    //  setTimeout ( function(){
    //    _send_mail_to_all_users ( subject,message,user_list,count+1 );
    //  },1);
    //  return;
    //}

    emailer.send ( user_list[count].email,subject,
                   message.replace('&lt;User Name&gt;',user_list[count].name) );
    log.standard ( 18,'Message sent to ' + user_list[count].name + ' at ' +
                     user_list[count].email );
    if (count<user_list.length-1)
      setTimeout ( function(){
        _send_mail_to_all_users ( subject,message,user_list,count+1 );
      },2000);
  }
}

function sendMailToAllUsers ( loginData,message )  {

  // Check that we're having a new login name
  let userFilePath = getUserDataFName ( loginData );

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );
    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        let usersData = readUsersData();
        let users     = usersData.userList;
        //for (let i=0;i<users.length;i++)  {
        //  emailer.send ( users[i].email,cmd.appName() + ' Announcement',
        //                 message.replace( '&lt;User Name&gt;',users[i].name ) );
        //  log.standard ( 12,'Announcement sent to ' + users[i].name + ' at ' +
        //                   users[i].email );
        //}
        _send_mail_to_all_users ( cmd.appName() + ' Announcement',message,users,0 );

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

function makeAnnouncement ( loginData,params )  {
  let rdata     = {};
  let fe_server = conf.getFEConfig();
  let afpath    = path.join ( fe_server.storage,__announcementFile );

  switch (params.action)  {

    default     :
    case 'read' : rdata.text = utils.readString ( afpath );
                  if (!rdata.text)
                    rdata.text = '<h2>Maintenance Notice</h2>\n\n' +
                                 'Please note that CCP4 Cloud will be unavailable between\n\n' +
                                 '<p><b>31 Mar 2023 17:00 UK time and ' +
                                 '03 Apr 2023 10:00 UK time</b>\n\n' +
                                 '<p>due to maintenance works on site.\n\n' +
                                 '<p>Apologies for any inconvenience.\n';
                  else if (rdata.text.startsWith('!#'))
                    rdata.text = rdata.text.split('\n').slice(2).join('\n');
                  break;

    case 'on'   : utils.writeString ( afpath,
                    '!#on  <-  change this for !#off in order to remove the announcement\n\n' +
                    params.text
                  );
                  break;

    case 'off'   : utils.writeString ( afpath,
                    '!#off  <-  change this for !#on in order to release the announcement\n\n' +
                    params.text
                  );

  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

}

// ===========================================================================

function manageDormancy ( loginData,params )  {
  let userFilePath = getUserDataFName ( loginData );
  let ddata = { 'status' : 'ok' };

  // Check that we're having a new login name

  if (utils.fileExists(userFilePath))  {

    let uData = utils.readObject ( userFilePath );
    if (uData)  {

      ud.checkUserData ( uData );

      if (uData.role==ud.role_code.admin)  {

        let usersData = readUsersData();
        let users     = usersData.userList;

        ddata.total_users   = users.length;
        ddata.dormant_users = 0;
        ddata.disk_released = 0;  // in case of dormancy
        ddata.deleted_users = 0;
        ddata.disk_freed    = 0;  // in case of deletion
        ddata.check_date    = Date.now();

        for (let key in params)
          ddata[key] = params[key];

        let timer_delay = 0; // ms
        let tnorm = 1000 * 60 * 60 * 24;
        for (let i=0;i<users.length;i++)
          if (users[i].dormant)  {
            // THIS IS NOT FINISHED !!!!!
            let ndays = (ddata.check_date-users[i].dormant) / tnorm;
            if (ndays>ddata.period3)  {
              ddata.deleted_users++;
              ddata.disk_freed += users[i].ration.storage_used;
              if (!ddata.checkOnly)  {
                log.standard ( 19,'dormant user ' + users[i].login + ' deleted' );
              }
            }
          } else  {
            let ndays = (ddata.check_date-users[i].lastSeen) / tnorm;
//ndays = 10000;
            if ((ndays>ddata.period1) ||
                ((users[i].ration.jobs_total<=ddata.njobs) && (ndays>ddata.period2)))  {
              ddata.dormant_users++;
              ddata.disk_released += users[i].ration.storage - users[i].ration.storage_used;
              if (!ddata.checkOnly)  {
                let uiFilePath = getUserDataFName ( users[i] );
                let uiData     = utils.readObject ( uiFilePath );
                if (uiData)  {
                  ud.checkUserData ( uiData );
                  uiData.dormant = ddata.check_date;
//uiData.dormant = 0;
                  if (utils.writeObject(uiFilePath,uiData))  {
                    let reason_msg = '';
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
                    log.standard ( 20,'user ' + users[i].login + ' made dormant (' +
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

function saveMyWorkflows ( loginData,params )  {
  let workflowsFPath = getWorkflowsFName ( loginData );
  utils.writeObject ( workflowsFPath,params );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}

// ===========================================================================

function getInfo ( meta,callback_func )  {
  let fe_server = conf.getFEConfig();

  if (fe_server)  {

    let rData = {};
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
      let loginData    = __userLoginHash.getLoginEntry ( rData.logintoken );
      if (loginData.login)  {
        let userFilePath = getUserDataFName ( loginData );
        if (utils.fileExists(userFilePath))  {
          let uData = utils.readObject ( userFilePath );
          if (uData)
            rData.helpTopics = uData.helpTopics;
        }
      } else  {
        rData.helpTopics = [];
      }
      rData.cloud_storage = (storage.getUserCloudMounts(loginData).length>0);
    }
    rData.localSetup = conf.isLocalSetup();
    rData.titlePage  = true;
    let desktop      = conf.getDesktopConfig()
    if (desktop && ('titlePage' in desktop))
      rData.titlePage = desktop.titlePage;
    rData.isArchive  = conf.isArchive   ();
    rData.regMode    = conf.getRegMode  ();
    if (fe_server.hasOwnProperty('description'))
          rData.setup_desc = fe_server.description;
    else  rData.setup_desc = null;
    rData.check_session_period = fe_server.sessionCheckPeriod;  // ms
    rData.ccp4_version    = conf.CCP4Version();
    rData.maintainerEmail = conf.getEmailerConfig().maintainerEmail;
    rData.jscofe_version  = cmd.appVersion();

    let client_conf = conf.getClientNCConfig();
    if (client_conf) rData.local_service = client_conf.externalURL;
                else rData.local_service = null;

    rData.remoteJobServer = { 
      url    : conf.getRemoteJobsServerURL(), 
      status : 'nourl' 
    };
    if (rData.remoteJobServer.url)  {
      conf.checkRemoteJobsServerURL ( rData.remoteJobServer.url,function(text){
        rData.remoteJobServer.status = text;
        if (text=='FE')
          log.standard ( 21,'remote server responded on ' + rData.remoteJobServer.url );
        else
          log.standard ( 21,'remote server not responded on ' + rData.remoteJobServer.url );
        callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rData ) );
      });
    } else  {
      callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rData ) );
    }

  } else  {

    callback_func ( new cmd.Response ( cmd.fe_retcode.unconfigured,'','' ) );

  }

}


// ===========================================================================

function getLocalInfo ( inData,callback_func )  {
  let response  = null;  // must become a cmd.Response object to return
  let fe_server = conf.getFEConfig();

  if (fe_server)  {

    let rData = { code : 'ok' };
    if ('localuser' in fe_server)  {

      let uLoginData = { login : ud.__local_user_id, volume : null };
      rData.userData = readUserData ( uLoginData );

      rData.project_paths = [];
      let disk_reserved   = [];
      for (let fsname in fe_server.projectsPath)  {
        rData.project_paths.push ( path.resolve(
                                     fe_server.projectsPath[fsname].path) );
        disk_reserved.push ( fe_server.projectsPath[fsname].diskReserve );
      }

      rData.cpus = os.cpus();

      rData.disk_free = 0.0;

      function _calc_disk_free ( n )  {
        if (n<rData.project_paths.length)  {
          let fspath = path.resolve ( rData.project_paths[n] );
          checkDiskSpace(fspath).then ( (diskSpace) => {
              let dfree = diskSpace.free/(1024.0*1024.0);  // MBytes
              rData.disk_free += dfree - disk_reserved[n];
              _calc_disk_free ( n+1 );
            }
          );
        } else  {
          callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',rData ) );
        }
      }

      _calc_disk_free ( 0 );

    } else  {
      rData.code = 'no_local_user';
      response   = new cmd.Response ( cmd.fe_retcode.ok,'',rData );
    }

  } else  {

    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );

  }

  if (response)
    setTimeout ( function(){ callback_func ( response ); },0);

}


// ===========================================================================

function authResponse ( server_request,server_response )  {
// process response from authorisation server
// /?token=WyIxLjIuMy40Iiw1MTM1XQ%3A1i4BlU%3AEyXX0QzMoWCGZqNwPZ5QabHToO8&code=ok&reqid=authorisation-arpwarp-340cef239bd34b777f3ece094ffb1ec5

  let params = {
    'token' : '',
    'code'  : '',
    'reqid' : ''
  };

  let pstr  = server_request.url;
  let plist = [];
  if (pstr.length>0)  {
    if (pstr.startsWith('/?'))     pstr = pstr.substr(2);
    else if (pstr.startsWith('?')) pstr = pstr.substr(1);
    plist = pstr.split('&');
    for (let i=0;i<plist.length;i++)  {
      let pair = plist[i].split('=');
      params[pair[0]] = pair[1];
    }
  }

  let auth_result  = 'ok';
  let software_key = '';

  if ((params.reqid=='') || (params.code==''))
    auth_result = 'bad_reply';
  else if (params.code=='declined')
    auth_result = 'denied';
  else if (params.code!='ok')
    auth_result = 'errors';
  else if (params.token=='')
    auth_result = 'denied';

  if (params.reqid) {
    let rlist = params.reqid.split('-');
    if (rlist.length>2)  {
      params.reqid  = [rlist[0],rlist.slice(1,rlist.length-1).join('-'),rlist[rlist.length-1]];
      software_key  = params.reqid[1];
      let loginData = __userLoginHash.getLoginEntry ( params.reqid[2] );
      if (loginData.login.length>0)  {
        let userFilePath = getUserDataFName ( loginData );
        let uData  = utils.readObject ( userFilePath );
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
  let html = utils.readString ( path.join('bootstrap','authend.html') );
  if (html.length>0)  {
    let fe_server  = conf.getFEConfig();
    let setup_name = '';
    let setup_icon = '';
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
module.exports.__announcementFile   = __announcementFile;
module.exports.__userDataExt        = __userDataExt;
module.exports.__suspend_prefix     = __suspend_prefix;
module.exports.userLogin            = userLogin;
module.exports.remoteCheckIn        = remoteCheckIn;
module.exports.checkSession         = checkSession;
module.exports.userLogout           = userLogout;
module.exports.makeNewUser          = makeNewUser;
module.exports.recoverUserLogin     = recoverUserLogin;
module.exports.readUserLoginHash    = readUserLoginHash;
module.exports.getLoginEntry        = getLoginEntry;
module.exports.signalUser           = signalUser;
module.exports.readUserData         = readUserData;
module.exports.getUserLoginData     = getUserLoginData;
module.exports.getUserRation        = getUserRation;
module.exports.readUsersData        = readUsersData;
module.exports.getUserData          = getUserData;
module.exports.getUserDataFName     = getUserDataFName;
module.exports.saveHelpTopics       = saveHelpTopics;
module.exports.updateUserData       = updateUserData;
module.exports.updateUserData_admin = updateUserData_admin;
module.exports.topupUserRation      = topupUserRation;
module.exports.suspendUser          = suspendUser;
module.exports.deleteUser           = deleteUser;
module.exports.deleteUser_admin     = deleteUser_admin;
module.exports.retireUser_admin     = retireUser_admin;
module.exports.resetUser_admin      = resetUser_admin;
module.exports.sendMailToAllUsers   = sendMailToAllUsers;
module.exports.makeAnnouncement     = makeAnnouncement;
module.exports.manageDormancy       = manageDormancy;
module.exports.saveMyWorkflows      = saveMyWorkflows;
module.exports.getInfo              = getInfo;
module.exports.getLocalInfo         = getLocalInfo;
module.exports.authResponse         = authResponse;
