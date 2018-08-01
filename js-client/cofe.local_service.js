
/*
 *  =================================================================
 *
 *    31.07.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

// local service url (used also as indicator of presentce in RVAPI)
var __local_service = null;   // full URL when defined
var __local_user    = false;  // true if running as a desktop
var __shared_fs     = false;  // shared file system setup when true
var __exclude_tasks = [];

function checkLocalService ( callback_func )  {
//  alert ( ' search=' + window.location.search );
  var n = window.location.search.indexOf ( 'lsp=' );
  if (n>=0)  {
    var port = window.location.search.substring ( n+4 );
//    if (port.startsWith('http:'))
    if (startsWith(port,'http:'))
          __local_service = port;
    else  __local_service = 'http://localhost:' + port;
  } else
    __local_service = null;
  //__local_user = (window.location.search.indexOf('lusr')>=0);

  serverCommand ( fe_command.getInfo,{},'getInfo',function(response){
    if (response.status==fe_retcode.ok)  {
      if (response.data.localuser)  {
        __local_user    = true;
        __login_user    = response.data.localuser;
        __login_token   = response.data.logintoken;
        __doNotShowList = response.data.helpTopics;
        __exclude_tasks = response.data.exclude_tasks;
      }
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
