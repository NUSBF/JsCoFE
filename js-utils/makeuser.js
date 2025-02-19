
/*
 *  =================================================================
 *
 *    04.08.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/makeuser.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User making utility
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2023
 *
 *  =================================================================
 *
 * Invocation:
 *
 *    node js-utils/makeuser.js config.json
 *
 * where config.json is the Front End configuration file. User name, e-mail,
 * login ID and applicable licence are asked interactively.
 *
 * Note: all new users are assigned the "user" role. This can be changed later
 * by the CCP4 Cloud administrator. First administrator is created by using the
 * reserved login ID: "admin". It is recommended to create administrative
 * account with this login ID immediately after initial setup.
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

  // prompt.start();

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

if (process.argv.length<3)  {
  console.log (
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    'node js-utils/makeuser.js /path/to/config.json\n\n' +
    'where config.json is the FE configuration file. User name, e-mail, login ID\n' +
    'and applicable licence are asked interactively.\n\n' +
    'Note: all new users are assigned the "user" role. This can be changed later\n' +
    'by the CCP4 Cloud administrator. First administrator is created by using the\n' +
    'reserved login ID: "admin". It is recommended to create administrative\n' +
    'account with this login ID immediately after initial setup.\n'
  );
  process.exit();
}

conf.set_python_check ( false );

var cfgfpath = process.argv[2];
var msg = conf.readConfiguration ( cfgfpath,'FE' );
if (msg)  {
  console.log ( ' *** FE configuration failed (wrong configuration file?). Stop.' );
  console.log ( msg );
  process.exit();
}

getUserData();
