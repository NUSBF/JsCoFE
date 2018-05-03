
/*
 *  =================================================================
 *
 *    31.10.17   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

// local service url (used also as indicator of presentce in RVAPI)
var __local_service = null;   // full URL when defined
var __shared_fs     = false;  // shared file system setup when true

function checkLocalService()  {
//  alert ( ' search=' + window.location.search );
  var n = window.location.search.indexOf ( 'lsp=' );
  if (n>=0)  {
    var port = window.location.search.substring ( n+4 );
    if (port.startsWith('http:'))
          __local_service = port;
    else  __local_service = 'http://localhost:' + port;
  } else
    __local_service = null;
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
