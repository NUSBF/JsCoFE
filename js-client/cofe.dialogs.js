
/*
 *  =================================================================
 *
 *    08.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
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

  if (__mobile_device)  {

    w = defWT*$(window).width () - 8;
    h = defHT*$(window).height() - 46;

  } else  {

    w = 2*w0;
    h = 2*h0;

    if (job_dialog_data)  {
      if (job_dialog_data.width>0)   w = job_dialog_data.width;
      if (job_dialog_data.height>0)  h = job_dialog_data.height;
    }

    if ((w>=w0) || (h>=h0))  {
      w = defW*w0;
      h = defH*h0;
      if (job_dialog_data)  {
        job_dialog_data.position = { my : 'center top',   // job dialog position reference
                                     at : 'center top+5%' }; // job dialog offset in the screen
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

  var msg = '<h3>Communication errors</h3><p><i>';
  if (!jqXHR)  {
    msg += 'Unknown error.';
  } else if (jqXHR.status === 0) {
    msg += 'Not connected.<br>Please verify your network connection.';
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

  new MessageBox ( title,msg + '</i><p>' +
    'This may be an intermittent error due to a poor internet connection,<br>' +
    'however, persistent appearance of this message is likely to indicate<br>' +
    appName() + ' failure or temporary shutdown.' );

}


function MessageDataWriteError ( title,message )  {
var msg = '<b>General failure: data cannot be written.</b>';
  if (message.length>0)
    msg += '<p>Server replied: <i>' + message + '</i>';
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
    '<b>User Not Logged In.</b>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser<br>or machine, or implicitly by, e.g., copy/pasting URL in another ' +
    'browser tab<br>or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again.' +
    '<p>If problem persists, please report to ccp4@stfc.ac.uk.' );
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
    '<b>Job directory not found on server.</b>' +
    '<p>This may result from duplicate logging (either explicitly in another ' +
    'browser or machine, or implicitly by, e.g., copy/pasting URL in another' +
    'browser tab or window), or using forward/back/reload buttons in your ' +
    'browser.<p>Please log in again and repeat your actions.' +
    '<p>If problem persists, please report to ccp4@stfc.ac.uk.' );
}

function MessageProxyError ( title )  {
  new MessageBox ( title,
    '<b>Proxy server error.</b>' +
    '<p>Usually, this means that connection with ' + appName() +
    ' is lost.<br>Please check your internet connection. ' +
    '<p>If problem persists, please report to ccp4@stfc.ac.uk.' );
}

function MessageUnknownError ( title,message )  {
  new MessageBox ( 'Registration',
    '<b>Unknown error.</b> The server replied with:<p>' +
    '<i>' + message + '</i><p>Please file a report to ' +
    'ccp4@stfc.ac.uk. Sorry and please come back later!' );
}
