//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.toolbar.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's toolbar module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';


function addToolBarButton ( toolBarId,col,btnId,button_class,
                            button_onclick,button_text )  {

  if (document.getElementById(btnId))
    return;

  let button = element ( "div","class",button_class,"" );
  button.setAttribute ( "id"     ,btnId          );
  button.setAttribute ( "onclick",button_onclick );

  addGridItem ( toolBarId,button,0,col,1,1 );
  let cell = getGridCell ( toolBarId,1,col );
  $("<div id='"+btnId+"-text"+"' class='toolbar-legend'>" +
    button_text + "</div>").appendTo ( cell );
}

function addToolBarSpacer ( toolBarId,col )  {
let cell = addGridItem ( mainToolBarId,document.createTextNode(" "),
                           0,col,1,1 );
  cell.setAttribute ( "style","width: 100%" );
//  cell = addGridItem ( mainToolBarId,document.createTextNode(" "),
//                           1,getNColumns(mainToolBarId+"-grid"),1,1 );
//  cell.setAttribute ( "width","100%" );
  cell = addGridItem ( mainToolBarId,document.createTextNode(" "),
                           1,col,1,1 );
  cell.setAttribute ( "style","width: 100%" );
}

function setToolBtnVisible ( btnId,visible )  {
let btn     = document.getElementById ( btnId );
let btnText = document.getElementById ( btnId+"-text" );
  if (btn)  {
    if (visible)  {
      btn    .style.display = "block";
      btnText.style.display = "block";
    } else  {
      btn    .style.display = "none";
      btnText.style.display = "none";
    }
  }
}

function addToolBarProgress ( toolBarId,col,width )  {
let cell = getGridCell ( toolBarId,0,col );
  cell.rowSpan = 1;
  cell.style.verticalAlign = "middle";
  cell.style.fontSize = "1.25em";
  $("<div id='"+progressBarId+"-text"+"' class='toolbar-legend'>" +
    "Progress:</div>").appendTo ( cell );
  cell = addProgressBar ( progressBarId,width,100,toolBarId,0,col+1,1,1 );
  cell.style.verticalAlign = "middle";
  cell = getGridCell ( toolBarId,1,col );
  $("<div class='toolbar-legend'></div>").appendTo ( cell );
  cell = getGridCell ( toolBarId,1,col+1 );
  $("<div class='toolbar-legend'></div>").appendTo ( cell );
}

function showToolBarProgress ( visible )  {
let sep = document.getElementById ( sep4BtnId             );
let pbr = document.getElementById ( progressBarId         );
let txt = document.getElementById ( progressBarId+"-text" );
  if (pbr)  {
    if (visible)  {
      sep.style.display = "block";
      pbr.style.display = "block";
      txt.style.display = "block";
    } else  {
      sep.style.display = "none";
      pbr.style.display = "none";
      txt.style.display = "none";
    }
  }
}

function refreshPage()  {
  window.location.reload();
}

function makeToolbar()  {

  if (document.getElementById(mainToolBarId))
    return;

  let div = element ( "div","id",mainToolBarId,"" );
  let pos = 0;

  div.setAttribute ( "class","toolbar" );
  let cell = getGridCell ( pageTopId,1,0 );
  cell.setAttribute ( "style","text-align:left;width:100%;" );
  cell.appendChild ( div );

//  _document_body.appendChild ( div );
  addGrid ( mainToolBarId );

  addToolBarButton ( mainToolBarId,pos++,printBtnId,"icon_print",
                     "print_window()","Print" );
  addToolBarButton ( mainToolBarId,pos++,sep1BtnId,"icon_separator",
                     "findString('This')","" );
  addToolBarButton ( mainToolBarId,pos++,refreshBtnId,"icon_refresh",
                    "refreshPage()","Refresh" );
  let showdocs = (programDocFile.length>0);
  addToolBarButton ( mainToolBarId,pos++,sep2BtnId,"icon_separator",
                       "","" );
  setToolBtnVisible ( sep2BtnId,showdocs );

  if (_helpInTab)
        addToolBarButton ( mainToolBarId,pos++,helpPgmBtnId,
                           "icon_help_program","addHelpTab('')",
                           helpBtnName );
  else  addToolBarButton ( mainToolBarId,pos++,helpPgmBtnId,
                           "icon_help_program","openHelpWindow('')",
                           helpBtnName );
  setToolBtnVisible ( helpPgmBtnId,showdocs );
    /*
    if (ccp4DocFile.length>0)
      addToolBarButton ( mainToolBarId,pos++,helpCCP4BtnId,
                         "icon_help_ccp4",
                         "addHelpTab('" + ccp4DocFile + "')","CCP4" );
    */
  addToolBarButton  ( mainToolBarId,pos++,sep3BtnId,"icon_separator",
                      "","" );
  setToolBtnVisible ( sep3BtnId,false );
  addToolBarButton  ( mainToolBarId,pos++,goBackBtnId,"icon_go_back",
                      "window.history.back()","Back" );
  setToolBtnVisible ( goBackBtnId,false );
  addToolBarButton  ( mainToolBarId,pos++,goForwardBtnId,"icon_go_forward",
                      "window.history.forward()","Forward" );
  setToolBtnVisible ( goForwardBtnId,false );
  addToolBarButton  ( mainToolBarId,pos++,findBtnId,"icon_find",
                      "","Find" );
  setToolBtnVisible ( findBtnId,false );
  addToolBarButton  ( mainToolBarId,pos++,sep4BtnId,"icon_separator",
                      "","" );
  setToolBtnVisible ( sep4BtnId,false );

  addToolBarProgress ( mainToolBarId,pos++,200 );
  pos++;
  showToolBarProgress ( false );

  addToolBarSpacer ( mainToolBarId,pos++ );
  if (window.rvGate)
    addToolBarButton ( mainToolBarId,pos++,configureBtnId,
                       "icon_configure","pref_dialog()","Configure" );
  addToolBarButton ( mainToolBarId,pos++,exitBtnId,"icon_exit",
                     "close_window()","Exit" );

}

//$(window).change(function() {
//  alert('Handler for .change() called.');
//});

function setToolBarModification ( tab,helpfile,shownav,showfind )  {
  if (tab)  {
    if (helpfile=="*")  tab['tabmod']['helpfile'] = programDocFile;
                  else  tab['tabmod']['helpfile'] = helpfile;
    tab['tabmod']['shownav']  = shownav;
    tab['tabmod']['showfind'] = showfind;
  }
}
