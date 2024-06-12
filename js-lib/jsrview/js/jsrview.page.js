//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.page.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's main page module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function makeHeader()  {
let table,div,cell;

  table = element ( "table","id",pageTopId+"-grid","" );
  table.setAttribute ( "class","grid-layout" );
  _document_body.appendChild ( table );
  cell = getGridCell ( pageTopId,0,0 );
  cell.rowSpan = 2;
  cell.colSpan = 1;
  cell.setAttribute ( "style","vertical-align:middle;padding-right:32px;" );
  $("<div class='icon_ccp4_logo'></div>").appendTo ( cell );

  div = element ( "div","id",pageHeaderId,"" );
  div.setAttribute   ( "class","page-header" );
  cell = getGridCell ( pageTopId,0,1 );
  cell.setAttribute  ( "style","text-align:left;width:100%;" );
  cell.appendChild   ( div );

}


function makeSlimHeader()  {
let table,div,cell;

  table = element ( "table","id",pageTopId+"-grid","" );
  table.setAttribute ( "class","grid-layout" );
  _document_body.appendChild ( table );
  cell = getGridCell ( pageTopId,0,0 );
  div  = element ( "div","id",pageHeaderId,"" );
  div.setAttribute   ( "class","page-header" );
  cell.setAttribute  ( "style","text-align:center;width:100%;" );
  cell.appendChild   ( div );

  addToolBarButton ( mainToolBarId,1,exitBtnId,"icon_exit",
                     "close_window()","Exit" );

}


function setPageHeader ( htmlString )  {
let header = document.getElementById ( pageHeaderId );
  if (header)  {
    while (header.firstChild)
      header.removeChild(header.firstChild);
    let hdrString = $.trim(htmlString);
    if (hdrString[0]!='<')
       hdrString = "<div>" + hdrString +
                   "</div>";
    header.innerHTML = hdrString;
    window.document.title = jQuery(hdrString).text();
    resizeTabBar();
  }
}

function initPage ( layHeaderKey,layToolbar,layTabs,sceneId )  {

//  if (window.rvGate)
//    alert ( " running in Qt Browser" );

  // initialisations in case of reload

  document.body.style.fontSize = '16px';

  if (sceneId)  {
    _document_body = document.getElementById ( sceneId );
    _document_body.style.fontSize = '16px';
  }
  if (!_document_body)
    _document_body = document.body;  // a fallback

  graphWidgetList = new Object();
  graphDataHash   = new Object();
  logGraphHash    = new Object();
  _taskData  = "{*}";
  _taskTimer = 0;

  let compStyle = window.getComputedStyle(_document_body,null);
  if (compStyle)  {
    let font_size = parseInt(compStyle.getPropertyValue('font-size'));
//  alert ( " font_size=" + font_size );
// ##### i2
    if (font_size<12)
      _document_body.style.fontSize = "1.0em";
  }

  setZoomHandler();

  if (window.rvGate)  {
    gwPlotWidth = window.rvGate.gwPlotWidth;
    gwTreeWidth = window.rvGate.gwTreeWidth;
    gwHeight    = window.rvGate.gwHeight;
  }

  if (layHeaderKey==1)       makeHeader    ();
  else if (layHeaderKey==2)  makeSlimHeader();
  if (layToolbar)  makeToolbar();
  if (layTabs)
    makeTabs();
  else  // default non-compact 'body' grid for laying everything else
    $( "<table id='" + noTabGridId + "-grid' class='grid-layout'>" +
       "<tr><td></td></tr></table>" ).appendTo ( $(_document_body) );

}
