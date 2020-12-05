
/*
 *  =================================================================
 *
 *    05.12.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.communication.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  validateUserData()
 *       ~~~~~~~~~  makeCommErrorMessage()
 *                  serverCommand()
 *                  serverRequest()
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */


var cofe_signals = {
  taskReady       : 'task_ready',         // fired by Job Dialog's input panels
  jobStarted      : 'job_started',        // fired by JobTree
  treeUpdated     : 'tree_updated',       // fired by JobTree
  reloadTree      : 'reload_tree',        // fired by JobTree
  makeProjectList : 'make_project_list',  // fired by JobTree
  jobDialogOpened : 'job_dialog_opened',  // fired by JobTree
  rationUpdated   : 'ration_updated',     // fired by JobTree
  jobDlgSignal    : 'job_dlg_signal',
  uploadEvent     : 'uploadEvent'         // fired by Upload module
}


function validateUserData ( user_inp,email_inp,login_inp )  {
//  All parameters are InputText classes, corresponding to the input of
//  user name, e-mail and login name, respectively
var msg = '';

  if (user_inp.getValue().length<=0)
    msg += '<b>User name</b> must be provided.<p>';
  /*
  else if (user_inp.element.validity.patternMismatch)
    msg += '<b>User name</b> should only contain latin letters, dots,<br>' +
           'dashes and spaces.<p>';
  */

  if (email_inp.getValue().length<=0)
    msg += '<b>E-mail address</b> must be provided.<p>';
  else if (email_inp.element.validity.typeMismatch)
    msg += '<b>E-mail address</b> should the correct one. Your temporary<br>' +
           'password will be sent to the e-mail provided.<p>';

  if (login_inp.getValue().length<=0)
    msg += '<b>Login name</b> must be provided.<p>';
  else if (login_inp.element.validity.patternMismatch)
    msg += '<b>Login name</b> should contain only latin letters, numbers,<br> ' +
           'undescores, dashes and dots, and must start with a letter.<p>';

  return msg;

}


function makeCommErrorMessage ( title,response )  {
// starts respective error message dialog
//    title:     dialog title string, which should correspond to error context
//    response:  Response structure

  switch (response.status)  {

    case fe_retcode.readError:
        MessageDataReadError ( title,response.message );
      break;

    case fe_retcode.jobballError:
        MessageDataReadError ( title,response.message );
      break;

    case fe_retcode.noProjectData:
        MessageNoProjectDataError ( title,response.message );
      break;

    case fe_retcode.writeError:
        MessageDataWriteError ( title,response.message );
      break;

    case fe_retcode.mkDirError:
        MessageMkDirError ( title,response.message );
      break;

    case fe_retcode.notLoggedIn:
        MessageNotLoggedIn ( title );
        //makePage ( new LogoutPage(__current_page.element.id) );
        logout ( __current_page.element.id,0 )
      break;

    case fe_retcode.uploadErrors:
        MessageUploadErrors ( title,response.message );
      break;

    case fe_retcode.noJobDir:
        MessageNoJobDir ( title );
      break;

    case fe_retcode.proxyError:
        MessageProxyError ( title );
      break;

    case fe_retcode.projectAccess:
        MessageProjectAccess ( title );
      break;

    default:
        //alert ( 'unknown error, response='+JSON.stringify(response) );
        MessageUnknownError ( title,'"'+response.message+'"' );

  }

}


function checkVersionMatch ( response,localServer_bool )  {

  var v0 = appVersion().split(' ')[0];
  var rs = response.version.split(' ');
  var v1 = rs[0];

  if (localServer_bool)
    return true;  // may need a better solution

  if (response.version!='*')  {  // else ignore (useful for debugging)
    if ((v0!=v1) && (rs[rs.length-1]=='client'))  {
      // this works when client version is different from server version
      if (v0.split('.')[1]!=v1.split('.')[1])  { // check 2nd version digit
        var whattodo = '';
        if (v1<v0)
              whattodo = 'Please update CCP4 setup on your computer';
        else  whattodo = 'The maintainer of your ' + appName() + ' setup should ' +
                         'update the setup<br>to the latest version';
        new MessageBox ( 'Incompatible Client Version',
            '<h2>Incompatible Client Version</h2>' +
            'Your device runs ' + appName() + ' Client version <b>' + rs[0] +
            ' ' + rs[1] + '</b>,<br>which is not compatible with version <b>' +
            appVersion() + '</b>, running<br>on the server.<p>' + whattodo +
            '.<p>You may use ' + appName() + ' by using the direct web-link, ' +
            'however,<br><i>Coot</i> and other graphical applications will ' +
            'not be available.'
        );
        return false;
      }
    } else if (v0<v1)  {
      // this works if server is updated in the midst of user's session
      new MessageBoxF ( appName() + ' update',
          '<center>' + appName() + ' has advanced to version' +
          '<br><center><sup>&nbsp;</sup><b><i>' +
          response.version + '</i></b><sub>&nbsp;</sub></center>' +
          'which is incompatible with version<br><center><sup>&nbsp;</sup><b><i>'
          + appVersion() + '</b></i><sub>&nbsp;</sub></center>you are currently using.' +
          '<hr/>' + appName() + ' will now update in your browser, which will ' +
          'end the current login<br>' +
          'session. Please login again after update; your projects and data should<br>' +
          'be safe, however, you may find that you cannot clone some old tasks.<hr/></center>',
          'Update',function(){
            location.reload();
          },true );
      return false;
    }
  }

  return true;

}


