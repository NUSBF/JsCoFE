
/*
 *  =================================================================
 *
 *    08.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019
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

  var options_proxy = {};
  var options_web   = { target : fe_url };
  if (fe_config.protocol=='https')  {
    options_proxy.secure = true;
    options_proxy.changeOrigin = true;
    options_proxy.target = {
      protocol : 'https:',
      host     : fe_config.host
    };
    options_web.secure = true;
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
  switch (proxy_config.localisation)  {
    case 3 : local_prefixes = ['images_','js-'];     break;
    case 2 : local_prefixes = ['images_','js-lib'];  break;
    case 1 : local_prefixes = ['images_'];           break;
    default: ;
  }

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
    cmd.sendResponse ( server_response, cmd.fe_retcode.proxyError,'Proxy error #2',{} );
  });

  var server = http.createServer ( function(server_request,server_response){

    try {

      var command = url.parse(server_request.url).pathname.substr(1).toLowerCase();

      switch (command)  {

        case cmd.fe_command.getClientInfo :
              conf.getClientInfo ( null,function(response){ response.send(server_response); });
            break;

        case cmd.fe_command.getFEProxyInfo :
              conf.getFEProxyInfo ( {},function(response){ response.send(server_response); });
            break;

        default :
              var responded = false;
              for (var i=0;(i<local_prefixes.length) && (!responded);i++)
                if (command.startsWith(local_prefixes[i]))  {
                  responded = true;
                  utils.send_file ( command,server_response,utils.getMIMEType(command),
                                    false,0,function(fpath,mimeType,deleteOnDone,capSize){
                    proxy.web ( server_request,server_response, options_web );
                  });
                }
              if (!responded)
                proxy.web ( server_request,server_response, options_web );

      }

    } catch (e)  {

      log.error ( 1,'fe-proxy failure on ' + command );
      cmd.sendResponse ( server_response, cmd.fe_retcode.proxyError,'Proxy error #1',{} );

    }

  });

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
