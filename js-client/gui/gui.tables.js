
/*
 *  =================================================================
 *
 *    18.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.tables.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Table        - plain table
 *       ~~~~~~~~~  TableScroll  - table with scrollable body
 *                  TableSort    - table with sortable columns
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
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
    headerCell.setAttribute ( 'class','table-blue-vh' );
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

Table.prototype.addSignalHandler = function (signal, onReceive) {
  this.element.addEventListener(signal, function (e) {
    onReceive(e.target);
  }, false);
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
