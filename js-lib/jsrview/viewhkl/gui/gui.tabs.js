//
//  =================================================================
//
//    19.08.17   <--  Date of Last Modification.
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
//  (C) E. Krissinel 2017
//
//  =================================================================
//

/*
  $ ( '<div id="' + this.tabsId + '" style="width:100%;">' +
      '<ul>' +
        '<li><a href="#' + this.tab1Id + '">General</a></li>' +
        '<li><a href="#' + this.tab2Id + '">Summary</a></li>' +
        '<li><a href="#' + this.tab3Id + '">HKL List</a></li>'  +
        '<li><a href="#' + this.tab4Id + '">HKL Zones</a></li>' +
      '</ul>' +
      '<div id="' + this.tab1Id + '">' +
      '</div>' +
      '<div id="' + this.tab2Id + '">' +
      '</div>' +
      '<div id="' + this.tab3Id + '">' +
      '</div>' +
      '<div id="' + this.tab4Id + '">' +
      '</div>' +
      '</div>' ).appendTo ( '#' + this.sceneId );

    $( '#' + this.tabsId ).tabs();
*/

function Tabs()  {

  Widget.call ( this,'div' );
//  $(this.element).css({'padding-bottom':'12pt'});

  this.tabbar = new Widget ( 'ul' );
  this.addWidget ( this.tabbar );
  $(this.element).tabs ( {heightStyle:'fill'} );
//  $(this.element).tabs ( {heightStyle:'auto'} );

}


Tabs.prototype = Object.create ( Widget.prototype );
Tabs.prototype.constructor = Tabs;


Tabs.prototype.addTab = function ( name,open_bool )  {

  var tab = new Widget ( 'div');
  var hnd = new Widget ( 'li' );
  var a   = new Widget ( 'a'  );

  a.setAttribute ( 'href','#' + tab.id );
  a.element.innerHTML = name;
  hnd .addWidget ( a );
  this.tabbar.addWidget ( hnd );
  this.addWidget ( tab );

  tab.grid = new Grid ( '' );
  tab.addWidget ( tab.grid );

  $(this.element).tabs ( 'refresh' );
  if (open_bool)
    $(this.element).tabs ( 'option', 'active', this.child.length-2 );

  return tab;

}


Tabs.prototype.numberOfTabs = function()  {
  return this.child.length - 1;
}


Tabs.prototype.refresh = function()  {
  $(this.element).tabs ( 'refresh' );
}

Tabs.prototype.getTabNo = function ( tab )  {
  return $("#"+this.id+" >div").index(tab.id);
}

Tabs.prototype.setActiveTab = function ( tab )  {
  $(this.element).tabs ( "option", "active",this.getTabNo(tab) );
}
