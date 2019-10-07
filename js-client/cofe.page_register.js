
/*
 *  =================================================================
 *
 *    29.09.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_register.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User registration page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// Register page class

function RegisterPage ( sceneId )  {

//  if (__login_token)
//    __login_token.empty();
  //__login_token = '';

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','RegisterPage' );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize            ( '45%','',0,0,1,1 );
  this.grid.setVerticalAlignment   ( 0,1,'middle' );
  this.grid.setCellSize            ( '10%','',0,1,1,1 );
  this.grid.setCellSize            ( '45%','',0,2,1,1 );
  this.makeLogoPanel               ( 1,0,3 );

  // make login panel
  var panel = new Grid('');
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  var reg_lbl      = new Label     ( 'Registration' );
  var user_lbl     = new Label     ( 'User name:'   ).setNoWrap();
  var email_lbl    = new Label     ( 'E-mail:'      ).setNoWrap();
  var login_lbl    = new Label     ( 'Login name:'  ).setNoWrap();
  var licence_lbl  = new Label     ( 'Licence agreement:&nbsp;&nbsp;&nbsp;' ).setNoWrap();
  //var licence_val  = new Label     ( '--/--/--/--'  ).setFontColor('darkred').setNoWrap();
  var feedback_lbl = new Label     ( 'Feedback agreement:&nbsp;&nbsp;&nbsp;').setNoWrap();
  //var feedback_val = new Label     ( '--/--/--/--'  ).setFontColor('darkred').setNoWrap();
  var user_inp     = new InputText ( '' );
  var email_inp    = new InputText ( '' );
  var login_inp    = new InputText ( '' );
  user_inp   .setStyle         ( 'text',"^[A-Za-z\\-\\.\\s]+$",'John Smith',
                                 'User name should only contain latin ' +
                                 'letters,\n dots, dashes and spaces' );
  email_inp  .setStyle         ( 'email','','john.smith@university.ac.uk',
                                 'Should be a valid e-mail address, at which ' +
                                 'your\n temporary password will be sent' );
  login_inp  .setStyle         ( 'text',"^[A-Za-z0-9\\-\\._]+$",'john.smith',
                                 'Login name should contain only latin ' +
                                 'letters, numbers,\n undescores, dashes ' +
                                 'and dots, and must start with a letter' );
  /*
  licence_val.setTooltip       ( 'Type of licence must be chosen, please ' +
                                 'press "Choose" button.' );
  feedback_val.setTooltip      ( 'Terms of feedback agremment must be chosen, ' +
                                 'please press "Choose" button.' );
  */
  reg_lbl     .setFont         ( 'times','300%',true,true );
  user_lbl    .setFontSize     ( '125%' );
  email_lbl   .setFontSize     ( '125%' );
  login_lbl   .setFontSize     ( '125%' );
  licence_lbl .setFontSize     ( '125%' );
  //licence_val .setFontSize     ( '112%' ).setFontItalic(true).setFontWeight(700);
  feedback_lbl.setFontSize     ( '125%' );
  //feedback_val.setFontSize     ( '112%' ).setFontItalic(true).setFontWeight(700);
  user_inp    .setFontSize     ( '112%' ).setFontItalic(true).setWidth('97%');
  email_inp   .setFontSize     ( '112%' ).setFontItalic(true).setWidth('97%');
  login_inp   .setFontSize     ( '112%' ).setFontItalic(true).setWidth('97%');

  var row = 0;
  panel.setWidget              ( reg_lbl, row,0,1,4 );
  panel.setHorizontalAlignment ( row++  ,0,'center' );
  panel.setWidget              ( this.makeSetupNamePanel(), row++,0,1,4 );
  panel.setCellSize            ( '','20pt'   ,row++,0 );
  panel.setWidget              ( user_lbl    ,row  ,0,1,1 );
  panel.setWidget              ( email_lbl   ,row+1,0,1,1 );
  panel.setWidget              ( login_lbl   ,row+2,0,1,1 );
  for (var i=0;i<3;i++)
    panel.setCellSize  ( '96pt','',row+i,0   );
  panel.setWidget              ( licence_lbl ,row+3,0,1,2 );
  panel.setWidget              ( feedback_lbl,row+4,0,1,2 );
  panel.setWidget              ( user_inp    ,row  ,1,1,3 );
  panel.setWidget              ( email_inp   ,row+1,1,1,3 );
  panel.setWidget              ( login_inp   ,row+2,1,1,3 );
  //panel.setWidget              ( licence_val ,row+3,1,1,1 );
  //panel.setWidget              ( feedback_val,row+4,1,1,1 );
  for (var i=0;i<5;i++)  {
    panel.setVerticalAlignment ( row+i,0,'middle' );
    panel.setVerticalAlignment ( row+i,1,'middle' );
  }

  row += 3;
  //var licence_btn = new Button ( 'Choose',image_path('licence') );
  var licence_btn = new Button  ( 'choose',image_path('licence') );
  licence_btn.setWidth          ( '100%' );
  licence_btn.setTooltip        ( 'Type of licence must be chosen' );
  panel.setWidget               ( licence_btn,row,1,1,2 );
  panel.setVerticalAlignment    ( row,1,'middle'  );
  //panel.setWidget              ( licence_btn,row,2,1,1 );
  //panel.setVerticalAlignment   ( row,2,'middle'  );
  //panel.setCellSize            ( '','40pt',row,2 );

  row++;
  var feedback_btn = new Button ( 'choose',image_path('feedback') );
  feedback_btn.setWidth         ( '100%' );
  feedback_btn.setTooltip       ( 'Terms of feedback agremment must be chosen' );
  panel.setWidget               ( feedback_btn,row,1,1,2 );
  panel.setVerticalAlignment    ( row,1,'middle'  );
  //panel.setWidget               ( feedback_btn,row,2,1,1 );
  //panel.setVerticalAlignment    ( row,2,'middle'  );
  //panel.setCellSize             ( '','40pt',row,2 );

  row++;
  panel.setCellSize             ( '','12pt',row++,0 );
  panel.setWidget               ( new HLine('3pt'), row++,0,1,4 );
  panel.setCellSize             ( '','1pt',row++,0 );

  var reg_btn  = new Button     ( 'Register and send password by e-mail',image_path('email') );

  var back_btn = null;
  if (__login_token=='')  {
    back_btn = new Button       ( 'Back to User Login',image_path('login') );
    back_btn.addOnClickListener ( function(){ makeLoginPage(sceneId); } );
  } else  {
    back_btn = new Button       ( 'Back to Admin Page',image_path('admin') );
    back_btn.addOnClickListener ( function(){ makeAdminPage(sceneId); } );
  }

  reg_btn .setWidth             ( '100%' );
  back_btn.setWidth             ( '100%' );

  panel.setWidget               ( reg_btn ,row++,0,1,4 );
  panel.setWidget               ( back_btn,row++,0,1,4 );

  licence_btn.addOnClickListener ( function(){
    new LicenceDialog(licence_btn.getText(),function(licence){
      licence_btn.setButton ( licence,image_path('licence') );
    });
    /*
    new LicenceDialog(licence_val.getText(),function(licence){
      licence_val.setFontItalic(true).setFontColor('black').setText ( licence );
      licence_btn.setButton ( 'Change',image_path('feedback') );
    });
    */
  });

  feedback_btn.addOnClickListener ( function(){
    new FeedbackDialog(feedback_btn.getText(),function(feedback){
      feedback_btn.setButton ( feedback,image_path('feedback') );
    });
    /*
    new FeedbackDialog(feedback_val.getText(),function(feedback){
      feedback_val.setFontItalic(true).setFontColor('black').setText ( feedback );
      feedback_btn.setButton ( 'Change',image_path('feedback') )
    });
    */
  });

  reg_btn.addOnClickListener  ( function(){

    // Validate the input
    var msg = validateUserData ( user_inp,email_inp,login_inp );

    if ([licence_code.academic,licence_code.commercial]
        .indexOf(licence_btn.getText())<0)
      msg += '<b>Licence</b> must be chosen.<p>';

    if ([feedback_code.agree1,feedback_code.agree2,feedback_code.decline]
        .indexOf(feedback_btn.getText())<0)
      msg += '<b>Feedback agreement</b> must be chosen.<p>';

    if (msg)  {

      new MessageBox ( 'Registration',
         'Registration of new user cannot be done due to the following:<p>' +
          msg + 'Please provide all needful data and try again.' );

    } else  {

      ud          = new UserData();
      ud.name     = user_inp    .getValue();
      ud.email    = email_inp   .getValue();
      ud.login    = login_inp   .getValue();
      ud.licence  = licence_btn .getText();
      ud.feedback = feedback_btn.getText();
      ud.pwd      = '';  // will be generated by server when empty

      serverCommand ( fe_command.register,ud,'Registration',function(response){

        switch (response.status)  {

          case fe_retcode.ok:
            if (response.data)
                new MessageBoxW ( 'Registration',response.data,0.5 );
            else
                new MessageBox ( 'Registration',
                  'Dear ' + ud.name +
                  ',<p>You are now registered for CCP4 on-line services with ' +
                  'login name<br><b><i>' + ud.login + '</i></b>.' +
                  '<p>Your temporary password was sent to e-mail address<br><b><i>' +
                  ud.email + '</i></b>.' +
                  '<p>Please check your e-mail and return to the login page.' );
            return true;

          case fe_retcode.existingLogin:
            new MessageBox ( 'Registration',
              '<b>Login name <i>"' + ud.login + '"</i> is already used.</b><p>' +
              'If this is your name: Go back to Login Page and use button ' +
              '<i>Forgotten password</i><p>' +
              'If you try to register a new user: Please choose a different ' +
              'login name.' );
            return true;

          case fe_retcode.regFailed:
            new MessageBox ( 'Registration Failed',response.message );
            return true;

          default: ;

        }

        return false;

      },null,null);

    }

  });

  setDefaultButton ( reg_btn,panel );

}

RegisterPage.prototype = Object.create ( BasePage.prototype );
RegisterPage.prototype.constructor = RegisterPage;


function makeRegisterPage ( sceneId )  {
  makePage ( new RegisterPage(sceneId) );
  setHistoryState ( 'RegisterPage' );
}
