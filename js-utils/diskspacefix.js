
/*
 *  =================================================================
 *
 *    04.08.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/diskspace.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User making utility
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2023
 *
 *  =================================================================
 *
 * This routine examines disk space consumption by the system and (optionally)
 * corrects errors found. Use only when jsCoFE is taken down for maintenance,
 * and only if you suspect problems in disk space control.
 * 
 * Invocation:
 *
 *    node js-utils/diskspace.js {check|fix} config.json
 *
 * where config.json is the Front End configuration file. 
 *
 */

//  load system modules
const prompt = require('prompt');

//  load application modules
const conf   = require('../js-server/server.configuration');
const ud     = require('../js-common/common.data_user');
const ustats = require('../js-server/server.fe.usagestats');


//  prepare log
//var log = require('../js-server/server.log').newLog(26);

// ==========================================================================


function diskSpaceFix ( check_only )  {

  console.log ( ' ' );

  if (check_only)
    ustats.diskSpaceFix ( check_only );
  else  {

    console.log ( 
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
          ustats.diskSpaceFix ( check_only );
        } else
          console.log ( 'Good bye.' );
        return 0;
      }
    });

  }

}

// ==========================================================================

if (process.argv.length<4)  {
  console.log (
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    '      node js-utils/diskspacefix.js check /path/to/config.json\nor' +
    '    node js-utils/diskspacefix.js fix /path/to/config.json\n\n' +
    'where config.json is the FE configuration file.\n\n' +
    'If used with "check", only inconsistency in disk space evaluations\n' +
    'are reported. If used with "fix", all records are re-evaluated.\n\n' +
    'Note: "fix" option may be used only when jsCoFE is taken down for\n'  +
    'maintenance. Use it only if you suspect problems in disk space\ncontrol.\n'
  );
  process.exit();
}

conf.set_python_check ( false );

var cfgfpath = process.argv[3];
var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  console.log ( ' *** FE configuration failed (wrong configuration file?). Stop.' );
  console.log ( msg );
  process.exit();
}

diskSpaceFix ( (process.argv[2].toLowerCase()=='check') );
