
/*
 *  =================================================================
 *
 *    16.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  nc_server.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Number Cruncher Server
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  =================================================================
 *
 *  Invokation:
 *    node ./nc_server.js configFile n
 *
 *  where "configFile" is path to JSON-formatted configuration file for NC,
 *  and "n" is server's serial number, ranging from 0 to
 *  NumberCrunchers.length-1 as defined in the configuration file.
 *
 *  The server must run in CCP4-sourced environment.
 *
 */

'use strict';

//  load system modules
const url    = require('url');
// const path   = require('path');
const http   = require('http');
const https  = require('https');

//  load application modules
const utils  = require('./server.utils');
const conf   = require('./server.configuration');
const pp     = require('./server.process_post');
const cmd    = require('../js-common/common.commands');
const jm     = require('../js-server/server.nc.job_manager');
const rm     = require('../js-server/server.nc.requests');

//  prepare log
const log = require('./server.log').newLog(1);


// ==========================================================================

// check server serial number

function cmdLineError()  {
  log.error ( 7,'Incorrect command line. Stop.' );
  if (conf.getNumberOfNCs()>0)
    log.error ( 8,'Restart as "node ./nc_server.js configFile n", ' +
                        'with 0 <= n < ' + conf.getNumberOfNCs() );
  else
    log.error ( 9,'Restart as "node ./nc_server.js configFile n", where ' +
                        '"n" is the NC serial number');
  process.exit();
}

if (process.argv.length!=4)
  cmdLineError();

var msg = conf.readConfiguration ( process.argv[2],'NC' );
if (msg)  {
  log.error ( 10,'NC configuration failed. Stop.' );
  log.error ( 10,msg );
  process.exit();
}

if (isNaN(process.argv[3]))
  cmdLineError();

var nc_number = parseInt ( process.argv[3] );

if ((nc_number<0) || (nc_number>=conf.getNumberOfNCs()))
  cmdLineError();


// --------------------------------------------------------------------------

log.standard ( 0,'CCP4 path: ' + process.env['CCP4'] );

conf.setServerConfig ( conf.getNCConfig(nc_number) );
conf.cleanNCTmpDir();

var srvConfig = conf.getServerConfig();
srvConfig.killPrevious();
srvConfig.savePID();

// --------------------------------------------------------------------------

var ncrash       = 0;
var browserCount = 0;  // browser start counter

