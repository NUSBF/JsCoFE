
/*
 *  =================================================================
 *
 *    06.06.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_base.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Base page class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// Base page class

function BasePage ( sceneId,gridStyle,pageType )  {

  // clear the page first
  $('#'+sceneId).empty();
//  unsetDefaultButton ( null );

  // set background image
  if (getClientCode()==client_code.ccp4)
    $('#'+sceneId).css({"background-image"    : "url('" + image_path('ccp4_background') + "')",
                        "background-repeat"   : "no-repeat",
                        "background-size"     : "cover",
                        "background-position" : "center center"} );
  else
    $('#'+sceneId).css({"background-image"    : "url('" + image_path('ccpem_background') + "')",
                        "background-repeat"   : "no-repeat",
                        "background-size"     : "cover",
                        "background-position" : "center center"} );

  this.element = document.getElementById ( sceneId );
  this._type   = pageType;
  this.sceneId = sceneId;

  this.ration      = null;
  this.rationPanel = null;

  this.toolPanel   = null;

  // make master grid
  this.grid = new Grid ( gridStyle );
  $(this.grid.element).appendTo(this.element);

  this.getUserRation();

}


BasePage.prototype.onResize = function ( width,height )  {}

BasePage.prototype.makeSetupNamePanel = function()  {
  var setupPanel = new Grid ( '' );

  function _make_panel ( name,icon )  {
    setupPanel.setImage ( icon,'30px','30px', 0,1,1,1 );
    setupPanel.setLabel ( name, 0,2,1,1 )
              .setFont  ( 'times','150%',true,true ).setNoWrap();
    setupPanel.setCellSize ( '40%','',0,0 );
    setupPanel.setCellSize ( '10%','',0,1 );
    setupPanel.setCellSize ( '10%','',0,2 );
    setupPanel.setCellSize ( '40%','',0,3 );
    setupPanel.setVerticalAlignment ( 0,1,'bottom' );
    setupPanel.setVerticalAlignment ( 0,2,'bottom' );
  }

  if (__setup_desc)  {
    _make_panel ( __setup_desc.name,__setup_desc.icon );
  } else if (__local_setup)  {
    _make_panel ( 'Home setup',image_path('setup_home') );
  } else  {
    _make_panel ( 'Unnamed setup',image_path('setup_unknown') );
  }

  if (__fe_url != document.location.protocol + '//' +
                  document.location.host     +
                  document.location.pathname)  {
    setupPanel.setLabel ( __fe_url, 1,0,1,4 )
              .setFontSize ( '100%' ).setFontItalic(true).setNoWrap();
    setupPanel.setCellSize ( '','20pt',1,0 );
    setupPanel.setVerticalAlignment   ( 1,0,'bottom' );
    setupPanel.setHorizontalAlignment ( 1,0,'center' );
  }


  return setupPanel;

}


//var __ccp4online_logo = new ImageButton ( image_path('logo-ccp4_online'),'','28px' );
//var __stfc_logo       = new ImageButton ( image_path('logo-stfc')       ,'','28px' );
//var __bbsrc_logo      = new ImageButton ( image_path('logo-bbsrc')      ,'','28px' );
//var __ukri_logo       = new ImageButton ( image_path('logo-ukri')       ,'','28px' );

BasePage.prototype.makeLogoPanel = function ( row,col,colSpan )  {

  if (!__setup_desc)  return;
  if (!('partners' in __setup_desc))    return;
  if (__setup_desc.partners.length<=0)  return;

  if (!__setup_desc.partners[0].hasOwnProperty('icon'))
    for (var i=0;i<__setup_desc.partners.length;i++)  {
      __setup_desc.partners[i].icon = new ImageButton (
                                      __setup_desc.partners[i].logo,'','28px' );
      (function(partner){
        partner.icon.setCursor ( 'pointer' )
                    .addOnClickListener ( function(){
          window.open ( partner.url,'_blank' );
        });
      }(__setup_desc.partners[i]))
    }

  var logoPanel = this.grid.setGrid ( '',row,col,1,colSpan );
  var c = 0;
  logoPanel.setLabel ( '&nbsp;Powered by CCP4 v.' + __ccp4_version,0,c,1,1 )
                     .setFontSize ( '75%' ).setNoWrap()
                     .setVerticalAlignment('middle');
  logoPanel.setCellSize ( '50%','', 0,c++ );
  var spacer = Math.max ( 20,40-5*(__setup_desc.partners.length-2) ) + 'px';
  for (var i=0;i<__setup_desc.partners.length;i++)  {
    logoPanel.setWidget ( __setup_desc.partners[i].icon, 0,c++,1,1 );
    if (i<__setup_desc.partners.length-1)
      logoPanel.setLabel  ( '',0,c++,1,1 ).setWidth ( spacer );
  }
  /*
  if (getClientCode()==client_code.ccp4)  {
    logoPanel.setWidget ( __ccp4online_logo, 0,c++,1,1 );
    logoPanel.setLabel  ( '',0,c++,1,1 ).setWidth ( '40px' );
    //logoPanel.setWidget ( __stfc_logo, 0,c++,1,1 );
    //logoPanel.setLabel  ( '',0,c++,1,1 ).setWidth ( '30px' );
    //logoPanel.setWidget ( __bbsrc_logo, 0,c++,1,1 );
    logoPanel.setWidget ( __ukri_logo, 0,c++,1,1 );
  } else {
    logoPanel.setImage ( image_path('logo-ccpem'),'','28px',0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '40px' );
    logoPanel.setImage ( image_path('logo-ccp4_online'),'','28px',0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '40px' );
    logoPanel.setImage ( image_path('logo-stfc'),'','28px'  ,0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '30px' );
    logoPanel.setImage ( image_path('logo-mrc'),'','28px'  ,0,c++,1,1 );
  }
  */
  logoPanel.setLabel ( appName() + ' v.' + appVersion() + '&nbsp;&nbsp;&nbsp;&nbsp;',0,c,1,1 )
                     .setFontSize ( '75%' ).setNoWrap()
                     .setVerticalAlignment('middle');
  logoPanel.setVerticalAlignment   ( 0,0,'middle'  );
  logoPanel.setCellSize            ( '50%','', 0,c );
  logoPanel.setHorizontalAlignment ( 0,c,'right'   );
  logoPanel.setVerticalAlignment   ( 0,c,'middle'  );
  this.grid.setVerticalAlignment   ( row,col,'middle'   );
  this.grid.setCellSize            ( '','30px', row,col );
  $(logoPanel.element).css ({
    'position'         : 'absolute',
    'left'             : '0px',
    'bottom'           : '0px',
    'border'           : '1px solid lightgray',
    'background-color' : 'rgba(240,250,255,0.67)'
  });
}


