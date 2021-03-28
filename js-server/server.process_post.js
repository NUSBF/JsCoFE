
/*
 *  =================================================================
 *
 *    17.02.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.process_post.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  POST Processing Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */

 //  load application modules
 var class_map = require('./server.class_map');
 var user      = require('./server.fe.user');
 var cmd       = require('../js-common/common.commands');

//  prepare log
//var log = require('./server.log').newLog(12);


// ==========================================================================

function processPOSTData ( server_request,server_response,process_data_function,
                           server_state ) {

  if (server_state!='active')  {

    cmd.sendResponse ( server_response,cmd.fe_retcode.serverInactive,'Server deactivated','' );

  } else if (server_request.method=='POST')  {

    var data = '';
    server_request.on ( 'data', function(d) {
      data += d;
      // 1MB is too much POST data, kill the connection!
      if (data.length>1e6)  {
        server_request.connection.destroy();
        cmd.sendResponse ( server_response, cmd.fe_retcode.largeData,
                           'Server request data too large','' );
      }

    });

    server_request.on ( 'end', function(){

      var data_obj = class_map.getClassInstance ( data );

      if (data_obj)  {
        if (data_obj.hasOwnProperty('_type'))  {
          if (data_obj._type=='Request')  {
            var loginData = user.getLoginData ( data_obj.token );
            if (loginData.login.length<=0)
              cmd.sendResponse ( server_response, cmd.fe_retcode.notLoggedIn,
                                 'user not logged in','' );
            else
              process_data_function ( loginData,data_obj.request,data_obj.data,
                function(response){
                  response.send ( server_response );
                });
          } else
            process_data_function ( data_obj,function(response){
              response.send ( server_response );
            });
        } else
          process_data_function ( data_obj,function(response){
            response.send ( server_response );
          });
      } else  {
        cmd.sendResponse ( server_response, cmd.fe_retcode.corruptDO,
                           'corrupt data object found','' );
        //console.log ( ' >>>> ' + JSON.stringify(data) );
      }

    });

  }

}


// ==========================================================================
// export for use in node
module.exports.processPOSTData = processPOSTData;
