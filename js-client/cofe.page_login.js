
/*
 *  =================================================================
 *
 *    31.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_login.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Login page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

// -------------------------------------------------------------------------
// login page class

function _privacyStatement()  {
  new HelpBox ( 'Privacy Statement','./html/privacy_statement.html',null );
}

function _ccp4_download()  {
  window.open ( "https://www.ccp4.ac.uk/download/" );
  //new HelpBox ( 'CCP4 Download','./html/link_to_ccp4.html',null );
}

function LoginPage ( sceneId )  {

  stopSessionChecks();

  __login_token = '';
  __login_user  = '';

  __announcement_made = false;  // force checking at login

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LoginPage' );

  // adjust scene grid attributes such that login panel is centered

  // make login panel
  let panel = new Grid('');
  panel.setWidth ( '300px' );

  this.grid.setCellSize            ( '45%','',0,0,1,1 );
  this.grid.setCellSize            ( '','15px',0,0,1,3 );
  this.grid.setWidget              ( panel,1,1,1,1 );
  this.grid.setVerticalAlignment   ( 1,1,'middle' );
  this.grid.setCellSize            ( '10%','',1,1,1,1 );
  this.grid.setCellSize            ( '45%','',1,2,1,1 );

  let tip_lbl = this.grid.setLabel ( '&nbsp;',2,0,1,3 ).setFontSize('80%');
  this.grid.setHorizontalAlignment ( 2,0,'center' );
  this.grid.setVerticalAlignment   ( 2,0,'top'    );
  this.grid.setCellSize            ( '','20px',2,0,1,3 );
  this.grid.setCellSize            ( '','3px' ,3,0,1,3 );

  this.makeLogoPanel               ( 4,0,3 );

  if (!__mobile_device)  {
    window.setTimeout ( function(){
      if (__tips && __tips.use_tips && (__tips.tips.length>0))  {
        let tipNo = 0;
        if ('tipNo' in __tips)  tipNo = __tips.tipNo;
                          else  tipNo = round(Date.now()/5000,0);
        tipNo = tipNo % __tips.tips.length;
        let tipLink = '<a href="javascript:' +
                          'launchHelpBox1(\'' + __tips.tips[tipNo].title + '\',' +
                                        '\'' + __tips.tips[tipNo].doc   + '/'   +
                                               __tips.tips[tipNo].link  + '\',' +
                                        'null,10)">';
        tip_lbl.setText (
          '<img src="' + image_path('tip') +
          '" style="width:20px;height:20px;vertical-align:bottom;"/>' +
          '<span><i style="font-style:Garamond;color:#666666;">' +
          __tips.tips[tipNo].summary.replace('<a>',tipLink) +
          '</i></span>'
        );
      }
    },1000);
  }

  let login_lbl   = new Label     ( 'Login name:' );
  let pwd_lbl     = new Label     ( 'Password:'   );
  let login_inp   = new InputText ( '' );
  let pwd_inp     = new InputText ( '' );
  let vis_btn     = new ImageButton ( image_path('pwd_hidden'),'32px','14px' );
  login_lbl.setNoWrap();
  login_lbl.setFontSize         ( '125%' );
  pwd_lbl  .setFontSize         ( '125%' );
  login_inp.setFontSize         ( '112%' );
  login_inp.setStyle            ( 'text',__regexp_login, //'^[A-Za-z][A-Za-z0-9\\-\\._-]+$',
                                  'Your CCP4 login','' );
  vis_btn  .setTooltip          ( 'Toggle password visibility' );
  vis_btn  .icon_hidden = true;
  /*
                                  'Login name should contain only latin ' +
                                  'letters, numbers,\n underscores, dashes ' +
                                  'and dots, and must start with a letter' );
  */
  login_inp.setFontItalic       ( true   );
  pwd_inp  .setFontSize         ( '112%' );
  pwd_inp  .setStyle            ( 'password','','Your CCP4 password','' );
  pwd_inp  .setFontItalic       ( true   );
  login_inp.setWidth            ( '95%'  );
  pwd_inp  .setWidth            ( '95%'  );

  let row = 1;
  panel.setLabel ( appName() + ' Login', row,0,1,3 )
       .setFont  ( 'times','40px',true,true )
       .setNoWrap();
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setWidget               ( this.makeSetupNamePanel(), row++,0,1,3 );
  panel.setCellSize             ( '','10px',row++,0 );

  panel.setWidget               ( login_lbl,row  ,0,1,1 );
  panel.setWidget               ( pwd_lbl  ,row+1,0,1,1 );
  panel.setVerticalAlignment    ( row  ,0,'middle' );
  panel.setVerticalAlignment    ( row+1,0,'middle' );
  panel.setWidget               ( login_inp,row++,1,1,1 );
  panel.setWidget               ( pwd_inp  ,row  ,1,1,1 );
  panel.setWidget               ( vis_btn  ,row  ,2,1,1 );
  panel.setVerticalAlignment    ( row++,2,'middle' );

  panel.setCellSize             ( '','4px',row++,0 );
  panel.setWidget               ( new HLine('3px'), row++,0,1,3 );
  //panel.setCellSize             ( '','1px',row++,0 );

  let login_btn = new Button    ( 'Login',image_path('login') );
  let pwd_btn   = new Button    ( 'Forgotten password',image_path('reminder') );
  let reg_btn   = new Button    ( 'Registration',image_path('new_file') );

  login_btn.setWidth            ( '100%' );
  pwd_btn  .setWidth            ( '100%' );
  reg_btn  .setWidth            ( '100%' );
  panel.setWidget               ( login_btn,row++,0,1,3 );
  panel.setWidget               ( pwd_btn  ,row++,0,1,3 );
  panel.setWidget               ( reg_btn  ,row++,0,1,3 );

  //panel.setLabel                ( '&nbsp;',row++,0,1,3 )
  panel.setCellSize             ( '','6px',row++,0 );

  if (__any_mobile_device)  {
    panel.setLabel              ( '<center><i>Note: Coot and some other tasks ' +
                                  'cannot be used when<br>working ' +
                                  'from tablets and phones<br>&nbsp;' +
                                  '</i></center>',
                                  row++,0,1,3 )
         .setTooltip            ( 'For best experience, access this web-site from ' +
                                  'MS Windows, Linux or Mac OSX device  with ' +
                                  'CCP4 Software Suite version 7.1 or higher ' +
                                  'installed.'
                                )
         .setNoWrap();
    panel.setCellSize           ( '','24px',0,3 );
  } else if (!__local_service)  {
    panel.setLabel              ( '<div style="min-width:380px"><center><i>' +
                                  '<b>NOTE:</b> For using <span style="color:maroon">' +
                                  '<b>Coot, DUI, iMosflm</b></span> and similar<br>' +
                                  'tasks, install <a href="javascript:_ccp4_download()">' +
                                  'the CCP4 Software Suite</a> and ' +
                                  'start<br>' + appName() + ' with this icon:<br>' +
                                  '<img src="images_com/ccp4cloud_remote.png" ' +
                                  'style="height:36px;width:36px;padding-top:6px;"/>' +
                                  '</i></center></div>',
                                  row++,0,1,3 );
    panel.setCellSize           ( '','48px',0,3 );
  }

  if (!isProtectedConnection())
    panel.setLabel              ( '<div style="min-width:380px"><center><i>' +
                                  'Connection is not secure – <span style="color:maroon">' +
                                  '<b>Moorhen</b></span> will not work' +
                                  '</i></center></div>',
                                  row++,0,1,3 );

  panel.setLabel                ( '<center><i>Check ' + appName() +
                                  ' <a target="_blank" href="html/roadmap.html">' +
                                  'roadmap<a></i> for new users</center>',
                                  row++,0,1,3 );
  panel.setLabel                ( '<center style="padding-top:6px;"><i>' +
                                  '<a href="javascript:_privacyStatement()">' +
                                  'Privacy Statement<a></i></center>',
                                  row++,0,1,3 );
  // panel.setCellSize             ( '','24px',row++,0 );


  vis_btn.addOnClickListener ( function(){
    vis_btn.icon_hidden = !vis_btn.icon_hidden;
    if (vis_btn.icon_hidden)  {
      vis_btn.setImage ( image_path('pwd_hidden')  );
      pwd_inp.setType  ( 'password' );
    } else  {
      vis_btn.setImage ( image_path('pwd_visible') );
      pwd_inp.setType  ( 'text' );
    }
  });

  reg_btn.addOnClickListener ( function(){
    if (__regMode=='email')
      makeRegisterPage(sceneId);
    else
      new MessageBox ( 'New user registration',
        '<p>In order to register as a new user, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.', 'msg_information' );
  });

  pwd_btn.addOnClickListener ( function(){
    if (__regMode=='email')
      makeForgottenLoginPage(sceneId);
    else
      new MessageBox ( 'Password recovery',
        '<p>In order to reset your password, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.', 'msg_information' );
  });

  login_btn.addOnClickListener ( function(){

    if (__mobile_device)
      setFullScreen();

    // Validate the input
    let msg = '';

    if (login_inp.getValue().length<=0)
      msg += '<b>Login name</b> must be provided.<p>';
    else if (login_inp.element.validity.patternMismatch)
      msg += 'Login name can contain only latin letters, numbers,\n ' +
             'underscores, dashes and dots, and must start with a letter.<p>';

    if (pwd_inp.getValue().length<=0)
      msg += '<b>Password</b> must be provided.';

    if (msg)  {

      new MessageBox ( 'Login',
         'Login data is either incomplete or incorrect:<p>' +
          msg + '<p>Please provide all needful data and try again', 'msg_excl' );

    } else  {

      let page_switch = 0;
      if (__url_parameters)  {
        if ('id' in __url_parameters)  page_switch = 102;
                                 else  page_switch = 101;
      }
      login ( login_inp.getValue(),pwd_inp.getValue(),sceneId,page_switch );

    }

  });

  setDefaultButton ( login_btn,{ element : window } );

  if (__url_parameters)  {
    if ('project' in __url_parameters)
      new MessageBox ( 'Log in to ' + appName(),
        '<h2>Log in to ' + appName() + '</h2>' +
        'For getting access to Demo Project<h3>' + __url_parameters['project'] + 
        '</h3>please log in to your ' + appName() + ' account now.',
        'msg_information' );
    else if ('id' in __url_parameters)
      new MessageBox ( 'Log in to ' + appName(),
        '<h2>Log in to ' + appName() + '</h2>' +
        'For getting access to Archive Project<h3>' + __url_parameters['id'] + 
        '</h3>please log in to your ' + appName() + ' account now.',
        'msg_information' );
  }

}

// LoginPage.prototype = Object.create ( BasePage.prototype );
// LoginPage.prototype.constructor = LoginPage;

registerClass ( 'LoginPage',LoginPage,BasePage.prototype );

function makeLoginPage ( sceneId )  {
  makePage ( function(){ 
    new LoginPage(sceneId); 
    setHistoryState ( 'LoginPage' );
  });
}

function reloadBrowser()  {
  window.location = window.location;
}
