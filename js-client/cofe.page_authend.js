
/*
 *  =================================================================
 *
 *    20.01.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2020
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// authorisation end page class

var software_title = {
  'arpwarp' : 'Arp/wArp',
  'gphl'    : 'Global Phasing Limited'
}

/*
<html>
<head>
<title>ARP/wARP Webservice - External resource authorisation</title>
</head>
<body>
<h1>Request for permissions to run tasks and download results</h1>
<p>Site localhost (not resolved) is requesting authorisation for
the host 1.2.3.4 (not resolved).
</p>
<p>Please check the host and confirm permit by providing username and password.</p>
<form method="post" novalidate>
  <input type='hidden' name='csrfmiddlewaretoken' value='BZn9Fnmscra6S8kaXKaUaOUo57AibtHM1utI12iCpeolDF1IVNSrDdKYX3LumPA1' />
  <input type="hidden" name="reqid" value="authorisation-gphl-340cef239bd34b777f3ece094ffb1ec5" id="id_reqid" />
  <input type="hidden" name="addr" value="1.2.3.4" id="id_addr" />
  <input type="hidden" name="cburl" value="http://localhost:8085/" id="id_cburl" />
  <tr>
    <th><label for="id_username">Username:</label></th>
    <td><input type="text" name="username" autofocus required id="id_username" maxlength="254" /></td>
  </tr><tr>
    <th><label for="id_password">Password:</label></th>
    <td><input type="password" name="password" required id="id_password" /></td>
  </tr>
  <input name="decision" type="submit" value="Sign" />
  <input name="decision" type="submit" value="Decline" />
</form>
</body>
</html>
*/

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
