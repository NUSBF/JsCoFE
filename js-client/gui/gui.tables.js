
/*
 *  ========================================================================
 *
 *    04.12.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.tables.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Table        - plain table
 *       ~~~~~~~~~  TableScroll  - table with scrollable body
 *                  TableSort    - table with sortable columns
 *                  TablePages   - table with sortable columns and pages
 *                  TableSearchDialog - search dialog for TablePages
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ========================================================================
 *
 *  Requires: 	jquery.js
 *  	          theme.blue.css  // from tablesorter
 *  	          jquery.tablesorter.js
 *
 *  URL:  https://mottie.github.io/tablesorter/docs/example-css-highlighting.html
 *
 */

'use strict'; // *client*

// -------------------------------------------------------------------------
// Table class:  plain table, built as a Grid widget with direct access to all
// cells with all Grid convenience functions

function Table()  {
  Grid.call ( this,'None' );
  this.element.setAttribute ( 'class','table-blue' );
  this.selectedRow = -1;  // no selection by default
}

Table.prototype = Object.create ( Grid.prototype );
Table.prototype.constructor = Table;

Table.prototype.setHeaderWidget = function ( widget, row,col, rowSpan,colSpan ) {
let cell = this.getCell ( row,col );
  $(cell).empty();
  cell.setAttribute ( 'class','table-blue-hh' );
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (widget)  {
    cell.appendChild ( widget.element );
    widget.parent = this;
  }
  return cell;
}


Table.prototype.setHeaderText = function ( text, row,col, rowSpan,colSpan )  {
let label = new Label ( text );
  label.setAttribute ( 'class','label-blue-vh' );
  this.setHeaderWidget ( label, row,col, rowSpan,colSpan );
  return label;
}


Table.prototype.setHeaderRow = function ( header_list,tooltip_list )  {
  let tableRow = this.getCell ( 0,-1 );
  for (let i=0;i<header_list.length;i++)  {
    let headerCell = document.createElement('th');
    headerCell.innerHTML = header_list[i];
    headerCell.setAttribute ( 'class','table-blue-hh' );
    __set_tooltip ( headerCell,tooltip_list[i] );
    // if (tooltip_list.length>0)
    //   headerCell.setAttribute ( 'title',tooltip_list[i] );
    tableRow.appendChild ( headerCell );
  }
}


Table.prototype.setRow = function ( header,tooltip,cell_list,row,alt_bool )  {

  let col_cnt = 0;
  if (header)  {
    let tableRow   = this.getCell ( row,-1 );
    let headerCell = document.createElement('th');
    headerCell.innerHTML = header;
    headerCell.setAttribute ( 'class','table-blue-vh' );
    __set_tooltip ( headerCell,tooltip );
    // if (tooltip)
    //   headerCell.setAttribute ( 'title',tooltip );
    tableRow.appendChild ( headerCell );
    col_cnt++;
  }

  for (let i=0;i<cell_list.length;i++)  {
    let cell = this.getCell ( row,col_cnt++ );
    $(cell).empty();
    cell.rowSpan = 1;
    cell.colSpan = 1;
    if (alt_bool)
          cell.setAttribute ( 'class','table-blue-alt' );
    else  cell.setAttribute ( 'class','table-blue-td'  );
    if (Array.isArray(cell_list[i]))  {
      cell.innerHTML = cell_list[i][0];
      __set_tooltip ( cell,cell_list[i][1] );
    } else
      cell.innerHTML = cell_list[i];
  }

}


Table.prototype.setText = function ( text,row,col,rowSpan,colSpan,alt_bool=false )  {
  let cell = this.getCell ( row,col );
  $(cell).empty();
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (alt_bool)
        cell.setAttribute ( 'class','table-blue-alt' );
  else  cell.setAttribute ( 'class','table-blue-td'  );
  cell.innerHTML = text;
}


Table.prototype.setTooltip = function ( tooltip,row,col )  {
  __set_tooltip ( this.getCell(row,col),tooltip );
}


Table.prototype.setWidget = function ( widget,row,col,alt_bool )  {
let cell = this.getCell ( row,col );
  cell.rowSpan = 1;
  cell.colSpan = 1;
  $(cell).empty();
  if (alt_bool)
        cell.setAttribute ( 'class','table-blue-alt' );
  else  cell.setAttribute ( 'class','table-blue-td'  );
  if (widget)  {
    cell.appendChild ( widget.element );
    widget.parent = this;
  }
  return cell;
}


