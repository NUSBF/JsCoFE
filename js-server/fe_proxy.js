
/*
 *  =================================================================
 *
 *    16.06.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  fe_proxy.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2022
 *
 *  =================================================================
 *
 *  Invokation:
 *    node ./fe_proxy.js configFile
 *
 *  where "configFile" is path to JSON-formatted configuration file for FE.
 *
 *  The server must run in CCP4-sourced environment.
 *
 */

'use strict';

//  load application modules
const conf          = require('./server.configuration');
const feproxy_start = require('./server.feproxy.start');

//  prepare log
const log = require('./server.log').newLog(24);


// ==========================================================================

function cmdLineError()  {
  log.error ( 1,'Incorrect command line. Stop.' );
  log.error ( 1,'Restart as "node ./fe_proxy.js configFile' );
  process.exit();
}

if (process.argv.length!=3)
  cmdLineError();

var msg = conf.readConfiguration ( process.argv[2],'FE-PROXY' );
if (msg)  {
  log.error ( 2,'FE-PROXY configuration failed. Stop.' );
  log.error ( 2,msg );
  process.exit();
}

process.on('uncaughtException', function (err) {
  console.log ( 'FE-Proxy caught exception: ' + err );
});

conf.setServerConfig ( conf.getFEProxyConfig() );

feproxy_start.start ( null );
