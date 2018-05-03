
/*
 *  =================================================================
 *
 *    14.11.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/js-server/server.emailer.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  E-mail Support
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

//  load system modules
var nodemailer    = require('nodemailer');
var child_process = require('child_process');

//  load application modules
var conf = require('./server.configuration');

//  prepare log
var log = require('./server.log').newLog(4);

// ==========================================================================


function send_nodemailer ( to,subject,message )  {
var emailer     = conf.getEmailerConfig();
var transporter = nodemailer.createTransport ( emailer );

  var emailData = {
    from   : emailer.emailFrom,
    to     : to,
    subject: subject,
    text   : message,
    html   : message
  }

  transporter.sendMail ( emailData, function(error,response) {
    if (error) {
      log.error ( 1,'Emailer error: ' + error );
//    } else  {
//      console.log ( "Message sent: " + response.message );
    }
    transporter.close();
  });

}

function send_telnet ( to,subject,message )  {
var emailer = conf.getEmailerConfig();
var telnet  = child_process.spawn ( 'telnet', [emailer.host,emailer.port] );

  telnet.stdin.setEncoding ( 'utf-8' );

  (function(){

    telnet.on ( 'exit',function(code){
      telnet = null;
    });

    var stage = 0;

    telnet.stdout.on ( 'data', function(data){
      if (telnet && (stage>0))  {
        var msg = '';
        switch (stage)  {
          case 1 : msg = 'HELO '        + emailer.host;             break;
          case 2 : msg = 'MAIL FROM: '  + emailer.emailFrom;        break;
          case 3 : msg = 'RCPT TO: '    + to;                       break;
          case 4 : msg = 'DATA';                                    break;
          case 5 : msg = 'From: '       + emailer.headerFrom +
                         '\nTo: '       + to +
                         '\nSubject: '  + subject +
                         '\nMIME-Version: 1.0' +
                         '\nContent-Type: text/html; charset="ISO-8859-1"' +
                         '\n\n<html><body>\n' +
                         message +
                         '\n</body></html>\n' +
                         '.';
                   break;
          default: msg = 'QUIT';
        }
        try {
          telnet.stdin.write ( msg + '\n' );
        } catch (e)  {
          log.error ( 2,'Emailer error: cannot send e-mail' );
          telnet = null;
        }
      }
      stage += 1;
    });

  }());

}


function send ( to,subject,message )  {
var emailer_type = conf.getEmailerConfig().type;

  if (emailer_type=='nodemailer')  {
    send_nodemailer ( to,subject,message );
  } else if (emailer_type=='telnet')  {
    send_telnet ( to,subject,message );
  } else if (emailer_type=='desktop')  {
    return message;
  }

  return '';

}


// ==========================================================================
// export for use in node
module.exports.send = send;