Table.prototype.setLabel = function ( text,row,col,rowSpan,colSpan,alt_bool=false )  {
let label = new Label ( text );
let cell = this.getCell ( row,col );
  $(cell).empty();
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (alt_bool)
        cell.setAttribute ( 'class','table-blue-alt' );
  else  cell.setAttribute ( 'class','table-blue-td'  );
  cell.appendChild ( label.element );
  label.parent = this;
  return label;
}


Table.prototype.setCellCSS = function ( css,row,col )  {
  if (row<this.element.rows.length)  {
    let cells = this.element.rows[row].cells;
    if (col<cells.length)
       $(cells[col]).css ( css );
  }
}


Table.prototype.setColumnCSS = function ( css,col,start_row )  {
  for (let i=start_row;i<this.element.rows.length;i++)
    if (col<this.element.rows[i].cells.length)
       $(this.element.rows[i].cells[col]).css ( css );
}


Table.prototype.setAllColumnCSS = function ( css,start_row,start_col )  {
  for (let i=start_row;i<this.element.rows.length;i++)
    for (let j=start_col;j<this.element.rows[i].cells.length;j++)
       $(this.element.rows[i].cells[j]).css ( css );
}

Table.prototype.addSignalHandler = function ( signal,onReceive ) {
  this.element.addEventListener(signal, function (e) {
    onReceive(e.target);
  }, false);
}


Table.prototype.setMouseHoverHighlighting = function ( start_row,start_col ) {
  for (let i=start_row;i<this.element.rows.length;i++)
    if (i!=this.selectedRow)  {
      let cells = this.element.rows[i].cells;
      this.element.rows[i].addEventListener('mouseover', () => {
        for (let j=start_col;j<cells.length;j++)
          cells[j].classList.add('table-blue-highlight');
      });
      this.element.rows[i].addEventListener('mouseout', () => {
        for (let j=start_col;j<cells.length;j++)
          cells[j].classList.remove('table-blue-highlight');
      });
    }
}

Table.prototype.selectRow = function ( rowNo,start_col )  {
  if (this.selectedRow>=0)  {
    let cells = this.element.rows[this.selectedRow].cells;
    for (let j=start_col;j<cells.length;j++)
      cells[j].classList.remove('table-blue-select');
  }
  if ((rowNo>=0) && (rowNo<this.element.rows.length))  {
    this.selectedRow = rowNo;
    let cells = this.element.rows[this.selectedRow].cells;
    for (let j=start_col;j<cells.length;j++)  {
      cells[j].classList.remove('table-blue-highlight');
      cells[j].classList.add('table-blue-select');
    }
  }
}

Table.prototype.getSelectedRowData = function()  {
  let rowData = null;
  if ((this.selectedRow>=0) && (this.selectedRow<this.element.rows.length))  {
    let cells = this.element.rows[this.selectedRow].cells;
    rowData   = [];
    for (let j=0;j<cells.length;j++)
      rowData.push ( cells[j].innerHTML );
  }
  return rowData;
}

Table.prototype.getTableData = function()  {
  let tdata = [];
  for (let i=0;i<this.element.rows.length;i++)  {
    let cells = this.element.rows[i].cells;
    let rdata = [];
    for (let j=0;j<cells.length;j++)
      rdata.push ( cells[j].innerHTML );
    tdata.push ( rdata );
  }
  return tdata;
}

Table.prototype.getRowHeight = function ( rowNo )  {
  if (rowNo<this.element.rows.length)  {
    let rowHeight = $(this.element.rows[1]).outerHeight();
    if (rowHeight>6)
      return rowHeight;
  }
  return  29.1953;
}

// -------------------------------------------------------------------------
// TableCell class

function TableCell ( text )  {
  Widget.call ( this,'td' );
  this.setText ( text );
//  this.element.innerHTML = text;
  this.text = text;
  this.css0 = null;
}

TableCell.prototype = Object.create ( Widget.prototype );
TableCell.prototype.constructor = TableCell;

TableCell.prototype.setNoWrap = function()  {
  this.element.setAttribute ( 'style','white-space: nowrap' );
  return this;
}


// -------------------------------------------------------------------------
// TableHeaderCell class

function TableHeaderCell ( text )  {
  Widget.call ( this,'th' );
  this.setText ( text );
//  this.element.innerHTML = text;
}

TableHeaderCell.prototype = Object.create ( Widget.prototype );
TableHeaderCell.prototype.constructor = TableHeaderCell;


// -------------------------------------------------------------------------
// TableRow class

function TableRow()  {
  Widget.call ( this,'tr' );
  this.selected = -1;  // 0: not selectable;  1: selected;  -1: not selected
}

TableRow.prototype = Object.create ( Widget.prototype );
TableRow.prototype.constructor = TableRow;

