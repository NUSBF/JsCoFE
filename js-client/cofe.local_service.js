
/*
 *  =================================================================
 *
 *    08.10.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.local_service.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Functions for communication with local (on-client)
 *       ~~~~~~~~~  number cruncher
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

// local service url (used also as indicator of presentce in RVAPI)
var __local_service = null;     // full URL when defined
var __local_user    = false;    // true if running as a desktop
var __shared_fs     = false;    // shared file system setup when true
var __regMode       = 'email';  // 'email' (by user) or 'admin' (by admin)
var __exclude_tasks = [];
var __setup_desc    = null;     // setup description
var __check_session_period = 2000;  // in ms


// ---------------------------------------------------------------------------

function checkLocalService ( callback_func )  {

  function probeClient ( attemptCount,callback )  {
    localCommand ( nc_command.countBrowser,{},'Advance Browser Count',
      function(response){
        var count = attemptCount-1;
        if (!response)  {
          if (count<=0)  {
            __local_service = null;
            new MessageBox ( 'Local service',
              '<h2>Cannot connect to Local Service</h2>' +
              'You will not be able to use Coot and other local applications.<p>' +
              '<i>Local Service was either not launched or has terminated because ' +
              'of error.<br>Please contact ' + appName() + ' maintainer.<i>' );
            //return false;  // issue standard AJAX failure message
          }
        } else if (response.status!=nc_retcode.ok)  {
          //console.log ( ' point 1 ' + response.status );
          if (count<=0)  {
            __local_service = null;
            new MessageBox ( 'Local service',
              '<h2>Local Service Is Not Available</h2>' +
              'You will not be able to use Coot and other local applications.<p>' +
              '<i>Local Service was either not launched or has terminated because ' +
              'of error.<br>Please contact ' + appName() + ' maintainer.<i>' );
          }
        } else  {
          count = 0;
        }
        if (count>0)
              window.setTimeout ( function(){ probeClient(count); },100);
        else  callback();
        //else  getServerInfo();
        return true;
      });
  }

  function getServerInfo()  {
    serverCommand ( fe_command.getInfo,{},'getInfo',function(response){
      if (response.status==fe_retcode.ok)  {
        var rData = response.data;
        __exclude_tasks = rData.exclude_tasks;
        __cloud_storage = rData.cloud_storage;
        __demo_projects = rData.demo_projects;
        __local_setup   = rData.localSetup;
        __regMode       = rData.regMode;
        __setup_desc    = rData.setup_desc;
        __ccp4_version  = rData.ccp4_version;
        maintainerEmail = rData.maintainerEmail;
        __check_session_period = rData.check_session_period;
        __fe_url        = document.location.protocol + '//' +
                          document.location.host     +
                          document.location.pathname;
        if (rData.localuser)  {
          __local_user    = true;
          __login_user    = rData.localuser;
          __login_token   = rData.logintoken;
          __doNotShowList = rData.helpTopics;
        }
        if (!__local_service)
          serverCommand ( fe_command.getClientInfo,{},'getClientInfo',
                          function(rsp){
            if (rsp.status==fe_retcode.ok)  {
              __local_service = rsp.data.local_service;
              if (rsp.data.fe_url)
                __fe_url = rsp.data.fe_url;
            }
            if (__local_service)
                  probeClient ( 20,function(){ callback_func(0); });
            else  callback_func ( 0 );
            return true;
          });
        else
          callback_func ( 0 );
      } else  {
        new MessageBox ( 'Server not Configured',
            'Server not configured, contact administrator.' );
        callback_func ( 1 );
      }
      return true;
  //    alert ( JSON.stringify(response) );
    },null,null);
  }

  var n = window.location.search.indexOf ( 'lsp=' );
  var ls_protocol = 'http';
  if (n<0)  {
    n = window.location.search.indexOf ( 'lsps=' ) + 1;
    ls_protocol = 'https';
  }
  if (n>=1)  {
    var port = window.location.search.substring ( n+4 );
    if (startsWith(port,'http'))  // full specification of local service given
          __local_service  = port;
    else  __local_service = ls_protocol + '://' + localhost_name + ':' + port;

    // check that local service is actually running
    probeClient ( 20,function(){ getServerInfo(); });

  } else  {
    __local_service = null;
    getServerInfo();
  }
  // alert ( window.navigator.onLine );  -- seems to work

}


function ls_RVAPIAppButtonClicked ( base_url,command,data )  {

  if (__local_service)  {

    var data_obj = {};
    data_obj.base_url = base_url;
    data_obj.command  = command;
    data_obj.data     = data;

    //alert ( " url=" + base_url + ', command=' + command + ',  data=' + data );

    localCommand ( nc_command.runRVAPIApp,data_obj,'Local call',
      function(response){
        if (!response)
          return false;  // issue standard AJAX failure message
        if (response.status!=nc_retcode.ok)
          new MessageBox ( 'Local service',
            '<p>Launching local application ' + command +
            ' failed due to:<p><i>' + response.message +
            '</i><p>Please report this as a bug to <a href="mailto:' +
            maintainerEmail + '">' + maintainerEmail + '</a>' );
        return true;
      });

  }

}
