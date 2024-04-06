//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.dropdown.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's dropdown widget module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function toggleDropDown ( ddnId )  {
let btn    = document.getElementById ( ddnId+"-btn" );
let ddbody = document.getElementById ( ddnId );
  if (ddbody.style.display!="block")  {
    btn.setAttribute ( "class","icon_item_collapsed" );
    ddbody.style.display = "block";
  } else  {
    btn.setAttribute ( "class","icon_item_expanded" );
    ddbody.style.display = "none";
  }
}


function addDropDown ( ddnId,ddnTitle,holderId,row,col,rowSpan,colSpan,
                       foldState )  {

  if (document.getElementById(ddnId))
    return;

  if (!document.getElementById(holderId+"-grid"))  {
//    alert ( "  no holder for dropdown id=" + ddnId + ", holderId=" + holderId + "!" );
    return;
  }

  let table = document.getElementById ( ddnId+"_dd-grid" );

  if (table)  {
    removeElement ( table );
    table = false;
  }

  if (!table)  {
    table = element ( "table","id",ddnId+"_dd-grid","" );
    if (foldState.indexOf("wide")>0)
         table.setAttribute ( "class","dropdown-layout" );
    else table.setAttribute ( "class","dropdown-layout-compact" );
    if (foldState.indexOf("none")>=0)  {
      if ((ddnTitle!=" ") && (ddnTitle!=""))  {
        $("<tr>" +
            "<td class='dropdown-header'>"+ddnTitle+"</td>" +
            "<td width='99%'><div id='"+ddnId+"-ext'></div></td>" +
          "</tr><tr>"+
            "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
          "</tr>"
         ).appendTo(table);
      } else  {
        $("<tr>" +
            "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
          "</tr>"
         ).appendTo(table);
      }
      addGridItem ( holderId,table,row,col,rowSpan,colSpan );
    } else  {
      $("<tr>" +
          "<td><button id='"+ddnId+"-btn' " +
                "class=\"icon_item_collapsed\" " +
                "onclick=\"toggleDropDown('"+ddnId+"')\">&nbsp;</button>"+
          "</td>" +
          "<td class='dropdown-header' onclick=\"toggleDropDown('"+ddnId+"')\">"+
                                   ddnTitle+"</td>" +
          "<td width='99%'><div id='"+ddnId+"-ext'></div></td>" +
        "</tr><tr>"+
          "<td height='0px'></td>" +
          "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
        "</tr>"
       ).appendTo(table);
      addGridItem ( holderId,table,row,col,rowSpan,colSpan );
      let btn    = document.getElementById ( ddnId+"-btn" );
      let ddbody = document.getElementById ( ddnId );
      if (foldState.indexOf("_folded")>=0)  {
        btn.setAttribute ( "class","icon_item_expanded" );
        ddbody.style.display = "none";
      } else  {
        btn.setAttribute ( "class","icon_item_collapsed" );
        ddbody.style.display = "block";
      }
    }
  }
}
