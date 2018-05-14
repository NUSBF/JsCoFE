
/*
 *  =================================================================
 *
 *    01.05.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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

//  load system modules
var http   = require('http');
var url    = require('url');
var path   = require('path');

//  load application modules
var utils  = require('./js-server/server.utils');
var conf   = require('./js-server/server.configuration');
var pp     = require('./js-server/server.process_post');
var cmd    = require('./js-common/common.commands');
var jm     = require('./js-server/server.nc.job_manager');
var rm     = require('./js-server/server.nc.requests');

//  prepare log
var log = require('./js-server/server.log').newLog(1);


// ==========================================================================

// check server serial number

function cmdLineError()  {
  log.error ( 7,'Incorrect command line. Stop.' );
  if (conf.getNumberOfNCs()>0)
    log.error ( 8,'Restart as "node ./nc_server.js configFile n", ' +
                        'with 0 <= n < ' + conf.getNumberOfNCs() );
  else
    log.error ( 8,'Restart as "node ./nc_server.js configFile n", where ' +
                        '"n" is the NC serial number')
  process.exit();
}

if (process.argv.length!=4)
  cmdLineError();

var msg = conf.readConfiguration ( process.argv[2],'NC' );
if (msg)  {
  log.error ( 9,'NC configuration failed. Stop.' );
  log.error ( 9,msg );
  process.exit();
}

if (isNaN(process.argv[3]))
  cmdLineError();

var nc_number = parseInt ( process.argv[3] );

if ((nc_number<0) || (nc_number>=conf.getNumberOfNCs()))
  cmdLineError();


// --------------------------------------------------------------------------

conf.setServerConfig ( conf.getNCConfig(nc_number) );
var srvConfig = conf.getServerConfig();

// --------------------------------------------------------------------------

var ncrash = 0;

function start()  {

  //log.standard ( 1,'FE: url=' + conf.getFEConfig().url() );
  log.standard ( 1,'NC[' + nc_number + ']: type=' +
                   conf.getNCConfig(nc_number).exeType +
                   ' url=' + conf.getNCConfig(nc_number).url() );
  log.standard ( 2,'Emailer: ' + conf.getEmailerConfig().type );

  // --------------------------------------------------------------------------

  // check server storage and configure it if necessary

  var jobsDir = jm.ncGetJobsDir();
  if (!utils.fileExists(jobsDir))  {
    if (!utils.mkDir(jobsDir))  {
      log.error ( 10,'cannot create job area at ' + jobsDir );
      process.exit();
    } else  {
      log.standard ( 5,'created job area at ' + jobsDir );
    }
  }

  // resume job management

  jm.readNCJobRegister();

  // --------------------------------------------------------------------------

  //  instantiate server
  var server = http.createServer();

  //  make request listener
  server.on ( 'request', function(server_request,server_response)  {

    try {

      var response = null;
      var command  = '';

      // Parse the server request command
      var url_parse = url.parse(server_request.url);
      var url_path  = url_parse.pathname;
      if (url_path.length>0)  // remove leading slash
            command = url_path.substr(1);
      else  command = url_path;

      //console.log ( ' url=' + server_request.url );
      //console.log ( ' command=' + command );

      if (command.startsWith(cmd.special_url_tag))  {  // special access to files not
                                        // supposed to be on http path --
                                        // download from job directory

        jm.ncSendFile ( command,server_response,url_parse.search );

      } else  {

        switch (command)  {

          case cmd.nc_command.stop :
              if (srvConfig.stoppable)  {
                log.standard ( 7,'stopping' );
                jm.writeNCJobRegister();
                response = new cmd.Response ( cmd.nc_retcode.ok,'','' );
                setTimeout ( function(){
                  server.close();
                  process.exit();
                },0);
              } else {
                log.detailed ( 7,'stop command issued -- ignored according configuration' )
              }
            break;

          case cmd.nc_command.runJob :
              response = jm.ncMakeJob ( server_request,server_response );
            break;

          case cmd.nc_command.getNCInfo :
              response = rm.ncGetInfo ( server_request,server_response );
            break;

          case cmd.nc_command.stopJob :
              pp.processPOSTData ( server_request,server_response,jm.ncStopJob );
            break;

          case cmd.nc_command.selectDir :
              pp.processPOSTData ( server_request,server_response,rm.ncSelectDir );
            break;

          case cmd.nc_command.runRVAPIApp :
              pp.processPOSTData ( server_request,server_response,jm.ncRunRVAPIApp );
            break;

          case cmd.nc_command.runClientJob :
              pp.processPOSTData ( server_request,server_response,jm.ncRunClientJob );
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

      var maxRestarts = 100;
      if ('maxRestarts' in srvConfig)
        maxRestarts = srvConfig.maxRestarts;

      ncrash++;
      if ((maxRestarts<0) || (ncrash<maxRestarts))  {
        log.error  ( 10,'NC-' + nc_number + ' crash #' + ncrash + ', recovering ... ' );
        setTimeout ( function(){ start(); },0 );
      } else
        log.error  ( 11,'NC-' + nc_number + ' crash #' + ncrash + ', exceeds maximum -- stop.' );

    }

  });

  server.on ( 'error',function(e){
    log.error ( 12,'server error' );
    console.error ( e.stack || e );
  });


  server.listen({
    host      : srvConfig.host,
    port      : srvConfig.port,
    exclusive : srvConfig.exclusive
  },function(){
    if (srvConfig.exclusive)
      log.standard ( 6,'number cruncher #'  + nc_number +
                     ' started, listening to ' +
                     srvConfig.url() + ' (exclusive)' );
    else
      log.standard ( 6,'number cruncher #'  + nc_number +
                     ' started, listening to ' +
                     srvConfig.url() + ' (non-exclusive)' );
  });

}

start();
