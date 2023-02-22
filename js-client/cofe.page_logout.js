
/*
 *  =================================================================
 *
 *    22.02.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_logout.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Logout page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2023
 *
 *  =================================================================
 *
 */

'use strict';

// -------------------------------------------------------------------------
// logout page class

function LogoutPage ( sceneId,reason_key )  {

  //if (__login_token)  __login_token.empty();
  //if (__login_user)   __login_user .empty();
  __login_token = '';
  __login_user  = '';
  __user_role   = role_code.user;
//  __admin       = false;

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LogoutPage' );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize          ( '45%','',0,0,1,1 );
  this.grid.setCellSize          ( '10%','',0,1,1,1 );
  this.grid.setVerticalAlignment ( 0,1,'middle' );
  this.grid.setHorizontalAlignment ( 0,1,'center' );
  this.grid.setCellSize          ( '45%','',0,2,1,1 );
  this.makeLogoPanel             ( 1,0,3 );

  // make login panel
  var panel = new Grid('');
  panel.setWidth      ( '500pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  var thank_lbl = new Label ( 'Thank you for using ' + appName() );
  var msg = '';
  switch (reason_key)  {
    case 1  :  msg = 'Your session in this window was closed ' +
                     'because you have logged in somewhere else.';
            break;
    case 2  :  msg = 'Your session in this window was terminated because local ' +
                     appName() + ' service has stopped or was restared.';
            break;
    case 3  :  msg = 'Your session in this window was terminated in order to keep ' +
                     appName() + ' archiving process uninterrupted. Your account ' +
                     'is temporarily suspended and will be made available automatically ' +
                     'once archiving is completed.<p>Please try to login ' +
                     'after 10-20 minutes. Contact ' + report_problem ( 
                       appName() + ' archiving problem',
                       'Account remains suspended after archiving for long time.',
                       ''
                     ) + ' if you are not able to login after 2 hours.'
            break;
    case 10 :  msg = appName() + ' is now restarting. Please wait, the page will ' +
                     'reload automatically.';
            break;
    case 0  :
    default : msg = 'You are now logged out.';
  }
  var logout_lbl = new Label    ( msg );

  thank_lbl .setFont            ( 'times','200%',true,true );
  thank_lbl .setNoWrap          ();
  logout_lbl.setFontSize        ( '125%' );

  var row = 0;
  panel.setWidget               ( thank_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( logout_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );

  if ((!__local_user) && (reason_key!=10))  {
    var back_btn = new Button    ( 'Back to User Login',image_path('login') );
    panel.setWidget              ( back_btn,row,0,1,1 );
    panel.setHorizontalAlignment ( row++,0,'center' );
    back_btn  .setWidth          ( '300px' );
    // back_btn.addOnClickListener ( function(){ makeLoginPage(sceneId); });
    back_btn.addOnClickListener  ( function(){ reloadBrowser(); });
    // setDefaultButton             ( back_btn,this.grid );
    setDefaultButton             ( back_btn,panel );
  }

}

LogoutPage.prototype = Object.create ( BasePage.prototype );
LogoutPage.prototype.constructor = LogoutPage;


function logout ( sceneId,reason_key,onLogout_func=null )  {

  stopSessionChecks();

  if (__current_page && (__current_page._type=='ProjectPage'))
    __current_page.getJobTree().stopTaskLoop();

  if (__login_token && (reason_key!=3) && (reason_key!=10))  {

    serverRequest ( fe_reqtype.logout,0,'Logout',function(data){
      makePage ( new LogoutPage(sceneId,reason_key),onLogout_func );
    },null,null);

  } else {

    makePage ( new LogoutPage(sceneId,reason_key),onLogout_func );

  }

}
