
/*
 *  =================================================================
 *
 *    24.01.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.communication.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Communicartion functions
 *       ~~~~~~~~~  
 * 
 *   function validateUserData      ( user_inp,email_inp,login_inp )
 *   function makeCommErrorMessage  ( title,request_type,response )
 *   function checkVersionMatch     ( response,localServer_bool )  
 *   function makeJSONString        ( data_obj )
 *   function clearNetworkIndicators()
 *   function __process_network_indicators()
 *   function processServerQueue    ()
 *   function processLocalQueue     ()
 *   function printServerQueueState ( checkPoint)
 *   function __server_command      ( cmd,data_obj,page_title,function_response,
 *                                    function_always,function_fail,sqid )
 *   function __server_request      ( request_type,data_obj,page_title,function_ok,
 *                                    function_always,function_fail,sqid )
 *   function local_command         ( cmd,data_obj,command_title,function_response )
 *   function promptSessionCheck    ( cmd )
 *   function serverCommand         ( cmd,data_obj,page_title,function_response,
 *                                    function_always,function_fail )
 *   function serverRequest         ( request_type,data_obj,page_title,function_ok,
 *                                    function_always,function_fail )
 *   function localCommand          ( cmd,data_obj,command_title,function_response )
 *   function downloadFile          ( uri )
 *   function fetchFile             ( furl,function_success,function_always,
                                      function_fail )
 *   function fetchJobFile          ( task,fname,function_success,function_always,
                                      function_fail )
 *   function fetchJobOutputFile    ( task,fname,function_success,function_always,
                                      function_fail )
 *   function getJobFileURL             ( jobId,filePath )
 *   function downloadJobFile           ( jobId,filePath )
 *   function setCommunicatingIFrame    ( holder,iframe )
 *   function setCommunicationFrameData ( fid,dataName,data )
 *   function getCommunicationFrameData ( fid,dataName )
 *   function removeCommunicatingIFrame ( fid )
 *   function getNofCommunicatingIFrames()
 *   function onWindowMessage           ( event )
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

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
let msg = '';

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
           'underscores, dashes and dots, and must start with a letter.<p>';

  return msg;

}


function makeCommErrorMessage ( title,request_type,response )  {
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
        if (request_type!=fe_reqtype.logout)
          logout ( __current_page.element.id,0,function(){
            MessageNotLoggedIn ( title );
          });
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

    case fe_retcode.serverInactive:
        MessageServerInactive();
      break;

    case fe_retcode.fileNotFound:
        MessageFileNotFound ( response.message );
      break;

    default:
        //alert ( 'unknown error, response='+JSON.stringify(response) );
        MessageUnknownError ( title,'"'+response.message+'"' );

  }

}


function checkVersionMatch ( response,localServer_bool )  {

  let v0 = appVersion().split(' ')[0];
  let rs = response.version.split(' ');
  let v1 = rs[0];

  if (localServer_bool)
    return true;  // may need a better solution

  if (response.version!='*')  {  // else ignore (useful for debugging)
    if ((v0!=v1) && (rs[rs.length-1]=='client'))  {
      // this works when client version is different from server version
      if (v0.split('.')[1]!=v1.split('.')[1])  { // check 2nd version digit
        let whattodo = '';
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
            'not be available.', 'msg_excl'
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
          'Update', function(){
            location.reload();
          },true,  'msg_excl' );
      return false;
    }
  }

  return true;

}


function makeJSONString ( data_obj )  {
let json = null;

  // json = JSON.stringify ( data_obj );

  try {
    json = JSON.stringify ( data_obj );
  } catch(e) {
    new MessageBox ( 'Unsuitable data',
      '<div style="width:500px"><h2>Unsuitable data</h2>' +
      '<p>Unsuitable data encountered when sending data to ' + appName() +
      ' server. Usually this is caused by using symbols from a non-Latin ' +
      'alphabet or rare special characters.' +
      '<p>Try repeating your actions making sure that your keyboard is on ' +
      'English register. If this does not help, close this page or tab in ' +
      'your browser and log on ' + appName() + ' again. Ultimately, contact ' +
      appName() + ' support.</div>', 'msg_error' );
  }
  return json;
}



var __server_queue    = [];
var __local_queue     = [];
var __server_queue_id = 1;

var __delays_ind   = null;
var __delays_timer = null;
var __delays_wait  = 1000;  //msec
var __holdup_dlg   = null;
var __holdup_timer = null;
var __holdup_wait  = 20000;  //msec
var __communication_ind = null;

function clearNetworkIndicators()  {
  if (__delays_timer)
    window.clearTimeout ( __delays_timer );
  __delays_ind   = null;  // communication delays indicator
  __delays_timer = null;
  __communication_ind = null;  // blinking green dot, global reference
}

function __process_network_indicators()  {
  if (__server_queue.length>0)  {
    if (__communication_ind && (!__communication_ind.isVisible()))
      __communication_ind.fade ( true );
  } else if (__delays_ind)  {
    if (__delays_timer)  {
      window.clearTimeout ( __delays_timer );
      __delays_timer = null;
    }
    if (__delays_ind.isVisible())
      __delays_ind.hide();
    if (__holdup_timer)  {
      window.clearTimeout ( __holdup_timer );
      __holdup_timer = null;
    }
    if (__holdup_dlg)  {
      __holdup_dlg.close();
      __holdup_dlg = null;
    }
    if (__communication_ind.isVisible())
      __communication_ind.fade ( false );
  }
}

var __check_session_drops = 0;

function processServerQueue()  {
  if (__server_queue.length>0)  {
    let q0 = __server_queue[0];
    if (q0.status=='waiting')  {
      q0.status = 'running';
      if (q0.type=='command')
        __server_command ( q0.request_type,q0.data_obj,q0.page_title,
                           q0.function_response,q0.function_always,
                           q0.function_fail,q0.id );
      else
        __server_request ( q0.request_type,q0.data_obj,q0.page_title,
                           q0.function_ok,q0.function_always,
                           q0.function_fail,q0.id );
    }
    if (__delays_ind && (!__delays_ind.isVisible()) && (!__delays_timer))  {
      __delays_timer = window.setTimeout ( function(){
          __delays_ind.show();
      },__delays_wait);
      __holdup_timer = window.setTimeout ( function(){
        __holdup_timer = null;
        if (__server_queue.length>0)  {
          if ((__server_queue[0].type=='command') &&
                   (__server_queue[0].request_type==fe_command.checkSession) &&
                   (__check_session_drops<10))  {
            __check_session_drops++;
            __server_queue.shift();
            __process_network_indicators();
            processServerQueue();
          } else if (__server_queue[0].request_type!=undefined)  {
            __holdup_dlg = new QuestionBox ( 'Communication hold-up',
                '<div style="width:450px"><h3>Communication hold-up</h3>' +
                'Communication with ' + appName() + ' is severely delayed. ' +
                'Please be patient, the problem may resolve in few moments, ' +
                'after which this dialog will disappear automatically.<p>' +
                'If communication does not resume after a long time, you can ' +
                'either reload the current page (quick option) or start new ' +
                'working session (complete refresh, hard option) using buttons ' +
                'below.<p>Make sure that your Internet connection is stable.',[
                { name    : 'Reload current page',
                  onclick : function(){
                      __holdup_dlg = null;
                      window.setTimeout ( function(){
                        if (__current_page)  {
                          __server_queue = [];
                          __process_network_indicators();
                          makePage ( function(){
                            eval (
                              'new ' + __current_page._type + ' ( "' + __current_page.sceneId + '" );'
                            );
                          });
                          makeSessionCheck ( __current_page.sceneId );
                        } else  {  // should never come to here
                          reloadBrowser();
                        }
                      },100);
                    }
                },{
                  name    : 'Start new working session',
                  onclick : function(){
                      reloadBrowser();
                      // window.location = window.location;  // complete refresh
                    }
                }
              ],'msg_system'
            );
          } else  {
            console.log ( ' >>> undefined server request delayed' );
          }
        }
      },__holdup_wait);
    }
  }
}

// function shiftServerQueue()  {
//   if (__server_queue.length>0)  {
//     __server_queue.shift();
//     processServerQueue();
//   }
// }

function processLocalQueue()  {
  if (__local_queue.length>0)  {
    let q0 = __local_queue[0];
    if (q0.status=='waiting')  {
      q0.status = 'running';
      local_command ( q0.request_type,q0.data_obj,q0.command_title,q0.function_response );
    }
  }
}

// function shiftLocalQueue()  {
//   if (__local_queue.length>0)  {
//     __local_queue.shift();
//     processServerQueue();
//   }
// }

function printServerQueueState ( checkPoint)  {
  if (__server_queue.length>0)
    console.log (
      ' >>> ' + checkPoint + ' queue.length='  + __server_queue.length +
      ' queue[0].type=' + __server_queue[0].type +
      ' request_type='  + __server_queue[0].request_type +
      ' ndrops=' + __check_session_drops
    );
  else
    console.log ( ' >>> ' + checkPoint + ' queue.length='  + __server_queue.length );
}


function __server_command ( cmd,data_obj,page_title,function_response,
                            function_always,function_fail,sqid )  {
// used when no user is logged in

  let json = makeJSONString ( data_obj );

  if (json)
    $.ajax ({
      url      : cmd,
      async    : true,
      type     : 'POST',
      data     : json,
      timeout  : 1000000,   // milliseconds
      dataType : 'text'
      // error: function(xhr, ajaxOptions, thrownError) {
      //             alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
      //           }
    })
    .done ( function(rdata) {
      if ((__server_queue.length>0) && (sqid==__server_queue[0].id))  {
        __server_queue.shift();
        __process_network_indicators();
        try {
          let rsp = jQuery.parseJSON ( rdata );
          if (checkVersionMatch(rsp,false))  {
            let response = jQuery.extend ( true, new Response(), rsp );
            if (!function_response(response))
              makeCommErrorMessage ( page_title,cmd,response );
          }
        } catch(err) {
          console.log ( ' >>> error catch in __server_command.done: ' + err );  
          console.log ( ' >>> rdata = ' + rdata );
          // printServerQueueState ( 1 );
        }
        // *** old version
        // processServerQueue();
      } else  {
        console.log ( ' >>> return on skipped operation in __server_command.done' );
        console.log ( ' >>> rdata = ' + rdata );
        // printServerQueueState ( 2 );
        // *** new version
        if (__server_queue.length>0)  {
          __server_queue.shift();
          __process_network_indicators();
        } //else
          //makeSessionCheck ( __current_page.sceneId );
      }
      __check_session_drops = 0;
      // *** new version
      processServerQueue();
    })
    .always ( function(){
      // __check_session_drops = 0;
      if (function_always)
        function_always();
    })
    .fail ( function(xhr,err){
      console.log ( ' >>> cmd=' + cmd + ' err=' + err + ' ndrops=' + __check_session_drops );
      // can be "error" and "timeout"
      if ((__server_queue.length<=0) || (sqid!=__server_queue[0].id))  {
        console.log ( ' >>> return on skipped operation in __server_command.fail, err=' + err );
        // printServerQueueState ( 3 );
      }
      if (cmd==fe_command.checkSession)
        __check_session_drops++;
      if (function_fail)
            function_fail();
      else  MessageAJAXFailure ( page_title,xhr,err );
      // __server_queue.shift();
      __process_network_indicators();
      // *** old version
      processServerQueue();

      // if (cmd==fe_command.checkSession)
      //   makeSessionCheck ( __current_page.sceneId );

      /*  ==== ORIGINAL
      if ((__server_queue.length>0) && (sqid==__server_queue[0].id))  {
        __server_queue.shift();
        __process_network_indicators();
        if (function_fail)
              function_fail();
        else  MessageAJAXFailure(page_title,xhr,err);
        // *** old version
        processServerQueue();
      } else  {
        console.log ( ' >>> return on skipped operation in __server_command.fail, err=' + err );
        // printServerQueueState ( 3 );
        // *** new version
        // if (__server_queue.length>0)  {
        //   __server_queue.shift();
        //   __process_network_indicators();
        // } //else
          //makeSessionCheck ( __current_page.sceneId );
      }
      */
      // *** new version
      // processServerQueue();
      // if (cmd==fe_command.checkSession)
      //   makeSessionCheck ( __current_page.sceneId );
    });

}


