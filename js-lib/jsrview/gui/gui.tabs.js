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

/*
function Tabs()  {

  Widget.call ( this,'div' );

  this.tabbar = new Widget ( 'ul' );

  var tabs = $(this.element);

  tabs.tabs({
    heightStyle: "fill",
 //   beforeActivate: function(event,ui) {
 //     for (var i=0;i<graphWidgetIds.length;i++)  {
 //       drawLogGraph ( graphWidgetIds[i],null,null );
 //     }
 //   }
    //activate: function (event,ui)  {
    //  drawHiddenGraphs ( ui.newPanel );
    //  if (ui.newPanel.length>0)
    //    makeToolBarModification ( ui.newPanel[0] );
    //}
  });

  // close icon: removing the tab on click
  tabs.delegate( "span.ui-icon-circle-close", "click", function() {
    var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
    $( "#" + panelId ).remove();
    tabs.tabs( "refresh" );
  });

  // close icon: removing the tab on Alt-Backspace
  tabs.bind( "keyup", function( event ) {
    if ( event.altKey && event.keyCode === $.ui.keyCode.BACKSPACE ) {
      var panelId = tabs.find( ".ui-tabs-active" ).remove().attr( "aria-controls" );
      $( "#" + panelId ).remove();
      tabs.tabs( "refresh" );
    }
  });

}


Tabs.prototype = Object.create ( Widget.prototype );
Tabs.prototype.constructor = Tabs;


Tabs.prototype.getSelectedTabId = function() {
  var tabIndex = $(this.element).tabs('option','active');
  var selected = $( '#' + this.id + ' ul>li a').eq(tabIndex).attr('href');
  return selected.substring(1);
}
*/

/*
function resizeTabBar() {
// this resizes the tab bar when window is resized by user
var mainToolBar = $("#"+mainToolBarId);
var mainTabBar  = $("#"+mainTabBarId);
var header      = $("#"+pageHeaderId);
var h = window.innerHeight - 2 -
        parseInt($(_document_body).css('margin-top'),10) -
        parseInt($(_document_body).css('margin-bottom'),10) -
        parseInt(mainTabBar.css('padding-top'),10) -
        parseInt(mainTabBar.css('padding-bottom'),10);
  if (mainToolBar.length>0)
    h = h - mainToolBar.outerHeight(true);
  if (header.length>0)
    h = h - header.outerHeight(true);
  mainTabBar.height ( h );
  mainTabBar.tabs("refresh");
}

// set up bar resizer
$(window).resize ( resizeTabBar )
*/

/*
Tabs.prototype.numberOfTabs = function()  {
  return $("#"+this.id+" >ul >li").size();
}


Tabs.prototype.getTabNo = function ( tabId )  {
var tab = document.getElementById(tabId);
  if (!tab)  return -1;
  return $("#"+this.id+" >div").index(tab);
}
*/

/*
function makeToolBarModificationObject ( tab )  {
  if (tab)  {
    tab['tabmod'] = new Object();
    tab['tabmod']['helpfile'] = programDocFile;
    tab['tabmod']['shownav']  = false;
    tab['tabmod']['showfind'] = false;
  }
}

function makeToolBarModification ( tab )  {
  if (tab)  {
    var showdocs = (tab['tabmod']['helpfile'].length>0);
    setToolBtnVisible ( sep2BtnId,showdocs );
    setToolBtnVisible ( helpPgmBtnId,showdocs );
    setToolBtnVisible ( goBackBtnId   ,tab['tabmod']['shownav']  );
    setToolBtnVisible ( goBackBtnId   ,tab['tabmod']['shownav']  );
    setToolBtnVisible ( goForwardBtnId,tab['tabmod']['shownav']  );
    setToolBtnVisible ( findBtnId     ,tab['tabmod']['showfind'] );
    setToolBtnVisible ( sep3BtnId     ,tab['tabmod']['shownav'] ||
                                       tab['tabmod']['showfind'] );
  }
}
*/

/*
Tabs.prototype.addTab = function ( tabId,tabName,isOpen,closable )  {
// Adds new tab to a tab bar, and sets grid layout for it.
// Parameters:
//   tabId     (string) id of new tab
//   tabName   (string) tab name
var tab = document.getElementById(tabId);

  if (tab)  {
    if (isOpen)
      $(this.element).tabs ( "option","active",this.getTabNo(tabId) );
  } else  {
    var tabBar = $(this.element);
    var closeAttr = "";
    if (closable)
      closeAttr = "<span class='ui-icon ui-icon-circle-close' role='presentation'>Remove Tab</span>";
    tabBar.find( ".ui-tabs-nav" ).append (
                        $( "<li><a href='#"+tabId+"'>" + tabName +
                           "</a>" + closeAttr+ "</li>" ) );
    tab = new Widget('div');
    tab.setId ( tabId );
//    tab = element ( "div","id",tabId,"" );
//    makeToolBarModificationObject ( tab );
//    $(tab).appendTo ( tabBar );
    this.addWidget ( tab );
    tab.setAttribute ( "class","tab" );
    tab.grid = new Grid ( '' );
    tab.addWidget ( tab.grid );
    //addGrid ( tabId );
    tabBar.tabs ( "refresh" );
    if (isOpen)
      tabBar.tabs ( "option", "active", this.numberOfTabs()-1 );
  }

  return tab;

}
*/

