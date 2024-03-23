
/*
 *  =================================================================
 *
 *    23.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_forgotten_login.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Restore user access page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

// -------------------------------------------------------------------------
// forgotten login page class

function ForgottenLoginPage ( sceneId )  {

  if (__login_token)
    __login_token = '';
    //__login_token.empty();

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ForgottenLoginPage' );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize          ( '45%','',0,0,1,1 );
  this.grid.setVerticalAlignment ( 0,1,'middle' );
  this.grid.setCellSize          ( '10%','',0,1,1,1 );
  this.grid.setCellSize          ( '45%','',0,2,1,1 );
  this.makeLogoPanel             ( 1,0,3 );

  // make login panel
  let panel = new Grid('');
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  let title_lbl  = new Label     ( 'CCP4 Login Recovery'  );
  let email_lbl  = new Label     ( 'E-mail:' );
  let email_inp  = new InputText ( '' );
  let prompt_lbl = new Label     ( 'Please specify e-mail address, which was '  +
                                   'used for registering with ' + appName()     +
                                   ', and push the "E-mail ..." button below. ' +
                                   'Your login name(s) and password(s) will '   +
                                   'be e-mailed to you then.' );
  title_lbl .setFont            ( 'times','200%',true,true );
  email_lbl .setFontSize        ( '125%' );
  prompt_lbl.setFontSize        ( '90%'  );
  email_inp .setStyle           ( 'email','','john.smith@university.ac.uk',
                                  'Should be a valid e-mail address, which was ' +
                                  'used\n for registering with ' + appName() + '.' );
  email_inp.setFontSize         ( '112%' );
  email_inp.setFontItalic       ( true   );
  email_inp.setWidth            ( '95%'  );

  let row = 0;
  panel.setWidget               ( title_lbl, row,0,1,2 );
  panel.setHorizontalAlignment  ( row++,0,'center'  );
  panel.setWidget               ( this.makeSetupNamePanel(), row++,0,1,2 );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( email_lbl,row  ,0,1,1 );
  panel.setVerticalAlignment    ( row  ,0,'middle' );
  panel.setWidget               ( email_inp,row++,1,1,1 );
  panel.setCellSize             ( '','6pt',row++,0 );
  panel.setWidget               ( prompt_lbl,row++,0,1,2 );

  panel.setCellSize             ( '','12pt',row++,0 );
  panel.setWidget               ( new HLine('3pt'), row++,0,1,2 );
  panel.setCellSize             ( '','1pt',row++,0 );

  let send_btn = new Button     ( 'E-mail my login details to me',image_path('email') );
  let back_btn = new Button     ( 'Back to User Login',image_path('login') );

  send_btn.setWidth             ( '100%' );
  back_btn.setWidth             ( '100%' );

//  panel.setCellSize            ( '','28pt',row,0 );2 );
  panel.setWidget               ( send_btn,row++,0,1,2 );
  panel.setWidget               ( back_btn,row++,0,1,2 );

  back_btn.addOnClickListener  ( function(){
     makeLoginPage(sceneId);
  });

  send_btn.addOnClickListener   ( function(){

    // Validate the input
    let msg = '';

    if (email_inp.getValue().length<=0)
      msg += '<b>E-mail address</b> must be provided.<p>';
    else if (email_inp.element.validity.typeMismatch)
      msg += '<b>E-mail address</b> should the correct one. Your login details<br>' +
             'will be sent to the e-mail provided.<p>';

    if (msg)  {

      new MessageBox ( 'Login Recover',
         'Login Recovery cannot be done due to the following reasons:<p>' +
          msg + '<p>Please provide all needful data and try again', 'msg_warning' );

    } else  {

      ud       = new UserData();
      ud.email = email_inp.getValue();

      serverCommand ( fe_command.recoverLogin,ud,'CCP4 Login Recovery',
                      function(response){

        switch (response.status)  {

          case fe_retcode.ok:
              if (response.data)
                new MessageBoxW ( 'CCP4 Login Recovery',response.data,0.4 );
              else
                new MessageBox ( 'CCP4 Login Recovery',
                  'Dear ' + response.message +
                  ',<p>You login details have been successfully recovered and ' +
                  'sent to you at<br><i>"' + ud.email + '"</i>.' +
                  '<p>Please check your e-mail and return to the login page.', 'msg_information');
            return true;

          case fe_retcode.userNotFound:
              new MessageBox ( 'CCP4 Login Recovery',
                'No user with e-mail <i>"' + ud.email +
                '"</i> has been found.<p>', 'msg_excl'  );
            return true;

          default: ;

        }

        return false;

      },null,null);

    }

  });

  setDefaultButton ( send_btn,this.grid );

}

ForgottenLoginPage.prototype = Object.create ( BasePage.prototype );
ForgottenLoginPage.prototype.constructor = ForgottenLoginPage;


function makeForgottenLoginPage ( sceneId )  {
  makePage ( function(){ new ForgottenLoginPage(sceneId); } );
  setHistoryState ( 'ForgottenLoginPage' );
}
