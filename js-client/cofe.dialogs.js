
/*
 *  =================================================================
 *
 *    06.04.17   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */


function MessageAJAXFailure ( title,jqXHR,exception )  {

  var msg = '<b>General AJAX communication failure.</b><p><i>';
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

  new MessageBox ( title,msg + '</i><p>This may be due to a poor ' +
    'internet connection. If problem persists,<br>please report to ' +
    'ccp4@stfc.ac.uk .' );

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
  new MessageBox ( title,
    '<b>User Not Logged In.</b>' +
    '<p>This may result from using forward/back/reload functions in your ' +
    'browser.<p>Please log in again.<p>If problem persists, please report ' +
    'to ccp4@stfc.ac.uk.' );
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
    '<p>This may result from using forward/back/reload functions in your ' +
    'browser.<p>Please log in again and repeat your actions.' +
    '<p>If problem persists, please report to ccp4@stfc.ac.uk.' );
}

function MessageUnknownError ( title,message )  {
  new MessageBox ( 'Registration',
    '<b>Unknown error.</b> The server replied with:<p>' +
    '<i>' + message + '</i><p>Please file a report to ' +
    'ccp4@stfc.ac.uk. Sorry and please come back later!' );
}
