//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.tabs.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's tabs module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';


function makeTabs()  {
let div = element ( "div","id",mainTabBarId,"" );

  div.appendChild ( element ( "ul","","","" ) );
  _document_body.appendChild ( div );

  let tabs = $("#"+mainTabBarId);

  tabs.tabs({
    heightStyle: "fill",
 //   beforeActivate: function(event,ui) {
 //     for (let i=0;i<graphWidgetIds.length;i++)  {
 //       drawLogGraph ( graphWidgetIds[i],null,null );
 //     }
 //   }
    activate: function (event,ui)  {
      drawHiddenGraphs ( ui.newPanel );
      if (ui.newPanel.length>0)
        makeToolBarModification ( ui.newPanel[0] );
    }
  });

  // close icon: removing the tab on click
  tabs.delegate( "span.ui-icon-circle-close", "click", function() {
    let panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
    $( "#" + panelId ).remove();
    tabs.tabs( "refresh" );
  });

  // close icon: removing the tab on Alt-Backspace
  tabs.bind( "keyup", function( event ) {
    if ( event.altKey && event.keyCode === $.ui.keyCode.BACKSPACE ) {
      let panelId = tabs.find( ".ui-tabs-active" ).remove().attr( "aria-controls" );
      $( "#" + panelId ).remove();
      tabs.tabs( "refresh" );
    }
  });

  $(document.body).css({'overflow':'hidden','font-size':'16px'});

  resizeTabBar();

}

function getSelectedTabId() {
  let tabIndex = $("#"+mainTabBarId).tabs('option','active');
  let selected = $("#"+mainTabBarId+" ul>li a").eq(tabIndex).attr('href');
  return selected.substring(1);
}

let __iOS_device = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream );

function resizeTabBar() {
// this resizes the tab bar when window is resized by user
let mainToolBar = $("#"+mainToolBarId);
let mainTabBar  = $("#"+mainTabBarId);
let header      = $("#"+pageHeaderId);
let h;

  if (__iOS_device)
    h = window.parent.innerHeight - 46;
  else
    h = window.innerHeight + 6 -
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

function numberOfTabs ( tabBarId )  {
  //return $("#"+tabBarId+" >ul >li").size();
  return $("#"+tabBarId+" >ul >li").length;
}

function getTabNo ( tabBarId,tabId )  {
let tab = document.getElementById(tabId);
  if (!tab)  return -1;
  return $("#"+tabBarId+" >div").index(tab);
}

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
    let showdocs = (tab['tabmod']['helpfile'].length>0);
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


function addTab ( tabBarId,tabId,tabName,isOpen,closable )  {
// Adds new tab to a tab bar, and sets grid layout for it.
// Parameters:
//   tabBarId  (string) id of tab bar
//   tabId     (string) id of new tab
//   tabName   (string) tab name
let tab = document.getElementById(tabId);

  if (tab)  {
    if (isOpen)
      $( "#"+tabBarId ).tabs ( "option", "active",
                                       getTabNo(tabBarId,tabId) );
  } else  {
    let tabBar = $( "#"+tabBarId );
    let closeAttr = "";
    if (closable)
      closeAttr = "<span class='ui-icon ui-icon-circle-close' role='presentation'>Remove Tab</span>";
//      closeAttr = "<span class='ui-icon ui-icon-circle-close ui-closable-tab'></span>";
    tabBar.find( ".ui-tabs-nav" ).append (
                        $( "<li><a href='#"+tabId+"'>" + tabName +
                           "</a>" + closeAttr+ "</li>" ) );
    tab = element ( "div","id",tabId,"" );
    makeToolBarModificationObject ( tab );
    $(tab).appendTo ( tabBar );
    tab.setAttribute ( "class","tab" );
    addGrid ( tabId );
    tabBar.tabs ( "refresh" );
    if (isOpen)
      tabBar.tabs ( "option", "active", numberOfTabs(tabBarId)-1 );
  }

  return tab;

}

function removeTab ( tabBarId,tabId )  {
let tabBar = $("#"+tabBarId);
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
let beforeTab = document.getElementById(beforeTabId);

  if (!beforeTab)
    return addTab ( tabBarId,tabId,tabName,isOpen,closable );

  let tab = document.getElementById(tabId);

  if (tab)  {
    if (isOpen)
      $( "#"+tabBarId ).tabs ( "option", "active",
                                         getTabNo(tabBarId,tabId) );
  } else  {
    let tabBar = $( "#"+tabBarId );
    let closeAttr = "";
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
let tab,hfile;

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
let tab,hfile;

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
let tabName,uri0,tabId;


  if (uri.charAt(0)=="[")  {
    let n   = uri.indexOf ( "]" );
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
        let pre = element ( "pre","class","display-text",data );
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
//      let pre = element ( "pre","class","display-text",data );
//      setGridItem ( tabId,pre,0,0,1,1 );
//    },"text").always(function()  {
//      $("body").css("cursor", "default");
//    });

  }

}
