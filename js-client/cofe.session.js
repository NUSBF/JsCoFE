
/*
 *  =================================================================
 *
 *    19.10.19   <--  Date of Last Modification.
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

  // set jsrview path, which is used in jsrview iframes
  _jsrview_uri = 'js-lib/jsrview/';

  checkLocalService ( function(rc){

    if (!rc)  {

      if (__local_user)  {
        //__login_token = 'e58e28a556d2b4884cb16ba8a37775f0';
        //__login_user  = 'Local user';
        login ( '**localuser**','',sceneId,0 );
        //loadKnowledge ( 'Login' )
        //makeProjectListPage(sceneId);
      } else  {

        if (dev_switch==0)  {

          makeLoginPage ( sceneId );

        } else if (dev_switch==10)  {

          __login_token = 'a6ed8a1570e6c2bc8211997f9f1672528711e286';
          __login_user  = 'Admin';
          __doNotShowList = ['*'];
          loadKnowledge    ( 'Login' );
          makeAdminPage    ( sceneId );
          makeSessionCheck ( sceneId );

        } else  {

          __doNotShowList = ['*'];
          __cloud_storage = true;  // fixed for developer
          if (__login_token)  {
            __login_token = 'devel';
            __login_user  = 'Developer';
          } else  {
            __login_token = '340cef239bd34b777f3ece094ffb1ec5';
            __login_user  = 'Developer';
          }
          login ( 'devel','devel',sceneId,dev_switch );

          /*
          loadKnowledge ( 'Login' );

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

          makeSessionCheck  ( sceneId );
          */

        }

      }

      setHistoryListener ( sceneId );

    }

  });

}


function login ( user_login_name,user_password,sceneId,page_switch )  {

  ud       = new UserData();
  ud.login = user_login_name;
  ud.pwd   = user_password;

  serverCommand ( fe_command.login,ud,'Login',function(response){

    switch (response.status)  {

      case fe_retcode.ok:
              var userData    = response.data.userData;
              __login_token   = response.message;
              __login_user    = userData.name;
              __user_settings = userData.settings;
              __admin         = userData.admin;
              __dormant       = userData.dormant;
              __cloud_storage = response.data.cloud_storage;
              __demo_projects = response.data.demo_projects;

              if ('helpTopics' in userData)
                    __doNotShowList = userData.helpTopics;
              else  __doNotShowList = [];
              __local_setup = response.data.localSetup;

              loadKnowledge ( 'Login' );

              switch (page_switch)  {

                case 0 : if (__admin && (userData.login=='admin'))
                               makeAdminPage       ( sceneId );
                         else if ((!__local_setup) && (userData.action!=userdata_action.none))
                         //else if (userData.action!=userdata_action.none)
                               makeAccountPage     ( sceneId );
                         else  makeProjectListPage ( sceneId );
                      break;

                case 1 : makeProjectListPage ( sceneId );  break;
                case 2 : makeAccountPage     ( sceneId );  break;
                default: if (__admin)  makeAdminPage   ( sceneId );
                                 else  makeProjectPage ( sceneId );

              }

              makeSessionCheck ( sceneId );

              if (__dormant)
                window.setTimeout ( function(){
                  new MessageBox ( 'Dormant Account',
                          'Dear ' + __login_user + ',' +
                          '<p>Your account was deemed dormant due to low use rate.<br>' +
                          'This means: ' +
                          '<ul>' +
                          '  <li>you can login as before</li>' +
                          '  <li>you can browse your projects and jobs</li>' +
                          '  <li>you can export all your data, job directories and projects</li>' +
                          '  <li>you can delete your account, jobs and projects</li>' +
                          '  <li>you <b>cannot run</b> new jobs</li>' +
                          '  <li>you <b>cannot create</b> new projects</li>' +
                          '  <li>you <b>cannot import</b> projects</li>' +
                          '</ul>' +
                          'In order to re-activate your account, please send an e-mail<br>' +
                          'request to server\'s maintainer at<p>' +
                          '<a href="mailto:' + maintainerEmail +
                            '?Subject=' + appName() + '%20Account re-activation">' + maintainerEmail +
                          '</a>.<p>Kind regards<p>' + appName() + ' maintenance.'
                        );
                },100);

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


var __session_check_timer  = null;

function checkSession ( sceneId )  {

  serverCommand ( fe_command.checkSession,{'login_token':__login_token},
                  'Check session',
    function(rdata){ // successful reply
      if (__session_check_timer)  {
        if ((rdata.status==fe_retcode.wrongSession) ||
            (rdata.status==fe_retcode.notLoggedIn))  {
          __login_token = '';
          logout ( sceneId,1 );
        } else
          makeSessionCheck ( sceneId );
      }
      return true;
    },
    function(){}, // always do nothing
    function(){   // fail
      if (__session_check_timer)  {
        if (__local_setup)  {
          __login_token = '';
          logout ( sceneId,2 );
        } else
          makeSessionCheck ( sceneId );
      }
    }
  );

}

function makeSessionCheck ( sceneId )  {
  __session_check_timer = setTimeout ( function(){
    checkSession ( sceneId );
  },__check_session_period);
}

function stopSessionChecks()  {
  if (__session_check_timer)  {
    clearTimeout ( __session_check_timer );
    __session_check_timer = null;
  }
}
