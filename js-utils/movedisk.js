
/*
 *  =================================================================
 *
 *    26.10.24   <--  Date of Last Modification.
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
 *    Note that this operation will break links between shared projects,
 * therefore, the will need to be restored using js-utils/reshare.js.
 *
 */

//  load system modules
const prompt = require('prompt');
const fs     = require('fs-extra');
const path   = require('path');

//  load application modules
const conf   = require('../js-server/server.configuration');
const ud     = require('../js-common/common.data_user');
const utils  = require('../js-server//server.utils');
const user   = require('../js-server/server.fe.user');
const prj    = require('../js-server//server.fe.projects');

//  prepare log
const log    = require('../js-server/server.log').newLog(28);

// ==========================================================================

function move_disk ( disk1,disk2 )  {

  let fe_config = conf.getFEConfig();
  let udir_path = fe_config.userDataPath;

  // loop over all user records
  fs.readdirSync(udir_path).forEach(function(file,index){
    if (file.endsWith(user.__userDataExt))  {
    console.log ( ' >>> ' + file )

      let uDataFPath = path.join    ( udir_path,file );
      let uData      = utils.readObject ( uDataFPath );  // read the record

      if (uData && (uData.volume==disk1))  {  // check if projects are placed on "disk1"
        
        ud.checkUserData ( uData );  // add missing items in old records
        
        let old_path = prj.getUserProjectsDirPath ( uData );
        let old_vdir = fe_config.getVolumeDir     ( uData );

        uData.volume = disk2;  // change location to "disk2"

        let new_path = prj.getUserProjectsDirPath ( uData );
        let new_vdir = fe_config.getVolumeDir     ( uData );

        if (!utils.dirExists(old_vdir))  {
          log.error ( 6,'volume "' + disk1 + 
                        '" does not exists -- operation skipped; please investigate!' );
        } else if (!utils.dirExists(new_vdir))  {
          log.error ( 7,'volume "' + disk2 + 
                        '" does not exists -- operation skipped; please investigate!' );
        } else if (!utils.dirExists(old_path))  {
          log.error ( 8,'project directory does not exist for user "' + uData.login +
                        '" -- operation skipped; please investigate!' );
        } else if (utils.fileExists(new_path))  {
          log.error ( 9,'project directory already exists for user "' + uData.login +
                        '" in new destination -- operation skipped; please investigate!' );
        } else if (old_path==new_path)  {
          log.warning ( 10,'source and destination project directories coincide for user "' + 
                          uData.login + '" -- only disk name will be updated' );
          utils.writeObject ( uDataFPath,uData );  // commit
        } else if (utils.fileStat(old_vdir).dev===utils.fileStat(new_vdir).dev)  {
          // same file system, just move the directory
          if (utils.moveDir(old_path,new_path,false))  { // sync version, no overwrite
            utils.writeObject ( uDataFPath,uData );  // commit
            log.standard ( 5,'User ' + uData.login + ' moved from disk ' + disk1 +
                             ' to ' + disk2 )
          } else  {
            log.error ( 11,'failed to move directory "' + old_path +
                          '" to "' + new_path + '" possible data loss, investigate!' );
          }
        } else if (utils.copyDirSync(old_path,new_path))  {
          utils.removePath  ( old_path );
          utils.writeObject ( uDataFPath,uData );  // commit
          log.standard ( 6,'User ' + uData.login + ' moved from disk ' + disk1 +
                           ' to ' + disk2 )
        } else  {
          log.error ( 12,'failed to copy directory "' + old_path +
                        '" to "' + new_path + '" perform recovery, investigate!' );
          utils.removePath ( new_path );
        }
      }

    }

  });

}


function confirm_action ( disk1,disk2 )  {

  console.log ( ' \n' +
    '---------------------------------------------------------------------\n' +
    'This routine must be used ONLY when jsCoFE (CCP4 Cloud) is taken down\n' +
    'and no jobs are running or pending in the queue, or else user data\n'    +
    'may be lost.\n' +
    '---------------------------------------------------------------------\n'
  );

  prompt.message = '';

  prompt.start();

  const properties = [
    {
      name     : 'confirm',
      message  : 'Are all jsCoFE servers taken down and no jobs are running or\n' +
                 'pending in the queue (Yes/No)?',
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
        console.log ( '\nYou were asked, you said YES\n' );
        move_disk   ( disk1,disk2 );
      } else
        console.log ( '\nGood bye.\n' );
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
    'Note: use this utility ONLY when jsCoFE is taken down for maintenance\n' +
    'and no jobs are running or pending in the queue.\n'
  );
  process.exit();
}

conf.set_python_check ( false );

console.log ( '\n Reading configuration file\n' );

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
