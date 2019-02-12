
/*
 *  =================================================================
 *
 *    12.02.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// login page class

function _privacyStatement()  {
  new HelpBox ( '','./html/jscofe_privacy_statement.html',null );
}

function LoginPage ( sceneId )  {

  __login_token = '';
  __login_user  = '';

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LoginPage' );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize          ( '45%','',0,0,1,1 );
  this.grid.setVerticalAlignment ( 0,1,'middle' );
  this.grid.setCellSize          ( '10%','',0,1,1,1 );
  this.grid.setCellSize          ( '45%','',0,2,1,1 );
  this.makeLogoPanel             ( 1,0,3 );

  // make login panel
  var panel = new Grid('');
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  var ccp4_lbl  = new Label     ( appName() + ' Login' );
  var login_lbl = new Label     ( 'Login name:' );
  var pwd_lbl   = new Label     ( 'Password:'   );
  var login_inp = new InputText ( '' );
  var pwd_inp   = new InputText ( '' );
  login_lbl.setNoWrap();
  ccp4_lbl .setFont             ( 'times','300%',true,true ).setNoWrap();
  login_lbl.setFontSize         ( '125%' );
  pwd_lbl  .setFontSize         ( '125%' );
  login_inp.setFontSize         ( '112%' );
  login_inp.setStyle            ( 'text',"^[A-Za-z0-9\\-\\._]+$",
                                  'Your CCP4 login','' );
  /*
                                  'Login name should contain only latin ' +
                                  'letters, numbers,\n undescores, dashes ' +
                                  'and dots, and must start with a letter' );
  */
  login_inp.setFontItalic       ( true   );
  pwd_inp  .setFontSize         ( '112%' );
  pwd_inp  .setStyle            ( 'password','','Your CCP4 password','' );
  pwd_inp  .setFontItalic       ( true  );
  login_inp.setWidth            ( '95%' );
  pwd_inp  .setWidth            ( '95%' );

  var row = 0;
  panel.setWidget               ( ccp4_lbl, row,0,1,2 );
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( login_lbl,row  ,0,1,1 );
  panel.setWidget               ( pwd_lbl  ,row+1,0,1,1 );
  panel.setVerticalAlignment    ( row  ,0,'middle' );
  panel.setVerticalAlignment    ( row+1,0,'middle' );
  panel.setWidget               ( login_inp,row++,1,1,1 );
  panel.setWidget               ( pwd_inp  ,row++,1,1,1 );

  panel.setCellSize             ( '','12pt',row++,0 );
  panel.setWidget               ( new HLine('3pt'), row++,0,1,2 );
  panel.setCellSize             ( '','1pt',row++,0 );

  var login_btn = new Button    ( 'Login',image_path('login') );
  var pwd_btn   = new Button    ( 'Forgotten password',image_path('reminder') );
  var reg_btn   = new Button    ( 'Registration',image_path('new_file') );

//  login_btn.setFontSize         ( '100%' );
//  pwd_btn  .setFontSize         ( '100%' );
//  reg_btn  .setFontSize         ( '100%' );

  login_btn.setWidth            ( '100%' );
  pwd_btn  .setWidth            ( '100%' );
  reg_btn  .setWidth            ( '100%' );

  panel.setWidget               ( login_btn,row++,0,1,2 );
  panel.setWidget               ( pwd_btn  ,row++,0,1,2 );
  panel.setWidget               ( reg_btn  ,row++,0,1,2 );
  panel.setLabel                ( '&nbsp;<br><center><i>' + appName() +
                                  ' is available for ' +
                                  'local setups,<br>see instructions ' +
                                  '<a href="manual/html/index.html">here</a>.' +
                                  '</i></center>',
                                  row++,0,1,2 );
  panel.setLabel                ( '&nbsp;<br><center><i>' +
                                  '<a href="javascript:_privacyStatement()">' +
                                  'Privacy Statement<a></i></center>',
                                  row++,0,1,2 );
  panel.setCellSize             ( '','24pt',row++,0 );

  reg_btn.addOnClickListener ( function(){
    if (__regMode=='email')
      makeRegisterPage(sceneId);
    else
      new MessageBox ( 'New user registration',
        '<p>In order to register as a new user, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.' );
  });
  pwd_btn.addOnClickListener ( function(){ makeForgottenLoginPage(sceneId); } );

/*
  var viewFullScreen = document.getElementById("scene");
  if (viewFullScreen)
      viewFullScreen.addEventListener("click",setFullScreen );
*/

  if (__touch_device)
    login_btn.addOnClickListener ( setFullScreen );

  login_btn.addOnClickListener ( function(){


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

      login ( login_inp.getValue(),pwd_inp.getValue(),sceneId );

    }

  });

  setDefaultButton ( login_btn,this.grid );

}

LoginPage.prototype = Object.create ( BasePage.prototype );
LoginPage.prototype.constructor = LoginPage;

function makeLoginPage ( sceneId )  {
  makePage ( new LoginPage(sceneId) );
}