function serverCommand ( cmd,data_obj,page_title,function_response,
                         function_always,function_fail )  {
// used when no user is logged in

  $.ajax ({
    url     : cmd,
    async   : true,
    type    : 'POST',
    data    : JSON.stringify(data_obj),
    dataType: 'text'
  })
  .done ( function(rdata) {

    var rsp = jQuery.parseJSON ( rdata );
    if (checkVersionMatch(rsp,false))  {
      var response = jQuery.extend ( true, new Response(), rsp );
      if (!function_response(response))
        makeCommErrorMessage ( page_title,response );
    }

  })
  .always ( function(){
    if (function_always)
      function_always();
  })
  .fail ( function(xhr,err){
    if (function_fail)
          function_fail();
    else  MessageAJAXFailure(page_title,xhr,err);
  });

}


function serverRequest ( request_type,data_obj,page_title,function_ok,
                         function_always,function_fail )  {
// used when a user is logged in

  //var request = new Request ( request_type,__login_token.getValue(),data_obj );
  var request = new Request ( request_type,__login_token,data_obj );

  function execute_ajax ( attemptNo )  {

    $.ajax ({
      url     : fe_command.request,
      async   : true,
      type    : 'POST',
      data    : JSON.stringify(request),
      dataType: 'text'
    })
    .done ( function(rdata) {

/*  only for testing!!!!
if ((typeof function_fail === 'string' || function_fail instanceof String) &&
          (function_fail=='persist')) {
  if (attemptNo>0)  {
    execute_ajax ( attemptNo-1 );
    return;
  }
}
*/

      var rsp = jQuery.parseJSON ( rdata );
      if (checkVersionMatch(rsp,false))  {
        var response = jQuery.extend ( true, new Response(), rsp );
        if (response.status==fe_retcode.ok)  {
          if (function_ok)
            function_ok ( response.data );
        } else
          makeCommErrorMessage ( page_title,response );
        // we put this function here and in fail section because we do not want to
        // have it executed multiple times due to multiple retries
        if (function_always)
          function_always(0,response.data);
      }

    })

    .always ( function(){})

    .fail ( function(xhr,err){

      if ((typeof function_fail === 'string' || function_fail instanceof String) &&
          (function_fail=='persist')) {

        if (attemptNo>0)  {
          execute_ajax ( attemptNo-1 );
          return;
        } else
          MessageAJAXFailure ( page_title,xhr,err );

      } else if (function_fail)
        function_fail();
      else
        MessageAJAXFailure ( page_title,xhr,err );

      // we put this function here and in done section because we do not
      // want to have it executed multiple times due to multiple retries
      if (function_always)
        function_always ( 1,{} );

    });

  }

  execute_ajax ( __persistence_level );

}


function localCommand ( cmd,data_obj,command_title,function_response )  {
// used to communicate with local (client-side) server
//   cmd:               an NC command
//   data_obj:          data object to pass with the command
//   command_title:     identification title for error messages
//   function_response: callback function, invoked when server relpies to
//                      command. The only argument to response function is
//                      a common.commands::Response class filled with data
//                      sent by the server. The function should return false
//                      in case something is wrong, in which case a
//                      communication error message box is displayed.

  if (!__local_service)
    return;

//console.log ( ' url=' + __local_service + "/" + cmd );
//alert ( ' url=' + __local_service + "/" + cmd );

  $.ajax ({
    url     : __local_service + '/' + cmd,
    async   : true,
    type    : 'POST',
    data    : JSON.stringify(data_obj),
    dataType: 'text',
    crossDomain: true,
    timeout : 0  // in ms; '0' means no timeout
  })
  .done ( function(rdata) {

//    alert ( ' done rdata=' + rdata );
//console.log ( ' rdata=' + rdata );

    var rsp = jQuery.parseJSON ( rdata );
    if (checkVersionMatch(rsp,true))  {
      var response = jQuery.extend ( true,new Response(),rsp );
      if (function_response && (!function_response(response)))
        makeCommErrorMessage ( command_title,response );
    }

  })
  .always ( function(){} )
  .fail   ( function(xhr,err){
//console.log ( ' local request to ' + __local_service + '/' + cmd + ' failed ' + err );
//console.log ( xhr );
    if (function_response && (!function_response(null)))
      MessageAJAXFailure(command_title,xhr,err);
  });

}


function downloadFile ( uri )  {
var hiddenALinkID = 'hiddenDownloader';
var alink = document.getElementById(hiddenALinkID);
  if (!alink)  {
    alink    = document.createElement('a');
    alink.id = hiddenALinkID;
    alink.style.display = 'none';
    alink.type          = 'application/octet-stream';
    document.body.appendChild(alink);
  }
  alink.download = uri.split('/').pop();
  alink.href     = uri;
  alink.click();
}


function getJobFileURL ( jobId,filePath )  {
  var url = __special_url_tag + '/';
  if (__login_token)
        url += __login_token;
  else  url += '404';
  return url + '/' + __current_project + '/' + jobId + '/' + filePath;
}


function downloadJobFile ( jobId,filePath )  {
  /*
  var url = __special_url_tag + '/';
  if (__login_token)
        url += __login_token;
  else  url += '404';
  url += '/' + __current_project + '/' + jobId + '/' + filePath;
  downloadFile ( url );
  */
  downloadFile ( getJobFileURL(jobId,filePath) );
}

/*  commented on 17.07.2020
window.onbeforeunload = function(e)  {
  serverCommand ( fe_command.stop,{},'stopping',null,null,function(){} );
}
*/


/*
function setQuitDestructor()  {

  window.addEventListener('beforeunload', function (e) {
    // Cancel the event as stated by the standard.
    e.preventDefault();
    // Chrome requires returnValue to be set.
    e.returnValue = '';
    alert ( 'unload' );
    //localCommand  ( nc_command.stop,{},'stopping',function(){} );
    serverCommand ( fe_command.stop,{},'stopping',function(response){
      alert ('response');
    },null,function(){} );
    return true;
  });

}
*/
