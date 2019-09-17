
/*
 *  =================================================================
 *
 *    16.09.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  fe_proxy.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Proxy Server
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
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


var http      = require('http');
var httpProxy = require('http-proxy');
var url       = require('url');

//  load application modules
var conf      = require('./server.configuration');
var cmd       = require('../js-common/common.commands');

//  prepare log
var log = require('./server.log').newLog(22);


// ==========================================================================

// check server serial number

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

var proxy_config  = conf.getFEProxyConfig ();
var fe_config     = conf.getFEConfig      ();
//var client_config = conf.getClientNCConfig();
var fe_url        = fe_config.url();

// --------------------------------------------------------------------------
// Create a proxy server with custom application logic

var proxy = httpProxy.createProxyServer({});

var server = http.createServer ( function(server_request,server_response){
  var command = url.parse(server_request.url).pathname.substr(1).toLowerCase();
  if (command==cmd.fe_command.getClientInfo)
    conf.getClientInfo ( {},function(response){ response.send(server_response); });
  else
    proxy.web ( server_request,server_response, { target : fe_url } );
});

server.listen({
  host      : proxy_config.host,
  port      : proxy_config.port,
  exclusive : proxy_config.exclusive
},function(){
  if (proxy_config.exclusive)
    log.standard ( 1,'front-end proxy started, listening to ' +
                     proxy_config.url() + ' (exclusive)' );
  else
    log.standard ( 1,'front-end proxy started, listening to ' +
                     proxy_config.url() + ' (non-exclusive)' );
});
