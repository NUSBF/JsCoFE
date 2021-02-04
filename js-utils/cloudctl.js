
/*
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
var prompt = require('prompt');

//  load application modules
var conf   = require('../js-server/server.configuration');
var ud     = require('../js-common/common.data_user');
var user   = require('../js-server/server.fe.user');


//  prepare log
//var log = require('../js-server/server.log').newLog(26);

// ==========================================================================

function makeUser ( idata )  {

  var userData = new ud.UserData();
  userData.name  = idata.username;
  userData.email = idata.email;
  userData.login = idata.login;
  switch (idata.licence.toLowerCase())  {
    default:
    case 'a' :
    case 'academic'   : userData.licence = ud.licence_code.academic;   break;
    case 'c' :
    case 'commercial' : userData.licence = ud.licence_code.commercial; break;
  }
  /*
  switch (idata.role.toLowerCase())  {
    default:
    case 'u' :  case 'user'      : userData.role = ud.role_code.user;      break;
    case 'a' :  case 'admin'     : userData.role = ud.role_code.admin;     break;
    case 'd' :  case 'developer' : userData.role = ud.role_code.developer; break;
  }
  userData.action = ud.userdata_action.chpwd;
  */

  //console.log ( userData);
  console.log ( ' --- make new user' );

  user.makeNewUser ( userData,function(response){});

}


function getUserData()  {

  prompt.message = '';

  prompt.start();

  const properties = [
    {
      name     : 'username',
      message  : 'User name (e.g., John Smith)',
      validator: /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/,
      warning  : 'User name should only contain latin letters, dots, dashes and spaces'
    }, {
      name     : 'email',
      message  : 'User email (e.g., john@uni.ac.uk)',
      validator: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
      warning  : 'Should be a valid e-mail address'
    }, {
      name     : 'login',
      message  : 'User login ID (e.g., johnsmith15)',
      validator: /^[A-Za-z0-9\\-\\._]+$/,
      warning  : 'User login ID should only contain letters, numbers, ' +
                 'underscores, periods and dashes'
    /*
    }, {
      name     : 'role',
      message  : 'User role ([u]ser|[a]dmin|[d]eveloper)',
      validator: /(u|user|a|admin|d|developer)/,
      warning  : 'User role can be only [u]ser, [a]dmin or [d]eveloper'
    */
    }, {
      name     : 'licence',
      message  : 'Licence ([a]cademic|[c]ommercial)',
      validator: /(a|academic|c|commercial)/,
      warning  : 'Licence can be only [a]cademic or [c]ommercial'
  //    }, {
  //        name: 'password',
  //        hidden: true
    }
  ];

  prompt.start();

  prompt.get ( properties, function(err,result){
    if (err)  {
      console.log ( err );
      return 1;
    } else  {
      makeUser ( result );
      return 0;
    }
  });

}

// ==========================================================================

var cmdline   = (process.argv.length==5) || (process.argv.length==6);
var operation = '';
var node      = '';

if (cmdline)  {
  operation = process.argv[2];
  switch (operation)  {
    case 'deactivate' :
    case 'stop'       : cmdline = (process.argv.length==6);
                        node    = process.argv[3];
                        break;
    case 'activate'   : cmdline = (process.argv.length==5);
                        break;
    default           : cmdline = false;
  }
  if (cmdline && node && (node!='all'))
    cmdline = (parseInt(node)>=0);
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

var cfgfpath = process.argv[process.argv.length-1];
var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  console.log ( ' *** FE configuration failed (wrong configuration file?). Stop.' );
  console.log ( msg );
  process.exit();
}

//getUserData();
