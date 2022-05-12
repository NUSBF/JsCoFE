
/*
 *  =================================================================
 *
 *    26.07.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */



function calcDialogSize ( defW,defH, defWT,defHT, job_dialog_data )  {
//
//  defW  : default width as a fraction of window width; '0' means 'auto'
//  defH  : default width as a fraction of window width; '0' means 'auto'
//  defWT : default width as a fraction of window width for touch devices; '0' means 'auto'
//  defHT : default width as a fraction of window width for touch devices; '0' means 'auto'
//  job_dialog_data : optional dialog data structure
//

  //var w0 = $(window).width ();
  //var h0 = $(window).height();
  var w0 = window.innerWidth;
  var h0 = window.innerHeight;
  var w,h;

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

  var msg = '<h2>Communication errors</h2><p><i>';
  if (!jqXHR)  {
    msg += 'Unknown error.';
  } else if (jqXHR.status === 0) {
    msg += 'Not connected.<br>Please verify your network connection.';
  } else if (jqXHR.status == 404) {
    msg += 'The requested page not found. [404] ' + jqXHR.responseText;
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

  new MessageBox ( title,msg + '</i><p>' +
    'This may be an intermittent error due to a poor internet connection,<br>' +
    'however, persistent appearance of this message is likely to indicate<br>' +
    appName() + ' failure or temporary shutdown.','msg_error' );

}


function MessageNoProjectDataError ( title,message )  {
var msg = '<h3>General failure: project metadata not found on server</h3>';
  if (message.length>0)
    msg += 'Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!','msg_error' );
}

function MessageDataWriteError ( title,message )  {
var msg = '<h3>General failure: data cannot be written</h3>';
  if (message.length>0)
    msg += 'Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!' );
}

function MessageMkDirError ( title,message )  {
var msg = '<b>General failure: cannot create a directory.</b>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!' );
}

function MessageDataReadError ( title,message )  {
var msg = '<b>General failure: data cannot be read.</b>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!' );
}

function MessageNotLoggedIn ( title )  {
  if (__current_page && (['LogoutPage','LoginPage'].indexOf(__current_page._type)>=0))
    return;
  new MessageBox ( title,
    '<div style="width:500px"><b>User not logged in.</b>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser or machine, or implicitly by, e.g., copy/pasting URL in another ' +
    'browser tab or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again.' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0001',
      'Report code: D0001','' ) +
    '.</div>' );
  return;
}

function MessageUploadErrors ( title,message )  {
var msg = '<b>General failure: upload errors.</b>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
  new MessageBox ( title,msg +
    '<p>This is an internal error, and the respective maintener ' +
    'has been informed.<p>Sorry and please come back later!' );
}

function MessageNoJobDir ( title )  {
  new MessageBox ( title,
    '<div style="width:500px"><b>Job directory not found on server.</b>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser or machine, or implicitly by, e.g., copy/pasting URL in another' +
    'browser tab or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again and repeat your actions.' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0002',
      'Report code: D0002','' ) +
    '.</div>' );
}

function MessageProxyError ( title )  {
  new MessageBox ( title,
    '<b>Proxy server error.</b>' +
    '<p>Usually, this means that connection with ' + appName() +
    ' is lost.<br>Please check your internet connection. ' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0003',
      'Report code: D0003','' ) +
    '.' );
}

function MessageProjectAccess ( title )  {
  new MessageBox ( title,
    '<h2>Project Access Denied</h2>' +
    '<p>The Project is no longer available to you. Most probably, it was<br>' +
    'unshared with you by the project owner. You may delete this<br>' +
    'project from your <i>Project List</i> now.' +
    '<p>If problem persists, please report to ' +
    report_problem(
      'CCP4 Cloud Report: D0004',
      'Report code: D0004','' ) +
    '.' );
}

function MessageServerInactive()  {
  new MessageBox ( 'Server Inactive',
    '<div style="width:500px"><h2>' + appName() + ' Inactive</h2>' +
    '<p>' + appName() + ' is inactive, which may be because of ' +
    'starting up, shutting down or being temporary suspended for maintenance.' +
    '<p>Please come back later.</div>' );
}

function MessageFileNotFound ( message )  {
  new MessageBox ( 'File not found',
    '<div style="width:500px"><h2>File not found</h2>' +
    '<p>' + message +
    '<p>Please come back later.</div>' );
}

function MessageUnknownError ( title,message )  {
  new MessageBox ( 'Unknown error',
    '<div style="width:500px"><h2>Unknown error.</h2> The server replied with:<p>' +
    '<i>' + message + '</i><p>Please file a report to ' +
    report_problem(
      'CCP4 Cloud Report: D0005',
      'Report code: D0005','' ) +
    '. Sorry and please come back later!</div>' );
}
