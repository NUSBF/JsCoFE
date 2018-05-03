
/*
 *  =================================================================
 *
 *    22.09.17   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// logout page class

function LogoutPage ( sceneId )  {

  //if (__login_token)  __login_token.empty();
  //if (__login_user)   __login_user .empty();
  __login_token = '';
  __login_user  = '';
  __admin       = false;

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
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  var thank_lbl  = new Label    ( 'Thank you for using CCP4' );
  var logout_lbl = new Label    ( 'You are now logged out.'  );
  var back_btn   = new Button   ( 'Back to User Login','./images/login.svg' );

  thank_lbl .setFont            ( 'times','200%',true,true );
  logout_lbl.setFontSize        ( '125%' );
  back_btn  .setWidth           ( '100%' );

  var row = 0;
  panel.setWidget               ( thank_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( logout_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( back_btn ,row++,0,1,1 );

  back_btn.addOnClickListener   ( function(){ makeLoginPage(sceneId) } );
  setDefaultButton              ( back_btn,this.grid );


}

LogoutPage.prototype = Object.create ( BasePage.prototype );
LogoutPage.prototype.constructor = LogoutPage;


function logout ( sceneId )  {

  if (__login_token)  {

    serverRequest ( fe_reqtype.logout,0,'Logout',function(data){
      makePage ( new LogoutPage(sceneId) );
    },null,null);

  } else {

    makePage ( new LogoutPage(sceneId) );

  }

}
