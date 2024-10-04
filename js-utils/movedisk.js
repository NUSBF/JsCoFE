
/*
 *  =================================================================
 *
 *    03.10.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/movedisk.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Dosk moving utility
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2024
 *
 *  =================================================================
 *
 * This routine moves all projects from one disk to another. Both disks
 * must be described in FE configuration file, and the corresponding
 * disk directories must exist.
 * 
 * Invocation:
 *
 *    node js-utils/movedisk.js disk1 disk2 config.json
 *
 * where disk1 and disk2 are disk names as specified in FE configuration
 * file config.json. All projects from disk1 will be moved to disk2 and
 * user accounts will be upated accordingly.
 *
 */

//  load system modules
const prompt = require('prompt');

//  load application modules
const conf   = require('../js-server/server.configuration');
const ud     = require('../js-common/common.data_user');
const utils  = require('../js-server//server.utils');
const user   = require('../../js-server/server.fe.user');
const prj    = require('../js-server//server.fe.projects');

//  prepare log
const log = require('../js-server/server.log').newLog(28);

// ==========================================================================

function move_disk ( disk1,disk2 )  {
  let fe_config = conf.getFEConfig();
  let udir_path = fe_config.userDataPath;

  fs.readdirSync(udir_path).forEach(function(file,index){
    if (file.endsWith(user.__userDataExt))  {
      let uDataFPath = path.join    ( udir_path,file );
      let uData      = utils.readObject ( uDataFPath );

      if (uData && (ud.volume==disk1))  {
        ud.checkUserData ( uData );
        let old_path = prj.getUserProjectsDirPath ( uData );
        uData.volume = disk2;
        let new_path = prj.getUserProjectsDirPath ( uData );
        if (!utils.dirExists(old_path))  {
          log.error ( 6,'project directory does not exist for user "' + uData.login +
                        '" -- operation skipped; please investigate!' );
        } else if (utils.fileExists(new_path))  {
          log.error ( 7,'project directory already exists for user "' + uData.login +
                        '" in new destination -- operation skipped; please investigate!' );
        }

        if (old_path==new_path)  {
          log.warning ( 8,'source and destination project directories coincide for user "' + 
                          uData.login + '" -- only disk name will be updated' );
        } else  {
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

      }

    }

  });

            // a) calculate project directory paths

            // b) log user out and suspend their account
            __userLoginHash.removeUser ( uData.login );     // logout
            uData.login = __suspend_prefix + uData.login;   // suspend
            utils.writeObject ( userFilePath,uData );       // commit

            // c) copy user's projects to new volume


}


function confirm_action ( disk1,disk2 )  {

  console.log ( ' \n' +
    '---------------------------------------------------------------------\n' +
    'This routine must be used ONLY when jsCoFE (CCP4 Cloud) is taken down\n' +
    'or else user data may be lost.\n' +
    '---------------------------------------------------------------------\n'
  );

  prompt.message = '';

  prompt.start();

  const properties = [
    {
      name     : 'confirm',
      message  : 'Is jsCoFE (CCP4 Cloud) down now (Yes/No)?',
      validator: /^(?:Yes\b|No\b|Y\b|N\b|yes\b|no\b|YES\b|NO\b|y\b|n\b)/,
      warning  : 'Yes or No please'
    }
  ];

  prompt.get ( properties, function(err,result){
    if (err)  {
      console.log ( err );
      return 1;
    } else  {
      if (result.confirm.toUpperCase().startsWith('Y'))  {
        console.log ( 'You have been warned, you said YES\n' );
        move_disk ( disk1,disk2 );
      } else
        console.log ( 'Good bye.' );
      return 0;
    }
  });

}

// ==========================================================================

if (process.argv.length!=5)  {
  console.log (
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    '      node js-utils/movedisk.js disk1 disk2 /path/to/config.json\n\n'    +
    'where disk1 and disk2 are disk names as specified in FE configuration\n' +
    'file config.json. All projects from disk1 will be moved to disk2 and\n'  +
    'user accounts will be upated accordingly.\n\n' +
    'Note: use this utility ONLY when jsCoFE is taken down for maintenance.\n'
  );
  process.exit();
}

conf.set_python_check ( false );

var cfgfpath = process.argv[4];
var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  log.error ( 1,'FE configuration failed (wrong configuration file?). Stop.' );
  log.error ( 1,msg );
  process.exit(1);
}

var disk1 = process.argv[2]; 
var disk2 = process.argv[3]; 

if (disk1==disk2)  {
  log.error    ( 2,'disk names are equal ("' + disk1 + '"), nothing to do.' );
  log.standard ( 2,'STOP' );
  process.exit(2);
}

var cfg = conf.getFEConfig();

if (!(disk1 in cfg.projectsPath))  {
  log.error    ( 3,'disk name "' + disk1 + '" is not found in configuration file.' );
  log.standard ( 3,'STOP' );
  process.exit(3);
}

if (!(disk2 in cfg.projectsPath))  {
  log.error    ( 4,'disk name "' + disk2 + '" is not found in configuration file.' );
  log.standard ( 4,'STOP' );
  process.exit(4);
}

confirm_action ( disk1,disk2 );
