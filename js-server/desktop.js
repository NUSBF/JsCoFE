
/*
 *  =================================================================
 *
 *    07.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 * Invocation:
 *    node ./desktop.js configFile [-localuser Name]
 *
 *  where "configFile" is path to JSON-formatted configuration file, containing
 *  configurations for Front End and Number Crunchers, one of which may have
 *  execution type 'CLIENT'.
 *
 *  The desktop must run in CCP4-sourced environment.
 *
 */

//  load system modules
var child_process = require('child_process');
var path          = require('path');
var tmp           = require('tmp');
var fse           = require('fs-extra');

//  load application modules
var conf     = require('./server.configuration');
var fe_start = require('./server.fe.start');
var fe_proxy = require('./server.feproxy.start');
var utils    = require('./server.utils');

//  prepare log
var log = require('./server.log').newLog(23);


// ==========================================================================

tmp.setGracefulCleanup();

// ==========================================================================
// check command line and configuration

var arg2      = null;
var localuser = null;
var confout   = null;
for (let arg of process.argv.slice(2).reverse()) {
  if (arg == '-localuser') {
    if (arg2 == null) break;
    localuser = arg2;
    arg2 = null;
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
  var usage = 'Usage: ' + process.argv[0] + ' ' + process.argv[1];
  usage += ' [-localuser Name] [-confout Path]';
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
for (var i=0;i<ncConfigs.length;i++)
  ncConfigs[i].killPrevious();

if (localuser)
  feConfig.localuser = localuser;

var forceStart = false;  // debugging option forcing start of servers with fixed
                         // port numbers

// the following two lines should be commented out in production environment
//if ((feConfig.host=='localhost') && (feConfig.port<=0))
//  forceStart = true;

var startFE      = false;  // whether to start FE server
var startFEProxy = false;  // whether to start FE proxy server
var startNC      = [];     // whether to start NCs

if (forceStart)  {
  startFE = true;
  startNC = [true,true];
} else  {
  startFE = (feConfig.host=='localhost');
  startNC = [];
  for (var i=0;i<ncConfigs.length;i++)
    startNC.push ( (ncConfigs[i].exeType=='CLIENT') ||
                   (ncConfigs[i].host=='localhost') );
}

if (feProxyConfig)  {
  feProxyConfig.killPrevious();
  startFEProxy = (feProxyConfig.host=='localhost');
}

// ==========================================================================
// Define NC-starting function

function startNCServer ( nc_number,cfgpath )  {

  var stdout_path = path.join ( ncConfigs[nc_number].storage,'stdout.log' );
  var stderr_path = path.join ( ncConfigs[nc_number].storage,'stderr.log' );

  utils.writeString ( stdout_path,'' );
  utils.writeString ( stderr_path,'' );

  var job = child_process.spawn ( 'node',[path.join('js-server','nc_server.js'),
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

  var desktopConfig = conf.getDesktopConfig();
  if (!desktopConfig)
    return;   // no client application to

  var command   = [];
  var msg       = desktopConfig.clientApp;
  var feURL     = feConfig.url();
  var clientURL = '';

  if (feProxyConfig)  {

    feURL = feProxyConfig.url();

  } else  {

    var clientConfig = conf.getClientNCConfig();
    if (clientConfig)  {
      if (clientConfig.protocol=='http')  clientURL  = 'lsp=';
                                    else  clientURL  = 'lsps=';
      if ((clientConfig.host=='localhost') || (clientConfig.host=='127.0.0.1'))
                                          clientURL += clientConfig.port;
                                    else  clientURL += clientConfig.url();
    }
    if (clientURL)
      clientURL = '?' + clientURL;

  }

  for (var i=0;i<desktopConfig.args.length;i++)  {
    var arg = desktopConfig.args[i].replace('$feURL',feURL)
                                   .replace('$clientURL',clientURL);
    command.push ( arg );
    if (arg.indexOf(' ')>=0)  msg += " '" + arg + "'";
                        else  msg += ' '  + arg;
  }

  var job = child_process.spawn ( desktopConfig.clientApp,command );

  if ( confout ) fse.mkdirsSync(confout + '.READY');
  log.standard ( 5,'client application "' + msg + '" started, pid=' + job.pid );

  job.on ( 'close',function(code){
    log.standard ( 6,'client application "' + msg + '" quit with code ' + code );
  });

}


function startClientApplication()  {
  if (startFEProxy)  {
    fe_proxy.start ( function(){
      start_client_application();
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

      var cfg = conf.getFEConfig();
      cfg.externalURL = cfg.url();

      var cfg = conf.getFEProxyConfig();
      if (cfg)
        cfg.externalURL = cfg.url();

      for (var i=0;i<ncConfigs.length;i++)  {
        cfg = conf.getNCConfig(i);
        cfg.externalURL = cfg.url();
      }

      // write configuration into temporary file
      conf.writeConfiguration ( cfgpath );

      // start number crunchers identified previously
      for (var i=0;i<ncConfigs.length;i++)
        if (startNC[i])
          startNCServer ( i,cfgpath );

      // if necessary, start Front End
      if (startFE)  {
        fe_start.start ( function(){
          startClientApplication();
        });
      } else  {
        // working with Front End managed externally (such as on a remote server);
        // in this case, simply start client application (e.g., a browser).
        startClientApplication();
      }

    }
  });


});
