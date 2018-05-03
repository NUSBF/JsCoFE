
/*
 *  =================================================================
 *
 *    22.09.17   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2017
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
    $('#'+sceneId).css({"background-image"    : "url('images/ccp4_diamond_test.png')",
                        "background-repeat"   : "no-repeat",
                        "background-size"     : "cover",
                        "background-position" : "center center"} );
  else
    $('#'+sceneId).css({"background-image"    : "url('images/ccpem_background.png')",
                        "background-repeat"   : "no-repeat",
                        "background-size"     : "cover",
                        "background-position" : "center center"} );

  this.element = document.getElementById ( sceneId );
  this._type   = pageType;

  // make master grid
  this.grid = new Grid ( gridStyle );
  $(this.grid.element).appendTo(this.element);

}


BasePage.prototype.onResize = function ( width,height )  {}


BasePage.prototype.makeLogoPanel = function ( row,col,colSpan )  {
  var logoPanel = this.grid.setGrid ( '',row,col,1,colSpan );
  var c = 0;
  logoPanel.setCellSize ( '50%','', 0,c++ );
  if (getClientCode()==client_code.ccp4)  {
    logoPanel.setImage ( './images/logo-ccp4_online.svg','','28px',0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '40px' );
    logoPanel.setImage ( './images/logo-stfc.svg','','28px'  ,0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '30px' );
    logoPanel.setImage ( './images/logo-bbsrc.svg','','28px' ,0,c++,1,1 );
  } else {
    logoPanel.setImage ( './images/logo-ccpem.png','','28px',0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '40px' );
    logoPanel.setImage ( './images/logo-ccp4_online.svg','','28px',0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '40px' );
    logoPanel.setImage ( './images/logo-stfc.svg','','28px'  ,0,c++,1,1 );
    logoPanel.setLabel ( '',0,c++,1,1 ).setWidth ( '30px' );
    logoPanel.setImage ( './images/logo-mrc.png','','28px'  ,0,c++,1,1 );
  }
  logoPanel.setLabel ( 'jsCoFE v.' + jsCoFE_version,0,c,1,1 )
                     .setFontSize ( '75%' ).setNoWrap()
                     .setVerticalAlignment('bottom');
  logoPanel.setCellSize            ( '50%','', 0,c );
  logoPanel.setHorizontalAlignment ( 0,c,'right'   );
  logoPanel.setVerticalAlignment   ( 0,c,'bottom'  );
  this.grid.setVerticalAlignment   ( row,col,'bottom'   );
  this.grid.setCellSize            ( '','30px', row,col );
}


BasePage.prototype.makeHeader = function ( colSpan,on_logout_function )  {

  this.headerPanel = new Grid('');
  this.grid.setWidget   ( this.headerPanel,0,0,1,colSpan );
  this.grid.setCellSize ( '','32px',0,0 );

  this.headerPanel.menu = new Menu('','./images/menu.svg');
  this.headerPanel.setWidget ( this.headerPanel.menu,0,0,1,1 );

  this.headerPanel.setLabel    ( '',0,1,1,1 ).setWidth ( '40px' );
  this.headerPanel.setCellSize ( '40px','',0,1 );
  this.headerPanel.setCellSize ( '100%','',0,19 );

  if (__login_user)  {
    //var user_lbl = new Label ( '<i>' + __login_user.getValue() + '</i>' );
    var user_lbl = new Label ( '<i>' + __login_user + '</i>' );
    this.headerPanel.setWidget      ( user_lbl,0,20,1,1 );
    user_lbl.setHorizontalAlignment ( 'right' );
    user_lbl.setNoWrap();
//    this.headerPanel.setNoWrap   ( 0,20 );
  }

  this.logout_btn = new ImageButton ( './images/logout.svg','24px','24px' );
  this.headerPanel.setWidget ( this.logout_btn,0,21,1,1 );
  this.headerPanel.setHorizontalAlignment ( 0,21,'right' );
  this.headerPanel.setVerticalAlignment   ( 0,21,'top'   );
  this.headerPanel.setCellSize ( '32px','32px',0,21 );
  this.logout_btn.element.title = 'Logout';

  (function(page){
    page.logout_btn.addOnClickListener ( function(){
      if (on_logout_function)
        on_logout_function ( function(){ logout(page.element.id); } );
      else
        logout ( page.element.id );
    });
  }(this));

}

BasePage.prototype.destructor = function ( function_ready )  {
  function_ready();
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
