//
//  =================================================================
//
//    29.06.19   <--  Date of Last Modification.
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
//  (C) E. Krissinel 2017-2019
//
//  =================================================================
//

function Tabs()  {

  Widget.call ( this,'div' );

  this.tabbar = new Widget ( 'ul' );
  this.addWidget ( this.tabbar );
  $(this.element).tabs ( {heightStyle:'fill'} );

}


Tabs.prototype = Object.create ( Widget.prototype );
Tabs.prototype.constructor = Tabs;


Tabs.prototype.addTab = function ( name,open_bool )  {

  var tab = new Widget ( 'div');
  var hnd = new Widget ( 'li' );
  var a   = new Widget ( 'a'  );

  a.setAttribute ( 'href','#' + tab.id );
  a.setText ( name );
//  a.element.innerHTML = name;
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
  return $("#"+this.id+" >div").index(tab.id)-1;
}

Tabs.prototype.getActiveTabNo = function()  {
  return $(this.element).tabs ( "option", "active" );
}

Tabs.prototype.setActiveTab = function ( tab )  {
  $(this.element).tabs ( "option", "active",this.getTabNo(tab) );
}

Tabs.prototype.setActiveTabByNo = function ( tabNo )  {
  $(this.element).tabs ( "option", "active",tabNo );
}
