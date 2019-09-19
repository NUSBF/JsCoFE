
/*
 *  =================================================================
 *
 *    01.06.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 * Invocation:
 *    node ./desktop.js configFile
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

//  load application modules
var conf     = require('./js-server/server.configuration');
var fe_start = require('./js-server/server.fe.start');
var utils    = require('./js-server/server.utils');
var fs       = require('fs-extra');

//  prepare log
var log = require('./js-server/server.log').newLog(17);


// ==========================================================================
// check command line and configuration

if (process.argv.length!=3) {
  log.error ( 1,'Incorrect command line. Stop.' );
  log.error ( 1,'Restart as "node ./desktop.js configFile"' );
  process.exit();
}

var lockDir = path.join(path.dirname(process.argv[2]), 'LOCK');
//mock a failure:
//fs.rmdirsSync(lockDir + 'K')

var msg = conf.readConfiguration ( process.argv[2],'FE' );
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

var feConfig  = conf.getFEConfig ();
var ncConfigs = conf.getNCConfigs();

var startFE = (feConfig.host=='localhost');
var startNC = [];
for (var i=0;i<ncConfigs.length;i++)
  startNC.push ( (ncConfigs[i].exeType=='CLIENT') ||
                 (ncConfigs[i].host=='localhost') );

// ==========================================================================
// Define NC-starting function

function startNCServer ( nc_number,cfgpath )  {

  var stdout_path = path.join ( ncConfigs[nc_number].storage,'stdout.log' );
  var stderr_path = path.join ( ncConfigs[nc_number].storage,'stderr.log' );

  utils.writeString ( stdout_path,'' );
  utils.writeString ( stderr_path,'' );

  var job = child_process.spawn ( 'node',['js-server/nc_server.js',cfgpath,nc_number.toString()] );

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

function startClientApplication()  {

  var desktopConfig = conf.getDesktopConfig();

  if (desktopConfig)  {

    var clientConfig = conf.getClientNCConfig();
    var clientURL    = '';
    if (clientConfig)  {
      let key = clientConfig.protocol == 'https' ? 'lsps=' : 'lsp=';
      let value = clientConfig.host == 'localhost' ? clientConfig.port : clientConfig.url();
      clientURL = key + value;
    }

    var command = [];
    var msg     = desktopConfig.clientApp;
    for (var i=0;i<desktopConfig.args.length;i++)  {
      var arg = desktopConfig.args[i].replace('$feURL',feConfig.url())
                                     .replace('$clientURL','?'+clientURL);
      command.push ( arg );
      if (arg.indexOf(' ')>=0)  msg += " '" + arg + "'";
                          else  msg += ' ' + arg;
    }

    var job = child_process.spawn ( desktopConfig.clientApp,command );

    fs.mkdirsSync(lockDir)
    log.standard ( 5,'client application "' + msg + '" started, pid=' + job.pid );

    job.on ( 'close',function(code){
      log.standard ( 6,'client application "' + msg + '" quit with code ' + code );
    });
  }
}

// ==========================================================================
// Assign available port numbers to zero ports and start servers

conf.assignPorts ( function(){

  // Port numbers are assigned and stored in current configuration. Write
  // it to a temporary file for starting servers.

  cfgpath = process.argv[2];

  log.debug2 ( 7,'config file ' + cfgpath );

  var cfg = conf.getFEConfig();
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
});
