
/*
 *  =================================================================
 *
 *    13.02.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/makearchindex.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User making utility
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2023
 *
 *  =================================================================
 *
 * This routine will (re-)generate CCP4 Cloud Archive index, which is 
 * used in archive searches. This procedure is safe and may be run as 
 * many times as necessary.
 * 
 * Invocation:
 *
 *    node js-utils/makearchindex.js config.json
 *
 * where config.json is the Front End configuration file.
 * 
 */

//  load application modules
const conf = require('../js-server/server.configuration');
const arch = require('../js-server/server.fe.archive');


//  prepare log
//var log = require('../js-server/server.log').newLog(26);

// ==========================================================================

if (process.argv.length<3)  {
  console.log (
    'This routine will (re-)generate CCP4 Cloud Archive index, which is\n' +
    'used in archive searches. This procedure is safe and may be run as\n' +
    'many times as necessary.\n' +
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    'node js-utils/makearchindex.js /path/to/config.json\n\n' +
    'where config.json is the FE configuration file.\n'
  );
  process.exit();
}

// conf.set_python_check ( false );

var cfgfpath = process.argv[2];
var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  console.log ( ' *** FE configuration failed (wrong configuration file?). Stop.' );
  console.log ( msg );
  process.exit();
}

var fe_config = conf.getFEConfig();
if (!fe_config)  {
  console.log ( ' *** no FE configuration found (wrong configuration file?). Stop.' );
  process.exit();
}

if (!fe_config.isArchive())  {
  console.log ( ' *** no CCP4 Cloud Archive configuration found. Stop.' );
  process.exit();
}

arch.generateIndex();
