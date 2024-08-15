
/*
 *  =================================================================
 *
 *    09.08.23   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2023 
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

'use strict';

//  load application modules
const conf     = require('./server.configuration');
const fe_start = require('./server.fe.start');

//  prepare log
const log = require('./server.log').newLog(21);

/*
conf.setEmailerConfig ( 'telnet'          );
var emailer = require('./js-server/server.emailer');
console.log ( ' ... send e-mail with: ' + conf.getEmailerConfig().type );
emailer.send ( 'ccp4_cloud@listserv.stfc.ac.uk','Test message','Test message' );
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

process.on ( 'uncaughtException', function (err) {
  log.error ( 3,'Caught unhandled exception: ' + err );
});

conf.setServerConfig ( conf.getFEConfig() );
conf.cleanFETmpDir();

fe_start.start ( null );
