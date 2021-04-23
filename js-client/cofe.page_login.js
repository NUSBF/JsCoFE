
/*
 *  =================================================================
 *
 *    21.04.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// login page class

function _privacyStatement()  {
  new HelpBox ( 'Privacy Statement','./html/privacy_statement.html',null );
}

function _ccp4_download()  {
  // because CCP4 is on http an does not mix with https, open this in new
  // tab/window just for now
  window.open ( "http://www.ccp4.ac.uk/download" );
  //new HelpBox ( 'CCP4 Download','./html/link_to_ccp4.html',null );
}

function LoginPage ( sceneId )  {

  __login_token = '';
  __login_user  = '';

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LoginPage' );

  // adjust scene grid attributes such that login panel is centered

  // make login panel
  var panel = new Grid('');
  panel.setWidth ( '300pt' );

  if (__tips && __tips.use_tips && (__tips.tips.length>0))  {

    this.grid.setCellSize          ( '45%','',0,0,1,1 );
    this.grid.setCellSize          ( '','15px',0,0,1,3 );
    this.grid.setWidget            ( panel,1,1,1,1 );
    this.grid.setVerticalAlignment ( 1,1,'middle' );
    this.grid.setCellSize          ( '10%','',1,1,1,1 );
    this.grid.setCellSize          ( '45%','',1,2,1,1 );

    var tipNo = round(Date.now()/1000,0) % __tips.tips.length;
    var tipLink = '<a href="javascript:' +
                      'launchHelpBox(\'' + __tips.tips[tipNo].title + '\',' +
                                    '\'' + __tips.tips[tipNo].doc   + '/'   +
                                           __tips.tips[tipNo].link  + '\',' +
                                    'null,10)">';

    //this.grid.setImage ( image_path('tip'),'24px','24px', 2,0,1,3 );
    this.grid.setLabel (
      '<img src="' + image_path('tip') + '" style="width:24px;height:24px;vertical-align:bottom;"/>' +
      '<span><i style="font-style:Garamond;color:#666666;">' +
      __tips.tips[tipNo].summary.replace('<a>',tipLink) +
      '</i></span>',
      2,0,1,3 );
    this.grid.setHorizontalAlignment ( 2,0,'center' );
    this.grid.setVerticalAlignment   ( 2,0,'top' );
    this.grid.setCellSize          ( '','12px',2,0,1,3 );
    this.grid.setCellSize          ( '','3px',3,0,1,3 );

    this.makeLogoPanel             ( 4,0,3 );

  } else  {
    this.grid.setCellSize          ( '45%','',0,0,1,1 );
    this.grid.setWidget            ( panel,0,1,1,1 );
    this.grid.setVerticalAlignment ( 0,1,'middle' );
    this.grid.setCellSize          ( '10%','',0,1,1,1 );
    this.grid.setCellSize          ( '45%','',0,2,1,1 );
    this.makeLogoPanel             ( 1,0,3 );
  }

  /*
  var connected_lbl = null;
  var host_lbl      = null;
  if (__fe_url != document.location.protocol + '//' +
                  document.location.host     +
                  document.location.pathname)  {
    connected_lbl = new Label ( 'Connected to:' );
    host_lbl      = new Label ( __fe_url );
    connected_lbl.setNoWrap().setFontSize ( '125%' );
    host_lbl.setNoWrap().setFontSize ( '125%' ).setFontItalic(true);
  }
  */

  var login_lbl   = new Label     ( 'Login name:' );
  var pwd_lbl     = new Label     ( 'Password:'   );
  var login_inp   = new InputText ( '' );
  var pwd_inp     = new InputText ( '' );
  var vis_btn     = new ImageButton ( image_path('pwd_hidden'),'32px','14px' );
  login_lbl.setNoWrap();
  login_lbl.setFontSize         ( '125%' );
  pwd_lbl  .setFontSize         ( '125%' );
  login_inp.setFontSize         ( '112%' );
  login_inp.setStyle            ( 'text','^[A-Za-z][A-Za-z0-9\\-\\._-]+$',
                                  'Your CCP4 login','' );
  vis_btn  .setTooltip          ( 'Toggle password visibility' );
  vis_btn  .icon_hidden = true;
  /*
                                  'Login name should contain only latin ' +
                                  'letters, numbers,\n undescores, dashes ' +
                                  'and dots, and must start with a letter' );
  */
  login_inp.setFontItalic       ( true   );
  pwd_inp  .setFontSize         ( '112%' );
  pwd_inp  .setStyle            ( 'password','','Your CCP4 password','' );
  pwd_inp  .setFontItalic       ( true   );
  login_inp.setWidth            ( '95%'  );
  pwd_inp  .setWidth            ( '95%'  );

  var row = 0;
  panel.setLabel ( appName() + ' Login', row,0,1,3 )
       .setFont  ( 'times','40px',true,true )
       .setNoWrap();
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setWidget               ( this.makeSetupNamePanel(), row++,0,1,3 );
  panel.setCellSize             ( '','10pt',row++,0 );

  panel.setWidget               ( login_lbl,row  ,0,1,1 );
  panel.setWidget               ( pwd_lbl  ,row+1,0,1,1 );
  panel.setVerticalAlignment    ( row  ,0,'middle' );
  panel.setVerticalAlignment    ( row+1,0,'middle' );
  panel.setWidget               ( login_inp,row++,1,1,1 );
  panel.setWidget               ( pwd_inp  ,row  ,1,1,1 );
  panel.setWidget               ( vis_btn  ,row  ,2,1,1 );
  panel.setVerticalAlignment    ( row++,2,'middle' );

  panel.setCellSize             ( '','4pt',row++,0 );
  panel.setWidget               ( new HLine('3pt'), row++,0,1,3 );
  //panel.setCellSize             ( '','1pt',row++,0 );

  var login_btn = new Button    ( 'Login',image_path('login') );
  var pwd_btn   = new Button    ( 'Forgotten password',image_path('reminder') );
  var reg_btn   = new Button    ( 'Registration',image_path('new_file') );

  login_btn.setWidth            ( '100%' );
  pwd_btn  .setWidth            ( '100%' );
  reg_btn  .setWidth            ( '100%' );

  panel.setWidget               ( login_btn,row++,0,1,3 );
  panel.setWidget               ( pwd_btn  ,row++,0,1,3 );
  panel.setWidget               ( reg_btn  ,row++,0,1,3 );

  //panel.setLabel                ( '&nbsp;',row++,0,1,3 )
  panel.setCellSize             ( '','6pt',row++,0 );

  if (__any_mobile_device)
    panel.setLabel              ( '<center><i>Please note that some ' +
                                  'tasks, such as interactive<br>model building ' +
                                  'with Coot, interactive image<br>processing and ' +
                                  'some others, are not available<br>when CCP4 ' +
                                  'Cloud is accessed from mobile<br>devices ' +
                                  '(tablets, ipads and smartphones)</i></center>',
                                  row++,0,1,3 )
         .setTooltip            ( 'For best expereince, access this web-site from ' +
                                  'MS Windows, Linux or Mac OSX device  with ' +
                                  'CCP4 Software Suite version 7.1 or higher ' +
                                  'installed.'
                                )
         .setNoWrap();

  /*
  else if (!__local_service)
    panel.setLabel              ( '&nbsp;<br><center><i>For best experience, access ' +
                                  'this web site via<br>' + appName() + ' Client, ' +
                                  'which can be obtained by installing<br>' +
                                  '<a href="javascript:_ccp4_download()"> ' +
                                  'the CCP4 Software Suite version 7.1 or higher</a>' +
                                  '<br>(look for icon with wireless sign after ' +
                                  'installation)</i></center>',
                                  row++,0,1,3 )
  */
  else if (!__local_service)
    panel.setLabel              ( '<div style="min-width:440px"><center><i>' +
                                  '<b>NOTE:</b> In order to use CCP4 graphical ' +
                                  'applications, such as <span style="color:maroon">' +
                                  '<b>Coot, DUI, iMosflm</b></span> and similar, with ' +
                                  appName() + ', install<br><a href="javascript:_ccp4_download()">' +
                                  'the CCP4 Software Suite</a> and ' +
                                  'start with this icon:<br>' +
                                  '<img src="images_com/ccp4cloud_remote.png" ' +
                                  'style="height:36px;width:36px;padding-top:6px;"/>' +
                                  '</i></center></div>',
                                  row++,0,1,3 );