/*
function removeTab ( tabBarId,tabId )  {
var tabBar = $("#"+tabBarId);
   tabBar.find("[href='#"+tabId+"']").closest("li").remove();
   $( "#"+tabId ).remove();
   tabBar.tabs( "refresh" );
}


function insertTab ( tabBarId,beforeTabId,tabId,tabName,isOpen,closable )  {
// Inserts new tab to a tab bar before the specified tab, and sets grid
// layout for it.
// Parameters:
//   tabBarId    (string) id of tab bar
//   beforeTabId (string) id of tab to insert the new tabe before. If
//                        this tab is not found, the new tab is added
//                        to tab bar
//   tabId       (string) id of new tab
//   tabName     (string) tab name
var beforeTab = document.getElementById(beforeTabId);

  if (!beforeTab)
    return addTab ( tabBarId,tabId,tabName,isOpen,closable );

  var tab = document.getElementById(tabId);

  if (tab)  {
    if (isOpen)
      $( "#"+tabBarId ).tabs ( "option", "active",
                                         getTabNo(tabBarId,tabId) );
  } else  {
    var tabBar = $( "#"+tabBarId );
    var closeAttr = "";
    if (closable)
      closeAttr = "<span class='ui-icon ui-icon-circle-close' role='presentation'>Remove Tab</span>";
    $( "<li><a href='#"+tabId+"'>" + tabName +
           "</a>" + closeAttr+ "</li>" )
         .insertBefore ( $("[href='#"+beforeTabId+"']").parent() );
    tab = element ( "div","id",tabId,"" );
    makeToolBarModificationObject ( tab );
    $(tab).insertBefore ( $(beforeTab) );
    tab.setAttribute ( "class","tab" );
    addGrid ( tabId );
    tabBar.tabs ( "refresh" );
    if (isOpen)
      tabBar.tabs ( "option", "active",getTabNo(tabBarId,tabId ) );
  }

  return tab;

}

function setActiveTab ( tabBarId,tabId )  {
  $( "#"+tabBarId ).tabs ( "option", "active",
                                      getTabNo(tabBarId,tabId) );
}

function addHelpTab ( helpFile )  {
//  If helpFile is an empty string then file name is taken from current
//  tab modification fields, by this making for tab-specific help
//  support
var tab,hfile;

  if (helpFile.length<=0)  {
     tab = document.getElementById ( getSelectedTabId() );
     if (tab)  hfile = tab['tabmod']['helpfile'];
         else  hfile = "";
  } else
    hfile = helpFile;

  if (hfile.length>0)  {

    tab = addTab ( mainTabBarId,helpTabId,"Help",false,true );
    setToolBarModification ( tab,"*",true,true );
    setActiveTab ( mainTabBarId,helpTabId );

    loadFrame ( helpTabId,docURI + hfile );

  }

}


function openHelpWindow ( helpFile )  {
//  If helpFile is an empty string then file name is taken from current
//  tab modification fields, by this making for tab-specific help
//  support
var tab,hfile;

  if (helpFile.length<=0)  {
     tab = document.getElementById ( getSelectedTabId() );
     if (tab)  hfile = tab['tabmod']['helpfile'];
         else  hfile = "";
  } else
    hfile = helpFile;

  if (hfile.length>0)
    window.open(docURI+hfile,"",
      "location=no,menubar=no,status=no,titlebar=no,toolbar=no,scrollbars=yes");

}


function escapeRegExp ( str )  {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll ( str,find,rep )  {
  return str.replace(new RegExp(escapeRegExp(find),'g'),rep);
}

function displayData ( uri )  {
// uri may be given like [tabName]uri...
var tabName,uri0,tabId;


  if (uri.charAt(0)=="[")  {
    var n   = uri.indexOf ( "]" );
    tabName = uri.slice(1,n);
    uri0    = uri.slice(n+1);
  } else  {
    uri0    = uri;
    tabName = uri.split('\\').pop().split('/').pop();
  }

  tabId = replaceAll ( replaceAll(tabName," ","_"),  ".","_"  );

  if (document.getElementById(tabId))
    setActiveTab ( mainTabBarId,tabId );
  else  {

    $("body").css("cursor","progress");
    addTab ( mainTabBarId,tabId,tabName,true,true );

    processFile ( uri0,"post",true,
      function(data)  {
        var pre = element ( "pre","class","display-text",data );
        setGridItem ( tabId,pre,0,0,1,1 );
      },
      function() {
        $("body").css("cursor", "default");
      },
      function() {
        alert ( "Data transmission error in displayData()\nuri="+uri0 );
      }
    );

//    $.post(uri0,function(data)  {
//      var pre = element ( "pre","class","display-text",data );
//      setGridItem ( tabId,pre,0,0,1,1 );
//    },"text").always(function()  {
//      $("body").css("cursor", "default");
//    });

  }

}
*/
