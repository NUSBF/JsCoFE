
/*
 *  =================================================================
 *
 *    26.06.24   <--  Date of Last Modification.
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

// function _privacyStatement()  {
//   new HelpBox ( 'Privacy Statement','./html/privacy_statement.html',null );
// }

// function _aboutCCP4Cloud()  {
//   new HelpBox ( '',__user_guide_base_url + 'jscofe_about.html',null );
// }

// function _ccp4_download()  {
//   window.open ( "https://www.ccp4.ac.uk/download/" );
//   //new HelpBox ( 'CCP4 Download','./html/link_to_ccp4.html',null );
// }

function LoginPage ( sceneId )  {

  stopSessionChecks();

  __login_token = '';
  __login_user  = '';

  __announcement_made = false;  // force checking at login

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LoginPage' );

  let mrow = 0;

  let menu_panel = this.grid.setGrid ( '',mrow++,0,1,3 );
                      //  .setHeight ( '32px' );
  // menu_panel.addClass   ( 'upper-panel'  );

  this.grid.setCellSize ( '45%','20%',mrow++,0,1,1 );

  // ****
  $('#'+sceneId).addClass ( 'login-scene' );

  // make central panel
  // **** let cpanel = this.grid.setGrid ( '',mrow,1,1,1 ).setWidth('700px');
  let cpanel = this.grid.setGrid ( '',mrow,1,1,1 ); //.setWidth('200px');

  // adjust scene grid attributes such that login panel is centered
  // this.grid.setVerticalAlignment ( mrow,1,'middle' );
  this.grid.setCellSize          ( 'auto','auto', mrow,  1,1,1 );
  this.grid.setCellSize          ( '45%' ,'auto', mrow++,2,1,1 );
  this.grid.setLabel             ( '&nbsp;',mrow,0,1,1 );  // for Firefox
  this.grid.setCellSize          ( '45%' ,'20%' , mrow++,0,1,1 );

  // let synopsis_lbl = this.grid.setLabel ( '&nbsp;',mrow,1,1,1 )
  //                        .setWidth ( '640px' )
  //                        .setHorizontalAlignment ( 'center' )
  //                        .setFontSize('80%');
  // this.grid.setHorizontalAlignment ( mrow,0,'center' );
  // this.grid.setVerticalAlignment   ( mrow++,0,'top'    );
  // this.grid.setCellSize            ( '','40px',mrow++,0,1,1 );
  let tip_lbl = this.grid.setLabel ( '',mrow,0,1,3 ).setFontSize('80%');
  this.grid.setHorizontalAlignment ( mrow,0,'center' );
  this.grid.setVerticalAlignment   ( mrow,0,'top'    );
  this.grid.setCellSize            ( '','20px',mrow++,0,1,3 );
  this.grid.setCellSize            ( '','3px', mrow++,0,1,3 );

  this.makeLogoPanel               ( mrow,0,3 );

  if (!__mobile_device)  {
    //  Fetch and display random tip of the day
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
          '" style="padding-left:80px;width:20px;height:20px;vertical-align:bottom;"/>' +
          '<span><i style="font-style:Garamond;color:#666666;">' +
          __tips.tips[tipNo].summary.replace('<a>',tipLink) +
          '</i></span>'
        );
      }
    },1000);
  }

  // put logo
  // cpanel.setCellSize ( '','64px',0,0 );

  //*** */ cpanel.setImage ( image_path('ccp4cloud_remote'), '400px','', 0,0,1,1 );
  cpanel.setCellSize ( '0px','',0,0 );
  cpanel.setCellSize ( '0px','' ,0,1 );
  cpanel.setVerticalAlignment ( 0,0,'middle' );

  let panel       = cpanel.setGrid ( '',0,2,1,1 );
  let label_color = '#6A6A6A';
  let row         = 0;

  panel.setLabel ( '&nbsp;<p>' +
                   '<b style="font-size:220%">' + appName() + '</b><br>' +
                   '<b style="font-size:100%">' + '@ ' + __setup_desc.name + 
                   '</b>',
                   row++,0,1,2 )
       .setNoWrap()
       .setMargins ( '','','','32px' );

  panel.setLabel ( 'LOGIN',row++,0,1,1 )
       //  .setFont ( 'Lucida Console','90%',false,false )
       .setFontSize ( '90%' )
       .setFontColor ( label_color );

  let login_inp = panel.setInputText ( '',row++,0,1,2 )
                       .setStyle     ( 'text',__regexp_login, //'^[A-Za-z][A-Za-z0-9\\-\\._-]+$',
                                       '','' )
                       .setWidth     ( '200px' )
                       .setHeight    ( '32px'  )
                       .setVerticalAlignment ( 'middle' )
                       .setPaddings  ( '8px','','8px','2px' )
                       .setMargins   ( '','','','20px' )
                       .setFontSize  ( '100%' );

  panel.setLabel ( 'PASSWORD&nbsp;&nbsp;',row,0,1,1 )
       .setFontSize  ( '90%'     )
       .setFontColor ( label_color );

  let vis_btn   = panel.setImageButton ( image_path('pwd_hidden'),'32px','14px',
                                         row,1,1,1 )
                       .setTooltip     ( 'Toggle password visibility' );
  vis_btn.icon_hidden = true;
  panel.setCellSize ( '90%','',row++,1 );

  let pwd_inp   = panel.setInputText ( '',row++,0,1,2 )
                       .setStyle     ( 'password','','','' )
                       .setWidth     ( '200px' )
                       .setHeight    ( '32px'  )
                       .setVerticalAlignment ( 'middle' )
                       .setPaddings  ( '8px','','8px','2px' )
                       .setMargins   ( '','','','24px' )
                       .setFontSize  ( '100%' );

  let login_btn = panel.setButton ( 'Login',image_path('login'),row++,0,1,2 )
                       .setHeight ( '36px' );
                      //  .setFontSize ( '125%' );

  // make upper manu

  let col = 0;
  function _add_popup_button ( text,icon_name,listener_func,spacer='20px' )  {
    menu_panel.setCellSize ( spacer,'',0,col++,1,1 );
    // menu_panel.setPopupButton ( text,image_path(icon_name),0,col++,1,1 )
    menu_panel.setPopupButton ( text.toUpperCase(),'',0,col++,1,1 )
              .setFontSize ( '85%' )
              .addOnClickListener ( listener_func );
  }

  _add_popup_button ( 'About','about',function()  {
    new HelpBox ( '',__user_guide_base_url + 'jscofe_about.html',null );
  },'95%' );
  _add_popup_button ( 'CCP4','ccp4_diamond',function()  {
    window.open ( 'https://www.ccp4.ac.uk','_blank' );
  });
  _add_popup_button ( 'Privacy','privacy',function()  {
    new HelpBox ( 'Privacy Statement','./html/privacy_statement.html',null );
  });
  _add_popup_button ( 'Forgotten password','reminder',function()  {
    if (__regMode=='email')
      makeForgottenLoginPage(sceneId);
    else
      new MessageBox ( 'Password recovery',
        '<p>In order to reset your password, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.', 'msg_information' );
  });
  _add_popup_button ( 'Register','user',function()  {
    if (__regMode=='email')
      makeRegisterPage(sceneId);
    else
      new MessageBox ( 'New user registration',
        '<p>In order to register as a new user, please contact ' + appName() +
        '<br>admin or maintainer in your organisation.', 'msg_information' );
  });

  /*
  if (__any_mobile_device)  {
    panel.setLabel              ( '<center><i>Note: Coot and some other tasks ' +
                                  'cannot be used when<br>working ' +
                                  'from tablets and phones<br>&nbsp;' +
                                  '</i></center>',
                                  row++,col,1,3 )
         .setTooltip            ( 'For best experience, access this web-site from ' +
                                  'MS Windows, Linux or Mac OSX device  with ' +
                                  'CCP4 Software Suite version 7.1 or higher ' +
                                  'installed.'
                                )
         .setNoWrap();
    panel.setCellSize           ( '','24px',col,3 );
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
                                  row++,col,1,3 );
    panel.setCellSize           ( '','48px',col,3 );
  }

  if (!isProtectedConnection())
    panel.setLabel              ( '<div style="min-width:380px"><center><i>' +
                                  'Connection is not secure - <span style="color:maroon">' +
                                  '<b>Moorhen</b></span> will not work' +
                                  '</i></center></div>',
                                  row++,col,1,3 );

  panel.setLabel                ( '<center><i>Check ' + appName() +
                                  ' <a target="_blank" href="html/roadmap.html">' +
                                  'roadmap<a></i> for new users</center>',
                                  row++,col,1,3 );
  */

  // panel.setLabel                ( '<div style="font-size:80%">' + appName() + 
  //                                 ' provides computational resources ' +
  //                                 'and online access to CCP4 Software for ' +
  //                                 'determining macromoleculare structures in 3D ' +
  //                                 'from X-ray diffraction images. Read more details ' +
  //                                 ' <a href="javascript:_aboutCCP4Cloud()">' +
  //                                 'here<a>.</div>',
  //                                 row++,col,1,2 );

  // panel.setLabel                ( '<div style="padding-top:6px;"><i>' +
  //                                 '<a href="javascript:_privacyStatement()">' +
  //                                 'Privacy Statement<a></i></div>',
  //                                 row++,col,1,2 );

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