BasePage.prototype.getUserRation = function()  {

  if (__login_user)  {
    (function(page){
      serverRequest ( fe_reqtype.getUserRation,{},'User Ration',
        function(data){
          page.ration = data;
          page.makeUserRationIndicator();
        },null,function(){
          page.ration = null;
          page.makeUserRationIndicator();
        });
    }(this))
  } else {
    this.makeUserRationIndicator();
  }

}


BasePage.prototype._setModeIcon = function ( colNo )  {
  var icon_path;
  var tooltip  = '<i>' + appName();
  var ul_style = '<ul style="font-size:80%;margin:2px;padding-left:24px;">';
  if (__local_setup)  {
    icon_path = image_path ( 'setup_local'  );
    tooltip  += ' is in <b>local</b> mode:</i>' + ul_style +
                '<li>projects and data are stored on local drive</li>';
    if (__local_service)
          tooltip += '<li>all tasks run on your computer</li>';
    else  tooltip += '<li>non-interactive tasks run on your computer</li>'   +
                     '<li><b>interactive tasks are not available</b>' +
                     '<br><i>(' + appName() + ' Client not used)</i></li>';
  } else  {
    icon_path = image_path ( 'setup_remote' );
    tooltip  += ' is in <b>remote</b> mode:</i>' + ul_style +
                '<li>projects and data are stored on server</li>' +
                '<li>non-interactive tasks run on server</li>';
    if (__local_service)
          tooltip += '<li>interactive tasks run on your computer</li>';
    else  tooltip += '<li><b>interactive tasks are not available</b>' +
                     '<br><i>(' + appName() + ' Client not used)</i></li>';
  }
  this.headerPanel.setImageButton ( icon_path,'22px','22px',0,colNo,1,1 )
                  .setTooltip1    ( tooltip + '</ul>','show',false,0 )
                  .setFontSize    ( '90%' )
                  .setVerticalAlignment ( 'middle' );

  var setup_name = 'Unnamed CCP4 Cloud Setup';
  var setup_icon = 'images_png/setup_unknown.png';
  if (__setup_desc)  {
    setup_name = 'CCP4 Cloud Setup "' + __setup_desc.name + '" at<br><i>' +
                 __fe_url + '</i>';
    setup_icon = __setup_desc.icon;
  } else if (__local_setup)  {
    setup_name = 'Local CCP4 Cloud Setup at<br><i>' + __fe_url + '</i>';
    setup_icon = image_path ( 'setup_home' );
  }
  this.headerPanel.setImageButton ( setup_icon,'22px','22px',0,colNo+1,1,1 )
                  .setTooltip1    ( setup_name,'show',false,0 )
                  .setFontSize    ( '90%' )
                  .setVerticalAlignment ( 'middle' );
  /*
  this.headerPanel.setLabel ( setup_name, 0,colNo+1,1,1 )
                  .setFont  ( '','80%',false,true )
                  .setFontLineHeight ( '85%' );
  */
  this.headerPanel.setVerticalAlignment ( 0,colNo  ,'top' );
  this.headerPanel.setVerticalAlignment ( 0,colNo+1,'top' );
  this.headerPanel.setLabel ( '&nbsp;', 0,colNo+2,1,1 )
}