TableRow.prototype.addCell = function ( text )  {
let td;
  if ((typeof(text)!='undefined') && (text!=null))
        td = new TableCell ( text.toString() );
  else  td = new TableCell ( '&nbsp;' );
  this.addWidget ( td );
  return td;
}


// -------------------------------------------------------------------------
// TableScroll class:  table with scrollable body

/*
<div class="scrollingtable">
  <div>
    <div>
      <table>
        <caption>Top Caption</caption>
        <thead>
          <tr>
            <th><div label="Column 1"></div></th>
            <th><div label="Column 2"></div></th>
            <th><div label="Column 3"></div></th>
            <th>
              <!--more versatile way of doing column label; requires 2 identical copies of label-->
              <div><div>Column 4</div><div>Column 4</div></div>
            </th>
            <th class="scrollbarhead"/> <!--ALWAYS ADD THIS EXTRA CELL AT END OF HEADER ROW-->
          </tr>
        </thead>
        <tbody>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
          <tr><td>Lorem ipsum</td><td>Dolor</td><td>Sit</td><td>Amet consectetur</td></tr>
        </tbody>
      </table>
    </div>
    Faux bottom caption
  </div>
</div>
*/

function TableScroll ( topCaption,bottomCaption,header_list,tooltip_list )  {

  Widget.call ( this,'div' );

  this.element.className = 'scrollingtable';
  this.div1 = new Widget ( 'div' );
  this.addWidget ( this.div1 );
  this.div2 = new Widget ( 'div' );
  this.div1.addWidget ( this.div2 );
  this.table = new Widget ( 'table' );
  this.div2.addWidget ( this.table );

  if (bottomCaption)  {
    this.bottomLegend = new Label ( bottomCaption );
    this.div2.addWidget ( this.bottomLegend );
  }
  if (topCaption)  {
    this.topLegend = new Widget ( 'caption' );
    //caption.innerHTML = topCaption;
    this.topLegend.setText ( topCaption );
    this.table.addWidget ( this.topLegend );
  }

  this.thead = new Widget ( 'thead' );
  this.tbody = new Widget ( 'tbody' );
  this.table.addWidget ( this.thead );
  this.table.addWidget ( this.tbody );

  let trow = new TableRow();
  for (let i=0;i<header_list.length;i++)  {
    let th    = new TableHeaderCell ( '' );
    let thdiv = new Widget ( 'div' );
    th.setAttribute ( 'class','table-blue-hh' );
    thdiv.setAttribute ( 'label',header_list[i] );
    th.addWidget ( thdiv );
    if (tooltip_list.length>i)
      th.setTooltip ( tooltip_list[i] );
    trow.addWidget ( th );
  }
  let th = new TableHeaderCell ( '' );
  th.element.className = 'scrollbarhead';
  this.thead.addWidget ( trow );

}

TableScroll.prototype = Object.create ( Widget.prototype );
TableScroll.prototype.constructor = TableScroll;

TableScroll.prototype.setHeaderFontSize = function ( size )  {
let trow = this.thead.child[0];
  for (let i=0;i<trow.child.length;i++)
    trow.child[i].setFontSize ( size );
}

TableScroll.prototype.setHeaderNoWrap = function ( col )  {
let trow = this.thead.child[0];
  if (col<0)  {
    for (let i=0;i<trow.child.length;i++)
      trow.child[i].element.setAttribute ( 'style','white-space: nowrap' );
  } else if (col<trow.child.length)
    trow.child[col].element.setAttribute ( 'style','white-space: nowrap' );
}


TableScroll.prototype.addRow = function ( header,tooltip,cell_list,alt_bool )  {

  let trow = new TableRow();

  if (header)  {
    let th = new TableHeaderCell ( header );
    th.setAttribute ( 'class','table-blue-vh' );
    if (tooltip)
      th.setTooltip ( tooltip );
    trow.addWidget  ( th );
  }

  for (let i=0;i<cell_list.length;i++)  {
    let td = new TableCell ( cell_list[i] );
    if (alt_bool)  td.setAttribute ( 'class','table-blue-alt' );
             else  td.setAttribute ( 'class','table-blue-td'  );
    trow.addWidget ( td );
  }

  this.tbody.addWidget ( trow );

  return trow;

}


TableScroll.prototype.clearBody = function()  {
  $(this.tbody.element).empty();
}


// -------------------------------------------------------------------------
// TableSort class:  table with sortable columns