/*
  let synopsis_lbl = cpanel.setLabel ( '&nbsp;',row,0,1,3 )
                          .setWidth ( '600px' )
                          .setHorizontalAlignment ( 'right' )
                          .setFontSize('80%')
                          .setMargins ( '','36px','','' );
  synopsis_lbl.setText ( 
            appName() + 
            ' provides computational resources ' +
            'and online access to CCP4 Software for ' +
            'determining macromoleculare structures in 3D ' +
            'from X-ray diffraction images. Read more details ' +
            ' <a href="javascript:_aboutCCP4Cloud()">' +
            'here<a>.' );
*/

  // this.grid.setLabel ( 
  //             appName() + 
  //             ' provides computational resources ' +
  //             'and online access to CCP4 Software for ' +
  //             'determining macromoleculare structures in 3D ' +
  //             'from X-ray diffraction images. Read more details ' +
  //             ' <a href="javascript:_aboutCCP4Cloud()">' +
  //             'here<a>.',2,1,1,1 )
  //     .setWidth('640px')
  //     .setFontSize('90%')
  //     .setHorizontalAlignment ( 'center')
  //     .setPaddings('','','','24px');
  // this.grid.setHorizontalAlignment ( 2,0,'center' );
  // this.grid.setVerticalAlignment   ( 2,0,'top'    );
  // this.grid.setCellSize            ( '','20px',2,0,1,3 );


}

// LoginPage.prototype = Object.create ( BasePage.prototype );
// LoginPage.prototype.constructor = LoginPage;

registerClass ( 'LoginPage',LoginPage,BasePage.prototype );

function makeLoginPage ( sceneId )  {
  // if (__current_page)
  //  logout ( sceneId,0 );
  // else
  makePage ( function(){ 
    new LoginPage(sceneId); 
    setHistoryState ( 'LoginPage' );
  });
}

function reloadBrowser()  {
  window.location = window.location;
}
