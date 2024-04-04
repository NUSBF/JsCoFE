
/*
 *  =================================================================
 *
 *    15.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialogs.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Various message dialogs
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

function calcDialogSize ( defW,defH, defWT,defHT, job_dialog_data=null )  {
//
//  defW  : default width as a fraction of window width; '0' means 'auto'
//  defH  : default width as a fraction of window width; '0' means 'auto'
//  defWT : default width as a fraction of window width for touch devices; '0' means 'auto'
//  defHT : default width as a fraction of window width for touch devices; '0' means 'auto'
//  job_dialog_data : optional dialog data structure
//

  //let w0 = $(window).width ();
  //let h0 = $(window).height();
  let w0 = window.innerWidth;
  let h0 = window.innerHeight;
  let w,h;

  if (__any_mobile_device)  {

    w = defWT*$(window).width () - 8;
    h = defHT*$(window).height() - 40;// - 46;
    if (__iOS_device)          h += 36;
    else if (__mobile_device)  h += 24;

  } else  {

    w = 2*w0;
    h = 2*h0;

    if (job_dialog_data)  {
      if (job_dialog_data.width>0)   w = job_dialog_data.width;
      if (job_dialog_data.height>0)  h = job_dialog_data.height;
    }

    if ((w>=w0) || (h>=h0))  {
      w0 -= 8;
      h0 -= 42;
      if (defW>0.0)  w = Math.min ( defW*Math.min(w0,h0), w0 );
      if (defH>0.0)  h = Math.min ( defH*Math.min(w0,h0), h0 );
      if (job_dialog_data)  {
        job_dialog_data.position = {
          my : 'center top',               // job dialog position reference
          at : 'center top+'+(h0-h)/2+'px' // job dialog offset in the screen
        };
        job_dialog_data.width  = 0;
        job_dialog_data.height = 0;
      }
    }

  }

  if (w<=0)  w  = 'auto';
//       else  w += 'px';
  if (h<=0)  h  = 'auto';
//       else  h += 'px';

  return [w,h];

}


function MessageAJAXFailure ( title,jqXHR,exception )  {

  let msg = '<h2>Communication errors</h2>';
  if (!jqXHR)  {
    msg += '<b><i>Unknown error.</i></b>';
  } else {
    if (jqXHR.status === 0) {
      msg += 'Not connected. Please check your network connection.';
    } else if (jqXHR.status == 404) {
      msg += 'The requested page not found. [404]';
    } else if (jqXHR.status == 500) {
      msg += 'Internal Server Error [500].';
    } else if (exception === 'parsererror') {
      msg += 'Requested JSON parse failed.';
    } else if (exception === 'timeout') {
      msg += 'Time out error.';
    } else if (exception === 'abort') {
      msg += 'Ajax request aborted.';
    } else {
      msg += 'Uncaught Error.<br>' + jqXHR.responseText;
    }
    msg = '<b><i>' + msg + 
          '</i></b><p><b>Status:</b><i> '     + jqXHR.status +
          '</i><br><b>Description:</b><i> '   + jqXHR.statusText +
          '</i><br><b>Response text:</b><i> ' + jqXHR.responseText +
          '</i><br><b>Error:</b><i> '         + exception +
          '</i>';
  }

  new MessageBox ( title,'<div style="width:450px">' + msg +
    '<p>This may be an intermittent error due to a poor internet connection, ' +
    'however, persistent appearance of this message is likely to indicate ' +
    appName() + ' failure or temporary shutdown.</div>','msg_error' );

}


function MessageNoProjectDataError ( title,message )  {
  let msg = '<h2>General failure: project metadata not found on server</h2>';
  if (message.length>0)
    msg += 'Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageDataWriteError ( title,message )  {
  let msg = '<h2>General failure: data cannot be written</h2>';
  if (message.length>0)
    msg += 'Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageMkDirError ( title,message )  {
  let msg = '<h2>General failure: cannot create a directory.</h2>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageDataReadError ( title,message )  {
  let msg = '<h2>General failure: data cannot be read.</h2>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageNotLoggedIn ( title )  {
  if (__current_page && (['LogoutPage','LoginPage'].indexOf(__current_page._type)>=0))
    return;
  new MessageBox ( title,
    '<div style="width:500px"><h2>User not logged in.</h2>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser or machine, or implicitly by, e.g., copy/pasting URL in another ' +
    'browser tab or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again.' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0001',
      'Report code: D0001','' ) +
    '.</div>','msg_stop' );
  return;
}

function MessageUploadErrors ( title,message )  {
  let msg = '<h2>General failure: upload errors.</h2>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageNoJobDir ( title )  {
  new MessageBox ( title,
    '<div style="width:500px"><h2>Job directory not found on server.</h2>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser or machine, or implicitly by, e.g., copy/pasting URL in another' +
    'browser tab or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again and repeat your actions.' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0002',
      'Report code: D0002','' ) +
    '.</div>','msg_error' );
}

function MessageProxyError ( title )  {
  new MessageBox ( title,
    '<h2>Proxy server error.</h2>' +
    '<p>Usually, this means that connection with ' + appName() +
    ' is lost.<br>Please check your internet connection. ' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0003',
      'Report code: D0003','' ) +
    '.','msg_error' );
}

function MessageProjectAccess ( title )  {
  window.setTimeout ( function(){
    new MessageBox ( title,
      '<div style="width:350px;"><h2>Project Access Denied</h2>' +
      '<p>The Project is no longer available to you. Most probably, it was ' +
      'unshared with you by the project owner. You may delete this ' +
      'project from your <i>Project List</i> now.' +
      '<p>If you think that this message is incorrect, please report this ' +
      'as a bug to ' +
      report_problem(
        'CCP4 Cloud Report: D0004',
        'Report code: D0004','' ) +
      '.</div>','msg_error' );
  },0);
}

function MessageServerInactive()  {
  new MessageBox ( 'Server Inactive',
    '<div style="width:500px"><h2>' + appName() + ' Inactive</h2>' +
    '<p>' + appName() + ' is inactive, which may be because of ' +
    'starting up, shutting down or being temporary suspended for maintenance.' +
    '<p>Please come back later.</div>','msg_stop' );
}

function MessageFileNotFound ( message )  {
  new MessageBox ( 'File not found',
    '<div style="width:500px"><h2>File not found</h2>' +
    '<p>' + message +
    '<p>Please come back later.</div>','msg_error' );
}

function MessageUnknownError ( title,message )  {
  new MessageBox ( 'Unknown error',
    '<div style="width:500px"><h2>Unknown error.</h2> The server replied with:<p>' +
    '<i>' + message + '</i><p>Please file a report to ' +
    report_problem(
      'CCP4 Cloud Report: D0005',
      'Report code: D0005','' ) +
    '. Sorry and please come back later!</div>','msg_error' );
}
