
/*
 *  =================================================================
 *
 *    06.11.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2022
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

'use strict';

const http      = require('http');
const https     = require('https');
const httpProxy = require('http-proxy');
const url       = require('url');
const path      = require('path');

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(22);


// ==========================================================================

function start ( callback_func )  {

  let proxy_config  = conf.getFEProxyConfig ();
  let fe_config     = conf.getFEConfig      ();
  let client_config = conf.getClientNCConfig();
  let fe_url        = fe_config.url();
  let client_url    = null;

  log.standard ( 1,'setting up proxy for ' + fe_url + ' ' + fe_config.host );

  proxy_config.killPrevious();
  proxy_config.savePID();

  //let options_proxy = { proxyTimeout : 100, timeout : 0 };
  //let options_web   = { target  : fe_url, timeout : 0 };
  let options_proxy = {
    target       : fe_url,
    changeOrigin : true
  };
  let options_web = {
    // target : fe_url
    // rejectUnauthorized : proxy_config.rejectUnauthorized
  };
  if (fe_config.protocol=='https')  {

    // https://git.coolaj86.com/coolaj86/ssl-root-cas.js
    // let rootCas = require('ssl-root-cas').create();
    // https.globalAgent.options.ca = rootCas;

    options_proxy.secure = true;
    //options_proxy.changeOrigin = true;
    //options_web  .changeOrigin = true;
    //options_proxy.target = {
    //  protocol : 'https:',
    //  host     : fe_config.host
    //};
    //options_web.secure = true;
    //options_proxy.agent = new https.Agent ({ keepAlive: true, maxSockets: 10000 });
    //options_web  .agent = new https.Agent ({ keepAlive: true, maxSockets: 10000 });
    options_proxy.agent = new https.Agent ({
      keepAlive: true,
      rejectUnauthorized: proxy_config.rejectUnauthorized
    });
    //options_web  .agent = new https.Agent ({ keepAlive: true });
  } else  {
    //options_proxy.agent = new http.Agent ({ keepAlive: true, maxSockets: 10000 });
    //options_web  .agent = new http.Agent ({ keepAlive: true, maxSockets: 10000 });
    options_proxy.secure = false;
    //options_proxy.changeOrigin = true;
    options_proxy.agent = new http.Agent ({
      keepAlive: true,
      rejectUnauthorized: proxy_config.rejectUnauthorized
    });
    //options_web  .agent = new http.Agent ({ keepAlive: true });
  }

/*
  proxyTimeout: timeout (in millis) for outgoing proxy requests
  timeout: timeout (in millis) for incoming requests
*/

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

  let local_prefixes = [];
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

  let proxy = httpProxy.createProxyServer ( options_proxy );

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
    log.warning ( 3,'Proxy-server' + err + ' fetching ' + 
                    url.parse(server_request.url).pathname.substr(1) );
    // setTimeout ( function(){
    //   proxy.web ( server_request,server_response,options_web );
    // },10);
    // *** proxy.web ( server_request,server_response,options_proxy );
  });

  // Listen to the `upgrade` event in order to proxy the WebSocket requests as well.
  proxy.on ( 'upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
  });


  // -----------------------------------------------------------
  // Set proxy for client server

  let proxy_client = null;
  let options_proxy_client = null;

  if (client_config)  {

    client_url = client_config.url();
    log.standard ( 2,'setting up proxy for ' + client_url + ' ' + client_config.host );
    let options_proxy_client = {
      target       : client_url,
      changeOrigin : true,
      secure       : false,
      agent        : new http.Agent({ keepAlive: true })
    };

    proxy_client = httpProxy.createProxyServer ( options_proxy_client );

    proxy_client.on ( 'error', function(err,server_request,server_response){
      log.warning ( 4,'Proxy-client ' + err + ' fetching ' + 
                       url.parse(server_request.url).pathname.substr(1) );
      // setTimeout ( function(){
      //   // proxy_client.web ( server_request,server_response,options_web );
      //   proxy_client.web ( server_request,server_response,options_proxy_client );
      // },10);
    });

    // Listen to the `upgrade` event in order to proxy the WebSocket requests as well.
    proxy_client.on ( 'upgrade', function(req,socket,head){
      proxy_client.ws ( req, socket, head );
    });

  }


  let server = http.createServer ( function(server_request,server_response){

    let command = url.parse(server_request.url).pathname.substr(1);

    // console.log ( ' >>>>client ' + command );

    switch (command.toLowerCase())  {

      case cmd.fe_command.getClientInfo :
            conf.getClientInfo ( null,function(response){
              response.version  += ' client';
              response.data.via_proxy = true;
              response.send ( server_response );
            });
          break;

      case cmd.fe_command.getFEProxyInfo :
            conf.getFEProxyInfo ( {},function(response){
              response.version  += ' client';
              response.data.via_proxy = true;
              response.send ( server_response );
            });
          break;

      default :
            let n = -1;
            for (let i=0;(i<local_prefixes.length) && (n<0);i++)
              n = command.lastIndexOf ( local_prefixes[i] );
            if (n>=0)  {
              let fpath;
              if (local_prefixes[i]=='/jsrview/')
                    fpath = path.join ( 'js-lib',command.slice(n+1) );
              else  fpath = command.slice(n);
              utils.send_file ( fpath,server_response,utils.getMIMEType(fpath),
                                false,0,0,
                                function(filepath,mimeType,deleteOnDone,capSize){
                // proxy.web ( server_request,server_response, options_web );
                proxy.web ( server_request,server_response, options_proxy );
                return false;  // no standard processing
              });
            } else if (proxy_client && command.startsWith(cmd.__special_client_tag)) {
              // console.log ( ' >>>>1 ' + command );
              // proxy_client.web ( server_request,server_response, options_web );
              proxy_client.web ( server_request,server_response, options_proxy_client );
            } else
              proxy.web ( server_request,server_response, options_web );

    }

  });

  server.listen({
    host      : proxy_config.host,
    port      : proxy_config.port,
    exclusive : proxy_config.exclusive
  },function(){

    if (proxy_config.exclusive)
      log.standard ( 3,'front-end proxy started, listening to ' +
                       proxy_config.url() + ' (exclusive)' );
    else
      log.standard ( 3,'front-end proxy started, listening to ' +
                       proxy_config.url() + ' (non-exclusive)' );

    if (callback_func)
      callback_func();

  });

}

// ==========================================================================
// export for use in node
module.exports.start = start;
