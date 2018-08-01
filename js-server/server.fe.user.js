
/*
 *  =================================================================
 *
 *    31.07.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var crypto  = require('crypto');
var fs      = require('fs-extra');
var path    = require('path');

//  load application modules
var emailer = require('./server.emailer');
var conf    = require('./server.configuration');
var utils   = require('./server.utils');
var prj     = require('./server.fe.projects');
var ration  = require('./server.fe.ration');
var ud      = require('../js-common/common.data_user');
var cmd     = require('../js-common/common.commands');

//  prepare log
var log = require('./server.log').newLog(10);


// ===========================================================================

var userDataExt       = '.user';
var userLoginHashFile = 'login.hash';

// ===========================================================================

function hashPassword ( pwd )  {
  return crypto.createHash('md5').update(pwd).digest("hex");
}

function getUserDataFName ( login )  {
  return path.join ( conf.getFEConfig().userDataPath,login + userDataExt );
}

function makeNewUser ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password
  var pwd = '';
  if (userData.login=='devel')
    pwd = 'devel';
  else if (('localuser' in fe_server) && (userData.login=='localuser'))
    pwd = 'localuser';
  else if (userData.pwd.length>0)
    pwd = userData.pwd;
  else
    pwd = crypto.randomBytes(3).toString('hex');

  log.standard ( 1,'making new user, login: ' + userData.login );
  log.standard ( 1,'    temporary password: ' + pwd );
  userData.pwd = hashPassword ( pwd );

  userData.helpTopics = [];

  userData.admin      = (userData.login=='admin');
  userData.knownSince = Date.now();
  userData.lastSeen   = Date.now();

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( userData.login );
  log.standard ( 1,'        user data path: ' + userFilePath );

  if (utils.fileExists(userFilePath))  {

    log.error ( 2,'new user login: ' + userData.login +
                  ' -- already exists, rejected' );
    response  = new cmd.Response ( cmd.fe_retcode.existingLogin,
                                   'Login name exists','');

  } else if (utils.writeObject(userFilePath,userData))  {

    log.standard ( 2,'new user login: ' + userData.login + ' -- created' );

    response = prj.makeNewUserProjectsDir ( userData.login );

    if (response.status==cmd.fe_retcode.ok)  {

      msg = 'Dear ' + userData.name + ',<p>' +
            'Thank you for registering with CCP4 on-line services.<p>' +
            'Your login name is:         <b>' + userData.login + '</b><br>' +
            'Your temporary password is: <b>' + pwd + '</b><p>' +
            'Please use these data to login in CCP4 on-line services next time. ' +
            'When you log in, you may change your password in "My CCP4 Account", ' +
            'selectable from the Main Menu found on the top-left.<p>';

      msg += '<b><i>PLEASE NOTE:</i></b> <b>CCP4 on-line services are currently ' +
             'in the development mode. Therefore, we do not guarantee a permanent ' +
             'access to services; your data and projects may become unavailable ' +
             'to you from time to time (however, confidentiality of your projects ' +
             'and data will be fully respected). In addition, you may experience ' +
             'a permanent corruption or dysfunction in your projects. In such ' +
             'cases, you will need to delete all corrupt or dysfunctional ' +
             'projects and start them over again.</b><p>'

      if (response.message.length>0)
        msg += '<b><i>Note:</i></b> your login was re-used and may ' +
               'contain pre-existing projects and data.<p>'

      msg += 'Best Regards,<p>' +
             'CCP4 on-line.';

      response.data = emailer.send ( userData.email,'CCP4 Registration',msg );

    }

  } else  {

    response = new cmd.Response ( cmd.fe_retcode.writeError,
                      'Cannot write user data',
                      emailer.send ( conf.getEmailerConfig().maintainerEmail,
                        'CCP4 Registration Write Fails',
                        'Detected write failure at new user registration, ' +
                        'please investigate.' )
      );

  }

  callback_func ( response );

}


// ===========================================================================

function recoverUserLogin ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password

  log.standard ( 3,'recover user login for ' + userData.email + ' at ' +
                   fe_server.userDataPath );

  files = fs.readdirSync ( fe_server.userDataPath );

  var userName = '???';
  var logins   = [];
  var pwds     = [];
  var n = 0;
  for (var i=0;i<files.length;i++)
    if (files[i].endsWith(userDataExt))  {
      var userFilePath = path.join ( fe_server.userDataPath,files[i] );
      var uData = utils.readObject ( userFilePath );
      if (uData)  {
        if (uData.email==userData.email)  {
          userName  = uData.name;
          logins[n] = uData.login;
          // reset password
          if (uData.login=='devel')
                pwds[n] = 'devel';
          else if (('localuser' in fe_server) && (uData.login=='localuser'))
                pwds[n] = 'localuser';
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

      response = new cmd.Response ( cmd.fe_retcode.ok,userName,
        emailer.send ( userData.email,'CCP4 Login Recovery',
          'Dear ' + userName + ',<p>' +
          'Thank you for your request regarding CCP4 on-line login recovery.<p>' +
           msg +
          'Please use these data to login in CCP4 on-line services next time. ' +
          'You may change your password(s) in "My Account", selectable from ' +
          'Main Menu, when you log in.<p>' +
          'Best Regards,<p>' +
          'CCP4 on-line.' )
      );

    }

  }

  callback_func ( response );

}


// ===========================================================================

var userLoginHash = {
  '340cef239bd34b777f3ece094ffb1ec5' : 'devel'
};


function writeUserLoginHash()  {

  var userHashPath = path.join ( conf.getFEConfig().userDataPath,userLoginHashFile );

  if (!utils.writeObject(userHashPath,userLoginHash))
    return emailer.send ( conf.getEmailerConfig().maintainerEmail,
                          'CCP4 Login Hash Write Fails',
                          'Detected file read failure at user login hash write, ' +
                          'please investigate.' );

  return '';

}


function readUserLoginHash()  {
var fe_server  = conf.getFEConfig();
var updateHash = false;

  var userHashPath = path.join ( conf.getFEConfig().userDataPath,userLoginHashFile );

  userLoginHash = utils.readObject ( userHashPath);
  if (!userLoginHash)  {

    userData = new ud.UserData();
    userData.name    = 'Developer';
    userData.email   = conf.getEmailerConfig().maintainerEmail;
    userData.login   = 'devel';
    userData.pwd     = 'devel';
    userData.licence = 'academic';
    userData.admin   = false;
    makeNewUser ( userData,function(response){} );

    userLoginHash = {
      '340cef239bd34b777f3ece094ffb1ec5' : 'devel'
    };

    updateHash = true;

  }

  if (('localuser' in fe_server) && (!getTokenFromHash('localuser')))  {
    userData = new ud.UserData();
    userData.name    = fe_server.localuser;
    userData.email   = conf.getEmailerConfig().maintainerEmail;
    userData.login   = 'localuser';
    userData.pwd     = 'localuser';
    userData.licence = 'academic';
    userData.admin   = false;
    makeNewUser ( userData,function(response){} );
    addToUserLoginHash ( 'e58e28a556d2b4884cb16ba8a37775f0','localuser' );
    updateHash = true;
  }

  if (updateHash)
    writeUserLoginHash();

}


function addToUserLoginHash ( token,login_name )  {

  var newHash = {};
  for(var key in userLoginHash)
    if (userLoginHash[key]!=login_name)
      newHash[key] = userLoginHash[key];

  userLoginHash = newHash;
  userLoginHash[token] = login_name;

  writeUserLoginHash();

}


function removeFromUserLoginHash ( token )  {

  var newHash = {};
  for(var key in userLoginHash)
    if (key!=token)
      newHash[key] = userLoginHash[key];
  userLoginHash = newHash;

  writeUserLoginHash();

}


function removeUserFromHash ( login_name )  {

  var newHash = {};
  for(var key in userLoginHash)
    if (userLoginHash[key]!=login_name)
      newHash[key] = userLoginHash[key];
  userLoginHash = newHash;

  writeUserLoginHash();

}


function getLoginFromHash ( token )  {
  if (token in userLoginHash)
        return userLoginHash[token];
  else  return '';
}


function getTokenFromHash ( login_name )  {
  var token = null;
  for(var key in userLoginHash)
    if (userLoginHash[key]==login_name)  {
      token = key;
      break;
    }
  return token;
}


// ===========================================================================

function userLogin ( userData,callback_func )  {  // gets UserData object
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  // Get user data object and generate a temporary password
//  var userData = JSON.parse ( user_data_json );
  var pwd = hashPassword ( userData.pwd );

  log.standard ( 4,'user login ' + userData.login );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( userData.login );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );
    if (uData)  {

      if ((uData.login==userData.login) && (uData.pwd==pwd))  {

        uData.lastSeen = Date.now();
        utils.writeObject ( userFilePath,uData );

        if (uData.login=='devel')  {
          token = '340cef239bd34b777f3ece094ffb1ec5';
        } else if (('localuser' in fe_server) && (uData.login=='localuser'))  {
          token = 'e58e28a556d2b4884cb16ba8a37775f0';
        } else  {
          token = crypto.randomBytes(20).toString('hex');
          addToUserLoginHash ( token,uData.login );
        }

        // remove personal information just in case
        uData.pwd   = '';
        uData.email = '';
        var rData = {};
        rData.userData   = uData;
        rData.localSetup = conf.isLocalSetup();

        response = new cmd.Response ( cmd.fe_retcode.ok,token,rData );

      } else
        response = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );

    } else  {
      log.error ( 4,'User file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }

  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  callback_func ( response );

}


// ===========================================================================

function readUserData ( login )  {
  var userFilePath = getUserDataFName ( login );
  if (utils.fileExists(userFilePath))
    return utils.readObject ( userFilePath );
  return null;
}


function readUsersData()  {

  var usersData = {};
  usersData.loggedUsers = userLoginHash;
  usersData.userList    = [];
  var udir_path = conf.getFEConfig().userDataPath;

  if (utils.fileExists(udir_path))  {
    fs.readdirSync(udir_path).forEach(function(file,index){
      if (file.endsWith(userDataExt))  {
        var udata = utils.readObject ( path.join(udir_path,file) );
        if (udata)  {
          if (!('knownSince' in udata) || (udata.knownSince==''))  {
            udata.knownSince = new Date("2017-09-01").valueOf();
            utils.writeObject ( path.join(udir_path,file),udata );
          }
          var login = file.slice ( 0,file.length-userDataExt.length );
          udata.ration = ration.getUserRation ( login );
          if (udata.ration.jobs_total<udata.nJobs)  {  // backward compatibility 07.06.2018
            udata.ration.jobs_total = udata.nJobs;
            ration.saveUserRation ( login,udata.ration );
          }
          udata.ration.clearJobs();
          usersData.userList.push ( udata );
        }
      }
    });
  }

  return usersData;

}


function getUserData ( login )  {
var response = 0;  // must become a cmd.Response object to return

  log.standard ( 5,'user get data ' + login );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( login );

  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
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


function getUserRation ( login )  {
  return new cmd.Response ( cmd.fe_retcode.ok,'',ration.getUserRation(login) );
}


// ===========================================================================

function saveHelpTopics ( login,userData )  {
var response = 0;  // must become a cmd.Response object to return

  log.standard ( 6,'user save help topics ' + login );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( login );

  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      uData.helpTopics = userData.helpTopics;
      if (utils.writeObject(userFilePath,uData))  {
        response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
      } else  {
        log.error ( 6,'User file: ' + userFilePath + ' cannot be written' );
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                                      'User file cannot be written.','' );
      }
    } else  {
      log.error ( 7,'User file: ' + userFilePath + ' cannot be read' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


// ===========================================================================

function userLogout ( login )  {

  log.standard ( 7,'user logout ' + login );

  if ((login!='devel') && (login!='localuser'))
    removeUserFromHash ( login );

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


// ===========================================================================

function updateUserData ( login,userData )  {
var response = 0;  // must become a cmd.Response object to return

  log.standard ( 8,'update user data, login ' + login );

  var pwd = userData.pwd;
  userData.pwd = hashPassword ( pwd );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( login );

  if (utils.fileExists(userFilePath))  {

    if (utils.writeObject(userFilePath,userData))  {

      response = new cmd.Response ( cmd.fe_retcode.ok,'',
        emailer.send ( userData.email,'CCP4 Login Update',
          'Dear ' + userData.name + ',<p>' +
          'Your CCP4 on-line account has been updated as follows:<p>' +
          'Login name: <b>' + userData.login + '</b><br>' +
          'Password: <b>*****</b><br>' +
          'E-mail: <b>' + userData.email + '</b><p>' +
          'This e-mail is sent only for your information. However, if<br>' +
          'update request was not initiated by you, please contact<br>' +
          'CCP4 team at ' +
          conf.getEmailerConfig().maintainerEmail + ' .<p>' +
          'Best Regards,<p>' +
          'CCP4 on-line.' )
      );

    } else  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    'User file cannot be written.','' );
    }

  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


// ===========================================================================

function deleteUser ( login,userData )  {
var response = null;  // must become a cmd.Response object to return

  log.standard ( 8,'delete user, login ' + login );

  var pwd = userData.pwd;
  userData.pwd = hashPassword ( pwd );

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( login );

  if (utils.fileExists(userFilePath))  {
    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      if (userData.pwd==uData.pwd)  {

        var userProjectsDir = prj.getUserProjectsDirPath ( login );
        if (!utils.removePath(userProjectsDir))
          log.error ( 11,'User directory: ' + userProjectsDir + ' cannot be removed.' );

        if (utils.removeFile(userFilePath))  {

          response = new cmd.Response ( cmd.fe_retcode.ok,'',
            emailer.send ( userData.email,'jsCoFE Account Deleted',
              'Dear ' + userData.name + ',<p>' +
              'Your jsCoFE account and all associated data have been deleted<br>' +
              'per your request:<p>' +
              'Login name: <b>' + userData.login + '</b><br>' +
              'Password: <b>*****</b><br>' +
              'E-mail: <b>' + userData.email + '</b><p>' +
              'This e-mail is sent only for your information. Your data cannot<br>' +
              'be restored. If account delete request was not initiated by you,<br>' +
              'please contact CCP4 team at ' +
              conf.getEmailerConfig().maintainerEmail + ' .<p>' +
              'Best Regards,<p>' +
              'CCP4 on-line.' )
          );

          removeUserFromHash ( login );

        } else  {
          response = new cmd.Response ( cmd.fe_retcode.userNotDeleted,
                                        'Cannot delete user data.','' );
        }

      } else  {
        response = new cmd.Response ( cmd.fe_retcode.wrongPassword,
                                      'Incorrect password.','' );
      }
    } else  {
      log.error ( 12,'User file: ' + userFilePath + ' cannot be read.' );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                      'User file cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.wrongLogin,'','' );
  }

  return response;

}


// ===========================================================================

function sendAnnouncement ( login,message )  {

  // Check that we're having a new login name
  var userFilePath = getUserDataFName ( login );

  if (utils.fileExists(userFilePath))  {

    var uData = utils.readObject ( userFilePath );
    if (uData)  {
      if (uData.admin)  {

        usersData = readUsersData();
        users     = usersData.userList;
        for (var i=0;i<users.length;i++)  {
          emailer.send ( users[i].email,'CCP4 jsCoFE Announcement',
                         message.replace( '&lt;User Name&gt;',users[i].name ) );
          log.standard ( 9,'Announcement sent to ' + users[i].name + ' at ' +
                           users[i].email );
        }

      } else
        log.error ( 8,'Attempt to broadcast from a non-admin login -- stop.' );

    } else
      log.error ( 9,'User file: ' + userFilePath + ' cannot be read -- ' +
                    'cannot verify identity for broadcasting.' );

  } else
    log.error ( 10,'User file: ' + userFilePath + ' does not exist -- ' +
                   'cannot verify identity for broadcasting.' );

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


function getInfo ( inData,callback_func )  {
var response  = null;  // must become a cmd.Response object to return
var fe_server = conf.getFEConfig();

  if (fe_server)  {

    var rData = {};
    rData.localuser     = null;
    rData.logintoken    = null;
    rData.helpTopics    = [];
    rData.exclude_tasks = fe_server.exclude_tasks;
    if ('localuser' in fe_server)  {
      rData.localuser  = fe_server.localuser;
      rData.logintoken = getTokenFromHash ( 'localuser' );
      var userFilePath = getUserDataFName ( 'localuser' );
      if (utils.fileExists(userFilePath))  {
        var uData = utils.readObject ( userFilePath );
        if (uData)
          rData.helpTopics = uData.helpTopics;
      }
    }
    rData.localSetup = conf.isLocalSetup();

    response = new cmd.Response ( cmd.fe_retcode.ok,'',rData );

  } else  {

    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );

  }

  callback_func ( response );

}


// ==========================================================================
// export for use in node
module.exports.userLogin         = userLogin;
module.exports.userLogout        = userLogout;
module.exports.makeNewUser       = makeNewUser;
module.exports.recoverUserLogin  = recoverUserLogin;
module.exports.readUserLoginHash = readUserLoginHash;
module.exports.getLoginFromHash  = getLoginFromHash;
module.exports.readUserData      = readUserData;
module.exports.getUserRation     = getUserRation;
module.exports.readUsersData     = readUsersData;
module.exports.getUserData       = getUserData;
module.exports.getUserDataFName  = getUserDataFName;
module.exports.saveHelpTopics    = saveHelpTopics;
module.exports.updateUserData    = updateUserData;
module.exports.deleteUser        = deleteUser;
module.exports.sendAnnouncement  = sendAnnouncement;
module.exports.getInfo           = getInfo;
