
/*
 *  =================================================================
 *
 *    30.09.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  fe_server.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 *  Invokation:
 *    node ./fe_server.js configFile
 *
 *  where "configFile" is path to JSON-formatted configuration file for FE.
 *
 *  The server must run in CCP4-sourced environment.
 *
 */


//  load application modules
var conf     = require('./js-server/server.configuration');
var fe_start = require('./js-server/server.fe.start');

//  prepare log
var log = require('./js-server/server.log').newLog(16);

/*
conf.setEmailerConfig ( 'telnet'          );
var emailer = require('./js-server/server.emailer');
console.log ( ' ... send e-mail with: ' + conf.getEmailerConfig().type );
emailer.send ( 'eugene.krissinel@stfc.ac.uk','Test message','Test message' );
*/

// ==========================================================================

// check configuration mode

function cmdLineError()  {
  log.error ( 1,'Incorrect command line. Stop.' );
  log.error ( 1,'Restart as "node ./fe_server.js configFile"' );
  process.exit();
}

if (process.argv.length!=3)
  cmdLineError();

var msg = conf.readConfiguration ( process.argv[2],'FE' );
if (msg)  {
  log.error ( 2,'FE configuration failed. Stop.' );
  log.error ( 2,msg );
  process.exit();
}

conf.setServerConfig ( conf.getFEConfig() );

fe_start.start ( null );
