
/*
 *  =================================================================
 *
 *    13.10.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

//  load application modules
const class_map = require('./server.class_map');
const user      = require('./server.fe.user');
const cmd       = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(12);


// ==========================================================================

const __max_post_length = 1e8;  // 100 MBytes limit

function processPOSTData ( server_request,server_response,process_data_function,
                           server_state ) {

  if (server_state!='active')  {

    cmd.sendResponse ( server_response,cmd.fe_retcode.serverInactive,'Server deactivated','' );

  } else if (server_request.method=='POST')  {

    let data = '';
    server_request.on ( 'data', function(d) {
      data += d;
      // Allow maximum 1MB, otherwise kill the connection
      if (data.length>__max_post_length)  {
        log.warning ( 1,'long data in post (' + data.length + '), connection killed' );
        server_request.connection.destroy();
        cmd.sendResponse ( server_response, cmd.fe_retcode.largeData,
                           'Server request data too large','' );
      }
    });

    server_request.on ( 'end', function(){

      if (data.length<=__max_post_length)  {

        let data_obj = class_map.getClassInstance ( data );

        if (data_obj)  {
          if (data_obj.hasOwnProperty('_type'))  {
            if (data_obj._type=='Request')  {
              let loginData = user.getLoginEntry ( data_obj.token );
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
          log.error ( 1,'corrupt object ' + JSON.stringify(data,null,2) );
        }

      }

    });

  }

}


// ==========================================================================
// export for use in node
module.exports.processPOSTData = processPOSTData;
