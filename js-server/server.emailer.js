
/*
 *  =================================================================
 *
 *    30.09.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const nodemailer = require('nodemailer');
const path       = require('path');

//  load application modules
const conf       = require('./server.configuration');
const utils      = require('./server.utils');
const cmd        = require('../js-common/common.commands');
const com_utils  = require('../js-common/common.utils');

//  prepare log
const log = require('./server.log').newLog(4);

// ==========================================================================


function send_nodemailer ( to,subject,message )  {
let emailer     = conf.getEmailerConfig();
let transporter = nodemailer.createTransport ( emailer );

  let emailData = {
    from   : emailer.emailFrom,
    to     : to,
    subject: subject,
    text   : message,
    html   : message
  }

  transporter.sendMail ( emailData, function(error,response) {
    if (error) {
      log.error ( 1,'Attempt to send an e-mail:' );
      log.error ( 1,'To: ' + to );
      log.error ( 1,'Subject: ' + subject );
      // log.error ( 1,'Message: ' + message );
      log.error ( 1,'Emailer error: ' + error );
//    } else  {
//      console.log ( "Message sent: " + response.message );
    }
    transporter.close();
  });

}

/*
function send_telnet ( to,subject,message )  {
  try {
    let emailer = conf.getEmailerConfig();
    let telnet  = utils.spawn ( 'telnet',[emailer.host,emailer.port],{} );

      if (telnet)  {

        telnet.stdin.setEncoding ( 'utf-8' );

        (function(t){

          let finish = false;
          t.on ( 'exit',function(code){
            finish = true;
          });

          t.on ( 'error',function(e){
            log.error ( 2,'Emailer error: cannot send e-mail' );
            log.error ( e.stack || e );
          });

          let stage = 0;

          t.stdout.on ( 'data', function(data){
            if ((!finish) && (stage>0))  {
              let msg = '';
              switch (stage)  {
                case 1  : msg = 'HELO '         + emailer.host;             break;
                case 2  : msg = 'MAIL FROM: <'  + emailer.emailFrom + '>';  break;
                case 3  : msg = 'RCPT TO: <'    + to + '>';                 break;
                case 4  : msg = 'DATA';                                     break;
                case 5  : msg = 'From: '        + emailer.headerFrom +
                                '\nTo: '        + to      +
                                '\nSubject: '   + subject +
                                '\nMIME-Version: 1.0'     +
                                '\nContent-Type: text/html; charset="ISO-8859-1"' +
                                '\n\n<html><body>\n'      +
                                message                   +
                                '\n</body></html>\n'      +
                                '.';
                          break;
                case 6  : msg = 'QUIT';  break;
                default : ;
              }
              if (msg)  {
                try {
                  t.stdin.write ( msg + '\n' );
                } catch (e)  {
                  log.error ( 3,'Emailer error: cannot send e-mail' );
                  log.error ( e.stack || e );
                  finish = false;
                }
              }
            }
            stage += 1;
          });

        }(telnet));

      } else {
        log.warning ( 6,'telnet is not found, emailer will not work' );
      }

  } catch (e)  {
    log.error ( 6,'exception while using telnet' );
  }

  return;

}
*/

