
/*
 *  =================================================================
 *
 *    15.12.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  fe_server.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Local (on-desktop) jsCoFE launcher
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 * Invocation:
 *    node ./desktop.js configFile [-localuser Name] [-no-browser] [-confout Path]
 *
 *  where "configFile" is path to JSON-formatted configuration file, containing
 *  configurations for Front End and Number Crunchers, one of which may have
 *  execution type 'CLIENT'.
 *
 *  The desktop must run in CCP4-sourced environment.
 *
 */

'use strict';

//  load system modules
const child_process = require('child_process');
const path          = require('path');
const tmp           = require('tmp');
const fse           = require('fs-extra');

//  load application modules
const conf     = require('./server.configuration');
const fe_start = require('./server.fe.start');
const fe_proxy = require('./server.feproxy.start');
const utils    = require('./server.utils');

//  prepare log
const log = require('./server.log').newLog(23);


// ==========================================================================

tmp.setGracefulCleanup();

// ==========================================================================
// check command line and configuration

var arg2      = null;
var localuser = null;
var confout   = null;
var nobrowser = false;

for (let arg of process.argv.slice(2).reverse()) {
  if (arg == '-localuser') {
    if (arg2 == null) break;
    localuser = arg2;
    arg2 = null;
  }
  else if (arg == '-no-browser')  {
    if (arg2 != null) break;
    nobrowser = true;
  }
  else if (arg == '-confout') {
    if (arg2 == null) break;
    confout = arg2;
    arg2 = null;
  }
  else if (arg[0] == '-' || arg2) {
    arg2 = null;
    break;
  }
  else {
    arg2 = arg;
  }
}

if (!arg2) {
  let usage = 'Usage: ' + process.argv[0] + ' ' + process.argv[1];
  usage += ' [-localuser Name] [-no-browser] [-confout Path]';
  log.error ( 1,'Incorrect command line. Stop.' );
  log.error ( 1,usage );
  process.exit(1);
}

var msg = conf.readConfiguration ( arg2,'FE' );
if (msg)  {
  log.error ( 2,'Desktop configuration failed. Stop.' );
  log.error ( 2,msg );
  process.exit();
}


// ==========================================================================
// Determine which servers need to be started. Desktop will start only
// localhost-based services with zero port numbers. A non-zero port number
// or a DNS server name suggest that the server is managed externally and
// should not be managed by jsCoFE desktop (i.e. should not be created and/or
// closed). Such servers should have 'stoppable' attribute set to false in
// their configuration.

var feConfig      = conf.getFEConfig ();
var feProxyConfig = conf.getFEProxyConfig()
var ncConfigs     = conf.getNCConfigs();

feConfig.killPrevious();
for (let i=0;i<ncConfigs.length;i++)
  ncConfigs[i].killPrevious();

if (localuser)
  feConfig.localuser = localuser;

var forceStart = false;  // debugging option forcing start of servers with fixed
                         // port numbers

// the following two lines should be commented out in production environment
//if (feConfig.isLocalHost && (feConfig.port<=0))
//  forceStart = true;

var startFE      = false;  // whether to start FE server
var startFEProxy = false;  // whether to start FE proxy server
var startNC      = [];     // whether to start NCs

if (forceStart)  {
  startFE = true;
  startNC = [true,true];
} else  {
  startFE = feConfig.isLocalHost;
  startNC = [];
  for (let i=0;i<ncConfigs.length;i++)
    startNC.push ( (ncConfigs[i].exeType=='CLIENT') || ncConfigs[i].isLocalHost );
}

if (feProxyConfig)  {
  feProxyConfig.killPrevious();
  startFEProxy = feProxyConfig.isLocalHost;
  if (!startFEProxy)
    feProxyConfig = null;
}


// ==========================================================================
// Define NC-starting function