/*
function TableSort()  {
  Widget.call ( this,'table' );
  this.element.className = 'tablesorter widget-zebra';
//  this.element.setAttribute ( 'class','tablesorter widget-zebra' );
  this.spacer = new Widget('div');
  this.head   = new Widget('thead');
  this.body   = new Widget('tbody');
  this.element.appendChild ( this.head.element );
  this.element.appendChild ( this.body.element );
  this.selectedRow = null;  // none is selected initially
  this.spacer.setWidth_px ( 1 );
  this.head_top    = 0;
  this.head_height = 0;
}
*/

function TableSort()  {
  Widget.call ( this,'div' );
//  this.element.setAttribute ( 'class','tablesorter widget-zebra' );
  this.spacer    = new Widget('div');
  this.table_div = new Widget('div');
  this.table_div.element.className = 'table-content';
  this.element.appendChild ( this.spacer   .element );
  this.element.appendChild ( this.table_div.element );
  this.table  = new Widget('table');
  this.table.element.className = 'tablesorter widget-zebra';
  this.table_div.element.appendChild ( this.table.element );
  this.head   = new Widget('thead');
  this.body   = new Widget('tbody');
  this.table.element.appendChild ( this.head.element );
  this.table.element.appendChild ( this.body.element );
  this.selectedRow = null;  // none is selected initially
  this.spacer.setWidth_px ( 1 );
  this.head_top    = 0;
  this.head_height = 0;
  this.onsorted    = null;
}

TableSort.prototype = Object.create ( Widget.prototype );
TableSort.prototype.constructor = TableSort;

TableSort.prototype.setHeaders = function ( header_list )  {
let trow = new TableRow();
  for (let i=0;i<header_list.length;i++)
    trow.addWidget ( new TableHeaderCell(header_list[i]) );
  this.head.addWidget ( trow );
}

TableSort.prototype.setHeaderFontSize = function ( size )  {
let trow = this.head.child[0];
  for (let i=0;i<trow.child.length;i++)
    trow.child[i].setFontSize ( size );
}

TableSort.prototype.setHeaderNoWrap = function ( col )  {
let trow = this.head.child[0];
  if (col<0)  {
    for (let i=0;i<trow.child.length;i++)
      trow.child[i].element.setAttribute ( 'style','white-space: nowrap' );
  } else if (col<trow.child.length)
    trow.child[col].element.setAttribute ( 'style','white-space: nowrap' );
}

TableSort.prototype.setHeaderColWidth = function ( col,width )  {
let trow = this.head.child[0];
  trow.child[col].element.style.width = width;
  //if (this.body.child.length>0)
  //  this.body.child[col].element.style.width = width;
  if (this.body.child.length>0)  {
    trow = this.body.child[0];
    trow.child[col].element.style.width = width;
  }
  /*
  $(trow.child[col].element).css('width',width);
  if (this.body.child.length>0)
    $(this.body.child[col].element).css('width',width);
  */
}

TableSort.prototype.selectRow = function ( trow )  {
  if (trow.selected==-1)  {
    // the requested row need to be selected (0 is not selectable)
    if (this.selectedRow)  {
      // deselect curently selected row
      let cell = this.selectedRow.child;
      for (let i=0;i<cell.length;i++)
        $(cell[i].element).css('background',cell[i].css0);
      this.selectedRow.selected = -1;
    }
    // note and select the requested row
    this.selectedRow = trow;
    let cell = this.selectedRow.child;
    for (let i=0;i<cell.length;i++)
      $(cell[i].element).css('background','lightblue');
    this.selectedRow.selected = 1;
  }
}

TableSort.prototype.addRow = function()  {
let tr = new TableRow();
  this.body.addWidget ( tr );
  (function(table,trow)  {
    trow.addOnClickListener ( function(){
      table.selectRow ( trow );
      table.emitSignal ( 'row_click',trow );
    });
    trow.addOnDblClickListener ( function(){
      table.emitSignal ( 'row_dblclick',trow );
    });
    trow.addOnRightClickListener ( function(e) {
      table.selectRow  ( trow );
      table.emitSignal ( 'row_rightclick',trow );
    });
  }(this,tr));
  return tr;
}

TableSort.prototype.removeAllRows = function()  {
  this.body.removeAllChildren();
}

TableSort.prototype.clear = function()  {
  this.table.element.removeChild ( this.head.element );
  this.table.element.removeChild ( this.body.element );
  this.head = new Widget('thead');
  this.body = new Widget('tbody');
  this.table.element.appendChild ( this.head.element );
  this.table.element.appendChild ( this.body.element );
}

