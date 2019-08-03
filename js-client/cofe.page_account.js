
/*
 *  =================================================================
 *
 *    02.08.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_account.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  User account settings page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// account page class

function AccountPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','AccountPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  this.makeHeader ( 3,null );

  // Make Main Menu
  if (__current_project)
    this.addMenuItem ( 'Current project','project',function(){
      makeProjectPage ( sceneId );
    });
  this.addMenuItem ( 'My Projects','list',function(){
    makeProjectListPage ( sceneId );
  });
  if (__admin)
    this.addMenuItem ( 'Admin Page','admin',function(){
      makeAdminPage ( sceneId );
    });
  this.addLogoutToMenu ( function(){ logout(sceneId,0); } );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize          ( '45%','',1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'middle' );
  this.grid.setCellSize          ( '10%','',1,1,1,1 );
  this.grid.setCellSize          ( '45%','',1,2,1,1 );
//  this.grid.setCellSize          ( '','80pt',2,1,1,3 );
  this.makeLogoPanel             ( 2,0,3 );

  // make account panel
  var panel = new Grid('');
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,1,1,1,1 );

  var title_lbl    = new Label     ( 'My Account'  );
  var user_lbl     = new Label     ( 'User name:'  );
  var email_lbl    = new Label     ( 'E-mail:'     );
  var login_lbl    = new Label     ( 'Login name:' );
  var pwd_lbl      = new Label     ( 'Password:'   );
  var licence_lbl  = new Label     ( 'Licence agreement:&nbsp;&nbsp;&nbsp;' ).setNoWrap();
  var licence_val  = new Label     ( 'not chosen'  ).setFontItalic(true)     .setNoWrap();
  var feedback_lbl = new Label     ( 'Feedback agreement:&nbsp;&nbsp;&nbsp;').setNoWrap();
  var feedback_val = new Label     ( 'not chosen'  ).setFontItalic(true)     .setNoWrap();
  var user_inp     = new InputText ( '' );
  var email_inp    = new InputText ( '' );
  var login_inp    = new InputText ( '' );
  var pwd_inp      = new InputText ( '' );
  user_inp    .setStyle         ( 'text',"^[A-Za-z\\-\\.\\s]+$",'John Smith',
                                  'User name should only contain latin ' +
                                  'letters,\n dots, dashes and spaces' );
  email_inp   .setStyle         ( 'email','','john.smith@university.ac.uk',
                                  'Should be a valid e-mail address, at which ' +
                                  'your\n new password will be sent' );
  login_inp   .setStyle         ( 'text',"^[A-Za-z0-9\\-\\._]+$",'john.smith',
                                  'Login name cannot be changed' );
  pwd_inp     .setStyle         ( 'password','','password (old or new)',
                                  'Choose new password' );
  licence_val .setTooltip       ( 'Type of licence may be changed, please ' +
                                  'press "Choose" button.' );
  feedback_val.setTooltip       ( 'Terms of feedback agremment may be changed, ' +
                                  'please press "Choose" button.' );
  title_lbl   .setFont          ( 'times','300%',true,true );
  user_lbl    .setFontSize      ( '125%' ).setWidth('auto');
  email_lbl   .setFontSize      ( '125%' );
  login_lbl   .setFontSize      ( '125%' );
  pwd_lbl     .setFontSize      ( '125%' );
  licence_lbl .setFontSize      ( '125%' );
  licence_val .setFontSize      ( '112%' ).setFontWeight(700);
  feedback_lbl.setFontSize      ( '125%' );
  feedback_val.setFontSize      ( '112%' ).setFontWeight(700);
  user_inp    .setFontSize('112%').setFontItalic(true).setWidth('97%');
  email_inp   .setFontSize('112%').setFontItalic(true).setWidth('97%');
  login_inp   .setFontSize('112%').setFontItalic(true).setWidth('97%').setReadOnly(true);
  pwd_inp     .setFontSize('112%').setFontItalic(true).setWidth('97%');

  var row = 0;
  panel.setWidget               ( title_lbl   ,row,0,1,4 );
  panel.setHorizontalAlignment  ( row++ ,0    ,'center'  );
  panel.setWidget               ( this.makeSetupNamePanel(), row++,0,1,4 );
  panel.setCellSize             ( '','20pt'   ,row++,0   );
  panel.setWidget               ( user_lbl    ,row  ,0,1,1 );
  panel.setWidget               ( email_lbl   ,row+1,0,1,1 );
  panel.setWidget               ( login_lbl   ,row+2,0,1,1 );
  panel.setWidget               ( pwd_lbl     ,row+3,0,1,1 );
  panel.setWidget               ( licence_lbl ,row+4,0,1,2 );
  panel.setWidget               ( feedback_lbl,row+5,0,1,2 );
  for (var i=0;i<4;i++)
    panel.setCellSize  ( '96pt','',row+i,0   );
  panel.setWidget               ( user_inp    ,row  ,1,1,3 );
  panel.setWidget               ( email_inp   ,row+1,1,1,3 );
  panel.setWidget               ( login_inp   ,row+2,1,1,3 );
  panel.setWidget               ( pwd_inp     ,row+3,1,1,3 );
  panel.setWidget               ( licence_val ,row+4,1,1,1 );
  panel.setWidget               ( feedback_val,row+5,1,1,1 );
  for (var i=0;i<6;i++)  {
    panel.setVerticalAlignment  ( row+i,0,'middle' );
    panel.setVerticalAlignment  ( row+i,1,'middle' );
  }

  row += 4;
  var licence_btn = new Button  ( 'Choose',image_path('licence') );
  licence_btn.setWidth          ( '100%' );
  panel.setWidget               ( licence_btn,row,2,1,1 );
  panel.setVerticalAlignment    ( row,2,'middle'  );
  //panel.setCellSize             ( '','40pt',row,2 );
  licence_btn.setDisabled       ( true );

  licence_btn.addOnClickListener  ( function(){
    new LicenceDialog(licence_val.getText(),function(licence){
      licence_val.setText ( licence );
    });
  });

  row++;
  var feedback_btn = new Button ( 'Choose',image_path('feedback') );
  feedback_btn.setWidth         ( '100%' );
  panel.setWidget               ( feedback_btn,row,2,1,1 );
  panel.setVerticalAlignment    ( row,2,'middle'  );
  //panel.setCellSize             ( '','40pt',row,2 );
  feedback_btn.setDisabled      ( true );

  feedback_btn.addOnClickListener  ( function(){
    new FeedbackDialog(feedback_val.getText(),function(feedback){
      feedback_val.setText ( feedback );
    });
  });

  panel.setCellSize             ( '','12pt',row++,0 );
  panel.setWidget               ( new HLine('3pt'), row++,0,1,4 );
  panel.setCellSize             ( '','1pt',row++,0 );

  var update_btn = panel.setButton ( 'Update my account',image_path('email'),
                                     row++,0,1,4 )
                        .setWidth  ( '100%' )
                        .setDisabled ( true ); // disable button until user data arrives from server

  var delete_btn = panel.setButton ( 'Delete my account',image_path('remove'),
                                     row++,0,1,4  );
  delete_btn.setWidth           ( '100%' );
  // disable button until user data arrives from server
  delete_btn.setDisabled        ( true   );


  // however add update button listener
  var response;  // will keep user data
  var userData;  // will transfer user data across

  update_btn.addOnClickListener ( function(){

    // Validate the input
    var msg = validateUserData ( user_inp,email_inp,login_inp );

    if (pwd_inp.getValue().length<=0)
      msg += '<b>Password</b> must be provided (old or new).<p>';

    if ([licence_code.academic,licence_code.commercial]
        .indexOf(licence_val.getText())<0)
      msg += '<b>Licence</b> must be chosen.<p>';

    if ([feedback_code.agree1,feedback_code.agree2,feedback_code.decline]
        .indexOf(feedback_val.getText())<0)
      msg += '<b>Feedback agreement</b> must be chosen.<p>';

    if (msg)  {

      new MessageBox ( 'My Account Update',
         'Account Update cannot be done due to the following:<p>' +
          msg + 'Please provide all needful data and try again' );

    } else  {

      userData.name     = user_inp    .getValue();
      userData.email    = email_inp   .getValue();
      userData.login    = login_inp   .getValue();
      userData.pwd      = pwd_inp     .getValue();
      userData.licence  = licence_val .getText();
      userData.feedback = feedback_val.getText();
      userData.action   = userdata_action.none;

      serverRequest ( fe_reqtype.updateUserData,userData,'My Account',
                      function(response){
        if (response)
          new MessageBoxW ( 'My Account',response,0.5 );
        else  {
          new MessageBox ( 'My Account',
            'Dear ' + userData.name +
            ',<p>Your account has been successfully updated, and ' +
            'notification<br>sent to your e-mail address:<p><b><i>' +
            userData.email + '</i></b>.' +
            '<p>You are logged out now, please login again.' );
          stopSessionChecks();
          makeLoginPage ( sceneId );
        }
      },null,'persist' );
    }

  });

  delete_btn.addOnClickListener ( function(){

    var inputBox  = new InputBox  ( 'Delete My Account' );
    var ibx_grid  = new Grid      ( '' );
    var pswd_inp  = new InputText ( '' );
    pswd_inp.setStyle    ( 'password','','Your password','' );
    pswd_inp.setFontSize ( '112%' ).setFontItalic(true).setWidth('50%');
    ibx_grid .setWidget  ( new Label(
      '<h2>Delete My Account</h2>' +
      'Your account will be deleted, are you sure?<p>' +
      'Once deleted, all your data, including registration details,<br>' +
      'imported files, projects and results will be removed from<br>' +
      'the server irrevocably.<p>' +
      'In order to confirm complete deletion of your account and<br>' +
      'all associated data, in your password and press <b>Confirm</b><br>' +
      'button.' ),0,0,1,3 );
    ibx_grid .setWidget ( (new Label('Password:')).setWidth('5%'),1,0,1,1 );
    ibx_grid .setWidget ( pswd_inp,1,1,1,1 );
    ibx_grid .setWidget ( (new Label('&nbsp;')).setWidth('45%'),1,2,1,1 );
    ibx_grid .setNoWrap ( 0,0 );
    ibx_grid .setNoWrap ( 1,0 );
    inputBox .addWidget            ( ibx_grid     );
    ibx_grid .setVerticalAlignment ( 0,0,'middle' );
    ibx_grid .setVerticalAlignment ( 1,0,'middle' );

    inputBox.launch ( 'Confirm',function(){

      if (pswd_inp.getValue().length<=0)  {
        new MessageBox ( 'Delete My Account',
                         'Please provide password and try again' );
        return false;  // close dialog
      } else  {

        userData.name     = user_inp    .getValue();
        userData.email    = email_inp   .getValue();
        userData.login    = login_inp   .getValue();
        userData.pwd      = pswd_inp    .getValue();
        userData.licence  = licence_val .getText();
        userData.feedback = feedback_val.getText();

        serverRequest ( fe_reqtype.deleteUser,userData,'Delete My Account',
                        function(response){
          if (response)
            new MessageBoxW ( 'Delete My Account',response,0.5 );
          else
            new MessageBox ( 'Delete My Account',
              'Dear ' + userData.name +
              ',<p>Your account and all associated data have been<br>successfully ' +
              'deleted, and notification sent<br>to your e-mail address:<p><b><i>' +
              userData.email + '</i></b>.' +
              '<p>You are logged out now.' );
              makeLoginPage ( sceneId );
        },null,'persist' );

        return true;  // close dialog

      }
    });

  });

  // fetch user data from server
  serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){
    userData = data;
    var msg = checkUserData ( userData );
    if (msg.length>0)
      window.setTimeout ( function(){
        new MessageBox ( 'Update Account',
          'Please check your account settings:<ul>' + msg + '</ul>' +
          'To confirm your changes, push <b>Update</b> button.' );
      },0);
    user_inp    .setValue ( userData.name     );
    email_inp   .setValue ( userData.email    );
    login_inp   .setValue ( userData.login    );
    licence_val .setText  ( userData.licence  );
    if (userData.feedback)
      feedback_val.setText  ( userData.feedback );
    // now activate the update button:
    licence_btn .setDisabled ( false );
    feedback_btn.setDisabled ( false );
    update_btn  .setDisabled ( false );
    delete_btn  .setDisabled ( false );
    setDefaultButton ( update_btn,panel );
  },null,'persist');

}

AccountPage.prototype = Object.create ( BasePage.prototype );
AccountPage.prototype.constructor = AccountPage;


function makeAccountPage ( sceneId )  {
  makePage ( new AccountPage(sceneId) );
  setHistoryState ( 'AccountPage' );
}
