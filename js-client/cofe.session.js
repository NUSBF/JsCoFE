
/*
 *  =================================================================
 *
 *    19.11.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */

function startSession ( sceneId,dev_switch )  {


  setClientCode ( client_code.ccp4 );

  // set jsrview path, which is used in jsrview iframes
  _jsrview_uri = 'js-lib/jsrview/';

  // check whether session was started to load a demo project
  var url_search = window.location.search;
  if (url_search)  {
    var url_plist    = decodeURI(url_search).split('?').pop().split('&');
    __url_parameters = {};
    for (var i=0;i<url_plist.length;i++)  {
      var p = url_plist[i].split('=');
      __url_parameters[p[0]] = p[1];
    }
    // alert ( JSON.stringify(__url_parameters) );
alert ( window.location.pathname );
    var lpath = window.location.pathname.substr(1).split('/');  // skip first slash
    var wpath = '/';
    if (lpath.length>0)
      wpath = '/' + lpath[0] + '/';
alert ( wpath );
    window.history.replaceState ( {},document.title,wpath );
  }

  checkLocalService ( function(rc){

    if (!rc)  {

      if (__local_user)  {
        //__login_token = 'e58e28a556d2b4884cb16ba8a37775f0';
        //__login_user  = 'Local user';
        login ( '**' + __local_user_id + '**','',sceneId,0 );
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


var __announcement_made = false;

function checkAnnouncement()  {

  if (!__announcement_made)
    serverCommand ( fe_command.checkAnnouncement,{},'Announcement',
      function(rdata){ // successful reply
        if (rdata.data.message)  {
          if (startsWith(rdata.data.message,'!#'))
            rdata.data.message = rdata.data.message.split('\n').slice(1).join('\n');
          if (rdata.data.message)
            new MessageBox ( 'Announcement','<div style="width:500px;">' +
                                            rdata.data.message + '</div>' );
        }
        __tips = rdata.data.tips;  // may be null
        __announcement_made = true;
        return true;
      },
      function(){}, // always do nothing
      function(){}  // do nothing on fail
    );

}


function login ( user_login_name,user_password,sceneId,page_switch )  {

  ud       = new UserData();
  ud.login = user_login_name;
  ud.pwd   = user_password;

  serverCommand ( fe_command.login,ud,'Login',function(response){

    switch (response.status)  {

      case fe_retcode.ok:
              var userData         = response.data.userData;
              __login_token        = response.message;
              if (user_login_name=='**' + __local_user_id + '**')
                    __login_id     = __local_user_id;
              else  __login_id     = user_login_name;
              __cloud_storage      = response.data.cloud_storage;
              __jobs_safe          = response.data.jobs_safe;
              __demo_projects      = response.data.demo_projects;
              __environ_server     = response.data.environ_server;
              __login_user         = userData.name;
              __user_settings      = userData.settings;
              __user_role          = userData.role;
              __dormant            = userData.dormant;
              __user_authorisation = userData.authorisation;

              if (!__local_service)  {
                __environ_client = [];
              } else  {
                localCommand ( nc_command.getNCInfo,{},'NC Info Request',
                  function(response){
                    if (response)  {
                      if (response.status==nc_retcode.ok)  {
                        if ('environ' in response.data)
                          __environ_client = response.data.environ;
                        else  // fallback
                          __environ_client = ['CCP4'];
                      } else  {
                        new MessageBox ( 'Get NC Info Error',
                          'Unknown error: <b>' + response.status + '</b><p>' +
                          'when trying to fetch Client NC data.' );
                      }
                      return true;
                    }
                    return false;
                  });
              }

              if ('helpTopics' in userData)
                    __doNotShowList = userData.helpTopics;
              else  __doNotShowList = [];
              __local_setup = response.data.localSetup;

              loadKnowledge ( 'Login' );

              switch (page_switch)  {

                //case 0 : if (__admin && (userData.login=='admin'))
                case 0 :  if ((__user_role==role_code.admin) && (userData.login=='admin'))
                            makeAdminPage       ( sceneId );
                          else if ((!__local_setup) && (userData.action!=userdata_action.none))
                          //else if (userData.action!=userdata_action.none)
                            makeAccountPage     ( sceneId );
                          else if (__user_settings.onlogin=='last_project')  {
                            serverRequest ( fe_reqtype.getProjectList,0,'Project List',function(data){
                              var found = false;
                              for (var i=0;(i<data.projects.length) && (!found);i++)
                                found = (data.projects[i].name==data.current);
                              if (found)  makeProjectPage     ( sceneId );
                                    else  makeProjectListPage ( sceneId );
                            },null,'persist');
                          } else  makeProjectListPage ( sceneId );
                        break;

                case 1 :  makeProjectListPage ( sceneId );  break;
                case 2 :  makeAccountPage     ( sceneId );  break;

                case 101: new HopOnDemoProjectDialog ( function(){
                            makeProjectPage ( sceneId );
                          });
                        break;

                //default: if (__admin)  makeAdminPage   ( sceneId );
                default:  if (__user_role==role_code.admin)
                                makeAdminPage   ( sceneId );
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
                    '<a href="mailto:' + __maintainerEmail +
                      '?Subject=' + appName() + '%20Account re-activation">' +
                       __maintainerEmail +
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

      case fe_retcode.suspendedLogin:
                new MessageBox ( 'Suspended Login',
                  '<div style="width:500px;">' +
                  '<h2>Your account is suspended.</h2><p>' +
                  'Your account is suspended due to the maintenance or data ' +
                  'reorganisation work on ' + appName() + ' taking place at this ' +
                  'moment. This should not last longer than a minute per ' +
                  'gigabyte of your project data, after which your account ' +
                  'will be released automatically. Please contact ' + appName() +
                  ' maintainer at <a href="mailto:' + __maintainerEmail +
                    '?Subject=License%20enquiry">' + __maintainerEmail +
                    '</a> if your account remains suspended for ' +
                  'unreasonably long time.<p>Sincere apologies for any ' +
                  'inconvenience this may be causing to you.</div>' );
          return true;

      default: ;

    }

    return false;

  },null,null);

}


var __session_check_timer  = null;

function checkSession ( sceneId )  {

  if (__server_queue.length>0)  {

    makeSessionCheck ( sceneId );

  } else  {

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

}


function stopSessionChecks()  {
  if (__session_check_timer)  {
    __session_check_timer = null;
    clearTimeout ( __session_check_timer );
  }
}

function makeSessionCheck ( sceneId )  {
  stopSessionChecks();
  __session_check_timer = setTimeout ( function(){
    checkSession ( sceneId );
  },__check_session_period);
}