TableSort.prototype.createTable = function ( onSorted_func )  {
//  alert ( this.parent.element.innerHTML );

  this.onsorted = onSorted_func;

  (function(self){
    $(self.table.element).tablesorter({
      theme   : 'blue',
      widgets : ['zebra']
    })
    .bind("sortEnd",function(e, t) {
      if (self.onsorted)
        self.onsorted();
    });
  }(this))

/*
  $(this.element).tablesorter({
    theme: 'blue',
    headerTemplate: '{content} {icon}', // Add icon for various themes
    widgets: ['zebra', 'filter', 'stickyHeaders'],
    widgetOptions: {
      // jQuery selector or object to attach sticky header to
      stickyHeaders_attachTo: '#tbspopup',
      stickyHeaders_offset: 0,
      stickyHeaders_addCaption: true
    }
  });


    $("table")
      .tablesorter({
        theme: 'blue',
        showProcessing : true
      })

      // assign the sortStart event
      .bind("sortStart",function(e, t) {
        start = e.timeStamp;
        $("#display").append('<li>Sort Started</li>').find('li:first').remove();
      })

      .bind("sortEnd",function(e, t) {
        $("#display").append('<li>Sort Ended after ' + ( (e.timeStamp - start)/1000 ).toFixed(2) + ' seconds</li>').find('li:first').remove();
      });

*/

  let child = this.body.child;
  for (let i=0;i<child.length;i++)  {
    let childi = child[i].child;
    for (let j=0;j<childi.length;j++)
      childi[j].css0 = $(childi[j].element).css("background");
  }

  /*
  this.head.element.className = 'fixthead';
  let hrow = this.head.child[0];
  for (let j=0;j<child[0].length;j++)
    hrow.child[j].element.style.width = child[0][j].element.style.width;
*/

}

TableSort.prototype.fixHeader = function()  {

  if ((this.body.child.length>0) && (this.head.child.length>0))  {

    $(this.head.element).addClass ('fixthead');

    let hrow = this.head.child[0].child;
    let trow = this.body.child[0].child;

    if (this.head_height<=0)  {
      this.head_height = Math.round($(this.head.element).outerHeight());
      this.head_top    = Math.round($(this.head.element).position().top);
      //this.head.element.style.top = (this.head_top-this.head_height) + 'px';
      this.head.element.style.top = this.head_top + 'px';
      this.spacer.setHeight_px ( this.head_height );
    }

    this.head.setWidth_px ( this.body.width_px() );

    for (let j=0;j<hrow.length;j++)
      $(hrow[j].element).outerWidth ( $(trow[j].element).outerWidth() );

    for (let j=0;j<hrow.length;j++)
      $(trow[j].element).outerWidth ( $(hrow[j].element).outerWidth() );

/*
    let hwidth = [];
    vat twidth = [];
    for (let j=0;j<hrow.length;j++)


*/

  }

}

TableSort.prototype.setTableHeight = function ( height_int )  {
  if (this.body.child.length>0)
    this.table_div.element.style.height = height_int - this.head_top + 'px';
}

TableSort.prototype.setTableWidth = function ( width_int )  {
  if (this.body.child.length>0)
    this.table_div.element.style.width = width_int + 'px';
}

TableSort.prototype.getSortList = function()  {
  return $(this.table.element)[0].config.sortList;
}

TableSort.prototype.applySortList = function ( sortList,block_callback )  {
let onSorted_func = this.onsorted;
  if (block_callback)
    this.onsorted = null;
  $(this.table.element).trigger("sorton",[sortList]);
  this.onsorted = onSorted_func;
}


// -------------------------------------------------------------------------
// TablePages class:  table with sortable columns and pages

function TablePages()  {
  Grid.call ( this,'' );
  this.table        = null;
  this.tdesc        = null;
  this.tdata        = null;
  this.paginator    = null;
  this.header_list  = [];
  this.tooltip_list = [];
  this.sort_list    = [];
  this.filter       = null;
  this.startRow     = 0;   // 1 if horizontal headers are there
  this.startCol     = 0;   // 1 if vertical headers are there
  this.startIndex   = 0;   // first currently displayed record
  this.endIndex     = 0;   // last currently displayed record + 1
  this.sortCol      = 0;   // currently sorted column
  this.pageSize     = 20;
  this.crPage       = 1;
  this.style        = null;
}

TablePages.prototype = Object.create ( Grid.prototype );
TablePages.prototype.constructor = TablePages;


