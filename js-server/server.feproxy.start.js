
/*
 *  =================================================================
 *
 *    26.03.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2020
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
var path      = require('path');

//  load application modules
var conf      = require('./server.configuration');
var utils     = require('./server.utils');
var cmd       = require('../js-common/common.commands');

//  prepare log
var log = require('./server.log').newLog(22);


// ==========================================================================

function start ( callback_func )  {

  var proxy_config  = conf.getFEProxyConfig ();
  var fe_config     = conf.getFEConfig      ();
  //var client_config = conf.getClientNCConfig();
  var fe_url        = fe_config.url();

  log.standard ( 1,'setting up proxy for ' + fe_url + ' ' + fe_config.host );

  proxy_config.killPrevious();
  proxy_config.savePID();

  //var options_proxy = { proxyTimeout : 100, timeout : 0 };
  //var options_web   = { target  : fe_url, timeout : 0 };
  var options_proxy = {
    target       : fe_url,
    changeOrigin : true
  };
  //var options_web = {
  //  target : fe_url
  //};
  if (fe_config.protocol=='https')  {
    options_proxy.secure = true;
    //options_proxy.changeOrigin = true;
    //options_web  .changeOrigin = true;
    //options_proxy.target = {
    //  protocol : 'https:',
    //  host     : fe_config.host
    //};
    //options_web.secure = true;
    var https = require('https');
    //options_proxy.agent = new https.Agent ({ keepAlive: true, maxSockets: 10000 });
    //options_web  .agent = new https.Agent ({ keepAlive: true, maxSockets: 10000 });
    options_proxy.agent = new https.Agent ({ keepAlive: true });
    //options_web  .agent = new https.Agent ({ keepAlive: true });
  } else  {
    //options_proxy.agent = new http.Agent ({ keepAlive: true, maxSockets: 10000 });
    //options_web  .agent = new http.Agent ({ keepAlive: true, maxSockets: 10000 });
    options_proxy.secure = false;
    //options_proxy.changeOrigin = true;
    options_proxy.agent = new http.Agent ({ keepAlive: true });
    //options_web  .agent = new http.Agent ({ keepAlive: true });
  }

/*
  httpProxy.createProxyServer({
    target: {
      protocol: 'https:',
      host: 'my-domain-name',
      port: 443,
      pfx: fs.readFileSync('path/to/certificate.p12'),
      passphrase: 'password',
    },
    changeOrigin: true,
  }).listen(8000);
*/

  var local_prefixes = [];
  //console.log ( ' localisation='+proxy_config.localisation );
  switch (proxy_config.localisation)  {
    case 3 : local_prefixes = local_prefixes.concat ([
               'js-client/', 'js-common/', 'js-server/'
             ]);
    case 2 : local_prefixes = local_prefixes.concat ([
               'js-lib/', '/jsrview/'
             ]);
    case 1 : local_prefixes = local_prefixes.concat ([
               'images_com/','images_png/','images_svg/',
               'css/', 'manuals/', 'html/'
             ]);
    default: ;
  }
  //console.log ( ' local_prefixes='+JSON.stringify(local_prefixes) );

  // --------------------------------------------------------------------------
  // Create a proxy server with custom application logic

  var proxy = httpProxy.createProxyServer ( options_proxy );

  proxy.on ( 'error', function(err,server_request,server_response){
    /*
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Something went wrong. And we are reporting a custom error message.');
    */
    //log.error ( 2,'fe-proxy failure' );
    //cmd.sendResponse ( server_response, cmd.fe_retcode.proxyError,'Proxy error #2',{} );
    //log.warning ( 3,'failed proxy fetch ' + url.parse(server_request.url).pathname.substr(1) );
    //log.warning ( 3,'             error ' + err );
    log.warning ( 3,err + ' fetching ' + url.parse(server_request.url).pathname.substr(1) );
    proxy.web ( server_request,server_response ); //, options_web );
/*  -- losing internet symptoms:
    [2019-10-29T02:42:46.962Z] 22-003 +++ Error: socket hang up fetching =check_session
    [2019-10-29T02:43:14.071Z] 22-003 +++ Error: read ECONNRESET fetching =check_session
    [2019-10-29T02:43:14.166Z] 22-003 +++ Error: read ECONNRESET fetching xxJsCoFExx/usage_stats/task.tsk
    [2019-10-29T02:43:35.116Z] 22-003 +++ Error: connect ETIMEDOUT 130.246.93.68:443 fetching =check_session
    [2019-10-29T02:43:35.120Z] 22-003 +++ Error: getaddrinfo ENOTFOUND cloud.ccp4.ac.uk cloud.ccp4.ac.uk:443 fetching =check_session
    [2019-10-29T02:43:35.120Z] 22-003 +++ Error: getaddrinfo ENOTFOUND cloud.ccp4.ac.uk cloud.ccp4.ac.uk:443 fetching =check_session
    [2019-10-29T02:43:35.124Z] 22-003 +++ Error: getaddrinfo ENOTFOUND cloud.ccp4.ac.uk cloud.ccp4.ac.uk:443 fetching =check_session
    [
*/
  });

  // Listen to the `upgrade` event in order to proxy the WebSocket requests as well.
  proxy.on ( 'upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
  });

  var server = http.createServer ( function(server_request,server_response){

//    try {

      var command = url.parse(server_request.url).pathname.substr(1);

      switch (command.toLowerCase())  {

        case cmd.fe_command.getClientInfo :
              conf.getClientInfo ( null,function(response){ response.send(server_response); });
            break;

        case cmd.fe_command.getFEProxyInfo :
              conf.getFEProxyInfo ( {},function(response){ response.send(server_response); });
            break;

        default :
              var n = -1;
              for (var i=0;(i<local_prefixes.length) && (n<0);i++)
                n = command.lastIndexOf ( local_prefixes[i] );
              if (n>=0)  {
                var fpath;
                if (local_prefixes[i]=='/jsrview/')
                      fpath = path.join ( 'js-lib',command.slice(n+1) );
                else  fpath = command.slice(n);
                utils.send_file ( fpath,server_response,utils.getMIMEType(fpath),
                                  false,0,0,
                                  function(filepath,mimeType,deleteOnDone,capSize){
                  proxy.web ( server_request,server_response ); //, options_web );
                  return false;  // no standard processing
                });
              } else
                proxy.web ( server_request,server_response ); //, options_web );

              /*
              var fpath     = '';
              var responded = false;
              for (var i=0;(i<local_prefixes.length) && (!responded);i++)  {
                var n = command.lastIndexOf ( local_prefixes[i] );
                if (n>=0)  {
                  responded = true;
                  if (local_prefixes[i]=='/jsrview/')
                        fpath = path.join ( 'js-lib',command.slice(n+1) );
                  else  fpath = command.slice(n);
                  utils.send_file ( fpath,server_response,utils.getMIMEType(fpath),
                                    false,0,0,function(filepath,mimeType,deleteOnDone,capSize){
                    proxy.web ( server_request,server_response ); //, options_web );
                    return false;  // no standard processing
                  });
                }
              }
              if (!responded)  {
                proxy.web ( server_request,server_response ); //, options_web );
              }
              */

      }

//    } catch (e)  {
//
//      log.error ( 1,'fe-proxy failure on ' + command );
//      cmd.sendResponse ( server_response, cmd.fe_retcode.proxyError,'Proxy error #1',{} );
//
//    }

  });

  /*
  server.on('connection', function (socket) {
      'use strict';
      //console.log('server.on.connection - setNoDelay');
      socket.setNoDelay(true);
  });
  */

  server.listen({
    host      : proxy_config.host,
    port      : proxy_config.port,
    exclusive : proxy_config.exclusive
  },function(){

    if (proxy_config.exclusive)
      log.standard ( 2,'front-end proxy started, listening to ' +
                       proxy_config.url() + ' (exclusive)' );
    else
      log.standard ( 2,'front-end proxy started, listening to ' +
                       proxy_config.url() + ' (non-exclusive)' );

    if (callback_func)
      callback_func();

  });

}

// ==========================================================================
// export for use in node
module.exports.start = start;
