//
//  =================================================================
//
//    13.12.23   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  gui.tabs.js  <interface>
//       ~~~~~~~~~
//  **** Project :  Object-Oriented HTML5 GUI Toolkit
//       ~~~~~~~~~
//  **** Content :  Tabs module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2017-2023
//
//  =================================================================
//

'use strict'; // *client*

function Tabs()  {

  Widget.call ( this,'div' );

  this.tabbar = new Widget ( 'ul' );
  this.addWidget ( this.tabbar );
  this.tabs   = {};
  $(this.element).tabs ( {heightStyle:'fill'} );

}


Tabs.prototype = Object.create ( Widget.prototype );
Tabs.prototype.constructor = Tabs;


Tabs.prototype.addTab = function ( name,open_bool )  {

  let tab = new Widget ( 'div');
  let hnd = new Widget ( 'li' );
  let a   = new Widget ( 'a'  );

  a.setAttribute ( 'href','#' + tab.id );
  a.setText ( name );
  hnd.addWidget ( a );

  // $('<a href="#' + tab.id + '"><span>' + name + '</span></a>')
  //  .appendTo ( $(hnd.element) );

  this.tabbar.addWidget ( hnd );
  this.addWidget ( tab );

  tab.grid = new Grid ( '' );
  tab.addWidget ( tab.grid );

  $(this.element).tabs ( 'refresh' );
  if (open_bool)
    $(this.element).tabs ( 'option', 'active', this.child.length-2 );

  tab.name = name;
  this.tabs[name] = tab;

  return tab;

}


Tabs.prototype.setTabChangeListener = function ( onactivate_func )  {
  $(this.element).on( "tabsactivate", function(event,ui){
    onactivate_func ( ui );
  });
}


Tabs.prototype.numberOfTabs = function()  {
  return this.child.length - 1;
}

Tabs.prototype.refresh = function()  {
  $(this.element).tabs ( 'refresh' );
}

Tabs.prototype.getTabNo = function ( tab )  {
// tabs are counted started from 0
  return $(this.element).find(".ui-tabs-panel").index(tab.element);
  // return $("#"+this.id+" >div").index(tab.id)-1;
}

Tabs.prototype.getActiveTabNo = function()  {
  return $(this.element).tabs ( "option", "active" );
}

Tabs.prototype.getActiveTab = function()  {
  // child[0] keeps this.tabbar, therefore tabNo + 1
  return this.child [ this.getActiveTabNo()+1 ];
}


Tabs.prototype.setActiveTab = function ( tab )  {
  $(this.element).tabs ( "option","active",this.getTabNo(tab) );
}

Tabs.prototype.setActiveTabByNo = function ( tabNo )  {
  $(this.element).tabs ( "option", "active",tabNo );
}