function startNCServer ( nc_number,cfgpath )  {

  let stdout_path = path.join ( ncConfigs[nc_number].storage,'stdout.log' );
  let stderr_path = path.join ( ncConfigs[nc_number].storage,'stderr.log' );

  utils.writeString ( stdout_path,'' );
  utils.writeString ( stderr_path,'' );

  let job = child_process.spawn ( 'node',[path.join('js-server','nc_server.js'),
                                  cfgpath,nc_number.toString()] );

  log.standard ( 3,'server ' + ncConfigs[nc_number].name + ' started, pid=' +
                   job.pid );

  job.stdout.on ( 'data', function(buf) {
    utils.appendString ( stdout_path,buf );
  });
  job.stderr.on ( 'data', function(buf) {
    utils.appendString ( stderr_path,buf );
  });

  job.on ( 'close',function(code){
    log.standard ( 4,'server ' + ncConfigs[nc_number].name + ' quit with code ' +
                      code );
  });

}


// ==========================================================================
// Define function to start client application

function start_client_application()  {

  if (nobrowser)  {
    if (confout)
      fse.mkdirsSync ( path.join(path.dirname(confout),'LOCK') );
    log.standard ( 8,'launch of client application is supressed (no browser)' );
    return;
  }

  let desktopConfig = conf.getDesktopConfig();
  if (!desktopConfig)
    return;   // no client application to

  let command   = [];
  let msg       = desktopConfig.clientApp;
  let feURL     = feConfig.url();
  let clientURL = '';

  if (feProxyConfig)  {

    feURL = feProxyConfig.url();

  } else  {

    let clientConfig = conf.getClientNCConfig();
    if (clientConfig)  {
      if (clientConfig.protocol=='http')  clientURL  = 'lsp=';
                                    else  clientURL  = 'lsps=';
      if (clientConfig.isLocalHost)       clientURL += clientConfig.port;
                                    else  clientURL += clientConfig.url();
    }
    if (clientURL)
      clientURL = '?' + clientURL;

  }

  if ('args' in desktopConfig)  {

    for (let i=0;i<desktopConfig.args.length;i++)  {
      let arg = desktopConfig.args[i].replace('$feURL',feURL)
                                     .replace('$clientURL',clientURL);
      command.push ( arg );
      if (arg.indexOf(' ')>=0)  msg += " '" + arg + "'";
                          else  msg += ' '  + arg;
    }

    let job = child_process.spawn ( desktopConfig.clientApp,command );

  //if ( confout ) fse.mkdirsSync(confout + '.READY');
    if (confout)
      fse.mkdirsSync ( path.join(path.dirname(confout),'LOCK') );
    log.standard ( 5,'client application "' + msg + '" started, pid=' + job.pid );

    job.on ( 'close',function(code){
      log.standard ( 6,'client application "' + msg + '" quit with code ' + code );
    });

  }

}


function startClientApplication()  {
  if (startFEProxy)  {
    fe_proxy.start ( function(){
      setTimeout ( function(){
        start_client_application();
      },1000 );
    });
  } else
    start_client_application();
}


function configFileName(callback) {
  if ( confout ) {
    callback(null, confout);
  } else {
    tmp.tmpName(callback);
  }
}


// ==========================================================================
// Assign available port numbers to zero ports and start servers

function launch()  {

  conf.assignPorts ( function(){

    // Port numbers are assigned and stored in current configuration. Write
    // it to a temporary file for starting servers.

    configFileName(function(err,cfgpath) {

      if (err) {  // error; not much to do, just write into log and exit

        log.error ( 6,'cannot create temporary storage for file ' +
                      'request redirection' );
        process.exit();

      } else  {  // temporary name given


        log.debug2 ( 7,'tmp file ' + cfgpath );

        let cfg = conf.getFEConfig();
        cfg.externalURL = cfg.url();

        if (startFEProxy)  {
          cfg = conf.getFEProxyConfig();
          if (cfg)
            cfg.externalURL = cfg.url();
        }

        for (let i=0;i<ncConfigs.length;i++)  {
          cfg = conf.getNCConfig(i);
          cfg.externalURL = cfg.url();
        }

        // write configuration into temporary file
        conf.writeConfiguration ( cfgpath );

        // start number crunchers identified previously
        for (let i=0;i<ncConfigs.length;i++)
          if (startNC[i])
            startNCServer ( i,cfgpath );

        // if necessary, start Front End
        setTimeout ( function(){
          if (startFE)  {
            fe_start.start ( function(){
              startClientApplication();
            });
          } else  {
            // working with Front End managed externally (such as on a remote server);
            // in this case, simply start client application (e.g., a browser).
            startClientApplication();
          }
        },100);

      }
    });


  });

}

launch();
