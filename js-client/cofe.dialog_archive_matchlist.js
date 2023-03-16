
/*
 *  =================================================================
 *
 *    15.03.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_archive_matchlist.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Search Archive Matchlist Dialog (lists found Archive IDs)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// ArchiveMatchlistDialog class

function ArchiveMatchlistDialog ( mlist,callback_func ) {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Search results' );
  document.body.appendChild ( this.element );

  this.makeLayout ( mlist );

  let w = Math.max ( 600,4*$(window).width()/5 );

  var self = this;
  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    // width     : 'auto',
    // maxHeight : 400,
    width     : w,
    modal     : true,
    closeOnEscape : false,
    open: function (event,ui) {
      //hide close button.
      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
    },
    buttons : [
      {
        id    : 'archdlg_accept_match_btn',
        text  : 'Select',
        click : function () {
          callback_func ( self.tablesort_tbl.selectedRow.child[0].text );
          $(this).dialog('close');
        }
      },{
        id    : 'archdlg_matchlist_cancel_btn',
        text  : 'Cancel',
        click : function () {
          callback_func ( '' );
          $(this).dialog('close');
        }
      }
    ]

  });

  this.tablesort_tbl.addSignalHandler ( 'row_dblclick',function(trow){
    callback_func ( trow.child[0].text );
    $(self.element).dialog('close');
  });

}


ArchiveMatchlistDialog.prototype = Object.create(Widget.prototype);
ArchiveMatchlistDialog.prototype.constructor = ArchiveMatchlistDialog;

ArchiveMatchlistDialog.prototype.makeLayout = function ( mlist ) {

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  // this.grid.setLabel ( ' ',0,0,1,1 );
  // this.grid.setCellSize ( '','6px',0,0 );
  this.grid.setImage ( image_path('folder_cloud_archive'),'48px','48px',0,0,1,1 );
  this.grid.setLabel ( '&nbsp;&nbsp;&nbsp;',0,1,1,1 );

  this.grid.setLabel ( 
    '<b style="font-size:125%">Search results</b><hr/>' +
    '<span style="font-size:85%"><i>' +
    'Choose Archive ID by row selection</i></span>',
    0,2,1,1
  );

  this.grid.setVerticalAlignment ( 0,2,'middle' );
  this.grid.setCellSize ( '50px','50px',0,0 );
  this.grid.setCellSize ( '6px','',0,1 );

  this.tablesort_tbl = new TableSort();
  // this.tablesort_tbl.setTableHeight ( 200 );
  // this.tablesort_tbl.createTable ( null );
  this.tablesort_tbl.setHeaders ([
    'Archive ID','Project ID','Project Name','Depositor',
    '<center>Date<br>Deposited</center>'
  ]);

  this.grid.setWidget ( this.tablesort_tbl,1,0,1,3 );
  // this.grid.setCellSize ( 'auto','',1,0 );

  let selectedRow = null;
  for (let i=0;i<mlist.length;i++)  {
    let trow = this.tablesort_tbl.addRow();
    trow.addCell ( mlist[i].id  ).setNoWrap();
    trow.addCell ( mlist[i].project_name   ).setNoWrap();
    trow.addCell ( mlist[i].project_title  );
    trow.addCell ( mlist[i].depositor.name ).setNoWrap();
    trow.addCell ( getDateString(mlist[i].date[0]) ).setNoWrap();
    if (!selectedRow)
      selectedRow = trow;
  }

  this.tablesort_tbl.createTable ( null );
  this.tablesort_tbl.selectRow ( selectedRow );

  this.tablesort_tbl.setHeaderNoWrap   ( -1      );
  this.tablesort_tbl.setHeaderColWidth ( 0,'5%'  );
  this.tablesort_tbl.setHeaderColWidth ( 1,'5%'  );
  this.tablesort_tbl.setHeaderColWidth ( 2,'70%' );
  this.tablesort_tbl.setHeaderColWidth ( 3,'15%' );
  this.tablesort_tbl.setHeaderColWidth ( 4,'5%'  );
  this.tablesort_tbl.setHeaderFontSize ( '100%'  );

  this.tablesort_tbl.setTableHeight ( 300 );
  // this.tablesort_tbl.setTableWidth  ( 800 );

  var self = this;
  window.setTimeout ( function(){
    // self.tablesort_tbl.setTableWidth ( 900 );
    self.tablesort_tbl.fixHeader();
  },10);


/*
  "CCP4-4B2.ZGL5": {
    "id": "CCP4-4B2.ZGL5",
    "coauthors": "None",
    "pdbs": [
      "*"
    ],
    "dois": [
      "*"
    ],
    "kwds": [
      "*"
    ],
    "in_archive": true,
    "depositor": {
      "login": "devel",
      "name": "Developer",
      "email": "ccp4.cofe@gmail.com"
    },
    "project_name": "toxd-clone-clone",
    "version": 1,
    "date": [
      1668968351191
    ],
    "project_title": "TOXD with slicendice (cloned) (cloned)"
  },
*/


  /*
  let pgrid = this.grid.setGrid('-compact',2,2,1,1);
  let r = 0;
  pgrid.setLabel('PDB code:',r,0,1,1).setNoWrap();
  this.pdbcode = pgrid.setInputText('',r++,1,1,1).setWidth('80px')
                      .setStyle('text','','1XYZ','PDB code if known');
  pgrid.setLabel('Project ID:',r,0,1,1).setNoWrap();
  this.prid    = pgrid.setInputText('',r++,1,1,1).setWidth('80px')
                      .setStyle('text','','','Project ID if known (case-sensitive)');
  pgrid.setLabel('Depositor name:',r,0,1,1).setNoWrap();
  this.dname   = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                      .setStyle('text','','John R. Nobody','Depositor name if known');
  pgrid.setLabel('Depositor login:',r,0,1,1).setNoWrap();
  this.dlogin  = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                      .setStyle('text','','j.r.nobody',
                                'Depositor login name if known (case-sensitive)');
  pgrid.setLabel('Depositor email:',r,0,1,1).setNoWrap();
  this.demail  = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                      .setStyle('text','','j.r.nobody@uni-nowhere.edu',
                                'Depositor e-mail address if known');
  pgrid.setLabel('Deposition year:',r,0,1,1).setNoWrap();
  this.year_sel = new Dropdown();
  this.year_sel.addItem ( 'any year','','any',true );
  let year0 = new Date().getFullYear();
  for (let y=2022;y<=year0;y++)
    this.year_sel.addItem ( ''+y,'',''+y,false );
  this.year_sel.setWidth ( '120px' );
  pgrid.setWidget ( this.year_sel, r++,1,1,1 );
  this.year_sel.make();
  pgrid.setLabel('Publication DOI:',r,0,1,1).setNoWrap();
  this.doiref = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                     .setStyle('text','','10.1107/S2059798322007987',
                               'DOI reference if known');
  pgrid.setLabel('Keyword(s):',r,0,1,1).setNoWrap();
  this.kwds   = pgrid.setInputText('',r++,1,1,1).setWidth('400px')
                     .setStyle('text','','hydrolase, carboxypeptidase, ...',
                               'Comma-separated list of keywords');

  for (let i=0;i<r;i++)  {
    pgrid.setVerticalAlignment ( i,0,'middle' );
    pgrid.setVerticalAlignment ( i,1,'middle' );
  }
  */

}


// ArchiveMatchlistDialog.prototype.searchArchive = function ( callback_func ) {

// }
