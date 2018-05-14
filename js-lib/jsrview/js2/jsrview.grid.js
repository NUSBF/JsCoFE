//
//  ===========================================================================
//
//    24.04.18   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  ---------------------------------------------------------------------------
//
//  **** Module  :  jsrview.grid.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  Report grid support
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2018
//
//  ===========================================================================
//

//  ===========================================================================
//  REPORT GRIDS
//  ===========================================================================

function RVAPIReportGrid ( sceneId )  {
  RVAPIReportBase.call ( this,sceneId );
}

RVAPIReportGrid.prototype = Object.create ( RVAPIReportBase.prototype );
RVAPIReportGrid.prototype.constructor = RVAPIReportGrid;


RVAPIReportGrid.prototype.addGrid = function ( holderId )  {
// Adds grid layout to node identified by id 'holderId'. The layout
// is assigned id 'holderId-grid'. In further references to the grid,
// suffix '-grid' is appended automatically, i.e., 'holderId' is used
// as normal.

  if (!document.getElementById(holderId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    $( "<table id='" + holderId + "-grid' " +
       "class='grid-layout' style='border:0px'>" +
       "<tr><td></td></tr></table>" )
     .appendTo ( $( "#"+holderId ) );
}

RVAPIReportGrid.prototype.addGridCompact = function ( holderId )  {
// Adds grid layout to node identified by id 'holderId'. The layout
// is assigned id 'holderId-grid'. In further references to the grid,
// suffix '-grid' is appended automatically, i.e., 'holderId' is used
// as normal.

  if (!document.getElementById(holderId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    $( "<table id='" + holderId + "-grid' " +
       "class='grid-layout-compact' style='border:0px'>" +
       "<tr><td></td></tr></table>" )
     .appendTo ( $( "#"+holderId ) );
}

RVAPIReportGrid.prototype.getGridCell = function ( holderId,row,col )  {
var grid = document.getElementById ( holderId+"-grid" );

  if (grid)  {

    while (grid.rows.length<=row)
      grid.insertRow ( -1 ); // this adds a row

    var gridRow = grid.rows[row];
    while (gridRow.cells.length<=col)
      gridRow.insertCell ( -1 ); // this adds a cell

    return gridRow.cells[col];

  } else
    return null;

}

RVAPIReportGrid.prototype.setGridItem = function ( holderId,item,
                                                   row,col,rowSpan,colSpan )  {
// Adds 'item' to the specified cell of table with id='holderId'+'-grid'
var cell = this.getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    $(cell).empty();
    if (item)
      cell.appendChild ( item );
  }
  return cell;
}

RVAPIReportGrid.prototype.addGridItem = function ( holderId,item,
                                                   row,col,rowSpan,colSpan )  {
var cell = this.getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    cell.appendChild ( item );
  }
  return cell;
}

RVAPIReportGrid.prototype.nestGrid = function ( gridId,holderId,
                                                row,col,rowSpan,colSpan )  {
// Nests new grid with id 'gridId' into the specified cell of existing
// grid identified by id 'holderId'. The layout is assigned id
// 'gridId-grid'. In further references to the grid, suffix '-grid' is
// appended automatically, i.e., 'gridId' should be used as normal.

  if (!document.getElementById(gridId+"-grid"))  {
    var cell = this.getGridCell ( holderId,row,col );
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

RVAPIReportGrid.prototype.nestGridCompact ( gridId,holderId,
                                            row,col,rowSpan,colSpan )  {
// Nests new grid with id 'gridId' into the specified cell of existing
// grid identified by id 'holderId'. The layout is assigned id
// 'gridId-grid'. In further references to the grid, suffix '-grid' is
// appended automatically, i.e., 'gridId' should be used as normal.

  if (!document.getElementById(gridId+"-grid"))  {
    var cell = this.getGridCell ( holderId,row,col );
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

RVAPIReportGrid.prototype.setHtmlGrid = function ( holderId,htmlString,
                                                   row,col,rowSpan,colSpan )  {
var cell = this.getGridCell ( holderId,row,col );
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

RVAPIReportGrid.prototype.addHtmlGrid = function ( holderId,htmlString,
                                                   row,col,rowSpan,colSpan )  {
var cell = this.getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    if ((htmlString.lastIndexOf('<iframe',0)==0) ||
        (htmlString.lastIndexOf('<object',0)==0))
          $(htmlString).appendTo(cell);
    else  $("<span>" + htmlString + "</span>").appendTo(cell);
  }
  return cell;
}

RVAPIReportGrid.prototype.loadGridItem = function ( uri,holderId,
                                                    row,col,rowSpan,colSpan )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  (function(report){
    report.processFile ( uri,"post",true,
      function(data)  {
        var div = report.element ( "div","","",data );
        report.setGridItem ( holderId,div,row,col,rowSpan,colSpan );
      },
      function() {},
      function() {}
    );
  }(this))

}

RVAPIReportGrid.prototype.loadGridContent = function ( uri,watch,taskUri,holderId,
                                                       row,col,rowSpan,colSpan ) {

  if (!document.getElementById(holderId+"-grid"))
    return;

  var cntId = holderId + "-" + row + "-" + col;
  var elem  = document.getElementById ( cntId );

  if (!elem)  {
    elem = this.element ( "div","id",cntId,"" );
    this.addGridItem ( holderId,elem,row,col,rowSpan,colSpan );
  }

  this.loadContent ( cntId,uri,watch,taskUri );

}


RVAPIReportGrid.prototype.addPanel = function ( panelId,holderId,
                                                row,col,rowSpan,colSpan )  {
// Puts a panel, which is html <div> element, into the specified grid
// position

  if (!document.getElementById(holderId+"-grid"))
    return;

  var div = this.element ( "div","id",panelId,"" );
  this.addGridItem ( holderId,div,row,col,rowSpan,colSpan );
  this.addGrid     ( panelId );

}


RVAPIReportGrid.prototype.addFieldset = function ( fsetId,title,holderId,
                                                   row,col,rowSpan,colSpan )  {
// Puts a framed panel with title, into the specified grid position

  if (!document.getElementById(holderId+"-grid"))
    return;

  var fieldset = this.element ( "fieldset","id",fsetId,"" );
  var legend   = this.element ( "legend","id",fsetId+"_legend","" );
  legend.innerHTML = title;
  fieldset.appendChild  ( legend );
  fieldset.setAttribute ( "class","fieldset1" );

  this.addGridItem ( holderId,fieldset,row,col,rowSpan,colSpan );
  this.addGrid     ( fsetId );

}


RVAPIReportGrid.prototype.setCellStretch = function ( gridId, width,height, row,col )  {
// SET_CELL_STRETCH gridId width height row col
var cell = this.getGridCell ( gridId,row,col );
  if (cell)  {
    if (width!='0%')  cell.style.width  = width;
    if (height!='0%') cell.style.height = height;
  }
}


RVAPIReportGrid.prototype.addTextBoxGrid = function ( tbxId,text,holderId,
                                                      row,col,rowSpan,colSpan )  {
var cell = this.getGridCell ( holderId,row,col );
  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    $("<div id='"+tbxId+"' class='text-box'>"+text+"</div>")
         .appendTo(cell);
    return cell;
  }
  return null;
}