function send_telnet ( to,subject,message )  {
  try {
    let emailer = conf.getEmailerConfig();
    let telnet  = utils.spawn ( 'telnet',[emailer.host,emailer.port],{} );

    if (telnet)  {

      telnet.stdin.setEncoding ( 'utf-8' );

      let finish = false;
      telnet.on ( 'exit',function(code){
        finish = true;
      });

      telnet.on ( 'error',function(e){
        log.error ( 2,'Attempt to send an e-mail:' );
        log.error ( 2,'To: ' + to );
        log.error ( 2,'Subject: ' + subject );
        log.error ( 2,'Emailer error: cannot send e-mail' );
        log.error ( e.stack || e );
      });

      let stage = 0;

      telnet.stdout.on ( 'data', function(data){
        if ((!finish) && (stage>0))  {
          let msg = '';
          switch (stage)  {
            case 1  : msg = 'HELO '         + emailer.host;             break;
            case 2  : msg = 'MAIL FROM: <'  + emailer.emailFrom + '>';  break;
            case 3  : msg = 'RCPT TO: <'    + to + '>';                 break;
            case 4  : msg = 'DATA';                                     break;
            case 5  : msg = 'From: '        + emailer.headerFrom +
                            '\nTo: '        + to      +
                            '\nSubject: '   + subject +
                            '\nMIME-Version: 1.0'     +
                            '\nContent-Type: text/html; charset="ISO-8859-1"' +
                            '\n\n<html><body>\n'      +
                            message                   +
                            '\n</body></html>\n'      +
                            '.';
                      break;
            case 6  : msg = 'QUIT';  break;
            default : ;
          }
          if (msg)  {
            try {
              telnet.stdin.write ( msg + '\n' );
            } catch (e)  {
              log.error ( 3,'Attempt to send an e-mail:' );
              log.error ( 3,'To: ' + to );
              log.error ( 3,'Subject: ' + subject );
              log.error ( 3,'Emailer error: cannot send e-mail' );
              log.error ( e.stack || e );
              finish = false;
            }
          }
        }
        stage += 1;
      });

    } else {
      log.warning ( 6,'telnet is not found, emailer will not work' );
    }

  } catch (e)  {
    log.error ( 6,'exception while using telnet' );
  }

  return;

}


function send_sendmail ( to,subject,message )  {
  try {
    let emailer  = conf.getEmailerConfig();
    let sendmail = utils.spawn ( 'sendmail',[to],{} );
      if (sendmail)  {
        sendmail.stdin.setEncoding('utf-8');
        // sendmail.stdout.pipe(process.stdout);
        sendmail.stdin.write (
          'From: '        + emailer.headerFrom +
          '\nSubject: '   + subject +
          '\nMIME-Version: 1.0'     +
          '\nContent-Type: text/html; charset="ISO-8859-1"' +
          '\n\n<html><body>\n'      +
          message                   +
          '\n</body></html>\n'
        );
        sendmail.stdin.end();
      } else
        log.warning ( 5,'sendmail not found, e-mailer will not work' );
  } catch(e)  {
    log.error ( 5,'Attempt to send an e-mail:' );
    log.error ( 5,'To: ' + to );
    log.error ( 5,'Subject: ' + subject );
    log.error ( 5,'exception while using sendmail' );
  }
}


function send ( to,subject,message )  {
  if (message)  {
    let emailer_type = conf.getEmailerConfig().type;
    if (emailer_type=='nodemailer')  {
      send_nodemailer ( to,subject,message );
    } else if (emailer_type=='telnet')  {
      setTimeout ( function(){
        send_telnet ( to,subject,message );
      },200);
    } else if (emailer_type=='sendmail')  {
      setTimeout ( function(){
        send_sendmail ( to,subject,message );
      },200);
    } else if (emailer_type=='desktop')  {
      //log.standard ( 1,'send e-mail in desktop mode:\n' + message );
      return message;
    }
  } else
    log.error ( 4,'attempt to send an empty e-mail to user; e-mail was not sent' );
  return '';
}


function sendTemplateMessage ( userData,subject,template_name,subs_dict )  {
let message = utils.readString ( path.join('message_templates',template_name+'.html') );
  if (message)  {
    let userStatus = 'active';
    if (userData.dormant)
      userStatus = 'dormant since ' + (new Date(userData.dormant).toISOString().slice(0,10));
    let user_dict = {
      'userName'        : userData.name,
      'userLogin'       : userData.login,
      'userEMail'       : userData.email,
      'userLicence'     : userData.licence,
      'userFeedback'    : userData.feedback,
      'userStatus'      : userStatus,
      'appName'         : cmd.appName(),
      'appURL'          : '<a href="' + conf.getFEConfig().reportURL + '">' +
                          conf.getFEConfig().reportURL + '</a>',
      'app_url'         : conf.getFEConfig().reportURL,
      'maintainerEmail' : conf.getEmailerConfig().maintainerEmail
    };
    for (let key in user_dict)
      message = com_utils.replaceAll ( message,'$'+key,user_dict[key] );
    for (let key in subs_dict)
      message = com_utils.replaceAll ( message,'$'+key,subs_dict[key] );
  }
  return send ( userData.email,subject,message );
}


// ==========================================================================
// export for use in node
module.exports.sendTemplateMessage = sendTemplateMessage;
module.exports.send                = send;
