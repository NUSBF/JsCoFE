
/*
 *  =================================================================
 *
 *    03.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019
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


//  load application modules
var conf          = require('./server.configuration');
var feproxy_start = require('./server.feproxy.start');

//  prepare log
var log = require('./server.log').newLog(23);


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

conf.setServerConfig ( conf.getFEProxyConfig() );

feproxy_start.start ( null );