BasePage.prototype.makeHeader = function ( colSpan,on_logout_function )  {

  this.headerPanel = new Grid('');
  this.grid.setWidget   ( this.headerPanel,0,0,1,colSpan );
  this.grid.setCellSize ( '','32px',0,0 );

  this.headerPanel.menu = new Menu('',image_path('menu'));
  this.headerPanel.setWidget ( this.headerPanel.menu,0,0,1,1 );

  this.headerPanel.setLabel    ( '',0,1,1,1 ).setWidth ( '40px' );
  this.headerPanel.setCellSize ( '40px','',0,1 );

  if (__login_user)  {
    this.headerPanel.setCellSize ( '99%','',0,14 );
    this._setModeIcon ( 15 );
    this.rationPanel = new Grid('');
    this.headerPanel.setWidget ( this.rationPanel,0,18,1,1 );
    this.toolPanel = new Grid('');
    this.headerPanel.setWidget ( this.toolPanel,0,19,1,1 );
    this.headerPanel.setLabel  ( '&nbsp;',0,20,1,1 ).setWidth('40px');
    //var user_lbl = new Label ( '<i>' + __login_user.getValue() + '</i>' );
    var user_lbl = new Label ( '<i>' + __login_user + '</i>' );
    this.headerPanel.setWidget      ( user_lbl,0,21,1,1 );
    user_lbl.setHorizontalAlignment ( 'right' );
    user_lbl.setNoWrap();
//    this.headerPanel.setNoWrap   ( 0,20 );
  } else {
    this.rationPanel = null;
    this.headerPanel.setCellSize ( '99%','',0,17 );
    this._setModeIcon ( 18 );
  }

  this.logout_btn = new ImageButton ( image_path('logout'),'24px','24px' );
  this.headerPanel.setWidget ( this.logout_btn,0,22,1,1 );
  this.headerPanel.setHorizontalAlignment ( 0,22,'right' );
  this.headerPanel.setVerticalAlignment   ( 0,22,'top'   );
  this.headerPanel.setCellSize ( '32px','32px',0,22 );
  this.logout_btn .setTooltip  ( 'Logout' );

  this.headerPanel.setLabel( '&nbsp;',0,23,1,1 ).setWidth('10px');

  (function(page){
    page.logout_btn.addOnClickListener ( function(){
      if (on_logout_function)
        on_logout_function ( function(){ logout(page.element.id,0); } );
      else
        logout ( page.element.id,0 );
    });
  }(this));

}


BasePage.prototype.addMenuItem = function ( name,icon_name,listener_func )  {
  this.headerPanel.menu.addItem ( name,image_path(icon_name) )
                       .addOnClickListener ( listener_func );
  return this;
}

BasePage.prototype.addMenuSeparator = function()  {
  this.headerPanel.menu.addSeparator();
  return this;
}


