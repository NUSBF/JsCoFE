
/*
 *
 *     UNDER DEVELOPMENT, DO NOT USE!
 *
 *  =================================================================
 *
 *    01.02.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/cloudctl.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User making utility
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 * Invocation:
 *
 *    node js-utils/cloudctl.js [commands] config.json
 *
 * where config.json is the Front End configuration file.
 *
 * Commands:
 *
 *    deactivate N P : deactivate Nth server, using protocol P (see below).
 *                        N = 'all'  all nodes
 *                        N = 0      Front End
 *                        N = 1      Number cruncher #1
 *                        N = 2      Number cruncher #2
 *                        etc.
 *
 *    stop N P       : stop Nth server, using protocol P (see below); N is
 *                     defined as above
 *
 *    activate N     : activate Nth server, N is defined as above
 *
 *  Deactivated Front-End can still accept jobs from Number Crunchers, but
 *  wont send new jobs to them. If a user tries to submit a job to a deactivated
 *  FE, the action gets rejected with sending back the message from deacivation
 *  protocol.
 *
 *  Deactivated Number Cruncher will not send finished jobs back to FE and wont
 *  accept the new ones. The jobs will continue to run, and finished jobs will
 *  be sent to FE once the Number Cruncher is activated.
 *
 *  Deactivation Protocols
 *  ~~~~~~~~~~~~~~~~~~~~~~
 *
 *  They are optional and described in FE configuration file:
 *
 *  "Protocols" : {
 *     "A" :  { "lapse"   : 600,   // seconds
 *              "message" : "temporary shutdown"
 *            },
 *     "B" :  { "lapse"   : 900,   // seconds
 *              "message" : "closing for maintenance"
 *            }
 *  }
 *
 *  For the above configuration, protocol parameter 'P' may be either 'A' or 'B'.
 *  If protocols are not configured, 'P' may take any value and will be ignored.
 *
 *  In protocol description:
 *
 *     lapse      is used only in 'stop' command. Command 'stop' first deactivates
 *                server, then waits specified number of seconds, and then
 *                terminates it. By default, lapse=300 seconds
 *
 *     message    is message a user will see if FE is deactivated
 *
 */

//  load system modules
var request = require('request'   );

//  load application modules
var conf   = require('../js-server/server.configuration');
var cmd    = require('../js-common/common.commands');


// ==========================================================================

var cmdline   = (process.argv.length==5) || (process.argv.length==6);
var operation = '';
var node      = '';
var protocol  = '';
var cfgfpath  = '';

if (cmdline)  {
  operation = process.argv[2];
  switch (operation)  {
    case 'deactivate' :
    case 'stop'       : cmdline  = (process.argv.length==6);
                        node     = process.argv[3];
                        protocol = process.argv[4];
                        cfgfpath = process.argv[5];
                        break;
    case 'activate'   : cmdline  = (process.argv.length==5);
                        node     = process.argv[3];
                        cfgfpath = process.argv[4];
                        break;
    default           : cmdline = false;
  }
  if (cmdline && node && (node!='all'))  {
    node    = parseInt(node);
    cmdline = (node>=0);
  }
}

if (!cmdline)  {
  console.log (
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    '(1) node js-utils/cloudctl.js deactivate N P /path/to/config.json\n\n' +
    '(2) node js-utils/cloudctl.js stop N P /path/to/config.json\n\n' +
    '(3) node js-utils/cloudctl.js activate N /path/to/config.json\n\n' +
    'where config.json is the FE configuration file; N specifies Cloud\'s server:\n' +
    '       N = all   - all servers\n' +
    '       N = 0     - Front End server\n' +
    '       N = n     - (n=1,2,...) Number Cruncher #n;\n' +
    'P is deactivation protocol, described in FE configuration file.\n'
  );
  process.exit();
}

conf.set_python_check ( false );

var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  console.log ( ' *** FE configuration failed (wrong configuration file?). Stop.' );
  console.log ( msg );
  process.exit();
}

var config = null;
if ((node=='all') || (node==0))
  config = conf.getFEConfig();
else if (node<=conf.getNumberOfNCs())
  config = conf.getNCConfig(node-1);

if (config)  {

  request.post ({
      url  : config.externalURL + '/' + cmd.fe_command.control,
      body : {
        operation : operation,
        protocol  : protocol,
        node      : node
      },
      json : true
    },function(err,httpResponse,response) {

      if (err) {
        console.log ( ' *** request failed: ' + err );
      } else  {
        console.log ( ' response: ' + JSON.stringify(response) );

// response: {"_type":"Response","version":"1.6.019 [16.02.2021]","status":"ok","message":"{\"operation\":\"activate\",\"protocol\":\"\",\"node\":0}","data":"

        /*
        try {
          var resp = JSON.parse ( response );
          if (resp.status==cmd.fe_retcode.ok)  {
            log.detailed ( 1,'directory ' + dirPath +
                             ' has been received at ' + serverURL );
        } catch(err)  {
          onErr_func ( 4,response );  // '4' means unrecognised response
        }
        */
      }

    });

} else  {

  console.log ( ' *** wrong NC number: ' + node );
  console.log ( ' *** ' + conf.getNumberOfNCs() + ' NC(s) configured' );

}
