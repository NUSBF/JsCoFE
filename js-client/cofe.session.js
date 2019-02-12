
/*
 *  =================================================================
 *
 *    22.01.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.session.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User session management
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

function startSession ( sceneId,dev_switch )  {


  setClientCode ( client_code.ccp4 );

  // set jsrview path (primarily for UglyMol)
  _jsrview_uri = 'js-lib/jsrview/';

  //$(function() {
    $(document).tooltip({
        show  : { effect : 'slideDown' },
        track : true,
        open  : function (event, ui) {
            setTimeout(function() {
                $(ui.tooltip).hide('explode');
            },3000);
        }
    });
  //});

  checkLocalService ( function(rc){

    if (!rc)  {

      if (__local_user)  {
        //__login_token = 'e58e28a556d2b4884cb16ba8a37775f0';
        //__login_user  = 'Local user';
        login ( '**localuser**','',sceneId );
        //loadKnowledge ( 'Login' )
        //makeProjectListPage(sceneId);
      } else  {

        if (dev_switch==0)  {

          makeLoginPage ( sceneId );

        } else if (dev_switch==10)  {

          __login_token = 'a6ed8a1570e6c2bc8211997f9f1672528711e286';
          __login_user  = 'Admin';
          __doNotShowList = ['*'];
          loadKnowledge ( 'Login' )
          makeAdminPage ( sceneId );

        } else  {

          if (!__login_token)  {
            __login_token = '340cef239bd34b777f3ece094ffb1ec5';
            __login_user  = 'Developer';
          } else {
            __login_token = 'devel';
            __login_user  = 'Developer';
          }
          __doNotShowList = ['*'];
          __cloud_storage = true;  // fixed for developer
          loadKnowledge ( 'Login' )

          if (dev_switch==1)  {

            makeProjectListPage ( sceneId );

          } else if (dev_switch==2)  {

            makeAccountPage ( sceneId );

          //} else if (dev_switch==4)  {
          //      makeFacilitiesPage(sceneId);

          } else if (__admin)  {

            makeAdminPage ( sceneId );

          } else  {

            makeProjectPage ( sceneId );

          }

        }

      }

    }

  });

}


function login ( user_login_name,user_password,sceneId )  {

  ud       = new UserData();
  ud.login = user_login_name;
  ud.pwd   = user_password;

  serverCommand ( fe_command.login,ud,'Login',function(response){

    switch (response.status)  {

      case fe_retcode.ok:
              var userData    = response.data.userData;
              __login_token   = response.message;
              __login_user    = userData.name;
              __admin         = userData.admin;
              __cloud_storage = response.data.cloud_storage;
              if ('helpTopics' in userData)
                    __doNotShowList = userData.helpTopics;
              else  __doNotShowList = [];
              __local_setup = response.data.localSetup;
              loadKnowledge ( 'Login' )
              if (__admin && (userData.login=='admin'))
                    makeAdminPage       ( sceneId );
              else  makeProjectListPage ( sceneId );
          return true;

      case fe_retcode.wrongLogin:
                new MessageBox ( 'Login',
                  '<b>Login data cannot be recognised.</b><p>' +
                  'Please check that provided login name and password are ' +
                  'correct.' );
          return true;

      default: ;

    }

    return false;

  },null,null);

}