//          .setTooltip           ( appName() + ' Client is necessary for running ' +
//                                  'interactive graphical software, such as image ' +
//                                  'processing (DUI, Mosflm, XDSGUI), Coot and ' +
//                                  'some others.'
//                                );
//          .setNoWrap();

  panel.setLabel                ( '<center><i>Check ' + appName() +
                                  ' <a target="_blank" href="html/tutorials.html">' +
                                  'roadmap<a></i> for new users</center>',
                                  row++,0,1,3 );
  panel.setLabel                ( '<center style="padding-top:6px;"><i>' +
                                  '<a href="javascript:_privacyStatement()">' +
                                  'Privacy Statement<a></i></center>',
                                  row++,0,1,3 );
  panel.setCellSize             ( '','24pt',row++,0 );



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
        '<br>admin or maintainer in your organisation.' );
  });

  pwd_btn.addOnClickListener ( function(){
    if (__regMode=='email')
      makeForgottenLoginPage(sceneId);
    else
      new MessageBox ( 'Password recovery',
        '<p>In order to reset your password, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.' );
  });

/*
  var viewFullScreen = document.getElementById("scene");
  if (viewFullScreen)
      viewFullScreen.addEventListener("click",setFullScreen );
*/

  //if (__mobile_device)
  //  login_btn.addOnClickListener ( setFullScreen );

  login_btn.addOnClickListener ( function(){

    if (__mobile_device)
      setFullScreen();

    // Validate the input
    var msg = '';

    if (login_inp.getValue().length<=0)
      msg += '<b>Login name</b> must be provided.<p>';
    else if (login_inp.element.validity.patternMismatch)
      msg += 'Login name should contain only latin letters, numbers,\n ' +
             'undescores, dashes and dots, and must start with a letter.<p>';

    if (pwd_inp.getValue().length<=0)
      msg += '<b>Password</b> must be provided.';

    if (msg)  {

      new MessageBox ( 'Login',
         'Login cannot be done due to the following reasons:<p>' +
          msg + '<p>Please provide all needful data and try again' );

    } else  {

      login ( login_inp.getValue(),pwd_inp.getValue(),sceneId,0 );

    }

  });

  setDefaultButton ( login_btn,this.grid );

}

LoginPage.prototype = Object.create ( BasePage.prototype );
LoginPage.prototype.constructor = LoginPage;

function makeLoginPage ( sceneId )  {
  makePage ( new LoginPage(sceneId) );
  setHistoryState ( 'LoginPage' );
}