TablePages.prototype._form_table = function ( tdesc )  {

  this.tdesc = tdesc;

  if ('sortCol' in tdesc)
        this.sortCol = tdesc.sortCol;
  else  this.sortCol = -1;

  this.startRow     = 1;
  this.header_list  = [];
  this.tooltip_list = [];
  this.sort_list    = [];
  for (let i=0;i<tdesc.columns.length;i++)  
    if ('header' in tdesc.columns[i])  {
      this.header_list .push ( tdesc.columns[i].header  );
      this.tooltip_list.push ( tdesc.columns[i].tooltip );
      this.sort_list   .push ( tdesc.columns[i].sort    );
    }
  if (this.header_list.length<tdesc.columns.length)  {
    this.header_list  = [];
    this.tooltip_list = [];
    this.sort_list    = [];
    this.sortCol      = -1;  // no sorting without headers
    this.startRow     = 0;
  }

  this.vheaders = null;
  this.startCol = 0;
  if ('vheaders' in tdesc)  {
    this.vheaders = tdesc.vheaders;
    if (this.vheaders)
      this.startCol = 1;
  }

  this.pageSize = 20;
  if ('page_size' in tdesc)
    this.pageSize = tdesc.page_size;

  this.style = null;
  if ('style' in tdesc)
    this.style = tdesc.style;

}


TablePages.prototype.sortData = function()  {
  this.tdata = sortObjects ( this.tdata,this.sortCol-this.startCol,
                                        this.sort_list[this.sortCol] );
}


TablePages.prototype._fill_table = function ( startIndex )  {

  this.startIndex = startIndex;
  this.endIndex   = Math.min ( this.tdata.length,startIndex+this.pageSize );

  this.table = new Table();
  this.setWidget ( this.table,0,0,1,1 );

  let header0 = '';
  if (this.sortCol>=this.startCol)  {
    header0 = this.header_list[this.sortCol];
    let sh  = this.header_list[this.sortCol].split('<br>');
    if (this.sort_list[this.sortCol])
          sh[0] += '&nbsp;&darr;';
    else  sh[0] += '&nbsp;&uarr;';
    this.header_list[this.sortCol] = sh.join('<br>');
  }

  if (this.header_list.length==this.tdesc.columns.length)  {
    this.table.setHeaderRow ( this.header_list,this.tooltip_list );
    if (this.sortCol>=0)  {
      this.table.setCellCSS ({'color':'yellow'},0,this.sortCol );
      this.header_list[this.sortCol] = header0;
    }
  }

  let row   = 0;
  let ncols = this.header_list.length-this.startCol;
  for (let i=this.startIndex;i<this.endIndex;i++)  {
    row++;
    if (this.vheaders)
      this.table.setRow ( ''+(i+1),'',this.tdata[i].slice(0,ncols),row,row % 2 );
    else
      this.table.setRow ( this.tdata[i][0],'',this.tdata[i].slice(1,ncols),row,row % 2 );
  }

  let self = this;

  this.table.addSignalHandler ( 'click',function(target){
    const row = target.parentElement; // The <tr> containing the clicked <td>
    if (row.rowIndex>=self.startRow)  {
      if ('onclick' in self.tdesc)  {
        const uindex = self.startIndex + row.rowIndex; // Get the row index (1-based for <tbody>)
        self.table.selectRow ( -1,1 );  // deselect
        self.table.selectRow ( row.rowIndex,1 );
        self.tdesc.onclick   ( self.tdata[uindex-1] );
      }
    } else if ((target.tagName==="TH") && (self.sortCol>=0)) {
      let colNo = 0;  // find header column which was clicked
      for (let i=0;(i<self.header_list.length) && (!colNo);i++)  {
        let prefix = self.header_list[i].split('<')[0].split('&')[0];
        if (target.innerHTML.startsWith(prefix))
          colNo = i;
      }
      if (colNo>=self.startCol)  {
        if (colNo==self.sortCol)
          self.sort_list[colNo] = !self.sort_list[colNo];
        self.sortCol = colNo;
        self.sortData();
        if ('onsort' in self.tdesc)  {
          let showRec = self.tdesc.onsort ( self.tdata );
          if (showRec>=0)  {
            self.crPage = Math.floor(showRec/self.tdesc.page_size+1);
            if (self.paginator)
                  self.paginator.showPage ( self.crPage );
            else  self._fill_table ( self.startIndex );
            if ('onpage' in self.tdesc)
              self.tdesc.onpage ( self.crPage );
          } else
            self._fill_table ( self.startIndex );
        } else
          self._fill_table ( self.startIndex );
      }
    }
  });

  if ('ondblclick' in this.tdesc)  {
    this.table.addSignalHandler ( 'dblclick',function(target){
      // Ensure the click happened inside a table row (skip headers)
      // if (target.tagName === "TD") {
      const row = target.parentElement; // The <tr> containing the clicked <td>
      if (row.rowIndex>=self.startRow)  {
        const uindex = self.startIndex + row.rowIndex; // Get the row index (1-based for <tbody>)
        self.table.selectRow  ( row.rowIndex,1 );
        self.tdesc.ondblclick ( self.tdata[uindex-1],function(){
                                  self.table.selectRow ( -1,1 );  // deselect
                                });
      }
    });
  }

  if ('oncontext' in this.tdesc)  {
    this.table.addSignalHandler ( 'contextmenu',function(target){
      // Ensure the click happened inside a table row (skip headers)
      // if (target.tagName === "TD") {
      const row = target.parentElement; // The <tr> containing the clicked <td>
      if (row.rowIndex>=self.startRow)  {
        const uindex = self.startIndex + row.rowIndex; // Get the row index (1-based for <tbody>)
        self.table.selectRow ( row.rowIndex,1 );
        self.tdesc.oncontext ( self.table,self.tdata[uindex-1],function(){
                                  self.table.selectRow ( -1,1 );  // deselect
                                });
      }
    });
  }

  this.table.setCellCSS ({'color':'yellow'},0,this.sortCol );

  for (let i=0;i<this.tdesc.columns.length;i++)  {
    if ((this.startRow>0) && ('hstyle' in this.tdesc.columns[i]))
      this.table.setCellCSS ( this.tdesc.columns[i].hstyle,0,i );
    if (this.tdesc.columns[i].style)
      this.table.setColumnCSS ( this.tdesc.columns[i].style,i,this.startRow );
  }

  if (this.style)
    this.table.setAllColumnCSS ( this.style,this.startRow,this.startCol );

  if (this.tdesc.mouse_hover)
    this.table.setMouseHoverHighlighting ( this.startRow,this.startCol );

  if ('onpage' in this.tdesc)
    this.tdesc.onpage ( this.crPage );

}


