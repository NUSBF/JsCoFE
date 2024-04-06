//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.grid.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's grid module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function addGrid ( holderId )  {
// Adds grid layout to node identified by id 'holderId'. The layout
// is assigned id 'holderId-grid'. In further references to the grid,
// suffix '-grid' is appended automatically, i.e., 'holderId' is used
// as normal.

  if (!document.getElementById(holderId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    $( "<table id='" +holderId + "-grid' " +
       "class='grid-layout' style='border:0px'>" +
       "<tr><td></td></tr></table>" )
     .appendTo ( $( "#"+holderId ) );
}

function addGridCompact ( holderId )  {
// Adds grid layout to node identified by id 'holderId'. The layout
// is assigned id 'holderId-grid'. In further references to the grid,
// suffix '-grid' is appended automatically, i.e., 'holderId' is used
// as normal.

  if (!document.getElementById(holderId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    $( "<table id='" +holderId + "-grid' " +
       "class='grid-layout-compact' style='border:0px'>" +
       "<tr><td></td></tr></table>" )
     .appendTo ( $( "#"+holderId ) );
}

function getGridCell ( holderId,row,col )  {
let grid = document.getElementById ( holderId+"-grid" );

  if (grid)  {

    while (grid.rows.length<=row)
      grid.insertRow ( -1 ); // this adds a row

    let gridRow = grid.rows[row];
    while (gridRow.cells.length<=col)
      gridRow.insertCell ( -1 ); // this adds a cell

    return gridRow.cells[col];

  } else
    return null;

}

function setGridItem ( holderId,item,row,col,rowSpan,colSpan )  {
// Adds 'item' to the specified cell of table with id='holderId'+'-grid'
let cell = getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    $(cell).empty();
    if (item)
      cell.appendChild ( item );
  }
  return cell;
}

function addGridItem ( holderId,item,row,col,rowSpan,colSpan )  {
let cell = getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    cell.appendChild ( item );
  }
  return cell;
}

function nestGrid ( gridId,holderId,row,col,rowSpan,colSpan )  {
// Nests new grid with id 'gridId' into the specified cell of existing
// grid identified by id 'holderId'. The layout is assigned id
// 'gridId-grid'. In further references to the grid, suffix '-grid' is
// appended automatically, i.e., 'gridId' should be used as normal.

  if (!document.getElementById(gridId+"-grid"))  {
    let cell = getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      $( "<table id='" + gridId + "-grid' " +
         "class='grid-layout' style='border:0px'>" +
         "<tr><td></td></tr></table>" )
       .appendTo ( $(cell) );
    }
  }

}

function nestGridCompact ( gridId,holderId,row,col,rowSpan,colSpan )  {
// Nests new grid with id 'gridId' into the specified cell of existing
// grid identified by id 'holderId'. The layout is assigned id
// 'gridId-grid'. In further references to the grid, suffix '-grid' is
// appended automatically, i.e., 'gridId' should be used as normal.

  if (!document.getElementById(gridId+"-grid"))  {
    let cell = getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      $( "<table id='" + gridId + "-grid' " +
         "class='grid-layout-compact' style='border:0px'>" +
         "<tr><td></td></tr></table>" )
       .appendTo ( $(cell) );
    }
  }

}

function setHtmlGrid ( holderId,htmlString,row,col,rowSpan,colSpan )  {
let cell = getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    if ((htmlString.lastIndexOf('<iframe',0)==0) ||
        (htmlString.lastIndexOf('<object',0)==0))
          $(cell).html ( htmlString );
    else  $(cell).html ( $("<span>" + htmlString + "</span>") );
  }
  return cell;
}

function addHtmlGrid ( holderId,htmlString,row,col,rowSpan,colSpan )  {
let cell = getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    if ((htmlString.lastIndexOf('<iframe',0)==0) ||
        (htmlString.lastIndexOf('<object',0)==0))
          $(htmlString).appendTo(cell);
    else  $("<span>" + htmlString + "</span>").appendTo(cell);
//     $("<i></i>" + htmlString + "<i></i>").appendTo(cell);
  }
  return cell;
}

function loadGridItem ( uri,holderId,row,col,rowSpan,colSpan )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  processFile ( uri,"post",true,
    function(data)  {
      let div = element ( "div","","",data );
      setGridItem ( holderId,div,row,col,rowSpan,colSpan );
    },
    function() {},
    function() {
//      alert ( "Data transmission error in loadGridItem" );
    }
  );

//  $.post(uri,function(data)  {
//    let div = element ( "div","","",data );
//    setGridItem ( holderId,div,row,col,rowSpan,colSpan );
//  },"text");

}


function loadGridContent ( uri,watch,taskUri,holderId,
                           row,col,rowSpan,colSpan )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  let cntId = holderId+"-"+row+"-"+col;
  let elem  = document.getElementById ( cntId );

  if (!elem)  {
    elem = element ( "div","id",cntId,"" );
    addGridItem ( holderId,elem,row,col,rowSpan,colSpan );
  }

  loadContent ( cntId,uri,watch,taskUri );

}


function addPanel ( panelId,holderId,row,col,rowSpan,colSpan )  {
// Puts a panel, which is html <div> element, into the specified grid
// position

  if (!document.getElementById(holderId+"-grid"))
    return;

  let div = element ( "div","id",panelId,"" );
  addGridItem ( holderId,div,row,col,rowSpan,colSpan );
  addGrid     ( panelId );

}


function addFieldset ( fsetId,title,holderId,row,col,rowSpan,colSpan )  {
// Puts a framed panel with title, into the specified grid position

  if (!document.getElementById(holderId+"-grid"))
    return;

  let fieldset = element ( "fieldset","id",fsetId,"" );
  let legend   = element ( "legend","id",fsetId+"_legend","" );
  legend.innerHTML = title;
  fieldset.appendChild ( legend );
  fieldset.setAttribute ( "class","fieldset1" );

  addGridItem ( holderId,fieldset,row,col,rowSpan,colSpan );
  addGrid     ( fsetId );

}

function setCellStretch ( gridId, width,height, row,col )  {
// SET_CELL_STRETCH gridId width height row col
let cell = getGridCell ( gridId,row,col );
  if (cell)  {
    if (width!='0%')  cell.style.width  = width;
    if (height!='0%') cell.style.height = height;
  }
}


function addTextBoxGrid ( tbxId,text,holderId,row,col,rowSpan,colSpan )  {
let cell = getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    //  '{{meta' is reserved for optional metadata appended after text string
    $("<div id='"+tbxId+"' class='text-box'>"+text.split('{{meta')[0]+"</div>")
         .appendTo(cell);
    return cell;
  }
  return null;
}