BasePage.prototype.addFullscreenToMenu = function()  {
  if (this.headerPanel.menu.n_items>0)
    this.headerPanel.menu.addSeparator();
  this.headerPanel.menu.addItem('Toggle fullscreen',image_path('fullscreen'))
                       .addOnClickListener ( toggleFullScreen );
  return this;
}


BasePage.prototype.addLogoutToMenu = function ( logout_func )  {
  this.addFullscreenToMenu();
  this.headerPanel.menu.addItem('Log out',image_path('logout'))
                       .addOnClickListener ( logout_func );
  return this;
}


BasePage.prototype.makeUserRationIndicator = function()  {
  if (this.rationPanel)  {
    if (this.ration)  {
      if (this.ration.storage>0.0)  {
        this.rationPanel.disk_icon  = this.rationPanel.setImageButton (
                                      image_path('disk'),'20px','20px',0,0,1,1 );
        this.rationPanel.disk_usage = this.rationPanel.setLabel ( '',0,1,1,1 )
                                                      .setFontSize('90%');
        this.rationPanel.sep_label  = this.rationPanel.setLabel (
                                      '&nbsp;',0,2,1,1 ).setWidth('4px');
        this.rationPanel.cpu_icon   = this.rationPanel.setImageButton (
                                      image_path('cpu'),'20px','20px',0,3,1,1 );
        this.rationPanel.cpu_usage  = this.rationPanel.setLabel ( '',0,4,1,1 )
                                          .setNoWrap().setFontSize('90%');
        this.displayUserRation ( null );
      } else
        this.rationPanel.hideRow(0);
    } else {
      this.rationPanel.hideRow(0);
    }
  }
}


BasePage.prototype.displayUserRation = function ( pdesc )  {

  function getPercentLine ( used,ration )  {
    if (ration<=0.0)
      return '';
    var pp = round ( (100.0*used)/ration,0 );
    if (pp<90)       pp += '%';
    else if (pp<99)  pp  = '<font class="ration-warning">'  + pp + '%</font>';
               else  pp  = '<font class="ration-critical">' + pp + '%</font>';
    return pp;
  }

  if (this.rationPanel && this.ration)  {

    this.ration.pdesc = pdesc;

    if (this.ration.storage>0.0)  {

      var storage_pp   = getPercentLine ( this.ration.storage_used,this.ration.storage );
      var cpu_day_pp   = getPercentLine ( this.ration.cpu_day_used,this.ration.cpu_day );
      var cpu_month_pp = getPercentLine ( this.ration.cpu_month_used,this.ration.cpu_month );
      var stats = '<table class="table-rations">' +
        '<tr><th>Resource</th><th>Used&nbsp;</th><th>Quota&nbsp;</th><th>%%</th></tr>' +
        '<tr><td colspan="4"><hr/></td></tr>' +
        '<tr><td>Storage&nbsp;(MBytes)&nbsp;</td><td>&nbsp;' + round(this.ration.storage_used,1) +
                '&nbsp;</td><td>&nbsp;' + round(this.ration.storage,1) +
                '&nbsp;</td><td>&nbsp;' + storage_pp + '</td></tr>' +
        '<tr><td>CPU 24h (hours)</td><td>&nbsp;' + round(this.ration.cpu_day_used,4) +
                '&nbsp;</td><td>&nbsp;' + round(this.ration.cpu_day,2) +
                '&nbsp;</td><td>&nbsp;' + cpu_day_pp + '</td></tr>' +
        '<tr><td>CPU 30d (hours)</td><td>&nbsp;' + round(this.ration.cpu_month_used,4) +
                '&nbsp;</td><td>&nbsp;' + round(this.ration.cpu_month,2) +
                '&nbsp;</td><td>&nbsp;' + cpu_month_pp + '</td></tr>';

      if ((this.ration.cloudrun_day>0) && (this.ration.cloudrun_day_used>0))  {
        var cloudrun_day_pp = getPercentLine ( this.ration.cloudrun_day_used,
                                               this.ration.cloudrun_day );
        stats +=
          '<tr><td>CloudRun 24h (jobs)</td><td>&nbsp;' + this.ration.cloudrun_day_used +
                  '&nbsp;</td><td>&nbsp;' + this.ration.cloudrun_day +
                  '&nbsp;</td><td>&nbsp;' + cloudrun_day_pp + '</td></tr>';
      }

      stats += '<tr><td colspan="4"><hr/></td></tr>';

      if (pdesc)  {
        if ('disk_space' in pdesc)
          stats +=
            '<tr><td colspan="4"><b><i>Project stats:</i></b></td></tr>' +
            '<tr><td colspan="2"><i>Storage used (MBytes)</i></td><td><i>&nbsp;' +
                  round(pdesc.disk_space,1) + '&nbsp;</i></td><td></td></tr>' +
            '<tr><td colspan="2"><i>Total jobs run</i></td><td><i>&nbsp;' +
                  pdesc.njobs + '&nbsp;</i></td><td></td></tr>' +
            '<tr><td colspan="2"><i>CPU total used (hours)</i></td><td><i>&nbsp;' +
                  round(pdesc.cpu_time,4) + '&nbsp;</i></td><td></td></tr>' +
                  '<tr><td colspan="4"><hr/></td></tr>';
      }

      stats +=
        '<tr><td colspan="4"><b><i>User stats:</i></b></td></tr>' +
        '<tr><td colspan="2"><i>Total storage used (MBytes)</i></td><td><i>&nbsp;' +
                round(this.ration.storage_used,1) + '&nbsp;</i></td><td></td></tr>' +
        '<tr><td colspan="2"><i>Total jobs run</i></td><td><i>&nbsp;' +
                this.ration.jobs_total + '&nbsp;</i></td><td></td></tr>' +
        '<tr><td colspan="2"><i>CPU lifetime used (hours)</i></td><td><i>&nbsp;' +
                round(this.ration.cpu_total_used,4) +
                '&nbsp;</i></td><td></td></tr>' +
        '</table>';
      this.rationPanel.setTooltip1 ( stats,'show',false,20000 );  // 20 secs
      this.rationPanel.disk_usage.setText ( storage_pp );
      this.rationPanel.cpu_usage .setText ( cpu_day_pp + ':' + cpu_month_pp );

    }

  }

}