function __server_request ( request_type,data_obj,page_title,function_ok,
                            function_always,function_fail,sqid )  {
// used when a user is logged in

  let request = new Request ( request_type,__login_token,data_obj );
  let json    = makeJSONString ( request );

  function execute_ajax ( attemptNo )  {

    $.ajax ({
      url         : fe_command.request,
      async       : true,
      type        : 'POST',
      data        : json,
      processData : false,
      timeout     : 1000000,   // milliseconds
      dataType    : 'text'
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

      let response = null;

      if ((__server_queue.length>0) && (sqid==__server_queue[0].id))  {

        __server_queue.shift();  // request completed
        __process_network_indicators();

        try {
          let rsp = jQuery.parseJSON ( rdata );
          if (checkVersionMatch(rsp,false))  {
            response = jQuery.extend ( true, new Response(), rsp );
            if (response.status==fe_retcode.ok)  {
              if (function_ok)
                function_ok ( response.data );
            } else
              makeCommErrorMessage ( page_title,request_type,response );
            /*
            // we put this function here and in the fail section because we
            // do not want to have it executed multiple times due to multiple
            // retries
            if (function_always)
              function_always(0,response.data);
            */
          }
        } catch(err) {
          console.log ( ' >>> error catch in __server_request.done:' +
                        '\n --- ' + err +
                        '\n --- request type: ' + request_type +
                        '\n --- rdata = ' + rdata );
          // printServerQueueState ( 4 );
        }

        // *** old version
        // processServerQueue();

      } else  {
        console.log ( ' >>> return on skipped operation in __server_request.done' );
        // printServerQueueState ( 5 );
        // *** new version
        if (__server_queue.length>0)  {
          __server_queue.shift();
          __process_network_indicators();
        } else
          makeSessionCheck ( __current_page.sceneId );
      }

      __check_session_drops = 0;

      // *** new version
      processServerQueue();

      // we put this function here and in the fail section because we
      // do not want to have it executed multiple times due to multiple
      // retries
      if (function_always)  {
        if (response)  function_always(0,response.data);
                else   function_always(0,{});
      }

    })

    .always ( function(){
      // __check_session_drops = 0;
    })

    .fail ( function(xhr,err){

      console.log ( ' >>> 2 request=' + request_type + ' err=' + err );
      // can be "error" and "timeout"

      if ((__server_queue.length>0) && (sqid==__server_queue[0].id))  {

        // *** old version
        __server_queue.shift();  // request completed
        __process_network_indicators();

        try {

          if ((typeof function_fail === 'string' || function_fail instanceof String) &&
              (function_fail=='persist')) {

            if (attemptNo>0)  {
              execute_ajax ( attemptNo-1 );
              return;  // repeat; server queue is not shifted here
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

        } catch(err) {
          console.log ( ' >>> error catch in __server_request.fail: ' + err );
          // printServerQueueState ( 6 );
        }

        // *** old version
        // processServerQueue();

      } else  {
        console.log ( ' >>> return on skipped operation in __server_request.fail' );
        // printServerQueueState ( 7 );
        // *** new version
        if (__server_queue.length>0)  {
          __server_queue.shift();
          __process_network_indicators();
        } else
          makeSessionCheck ( __current_page.sceneId );
      }

      // *** new version
      processServerQueue();

    });

  }

  if (json)
    execute_ajax ( __persistence_level );

}


function local_command ( cmd,data_obj,command_title,function_response )  {
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

  let json = makeJSONString ( data_obj );

  if (__local_service && json)
    $.ajax ({
      url      : __local_service + '/' + cmd,
      async    : true,
      type     : 'POST',
      data     : json,
      dataType : 'text',
      crossDomain: true,
      timeout  : 0  // in ms; '0' means no timeout
    })
    .done ( function(rdata) {
      let rsp = jQuery.parseJSON ( rdata );
      if (checkVersionMatch(rsp,true))  {
        let response = jQuery.extend ( true,new Response(),rsp );
        if (function_response && (!function_response(response)))
          makeCommErrorMessage ( command_title,cmd,response );
      }

    })
    .always ( function(){
      __local_queue.shift();
      processServerQueue();
    })
    .fail   ( function(xhr,err){
      if (function_response && (!function_response(null)))
        MessageAJAXFailure(command_title,xhr,err);
    });

}

function promptSessionCheck ( cmd )  {
  // resumes check loop after client wakes up from sleeping
  if (__current_page && (cmd!=fe_command.checkSession))  {
    let crTime = Date.now();
    if ((crTime-__last_session_check_time>5*__check_session_period))  {
      __last_session_check_time = crTime + 2*__check_session_period;
      makeSessionCheck ( __current_page.sceneId );
    }
  }
}

function serverCommand ( cmd,data_obj,page_title,function_response,
                         function_always,function_fail )  {

  promptSessionCheck ( cmd );

  __server_queue.push ({
    status            : 'waiting',
    type              : 'command',
    id                : __server_queue_id++,
    // cmd               : cmd,
    request_type      : cmd,
    data_obj          : data_obj,
    page_title        : page_title,
    function_response : function_response,
    function_always   : function_always,
    function_fail     : function_fail
  });

  __process_network_indicators();
  processServerQueue();

}


function serverRequest ( request_type,data_obj,page_title,function_ok,
                         function_always,function_fail )  {

  promptSessionCheck ( 'x' );

  __server_queue.push ({
    status          : 'waiting',
    type            : 'request',
    id              : __server_queue_id++,
    request_type    : request_type,
    data_obj        : data_obj,
    page_title      : page_title,
    function_ok     : function_ok,
    function_always : function_always,
    function_fail   : function_fail
  });

  __process_network_indicators();
  processServerQueue();

}


function localCommand ( cmd,data_obj,command_title,function_response )  {

  promptSessionCheck ( 'x' );

  if (__local_service)  {
    __local_queue.push ({
      status            : 'waiting',
      // cmd               : cmd,
      request_type      : cmd,
      data_obj          : data_obj,
      command_title     : command_title,
      function_response : function_response
    });
    processLocalQueue();
  } else if (function_response)
    function_response(null);
}


function downloadFile ( uri )  {
let hiddenALinkID = 'hiddenDownloader';
let alink = document.getElementById(hiddenALinkID);
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


// function calculateJobFileURL ( fileName )  {
//   // let url = __special_url_tag + '/';
//   // if (__login_token)
//   //       url += __login_token;
//   // else  url += '404';
//   // return url + '/' + __current_project + '/' + jobId + '/' + filePath;
// }

/*
function fetchJobFile ( task,fname,function_success,function_always,function_fail )  {
// task may be any task from the project; the actual task number is obtained from 'fname'

  let furl = task.getProjectURL ( parseInt(fname.split('-')[0],10),fname );

  let oReq = new XMLHttpRequest();

  oReq.onload = function(oEvent) {
    function_success ( oReq.responseText );
    if (function_always)
      function_always();
  };

  oReq.onerror = function()  {
    if (function_fail)
      function_fail ( 'communication errors' );
    if (function_always)
      function_always();
  }

  oReq.overrideMimeType ( "text/plain; charset=x-user-defined" );
  // oReq.responseType = 'arraybuffer';
  oReq.timeout      = 9999999;
  oReq.open ( 'POST',furl,true );

  try {
    oReq.send(null);
  } catch (e) {
    if (function_fail)
      function_fail ( 'general error' );
    // alert ( 'loading ' + self.url + ' failed:\n' + e );
  }

}
*/


function fetchFile ( furl,function_success,function_always,function_fail )  {
// furl is relative file url starting from FE URL

  let oReq = new XMLHttpRequest();

  oReq.onload = function(oEvent) {
    function_success ( oReq.responseText );
    if (function_always)
      function_always();
  };

  oReq.onerror = function()  {
    if (function_fail)
      function_fail ( 'communication errors' );
    if (function_always)
      function_always();
  }

  oReq.overrideMimeType ( "text/plain; charset=x-user-defined" );
  // oReq.responseType = 'arraybuffer';
  oReq.timeout = 9999999;
  oReq.open ( 'POST',furl,true );

  try {
    oReq.send(null);
  } catch (e) {
    if (function_fail)
      function_fail ( 'general error' );
    // alert ( 'loading ' + self.url + ' failed:\n' + e );
  }

}


function fetchJobFile ( task,fname,function_success,function_always,function_fail )  {
// task may be any task from the project; the actual task number is obtained from 'fname'
  fetchFile ( task.getProjectURL(parseInt(fname.split('-')[0],10),fname),
              function_success,function_always,function_fail );
}

function fetchJobOutputFile ( task,fname,function_success,function_always,function_fail )  {
// task may be any task from the project; the actual task number is obtained from 'fname'
  fetchFile ( task.getProjectURL(parseInt(fname.split('-')[0],10),'output/'+fname),
              function_success,function_always,function_fail );
}


function getJobFileURL ( jobId,filePath )  {
  let url = __special_url_tag + '/';
  if (__login_token)
        url += __login_token;
  else  url += '404';
  return url + '/' + __current_project + '/' + jobId + '/' + filePath;
}


function downloadJobFile ( jobId,filePath )  {
  /*
  let url = __special_url_tag + '/';
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


//  ===========================================================================
//  Service functions for communication with iframes

var __comm_iframes = {};

function setCommunicatingIFrame ( holder,iframe )  {
let fid0 = 'fid_' + Date.now();
let fid  = fid0;
let k    = 0;
  while (fid in __comm_iframes)
    fid = fid0 + '_' + k++;
  __comm_iframes[fid] = { 
    'holder' : holder,
    'iframe' : iframe,
    'data'   : { 'was_output' : false }  // no output from job initially
  };
  return fid;
}

function setCommunicationFrameData ( fid,dataName,data )  {
  if (fid in __comm_iframes)
    __comm_iframes[fid].data[dataName] = data;
}

function getCommunicationFrameData ( fid,dataName )  {
  if (fid in __comm_iframes)
    return __comm_iframes[fid].data[dataName];
  return null;
}

function removeCommunicatingIFrame ( fid )  {
  if (fid in __comm_iframes)
    delete __comm_iframes[fid];
}

function removeAllCommunicatingIFrames()  {
  for (let fid in __comm_iframes)
    if (__comm_iframes.hasOwnProperty(fid))
      delete __comm_iframes[fid];
}

function getNofCommunicatingIFrames()  {
let c = 0;
  for (let p in __comm_iframes)
    if (__comm_iframes.hasOwnProperty(p))
      c++;
  return c;
}


if (window.addEventListener) {
  window.addEventListener ( 'message', onWindowMessage, false );
} else if (window.attachEvent) {
  window.attachEvent ( 'onmessage', onWindowMessage, false );
} else 
  alert ( 'No Window messaging' );


function onWindowMessage ( event ) {
  // Check sender origin to be trusted
  // if (event.origin !== "http://example.com") return;

  let edata = event.data;

  if (edata.command=='saveFiles')  {
    if (edata.files.length<=0)  {
      if ( __comm_iframes[edata.meta.fid].holder)
        __comm_iframes[edata.meta.fid].holder.close();
    } else  {
      let edata1 = {
        meta  : edata.meta,
        files : []
      }
      for (let i=0;i<edata.files.length;i++)
        if ('fpath' in edata.files[i])  {
          edata1.files.push ( edata.files[i] );
        } else  {
          edata1.files.push ({
            fpath : edata.files[i].molName + '.pdb',
            data  : edata.files[i].pdbData
          });
          edata1.files.push ({
            fpath : edata.files[i].molName + '.mmcif',
            data  : edata.files[i].mmcifData
          });
        }
      serverRequest ( fe_reqtype.saveJobFiles,edata1,'Save job file',
        function(rdata){
          if (rdata.project_missing)  {
            new MessageBox (  'Project not found',
                              '<div style="width:350px"><h3>Project "' + edata.meta.project +
                              '" is not found on server</h3>' +
                              '<i>This is a bug, please report</i>.</div>',
                              'msg_error'
                            );
          } else if (edata.confirm=='model')  {
          // if ('callback' in edata)
          //   edata.callback.postMessage ({ message: 'done!'} );
          // if (edata.meta.fid in __comm_iframes)
          //   alert ( ' >>>> ' + edata.meta.fid );
          // __comm_iframes[edata.meta.fid].iframe.getWindow().postMessage ({ message: 'done!'} );
            let flist = [];
            for (let i=0;i<edata.files.length;i++)
              if (!('report' in edata.files[i]) || edata.files[i].report)  {
                if ('fpath' in edata.files[i])  {
                  flist.push ( edata.files[i].fpath );
                } else  {
                  flist.push ( edata.files[i].molName + '.pdb'   );
                  flist.push ( edata.files[i].molName + '.mmcif' );
                }
              }
            if (flist.length<=0)  {
              if ( __comm_iframes[edata.meta.fid].holder)
                __comm_iframes[edata.meta.fid].holder.close();
            } else  {
              // set up a flag that some output was created; unless it os set,
              // the job will be deleted automatically
              setCommunicationFrameData ( edata.meta.fid,'was_output',true );
              new MessageBoxF ( 'Model(s) saved',
                                '<div style="width:400px"><h3>Model(s) saved</h3>' +
                                'The following model(s) are saved on ' + appName() +':<p>' +
                                flist.join('<br>')  + '</div>',
                                'Exit Moorhen',function(){
                                  // __comm_iframes[edata.meta.fid].iframe.getWindow().postMessage ({
                                  //   message: 'done!'
                                  // });
                                  if ( __comm_iframes[edata.meta.fid].holder)
                                    __comm_iframes[edata.meta.fid].holder.close();
                                },false,'msg_ok'
                              );
              // new MessageBox (  'Current model saved',
              //                   '<div style="width:350px"><h3>Current model saved</h3>' +
              //                   'Current model saved in file "' + edata.fpath + 
              //                   '" on ' + appName() + '.</div>',
              //                   'msg_ok'
              //                 );
            }              
          } else if (edata.confirm=='manual')  {
            // making a backup does not count as making an output
            // setCommunicationFrameData ( edata.meta.fid,'was_output',true );
            new MessageBox (  'Backup file written',
                              '<div style="width:350px"><h3>Backup file written</h3>' +
                              'Backip file saved in ' + appName() + 
                              ', use <i>"Recover molecule backup"</i> to retrieve.</div>',
                              'msg_ok'
                            );
          }
        },null,'persist' );
    }
  } else if (edata.command=='getFile')  {

      let req_data  = {};
      req_data.meta = {};
      req_data.meta.project = edata.meta.project;
      req_data.meta.id      = edata.meta.id;
      req_data.meta.file    = edata.fpath;

      serverRequest ( fe_reqtype.getJobFile,req_data,'Get job file',
                      function(data){
        __comm_iframes[edata.meta.fid].iframe.getWindow().postMessage ({
          postdata : edata,
          content  : data
          // message: 'done!'
        });
      },null,'persist');

  } else if (edata.command=='saveWebCootPreferences')  {

    let userData   = new UserData();
    userData.login = __login_id;
    userData.pwd   = '';  // can save only some records without password
    __user_settings.webcoot_pref = edata.data;
    userData.settings  = __user_settings;
    serverRequest ( fe_reqtype.updateUserData,userData,
                    'WebCoot preferences update',function(response){} );

  }

//      console.log ( 'Unknown windows message command: ' + edata.command );

    // alert ( JSON.stringify(data) );

    // if (typeof(window[data.func]) == "function") {
    //     window[data.func].call(null, data.message);
    // }
}