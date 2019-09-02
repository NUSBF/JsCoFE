
/*
 *  =================================================================
 *
 *    02.09.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_authend.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Authorisation end page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// authorisation end page class

var software_title = {
  'arpwarp' : 'Arp/wArp'
}

function AuthEndPage ( sceneId,software_key,auth_result )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','AuthEndPage' );

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

  var title   = 'Authorisation request for ' + software_title[software_key] + ' failed.';
  var details = '';
  switch (auth_result)  {

    case 'ok'     : title = 'Authorisation request for ' + software_title[software_key] +
                            ' succeeded.';
                    break;

    case 'denied' : title   = 'Authorisation request for ' + software_title[software_key] +
                              ' denied.';
                    details = 'Please contact ' + software_title[software_key] + ' provider.';
                    break;

    case 'bad_reply' : details = 'Malformed reply from the authorisation server, ' +
                                 'please file bug report.';
                       break;

    case 'errors'    : details = 'Possible authorisation server malfunction, ' +
                                 'please file bug report.';
                       break;

    case 'no_user_data' : details = 'User registration data not found, please file ' +
                                    'bug report.';
                          break;

    case 'user_logout'  : details = 'User logged out before authorisation completed, ' +
                                    'please repeat authorisation request.';
                          break;

    case 'bad_reqid'    : details = 'Malformed request identifier obtained from the ' +
                                    'authorisation server, please file bug report.';
                          break;

    default : details = 'Unknown failure code (' + auth_result + ')';

  }

  var title_lbl   = new Label ( appName() );
  var result_lbl  = new Label ( title     );
  var details_lbl = new Label ( details   );
  var close_lbl   = new Label ( 'You may close this window now.' );

  title_lbl   .setFont          ( 'times','300%',true,true );
  result_lbl  .setFont          ( 'times','200%',true,true );
  result_lbl  .setNoWrap        ();
  details_lbl.setFontSize       ( '125%' );
  close_lbl  .setFontItalic     ( true );

  var row = 0;
  panel.setWidget               ( title_lbl   ,row,0,1,1   );
  panel.setHorizontalAlignment  ( row++ ,0    ,'center'    );
  panel.setWidget               ( this.makeSetupNamePanel(), row++,0,1,1 );
  panel.setCellSize             ( '','20pt'   ,row++,0     );
  panel.setWidget               ( result_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );
  panel.setWidget               ( details_lbl,row,0,1,1 );
  panel.setHorizontalAlignment  ( row++ ,0,'center' );
  panel.setCellSize             ( '','20pt',row++,0 );

  panel.setWidget               ( close_lbl,row,0,1,1 );

}

AuthEndPage.prototype = Object.create ( BasePage.prototype );
AuthEndPage.prototype.constructor = AuthEndPage;