BasePage.prototype.updateUserRationDisplay = function ( rdata )  {
  if ('ration' in rdata)
    this.ration = rdata.ration;
  if ('pdesc' in rdata)
    this.displayUserRation ( rdata.pdesc );
  else if (('_type' in rdata) && (rdata._type=='ProjectDesc'))
    this.displayUserRation ( rdata );
  else if ('ration' in rdata)
    this.displayUserRation ( null );
  else
    this.getUserRation();
}


BasePage.prototype.destructor = function ( function_ready )  {
  function_ready();
}


var __history_count = 0;

function setHistoryState ( stateName )  {
  if (__history_count==0)
    replaceHistoryState ( stateName );
  else if (window.history && window.history.pushState)  {
    window.history.pushState ( stateName, null, '' );
    __history_count++;
  }
}

function replaceHistoryState ( stateName )  {
  if (window.history && window.history.replaceState)  {
    window.history.replaceState ( stateName, null, '' );
    __history_count++;
  }
}


function makePage ( new_page )  {

  function launch()  {
    window.setTimeout ( function(){
      __current_page = new_page;
    },10 );
  }

  if (__current_page)  {
    __current_page.destructor ( launch );
  } else  {
    launch();
  }

}

function setHistoryListener ( sceneId )  {
  $(window).on('popstate', function(event) {
    //alert ( JSON.stringify(event.originalEvent.state) );
    if (event.originalEvent.state)  {
      makePage ( eval ( 'new ' + event.originalEvent.state + ' ( "' + sceneId + '" );' ) );
    } else if (__current_page)  {
      if ((__current_page._type!='LoginPage') && (__current_page._type!='LogoutPage'))
        new MessageBoxF ( 'Exit ' + appName(),
                          '<h3>Are you leaving your ' + appName() + ' session?</h3>' +
                          'Pressing <i><b>Back</b></i> button again will take you to ' +
                          'previous page<br>in your browser history and end your ' +
                          'current ' + appName() + '<br>session, but leave you ' +
                          'logged in.<p>' +
                          '<i>It is strongly recommended that you end your ' + appName() +
                          '<br>session via regular logout.</i>',
                          'Continue ' + appName() + ' session',
                          function(){
                            window.history.forward();
                          },true );
      else
        window.history.back();
    } else
      window.history.back();
  });
}
