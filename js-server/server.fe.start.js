
/*
 *  =================================================================
 *
 *    23.02.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const http      = require('http');
const path      = require('path');
const request   = require('request');
const httpProxy = require('http-proxy');

//  load application modules
const conf    = require('./server.configuration');
const pp      = require('./server.process_post');
const anl     = require('./server.fe.analytics');
const user    = require('./server.fe.user');
const rj      = require('./server.fe.run_job');
const comm    = require('./server.fe.communicate');
const rh      = require('./server.fe.request_handler');
const uh      = require('./server.fe.upload_handler');
const utils   = require('./server.utils');
const cmd     = require('../js-common/common.commands');

//  prepare log
const log     = require('./server.log').newLog(0);

// Create a proxy server
const proxy   = httpProxy.createProxyServer({});

// ==========================================================================

var ncrash = 0;
var tipNo  = 0;

function start ( callback_func )  {

  let feConfig  = conf.getFEConfig();
  let ncConfigs = conf.getNCConfigs();

  if (ncrash==0)  {
    feConfig.killPrevious();
    feConfig.savePID();
  }

  conf.setServerConfig ( feConfig );

  log.standard ( 1,'FE: url=' + feConfig.url() );
  for (let i=0;i<ncConfigs.length;i++)
    log.standard ( 2,'NC[' + i + ']: type=' + ncConfigs[i].exeType +
                     ' url=' + ncConfigs[i].url() + 
                     (ncConfigs[i].in_use ? '' : ' not in use') );
  log.standard ( 3,'Emailer: ' + conf.getEmailerConfig().type );

  utils.configureCache ( feConfig.cache );

  // read user login hash
  user.readUserLoginHash();

  // read job register
  rj.readFEJobRegister();
  //rj.cleanFEJobRegister();

  // read analytics
  anl.readFEAnalytics();

  //  instantiate the server
  let server = http.createServer();

  function commandServer ( nc_number,final_callback_function,command )  {
    if (nc_number<ncConfigs.length)  {
      /*
      if ((ncConfigs[nc_number].type!='FEProxy') &&
          (ncConfigs[nc_number].exeType!='CLIENT') &&
          ((ncConfigs[nc_number].stoppable || (command!=cmd.nc_command.stop))  {
      */
      if (ncConfigs[nc_number].in_use && ncConfigs[nc_number].stoppable &&
          (((ncConfigs[nc_number].type!='FEProxy') &&
            (ncConfigs[nc_number].exeType!='CLIENT')) ||
           feConfig.localSetup)) {
        request.post({
          url  : ncConfigs[nc_number].url() + '/' + command,
          body : {},
          json : true,
          rejectUnauthorized : feConfig.rejectUnauthorized
        }, function(err,httpResponse,response) {
          if (final_callback_function)
            commandServer ( nc_number+1,final_callback_function,command );
        });
      } else if (final_callback_function)
        commandServer ( nc_number+1,final_callback_function,command );
    } else if (final_callback_function)
      setTimeout ( final_callback_function,500);
  }

  function controlSignal ( options )  {
    let operation = options.operation;
    let protocol  = options.protocol;
    let node      = options.node;

    log.standard ( 7,'control signal received: <' + operation + ' ' +
                     protocol + ' ' + node + '>' );

    return {};

  }

  //  set up request listener
  server.on ( 'request', function(server_request,server_response)  {

    server_response.t_received = performance.now();

    server_response.setHeader ( 'Cross-Origin-Opener-Policy'  ,'same-origin'   );
    // server_response.setHeader ( 'Cross-Origin-Embedder-Policy','credentialles' );
    // server_response.setHeader ( 'Cross-Origin-Resource-Policy','same-origin'  );
    server_response.setHeader ( 'Cross-Origin-Embedder-Policy','require-corp' );
    // server_response.setHeader ( 'Cross-Origin-Embedder-Policy','credentialless' );
    // server_response.setHeader ( 'Referrer-Policy','no-referrer' );
    // server_response.setHeader ( 'Referrer-Policy','no-referrer-when-downgrade' );
    // server_response.setHeader ( 'Content-Encoding','deflate, compress, gzip' );
    // server_response.setHeader ( 'Content-Security-Policy',"script-src 'self'" );

    try {

      let c = new comm.Communicate ( server_request,server_response );

      switch (c.command)  {

        case cmd.fe_command.getInfo :
            pp.processPOSTData ( server_request,server_response,user.getInfo,'active' );
          break;

        case cmd.fe_command.getLocalInfo :
            pp.processPOSTData ( server_request,server_response,user.getLocalInfo,feConfig.state );
          break;

        case cmd.fe_command.getClientInfo :
            pp.processPOSTData ( server_request,server_response,conf.getClientInfo,'active' );
          break;

        case cmd.fe_command.getFEProxyInfo :
            pp.processPOSTData ( server_request,server_response,conf.getFEProxyInfo,'active' );
          break;

        case cmd.fe_command.login :
            pp.processPOSTData ( server_request,server_response,user.userLogin,feConfig.state );
          break;

        case cmd.fe_command.register :
            pp.processPOSTData ( server_request,server_response,user.makeNewUser,feConfig.state );
          break;

        case cmd.fe_command.recoverLogin :
            pp.processPOSTData ( server_request,server_response,user.recoverUserLogin,feConfig.state );
          break;

        case cmd.fe_command.request :
            pp.processPOSTData ( server_request,server_response,rh.requestHandler,'active' );
          break;

        case cmd.fe_command.upload :
            uh.handleUpload ( server_request,server_response );
          break;

        case cmd.fe_command.allocateJob :
            pp.processPOSTData ( server_request,server_response,rj.allocateJob,feConfig.state );
        break;

        case cmd.fe_command.jobFinished :
            rj.getJobResults ( c.job_token,server_request,server_response );
          break;

        case cmd.fe_command.cloudRun :
            rj.cloudRun ( server_request,server_response );
          break;

        case cmd.fe_command.cloudFetch :
            rj.cloudFetch ( server_request,server_response );
          break;

        case cmd.fe_command.remoteCheckIn :
            pp.processPOSTData ( server_request,server_response,user.remoteCheckIn,
                                 feConfig.state );
          break;

        case cmd.fe_command.remoteUserRation :
            pp.processPOSTData ( server_request,server_response,user.getRemoteUserRation,
                                 feConfig.state );
          break;

        case cmd.fe_command.checkSession :
            pp.processPOSTData ( server_request,server_response,user.checkSession,
                                 feConfig.state );
          break;

        case cmd.fe_command.control :
            pp.processPOSTData ( server_request,server_response,function(data){
              cmd.sendResponse ( server_response,cmd.fe_retcode.ok,controlSignal(data),'' );
            },'active' );
          break;

        case cmd.fe_command.checkAnnouncement :
            let rdata = {
              message : utils.readString ( path.join(feConfig.storage,user.__announcementFile) ),
              tips    : utils.readObject ( path.join('manuals','tips.json') )
            }
            if (rdata.tips)
              rdata.tips.tipNo = tipNo++;
            if ((!rdata.message) || rdata.message.startsWith('!#off'))
              rdata.message = '';
            cmd.sendResponse ( server_response,cmd.fe_retcode.ok,'',rdata );
          break;

        case cmd.fe_command.stop :
            if (conf.getFEConfig().stoppable)  {
              log.standard ( 6,'stopping' );
              commandServer ( 0,function(){
                server.close();
                cmd.sendResponse ( server_response,cmd.fe_retcode.ok,'','' );
                process.exit();
              },cmd.nc_command.stop);
            } else {
              log.standard ( 6,'stop command issued -- ignored according configuration' );
            }
          break;

        case cmd.fe_command.whoareyou :
            cmd.sendResponseMessage ( server_response,
                        cmd.appName() + ' FE ' + cmd.appVersion() +
                        ' CCP4-' + conf.CCP4Version() + ' ' + feConfig.state,
                        'text/plain' );
          break;

        case cmd.fe_command.status :
            conf.getAppStatus ( function(msg){
              cmd.sendResponseMessage ( server_response,msg,'text/plain' );
            });
          break;

        case cmd.fe_command.authResponse :
            user.authResponse ( server_request,server_response );
          break;

        case cmd.fe_command.ignore :
          break;

        case cmd.nc_command.getNCInfo :
            rj.ncGetInfo_remote ( server_request,server_response );
          break;

        default :

          if (c.filePath.startsWith(cmd.__special_rfe_tag))  {
            let clist = c.filePath.split('.');  // parse RFE token
            if (clist[2]==cmd.nc_command.runJob)  {
              // check credentials and quota
              let message = user.checkCredentials ( server_request,'cpu' );
              if (message)  {
                cmd.sendResponse ( server_response,cmd.fe_retcode.credCheckFailed,'',
                                   { run_remotely : true, message : message } );
                break;
              }
            }
            let furl  = conf.getNCConfig(parseInt(clist[1])).url(); // forward URL
            proxy.web ( server_request,server_response,
              { target : furl, changeOrigin : true }, (err) => {
                console.error('Proxy error:', err);
                server_response.writeHead ( 500, { 'Content-Type': 'text/plain' });
                server_response.end ( 'Proxy encountered an error.' );
            });
          } else
            c.sendFile ( server_response );

      }

    } catch (e)  {

      console.error ( e.stack || e );

      server.close();

      let maxRestarts = 100;
      if ('maxRestarts' in feConfig)
        maxRestarts = feConfig.maxRestarts;

      ncrash++;
      if ((maxRestarts<0) || (ncrash<maxRestarts))  {
        log.error  ( 6,'FE crash #' + ncrash + ', recovering ... ' );
        setTimeout ( function(){ start(null); },0 );
      } else
        log.error  ( 7,'FE crash #' + ncrash + ', exceeds maximum -- stop.' );

    }

  });

  server.on ( 'error',function(e){
    log.error ( 8,'server error' );
    console.error ( e.stack || e );
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

    setTimeout ( function(){
      rj.cleanFEJobRegister ( 5 );  // 5 attempts
      rj.setNCCapacityChecks();
    },10000);

    if (callback_func)
      callback_func();

  });

  utils.setGracefulQuit();
  
}


// ==========================================================================
// export for use in node
module.exports.start = start;
