
/*
 *  =================================================================
 *
 *    19.04.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2022
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
//  if (__admin)
  if (__user_role==role_code.admin)
    this.addMenuItem ( 'Admin Page',role_code.admin,function(){
      makeAdminPage ( sceneId );
    });
  this.addLogoutToMenu ( function(){ logout(sceneId,0); } );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize          ( '25%','',1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'middle' );
  this.grid.setCellSize          ( '50%','',1,1,1,1 );
  this.grid.setCellSize          ( '25%','',1,2,1,1 );
//  this.grid.setCellSize          ( '','80pt',2,1,1,3 );
  this.makeLogoPanel             ( 2,0,3 );

//  var response = {};  // will keep user data
  var userData = {};  // will keep user data

  // make account panel
  var panel = new Grid('');
  //panel.setWidth      ( '600pt' );
  this.grid.setWidget ( panel,1,1,1,1 );

  var title_lbl    = new Label     ( 'My Account'  ).setNoWrap();
  var user_lbl     = new Label     ( 'User name:'  ).setNoWrap();
  var email_lbl    = new Label     ( 'E-mail:'     );
  var login_lbl    = new Label     ( 'Login name:' ).setNoWrap();
  var pwd_lbl      = new Label     ( 'Password:'   );
  var pwd1_lbl     = new Label     ( 'Retype password:'   ).setNoWrap();
  var licence_lbl  = new Label     ( 'Licence agreement:' ).setNoWrap();
  var feedback_lbl = new Label     ( 'Feedback agreement:').setNoWrap();
  var authoris_lbl = null;
  var authorisation_dic = {};
  if (__auth_software)  {
    authoris_lbl = new Label ( 'Software authorisations:' ).setNoWrap();
    authoris_lbl.setFontSize( '112%' );
  }
  var user_inp     = new InputText ( '' );
  var email_inp    = new InputText ( '' );
  var login_inp    = new InputText ( '' );
  var pwd_inp      = new InputText ( '' );
  var pwd1_inp     = new InputText ( '' );

  //user_inp    .setStyle   ( 'text',"^[A-Za-z\\-\\.\\s]+$",'John Smith',
  //user_inp    .setStyle   ( 'text',"^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$",
  //                          'User name should only contain latin ' +
  //                          'letters, numbers,\n dots, dashes and spaces' );
  user_inp    .setStyle   ( 'text','','John Smith',
                            'This name will be used for addressing to you in\n' +
                            'web-pages and e-mails' );
  email_inp   .setStyle   ( 'email','','john.smith@university.ac.uk',
                            'Should be a valid e-mail address, at which ' +
                            'your\n new password will be sent' );
  login_inp   .setStyle   ( 'text',"^[A-Za-z0-9\\-\\._]+$",'john.smith',
                            'Login name cannot be changed' );
  pwd_inp     .setStyle   ( 'password','','password (old or new)',
                            'Choose new password' );
  pwd1_inp    .setStyle   ( 'password','','confirm password',
                            'Type password again here' );
  title_lbl   .setFont    ( 'times','300%',true,true );
  user_lbl    .setFontSize( '112%' ).setWidth('auto');
  email_lbl   .setFontSize( '112%' );
  login_lbl   .setFontSize( '112%' );
  pwd_lbl     .setFontSize( '112%' );
  pwd1_lbl    .setFontSize( '112%' );
  licence_lbl .setFontSize( '112%' );
  feedback_lbl.setFontSize( '112%' );
  /* == authoris_lbl.setFontSize( '112%' ); */
  user_inp    .setFontSize( '112%' ).setFontItalic(true).setWidth('200pt');
  email_inp   .setFontSize( '112%' ).setFontItalic(true).setWidth('200pt');
  login_inp   .setFontSize( '112%' ).setFontItalic(true).setWidth('200pt').setReadOnly(true);
  pwd_inp     .setFontSize( '112%' ).setFontItalic(true).setWidth('200pt');
  pwd1_inp    .setFontSize( '112%' ).setFontItalic(true).setWidth('200pt');

  var row = 0;
  panel.setWidget              ( title_lbl   ,row,0,1,4   );
  panel.setHorizontalAlignment ( row++ ,0    ,'center'    );
  panel.setWidget              ( this.makeSetupNamePanel(), row++,0,1,4 );
  panel.setCellSize            ( '','20pt'   ,row++,0     );
  panel.setWidget              ( user_lbl    ,row  ,0,1,1 );
  panel.setWidget              ( email_lbl   ,row+1,0,1,1 );
  panel.setWidget              ( login_lbl   ,row+2,0,1,1 );
  panel.setWidget              ( pwd_lbl     ,row+3,0,1,1 );
  panel.setWidget              ( pwd1_lbl    ,row+4,0,1,1 );
  panel.setWidget              ( licence_lbl ,row+5,0,1,2 );
  panel.setWidget              ( feedback_lbl,row+6,0,1,2 );
  if (__auth_software)
    panel.setWidget            ( authoris_lbl,row+7,0,1,2 );
  for (var i=0;i<5;i++)
    panel.setCellSize  ( '96pt','',row+i,0   );
  panel.setWidget              ( user_inp    ,row  ,1,1,3 );
  panel.setWidget              ( email_inp   ,row+1,1,1,3 );
  panel.setWidget              ( login_inp   ,row+2,1,1,3 );
  panel.setWidget              ( pwd_inp     ,row+3,1,1,3 );
  panel.setWidget              ( pwd1_inp    ,row+4,1,1,3 );
  /* == for (var i=0;i<7;i++)  { */
  if (__auth_software)  {
    for (var i=0;i<8;i++)  {
      panel.setVerticalAlignment ( row+i,0,'middle' );
      panel.setVerticalAlignment ( row+i,1,'middle' );
    }
  } else  {
    for (var i=0;i<7;i++)  {
      panel.setVerticalAlignment ( row+i,0,'middle' );
      panel.setVerticalAlignment ( row+i,1,'middle' );
    }
  }


  // make settings panel
  var spanel = new Grid('');
  spanel.setWidth ( '260pt' );
  panel.setLabel ( '&nbsp;',row,2,1,1 ).setWidth ( '80px' );
  panel.setWidget ( spanel ,row,3,15,3 );

  panel.setLabel ( 'Preferences<sup>*</sup>',row-1,5,1,1 )
       .setFont ( 'times','150%',true,true );
  //spanel.setCellSize ( '','10pt',1,0   );

  var prfrow = 0;

  spanel.setLabel ( '<hr/>',prfrow++,0,1,2 );
  spanel.setLabel ( 'On login, go to: ',prfrow,0,1,1 );
  spanel.setVerticalAlignment ( prfrow,0,'middle' );
  spanel.setCellSize  ( '120px','',prfrow,0   );
  var onlogin_sel = new Dropdown();
  onlogin_sel.addItem ( 'list of projects','','project_list',
                        __user_settings.onlogin =='project_list' );
  onlogin_sel.addItem ( 'last project','','last_project',
                        __user_settings.onlogin =='last_project' );
  spanel.setWidget ( onlogin_sel, prfrow++,1,1,1 );
  onlogin_sel.make();

  var dgrid = spanel.setGrid ( '-compact', prfrow++,0,1,2 );
  dgrid.setLabel ( '&nbsp;',0,0,1,3 ).setFontSize('50%');
  dgrid.setLabel ( 'Initial size (% of browser window):',1,0,1,3 )
       .setNoWrap();
  dgrid.setLabel ( 'width' ,2,1,1,1 ).setFontItalic(true);
  dgrid.setLabel ( 'height',2,2,1,1 ).setFontItalic(true);
  dgrid.setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Job dialogs:',3,0,1,1 )
       .setFontItalic(true);
  dgrid.setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Viewers:',4,0,1,1 )
       .setFontItalic(true);
  var expl = ' (in percents of browser window width or height, whichever ' +
             'is less; set negative in order to use full window size)';
  var defsize = [
    [
     'job dialogs width',
      dgrid.setInputText ( 100*__user_settings.jobdlg_size[0],3,1,1,1 )
           .setStyle ( 'text','real','','Initial width'+expl )
           .setWidth_px(40)
    ],[
      'job dialogs height',
      dgrid.setInputText ( 100*__user_settings.jobdlg_size[1],3,2,1,1 )
           .setStyle ( 'text','real','','Initial height'+expl )
           .setWidth_px(40)
    ],[
      'viewers width',
      dgrid.setInputText ( 100*__user_settings.viewers_size[0],4,1,1,1 )
           .setStyle ( 'text','real','','Initial width'+expl )
           .setWidth_px(40)
    ],[
      'viewers height',
      dgrid.setInputText ( 100*__user_settings.viewers_size[1],4,2,1,1 )
           .setStyle ( 'text','real','','Initial height'+expl )
           .setWidth_px(40)
    ]
  ];
  dgrid.setLabel ( '&nbsp;',5,0,1,3 ).setFontSize('50%');

  var fprefix_cbx = spanel.setCheckbox ( 'Use project name as default file prefix',
                                         __user_settings.project_prefix,
                                         prfrow++,0,1,2 )
                          .setWidth    ( '300px' )
                          .setTooltip  ( 'If selected, all generated file names ' +
                                         'will be prefixed with project name '    +
                                         'unless another prefix is specified in ' +
                                         'project settings'
                                       );

  var gimport_cbx = spanel.setCheckbox ( 'Guide through data import',
                                         __user_settings.guided_import,
                                         prfrow++,0,1,2 )
                          .setWidth    ( '300px' )
                          .setTooltip  ( 'If selected, extra guidance through ' +
                                         'data import procedure will be given.'
                                       );

  var jnotify_cbx = spanel.setCheckbox ( 'Send end-of-job notifications',
                                         __user_settings.notifications.end_of_job.send,
                                         prfrow++,0,1,2 )
                          .setWidth    ( '300px' )
                          .setTooltip  ( 'If selected, end-of-job e-mails will ' +
                                         'be sent for jobs that take longer than ' +
                                         'the specified time period.'
                                       );
  var jngrid = spanel.setGrid ( '-compact', prfrow++,0,1,2 );
  jngrid.setLabel ( '&nbsp;&nbsp; ',0,0,1,1 ).setWidth_px ( 45 );
  jngrid.setLabel ( 'for jobs taking longer than',0,1,1,1 )
         .setFontSize ( '90%' ).setFontItalic(true);
  var jntime = jngrid.setInputText ( __user_settings.notifications.end_of_job.lapse,0,2,1,1 )
            .setStyle ( 'text','real','','Execution time threshold' )
            .setWidth_px(40);
  jngrid.setLabel ( 'hours',0,3,1,1 )
        .setFontSize ( '90%' ).setFontItalic(true);
  jngrid.setVerticalAlignment ( 0,1,'middle' );
  jngrid.setVerticalAlignment ( 0,3,'middle' );
  jngrid.setVisible ( __user_settings.notifications.end_of_job.send );
  jnotify_cbx.addOnClickListener ( function(){
    jngrid.setVisible ( jnotify_cbx.getValue() );
  });

  spanel.setLabel ( '&nbsp;<br><hr/><sup>*</sup> Save changes for Preferences to ' +
                    'take an effect',prfrow,0,1,2 )
        .setFontSize ( '90%' ).setFontItalic(true);


  row += 5;
  var licence_btn = new Button  ( 'choose',image_path('licence') );
  licence_btn.setWidth          ( '100%' );
  licence_btn.setTooltip        ( 'Type of licence must be chosen' );
  panel.setWidget               ( licence_btn,row,1,1,2 );
  panel.setVerticalAlignment    ( row,1,'middle'  );
  licence_btn.setDisabled       ( true );
  licence_btn.addOnClickListener ( function(){
    new LicenceDialog(licence_btn.getText(),function(licence){
      licence_btn.setButton ( licence,image_path('licence') );
    });
  });

  row++;
  var feedback_btn = new Button ( 'choose',image_path('feedback') );
  feedback_btn.setWidth         ( '100%' );
  feedback_btn.setTooltip       ( 'Terms of feedback agremment must be chosen' );
  panel.setWidget               ( feedback_btn,row,1,1,2 );
  panel.setVerticalAlignment    ( row,1,'middle'  );
  feedback_btn.setDisabled      ( true );
  feedback_btn.addOnClickListener ( function(){
    new FeedbackDialog(feedback_btn.getText(),function(feedback){
      feedback_btn.setButton ( feedback,image_path('feedback') );
    });
  });

  var authoris_btn = null;
  if (__auth_software)  {
    row++;
    authoris_btn = new Button ( 'manage',image_path('authorisation') );
    authoris_btn.setWidth         ( '100%' );
    authoris_btn.setTooltip       ( 'Optional 3rd-part software authorisation' );
    panel.setWidget               ( authoris_btn,row,1,1,2 );
    panel.setVerticalAlignment    ( row,1,'middle'  );
    authoris_btn.setDisabled      ( true );
    authoris_btn.addOnClickListener ( function(){
      new AuthorisationDialog ( function(dlg){
        userData.authorisation = dlg.auth_dic;
        // eleminate circular dependency in userData
        for (var key in userData.authorisation)
          userData.authorisation[key].auth_lbl = null;
      });
    });
  }

  row++;
  panel.setCellSize  ( '','12pt',row++,0 );
  //panel.setWidget   ( new HLine('2pt'), row++,0,1,4 );
  panel.setHLine     ( 2, row++,0, 1,4 );
  panel.setCellSize  ( '','12pt',row++,0 );

  var update_btn = panel.setButton ( 'Save changes',image_path('disk'),
                                     row++,0,1,4 )
                        .setWidth  ( '100%' )
                        .setDisabled ( true ); // disable button until user data arrives from server

  var delete_btn = panel.setButton ( 'Delete my account',image_path('remove'),
                                     row++,0,1,4 )
                        .setWidth  ( '100%' )
                        .setDisabled ( true );

  panel.setCellSize ( '','64pt',row++,0 );

  // however add update button listener

  update_btn.addOnClickListener ( function(){

    // Validate the input
    var msg = validateUserData ( user_inp,email_inp,login_inp );

    if (pwd_inp.getValue().length<=0)
      msg += '<b>Password</b> must be provided (old or new).<p>';
    else if (pwd1_inp.getValue().length<=0)
      msg += '<b>Password</b> must be retyped for confirmation.<p>';
    else if (pwd1_inp.getValue()!=pwd_inp.getValue())
      msg += '<b>Retyped password</b> does not match the original.<p>';

    if ([licence_code.academic,licence_code.commercial]
        .indexOf(licence_btn.getText())<0)
      msg += '<b>Licence</b> must be chosen.<p>';

    if ([feedback_code.agree1,feedback_code.agree2,feedback_code.decline]
        .indexOf(feedback_btn.getText())<0)
      msg += '<b>Feedback agreement</b> must be chosen.<p>';

    for (var i=0;i<defsize.length;i++)  {
      var text = defsize[i][1].getValue().trim();
      if (text.length<=0)
        msg += '<b>Value for ' + defsize[i][0] + '</b> must be given.<p>';
      else if (!isFloat(text))
        msg += '<b>Value for ' + defsize[i][0] + '</b> is misformatted.<p>';
      else
        defsize[i].push ( parseFloat(text)/100.0 );
    }


    if (msg)  {

      new MessageBox ( 'My Account Update',
         'Account Update cannot be done due to the following:<p>' +
          msg + 'Please provide all needful data and try again' );

    } else  {

      userData.name     = user_inp    .getValue();
      userData.email    = email_inp   .getValue();
      userData.login    = login_inp   .getValue();
      userData.pwd      = pwd_inp     .getValue();
      userData.licence  = licence_btn .getText ();
      userData.feedback = feedback_btn.getText ();
      userData.action   = userdata_action.none;

      __user_settings.onlogin        = onlogin_sel.getValue();
      __user_settings.jobdlg_size    = [ defsize[0][2],defsize[1][2] ];
      __user_settings.viewers_size   = [ defsize[2][2],defsize[3][2] ];
      __user_settings.project_prefix = fprefix_cbx.getValue();
      __user_settings.guided_import  = gimport_cbx.getValue();
      __user_settings.notifications.end_of_job.send  = jnotify_cbx.getValue();
      __user_settings.notifications.end_of_job.lapse = jntime.getValue();
      userData.settings = __user_settings;

      serverRequest ( fe_reqtype.updateUserData,userData,'My Account',
                      function(response){
        if (response)
          new MessageBoxW ( 'My Account',response +
            '<p>You are logged out now, please login again.',0.5 );
        else
          new MessageBox ( 'My Account',
            'Dear ' + userData.name +
            ',<p>Your account has been successfully updated, and ' +
            'notification<br>sent to your e-mail address:<p><b><i>' +
            userData.email + '</i></b>.' +
            '<p>You are logged out now, please login again.' );
        stopSessionChecks();
        makeLoginPage ( sceneId );
      },null,'persist' );
    }

  });

  delete_btn.addOnClickListener ( function(){

    var inputBox  = new InputBox  ( 'Delete My Account' );
    // var ibx_grid  = new Grid      ( '' );
    var pswd_inp  = new InputText ( '' );
    pswd_inp.setStyle    ( 'password','','Your password','' );
    pswd_inp.setFontSize ( '112%' ).setFontItalic(true).setWidth_px(200);
    inputBox.setText ( '','msg_confirm' );
    ibx_grid  = inputBox.grid;
    ibx_grid .setWidget  ( new Label(
      '<h2>Delete My Account</h2>' +
      'Your account will be deleted, are you sure?<p>' +
      'Once deleted, all your data, including registration details,<br>' +
      'imported files, projects and results will be removed from<br>' +
      'the server irrevocably.<p>' +
      'In order to confirm complete deletion of your account and<br>' +
      'all associated data, in your password and press <b>Confirm</b><br>' +
      'button.' ),0,2,2,3 );
    ibx_grid .setWidget ( (new Label('Password:')).setWidth('75px'),2,2,1,1 );
    ibx_grid .setWidget ( pswd_inp,2,3,1,1 );
    ibx_grid .setLabel  ( '&nbsp;',2,4,1,1 ).setWidth('80px');

//    ibx_grid .setNoWrap ( 0,0 );
//    ibx_grid .setNoWrap ( 1,0 );
//    inputBox .addWidget            ( ibx_grid     );
    ibx_grid .setVerticalAlignment ( 2,2,'middle' );
    ibx_grid .setVerticalAlignment ( 2,3,'middle' );

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
        userData.licence  = licence_btn .getText();
        userData.feedback = feedback_btn.getText();

        serverRequest ( fe_reqtype.deleteUser,userData,'Delete My Account',
                        function(response){
          if (response)
            new MessageBoxW ( 'Delete My Account',response,0.5 );
          else  {
            new MessageBox ( 'Delete My Account',
              'Dear ' + userData.name +
              ',<p>Your account and all associated data have been<br>successfully ' +
              'deleted, and notification sent<br>to your e-mail address:<p><b><i>' +
              userData.email + '</i></b>.' +
              '<p>You are logged out now.' );
            stopSessionChecks();
            makeLoginPage ( sceneId );
          }
        },null,'persist' );

        return true;  // close dialog

      }
    });

  });

  // fetch user data from server
  serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){
    userData = data;
    var msg  = checkUserData ( userData );
    if (msg.length>0)
      window.setTimeout ( function(){
        new MessageBox ( 'Update Account Data',
          'Please check your account settings:<ul>' + msg + '</ul>' +
          'To confirm your changes, push <b>Save changes</b> button.' );
      },0);
    user_inp    .setValue  ( userData.name     );
    email_inp   .setValue  ( userData.email    );
    login_inp   .setValue  ( userData.login    );
    licence_btn .setButton ( userData.licence,image_path('licence') )
    if ((userData.feedback.length>0) &&
        ([feedback_code.agree1,feedback_code.agree2,feedback_code.decline]
            .indexOf(userData.feedback)>=0))
      feedback_btn.setButton ( userData.feedback,image_path('feedback') )

    // now activate buttons:
    licence_btn .setDisabled ( false );
    feedback_btn.setDisabled ( false );
    if (authoris_btn)
      authoris_btn.setDisabled ( false );
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