TablePages.prototype.makeTable = function ( tdesc )  {
//
// tdesc = {
//   columns : [   
//     { header  : text, // must be absent in all columns for no headers
//       hstyle  : { 'text-align' : 'center' },  // optional
//       tooltip : tooltip,
//       style   : { 'text-align' : 'right', 'width' : '80px', ... },
//       sort    : true  // initial sorting, true for ascending
//     }
//     ...
//   ],
//   rows     : [
//     [d11,d12,...],   // possibly [[d11,tooltip11],d12,...]
//     ...
//   ],
//   vheaders : 'row',  // null|'row'
//   style    : { cursor' : 'pointer', 'white-space' : 'nowrap', ... }, 
//                                           // general css for data columns
//   sortCol     : 0,   // should be absent for no sorting
//   mouse_hover : true,
//   page_size   : 20,  // 0 for no pages
//   start_page  : 1,   // optional
//   onclick     : function(rowData){}
//   ondblclick  : function(rowData,callback_func){}
//   oncontext   : function(target,rowData,callback_func){}
//   showonstart : function(rowData){ return true/false }
//   onsort      : function(tdata){ return index to show for page change, or -1 }
//   onpage      : function(pageNo){}
// }

  this._form_table ( tdesc );

  if (!this.filter)
    this.tdata = tdesc.rows;
  else  {
    // Apply filter to table data
    const escapedPattern = this.filter.replace ( /[-[\]{}()+.,\\^$|#\s]/g, "\\$&" );
    // Replace * with .* (zero or more characters) and ? with . (exactly one character)
    const regexPattern = "^" + escapedPattern.replace ( /\*/g, ".*").replace(/\?/g, "." ) + "$";
    // Create a regex and test the string
    const regex = new RegExp(regexPattern);
    this.tdata = [];
    for (let i=0;i<tdesc.rows.length;i++)  {
      let match = false;
      let row   = [];
      for (let j=0;j<tdesc.rows[i].length;j++)
        if (regex.test(tdesc.rows[i][j]))  {
          match = true;
          row.push ( '<span style="color:#D2042D;">' + tdesc.rows[i][j] + '</span>' );
        } else  
          row.push ( tdesc.rows[i][j] );
        if (match)
          this.tdata.push ( row );
    }
  }

  if (this.sortCol>=this.startCol)
    this.sortData();

  this.crPage = 1;
  this._fill_table ( 0 );
  
  if (this.pageSize<this.tdata.length)  {    
    // console.log ( ' >>>>> ' + this.pageSize + ' : ' + this.tdata.length)
    let self = this;
    let startPage = 1;
    if ('start_page' in tdesc)
      startPage = tdesc.start_page;
    if ('showonstart' in tdesc)  {
      let showIndex = -1;
      for (let i=0;(i<this.tdata.length) && (showIndex<0);i++)
        if (tdesc.showonstart(this.tdata[i]))
          showIndex = i;
      if (showIndex>=0)
        startPage = Math.floor(showIndex/this.pageSize+1);
    }
    this.paginator = new Paginator ( this.tdata.length,this.pageSize,7,startPage,
      function(pageNo){
        self.crPage = pageNo;
        self._fill_table ( self.pageSize*(pageNo-1) );
      });
    this.setWidget ( self.paginator,1,0,1,1 );
  } else if (this.paginator)  {
    this.setLabel ( '&nbsp;',1,0,1,1 );
    this.paginator = null;
  }

}

TablePages.prototype.setPageSize = function ( page_size )  {
  let psize = Math.max ( 1,page_size );
  if (psize!=this.tdesc.page_size)  {
    // console.log ( ' >>>> ' + $(this.table.element.rows[1]).outerHeight() )
    // console.log ( ' >>>> page_size=' + page_size )
    let showRow   = Math.max ( this.startRow,this.table.selectedRow );
    let showIndex = this.startIndex + showRow - this.startRow;
    this.tdesc.page_size  = Math.min   ( psize,this.tdata.length );
    this.tdesc.start_page = Math.floor ( showIndex/psize ) + 1;
    this.makeTable ( this.tdesc );
  }
}

TablePages.prototype.setFilter = function ( filter )  {
  if (filter!=this.filter)  {
    this.filter = filter;
    this.makeTable ( this.tdesc );
  }
}

TablePages.prototype.getTableState = function()  {
  return {
    pageSize  : this.pageSize,
    crPage    : this.crPage,
    sortCol   : this.sortCol,
    sort_list : this.sort_list
  };
}

TablePages.prototype.selectRow = function ( rowNo,start_col )  {
  this.table.selectRow ( rowNo,start_col );
}

TablePages.prototype.getSelectedRowData = function()  {
  return this.table.getSelectedRowData();
}

TablePages.prototype.getRowHeight = function ( rowNo )  {
  if (this.table)
    return  this.table.getRowHeight ( rowNo );
  return  29.1953;
}

TablePages.prototype.setContextMenu = function ( contextmenu_func,cellNo=2 )  {
  for (let i=this.startRow;i<this.table.element.rows.length;i++)  {
    let row         = this.table.element.rows[i];
    let contextMenu = contextmenu_func ( i,row,this.tdata[i-this.startRow] );
    let cell        = row.cells[cellNo];
    cell.insertBefore ( contextMenu.element,cell.childNodes[0] );
  }
}


// -------------------------------------------------------------------------
// TableSearchDialog class

function TableSearchDialog ( title,tablePages,offset_x,offset_y )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  let grid = new Grid('');
  this.addWidget ( grid );

  grid.setLabel ( 'Filter:',0,0,1,1 );
  let filter    = grid.setInputText('',0,1,1,1).setWidth('160px')
                      .setStyle('text','','','Search target')
                      .setWidth('220px');
  let find_btn  = grid.setButton ( 'Find' ,image_path('find' ),0,2,1,1 );
  let close_btn = grid.setButton ( 'Close',image_path('close'),0,3,1,1 );
  grid.setVerticalAlignment ( 0,0,'middle' );
  grid.setVerticalAlignment ( 0,1,'middle' );
  grid.setVerticalAlignment ( 0,2,'middle' );
  grid.setVerticalAlignment ( 0,3,'middle' );

  let self = this;
  find_btn.addOnClickListener ( function(){
    tablePages.setFilter ( filter.getValue() );
  });
  close_btn.addOnClickListener ( function(){
    tablePages.setFilter ( '' );
    $(self.element).dialog ( 'close' );
  });

  $(this.element).dialog({
    resizable : false,
    height    : 90,
    width     : 'auto',
    position  : { my: "left top", at: "left+" + offset_x + " top+" + offset_y, of: window },
    // maxHeight : 600,
    // width     : '820px',
    modal     : false,
    closeOnEscape: false,
    open: function (event,ui) {
      //hide close button.
      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
    },
    buttons : {}
  });

  this.setShade ( '8px 8px 16px 8px rgba(212,212,212,1.0)',
                  //  '0px 0px 16px 8px rgba(212,212,212,1.0) inset',
                  'none',
                  __active_color_mode );

  // this.setBackgroundColor ( '#BCC6CC' );
  this.setBackgroundColor ( '#F8F8F8' );

}

TableSearchDialog.prototype = Object.create(Widget.prototype);
TableSearchDialog.prototype.constructor = TableSearchDialog;