function start()  {

  //log.standard ( 1,'FE: url=' + conf.getFEConfig().url() );
  log.standard ( 1,'NC[' + nc_number + ']: type=' +
                   conf.getNCConfig(nc_number).exeType +
                   ' url=' + conf.getNCConfig(nc_number).url() );
  log.standard ( 2,'Emailer: ' + conf.getEmailerConfig().type );
  log.standard ( 2,'State:   ' + conf.getNCConfig(nc_number).state );

  utils.configureCache ( 0 );

  // --------------------------------------------------------------------------

  // check server storage and configure it if necessary

  let jobsDir = jm.ncGetJobsDir();
  if (!utils.fileExists(jobsDir))  {
    if (!utils.mkDir(jobsDir))  {
      log.error ( 11,'cannot create job area at ' + jobsDir );
      process.exit();
    } else  {
      log.standard ( 5,'created job area at ' + jobsDir );
    }
  }

  let safeDir = srvConfig.getJobsSafe().path;
  if (!utils.fileExists(safeDir))  {
    if (!utils.mkDir(safeDir))  {
      log.error ( 12,'cannot create safe area at ' + safeDir );
      process.exit();
    } else  {
      log.standard ( 6,'created job area at ' + safeDir );
    }
  }

  // resume job management

  jm.readNCJobRegister ( 0 );
  //jm.cleanNC ( false );

  // --------------------------------------------------------------------------

  //  instantiate server
  let server = null;
  if (srvConfig.protocol=='http')  {
    server  = http.createServer();
  } else  {
    // var fs    = require('fs');
    options = {};
    /*
    //var options = {
    //  key : fs.readFileSync ( path.join('certificates','key.pem'   ) ),
    //  cert: fs.readFileSync ( path.join('certificates','cert.pem'  ) )
    //};
    */
    server  = https.createServer ( options );
  }

  //  make request listener
  server.on ( 'request', function(server_request,server_response)  {

    server_response.setHeader ( 'Cross-Origin-Opener-Policy'  ,'same-origin'  );
    server_response.setHeader ( 'Cross-Origin-Embedder-Policy','require-corp' );

    try {

      let response = null;
      let command  = '';

      // Parse the server request command
      let url_parse = url.parse(server_request.url);
      let url_path  = url_parse.pathname;
      // console.log ( ' url_path=' + url_path );
      if (url_path.length>0)  {
        // remove leading slash and proxy forward-to-client tag
        // command = url_path.substr(1);
        command = url_path.slice(1);
        if (command.startsWith(cmd.__special_client_tag))
          command = command.slice(cmd.__special_client_tag.length+1);
          // command = command.substr(cmd.__special_client_tag.length+1);
      } else
        command = url_path;

      //console.log ( ' url=' + server_request.url );
      //console.log ( ' command=' + command );

      if (command.startsWith(cmd.__special_url_tag))  {  // special access to files not
                                        // supposed to be on http(s) path --
                                        // download from job directory
                                        
        jm.ncSendFile ( command,server_response,url_parse.search );

      } else  {

        switch (command)  {

          case cmd.nc_command.stop :
              if (srvConfig.stoppable)  {
                log.standard ( 8,'stopping' );
                jm.writeNCJobRegister();
                response = new cmd.Response ( cmd.nc_retcode.ok,'','' );
                setTimeout ( function(){
                  server.close();
                  process.exit();
                },0);
              } else {
                log.detailed ( 8,'stop command issued -- ignored according configuration' )
              }
            break;

          case cmd.nc_command.countBrowser :
              browserCount++;
              response = new cmd.Response ( cmd.nc_retcode.ok,'','' );
            break;

          case cmd.fe_command.whoareyou :
              //var cfg = conf.getServerConfig();
              cmd.sendResponseMessage ( server_response,
                  cmd.appName() + ' NC-' + srvConfig.serNo + ' (' + srvConfig.name + ') ' +
                  cmd.appVersion() + ' ' + browserCount,'text/plain' );
            break;

          case cmd.nc_command.runJob :
              response = jm.ncMakeJob ( server_request,server_response );
            break;

          case cmd.nc_command.getNCInfo :
              response = rm.ncGetInfo ( server_request,server_response );
            break;

          case cmd.nc_command.getNCCapacity :
              rm.ncGetCapacity ( server_request,server_response );
            break;

          case cmd.nc_command.stopJob :
              pp.processPOSTData ( server_request,server_response,jm.ncStopJob,'active' );
            break;

          case cmd.nc_command.wakeZombieJobs :
              pp.processPOSTData ( server_request,server_response,jm.ncWakeZombieJobs,'active' );
            break;

          case cmd.nc_command.selectDir :
              pp.processPOSTData ( server_request,server_response,rm.ncSelectDir,'active' );
            break;

          case cmd.nc_command.selectFile :
              pp.processPOSTData ( server_request,server_response,rm.ncSelectFile,'active' );
            break;

          case cmd.nc_command.selectImageDir :
              pp.processPOSTData ( server_request,server_response,rm.ncSelectImageDir,'active' );
            break;

          case cmd.nc_command.runRVAPIApp :
              pp.processPOSTData ( server_request,server_response,jm.ncRunRVAPIApp,srvConfig.state );
            break;

          case cmd.nc_command.sendJobResults :
              pp.processPOSTData ( server_request,server_response,jm.ncSendJobResults,srvConfig.state );
            break;

          case cmd.nc_command.checkJobResults :
              pp.processPOSTData ( server_request,server_response,jm.ncCheckJobResults,srvConfig.state );
            break;

          case cmd.nc_command.getJobResults :
              pp.processPOSTData ( server_request,server_response,jm.ncGetJobResults,srvConfig.state );
            break;

          case cmd.nc_command.runClientJob :
              pp.processPOSTData ( server_request,server_response,jm.ncRunClientJob,srvConfig.state );
            break;

          default:
              response = new cmd.Response ( cmd.nc_retcode.unkCommand,
                                            '[00101] Unknown command "' + command +
                                            '" at number cruncher','' );

        }

        if (response)
          response.send ( server_response );

      }

    } catch (e)  {

      console.error ( e.stack || e );

      server.close();

      let maxRestarts = 100;
      if ('maxRestarts' in srvConfig)
        maxRestarts = srvConfig.maxRestarts;

      ncrash++;
      if ((maxRestarts<0) || (ncrash<maxRestarts))  {
        log.error  ( 13,'NC-' + nc_number + ' crash #' + ncrash + ', recovering ... ' );
        setTimeout ( function(){ start(); },0 );
      } else
        log.error  ( 14,'NC-' + nc_number + ' crash #' + ncrash + ', exceeds maximum -- stop.' );

    }

  });

  server.on ( 'error',function(e){
    log.error ( 15,'server error' );
    console.error ( e.stack || e );
  });

  server.listen({
    host      : srvConfig.host,
    port      : srvConfig.port,
    exclusive : srvConfig.exclusive
  },function(){
    if (srvConfig.exclusive)
      log.standard ( 7,'number cruncher #'  + nc_number +
                     ' started, listening to ' +
                     srvConfig.url() + ' (exclusive)' );
    else
      log.standard ( 7,'number cruncher #'  + nc_number +
                     ' started, listening to ' +
                     srvConfig.url() + ' (non-exclusive)' );

    setTimeout ( function(){
      jm.cleanNC ( true );
    },10000);

  });

  utils.setGracefulQuit();

}

// ---------------------------------------------------------------------------

start();
