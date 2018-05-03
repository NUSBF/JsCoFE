
/*
 *  =================================================================
 *
 *    25.03.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.start.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var http    = require('http');
var request = require('request');

//  load application modules
var conf  = require('./server.configuration');
var pp    = require('./server.process_post');
var user  = require('./server.fe.user');
var fcl   = require('./server.fe.facilities');
var rj    = require('./server.fe.run_job');
var comm  = require('./server.fe.communicate');
var rh    = require('./server.fe.request_handler');
var uh    = require('./server.fe.upload_handler');
var cmd   = require('../js-common/common.commands');

//  prepare log
var log = require('./server.log').newLog(0);

// ==========================================================================

function start ( callback_func )  {

  var feConfig  = conf.getFEConfig ();
  var ncConfigs = conf.getNCConfigs();
  conf.setServerConfig ( feConfig );

  log.standard ( 1,'FE: url=' + feConfig.url() );
  for (var i=0;i<ncConfigs.length;i++)
    log.standard ( 2,'NC[' + i + ']: type=' + ncConfigs[i].exeType +
                     ' url=' + ncConfigs[i].url() );
  log.standard ( 3,'Emailer: ' + conf.getEmailerConfig().type );

  // initialize facilities
  /*
  if (!fcl.checkFacilities(''))  {
    if (!fcl.initFacilities(''))  {
      log.standard ( 4,'facilities fault -- stop.' );
      return;
    }
  }
  */

  // read user login hash
  user.readUserLoginHash();

  // read job register
  rj.readFEJobRegister();

  //  instantiate the server
  var server = http.createServer();

  function stopServer ( nc_number )  {
    if (nc_number<ncConfigs.length)  {
      if (ncConfigs[nc_number].stoppable)  {
        request.post({
          url      : ncConfigs[nc_number].url() + '/' + cmd.nc_command.stop,
          formData : {}
        }, function(err,httpResponse,response) {
          stopServer ( nc_number+1 );
        });
      } else
        stopServer ( nc_number+1 );
    } else  {
      setTimeout ( function(){
        server.close();
        process.exit();
      },500);
    }
  }

  //  set up request listener
  server.on ( 'request', function(server_request,server_response)  {

    var c = new comm.Communicate ( server_request,server_response );

    switch (c.command)  {

      case cmd.fe_command.login :
          pp.processPOSTData ( server_request,server_response,user.userLogin );
        break;

      case cmd.fe_command.register :
          pp.processPOSTData ( server_request,server_response,user.makeNewUser );
        break;

      case cmd.fe_command.recoverLogin :
          pp.processPOSTData ( server_request,server_response,user.recoverUserLogin );
        break;

      case cmd.fe_command.request :
          pp.processPOSTData ( server_request,server_response,rh.requestHandler );
        break;

      case cmd.fe_command.upload :
          uh.handleUpload ( server_request,server_response );
        break;

      case cmd.fe_command.jobFinished :
          rj.getJobResults ( c.job_token,server_request,server_response );
        break;

      case cmd.fe_command.stop :
          if (conf.getFEConfig().stoppable)  {
            log.standard ( 6,'stopping' );
            cmd.sendResponse ( server_response,cmd.fe_retcode.ok,'','' );
            stopServer ( 0 );
          } else {
            log.detailed ( 6,'stop command issued -- ignored according configuration' );
          }
        break;

      default :
          c.sendFile ( server_response );

    }

  });

  server.listen({
    host      : feConfig.host,
    port      : feConfig.port,   // zero is acceptable
    exclusive : feConfig.exclusive
  },function(){

    feConfig.port = server.address().port;  // reassigned if port was zero

    if (feConfig.exclusive)
      log.standard ( 5,'front-end started, listening to ' +
                     feConfig.url() + ' (exclusive)' );
    else
      log.standard ( 5,'front-end started, listening to ' +
                     feConfig.url() + ' (non-exclusive)' );

    if (callback_func)
      callback_func();

  });

}


// ==========================================================================
// export for use in node
module.exports.start = start;
