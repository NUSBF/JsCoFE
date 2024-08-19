
/*
 *  =================================================================
 *
 *    15.03.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_search_archive.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Search Archive Dialog (fetches Archive IDs)
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
// SearchArchiveDialog class

function SearchArchiveDialog ( callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Search ' + appName() + ' archive' );
  document.body.appendChild ( this.element );

  this.makeLayout();

  var self = this;
  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    // maxHeight : 600,
    // width     : '820px',
    modal     : true,
    closeOnEscape: false,
    open: function (event,ui) {
      //hide close button.
      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
    },
    buttons: [
      {
        id: 'archdlg_search_btn',
        text: 'Find',
        click: function () {
          (function (dlg) {
            self.searchArchive ( function(archiveId) {
              if (archiveId) {
                callback_func ( archiveId );
                $(dlg).dialog('close');
              }
            });
          }(this))
        }
      },{
        id: 'archdlg_search_cancel_btn',
        text: 'Cancel',
        click: function () {
          callback_func ( '' );
          $(this).dialog('close');
        }
      }
    ]

  });

}


SearchArchiveDialog.prototype = Object.create(Widget.prototype);
SearchArchiveDialog.prototype.constructor = SearchArchiveDialog;

SearchArchiveDialog.prototype.makeLayout = function () {

  this.grid = new Grid('');
  this.addWidget(this.grid);

  this.grid.setLabel(' ',0,0,1,1);
  this.grid.setCellSize('','6px',0,0);
  this.grid.setImage(image_path('folder_cloud_archive'),'48px','48px',1,0,1,1);
  this.grid.setLabel('&nbsp;&nbsp;&nbsp;',0,1,2,1);

  this.grid.setLabel('<h2>Search ' + appName() + ' Archive</h2><hr/>' +
    '<span style="font-size:85%"><i>' +
    'Provide as many filters as possible; at least one ' +
    'filter must be given</i><br>&nbsp;</span>',
    0,2,2,1);
  this.grid.setVerticalAlignment(0,2,'middle');

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

}


SearchArchiveDialog.prototype.searchArchive = function ( callback_func ) {


  let search_options = {
    'pdbcode' : this.pdbcode .getValue().trim(),
    'prid'    : this.prid    .getValue().trim(),
    'dname'   : this.dname   .getValue().trim(),
    'dlogin'  : this.dlogin  .getValue().trim(),
    'demail'  : this.demail  .getValue().trim(),
    'year'    : this.year_sel.getValue(),
    'doiref'  : this.doiref  .getValue().trim(),
    'kwds'    : []
  };


  let kwds = this.kwds.getValue().split(',').filter(Boolean);
  for (let i=0;i<search_options.kwds.length;i++)  {
    let kwd = kwds[i].trim();
    if (kwd)
      search_options.kwds.push ( kwd );
  }

  if ((!search_options.pdbcode) && (!search_options.prid)   && 
      (!search_options.dname)   && (!search_options.dlogin) && 
      (!search_options.demail)  && (!search_options.doiref) && 
      (!search_options.kwds.length>0) && 
      (search_options.year=='any'))  {
    new MessageBox ( 'No filter applied',
        '<div style="width:300px"><h2>No filter applied</h2>' +
        'At least one filter must be applied for searching in ' +
        appName() + ' Archive.</div>','msg_stop' );
    callback_func ( '' );
    return;
  }

  $('#archdlg_search_btn')       .button('disable');
  $('#archdlg_search_cancel_btn').button('disable');

  // alert ( JSON.stringify(search_options));

  serverRequest ( fe_reqtype.searchArchive,search_options,
                  'Search ' + appName() + ' Archive',
                  function(response){

      $('#archdlg_search_btn')       .button('enable');
      $('#archdlg_search_cancel_btn').button('enable');
  
      var message  = '';
      var archive  = appName() + ' Archive ';
      var msg_icon = 'msg_system';
      switch (response.code)  {
        case 'ok'                   :  break;
        case 'archive_unconfigured' :  message = '<h2>' + archive + 'not configured</h2>' +
                                         archive + 'is not configured on your server. ' +
                                         'Contact your ' + appName() + ' ' +
                                         report_problem(
                                           archive + 'is not configured.',
                                           'Searches were requested for unconfigured ' + archive,
                                           'maintainer');
                                       msg_icon = 'msg_excl_yellow';
                                    break;
        case 'archive_corrupt'      :  message = '<h2>' + archive + 'index is corrupt</h2>' +
                                         archive + 'index may be corrupt and needs attention. ' + 
                                         'Contact your ' + appName() + ' ' +
                                         report_problem(
                                           archive + 'may be corrupt.',
                                           'Reindex ' + archive,
                                           'maintainer');
                                       msg_icon = 'msg_excl_yellow'; 
                                    break;
        case 'archive_unindexed'    :  message = '<h2>' + archive + ' not indexed</h2>' +
                                         archive + ' is not indexed and cannot be searched. ' +
                                         'Contact your ' + appName() + ' ' +
                                         report_problem(
                                           archive + 'may be corrupt.',
                                           'Reindex ' + archive,
                                           'maintainer');
                                       msg_icon = 'msg_excl_yellow';
                                    break;
        default                     :  message = '<h2>' + archive + 'search errors</h2>' +
                                         'Unknown return code (' + response.code + 
                                         ') encountered when searching ' + archive +
                                         'Contact your ' + appName() + ' ' +
                                         report_problem(
                                           'Errors searching '  + archive,
                                           'Unknown return code (' + response.code + 
                                           ') encountered at searching ' + archive,
                                           'maintainer' );
                                       msg_icon = 'msg_excl_yellow';
                                    break;
      }
  
      if (message)   {

        new MessageBox ( 'Searching ' + archive,
                         '<div style="width:350px">' + message + '</div>',
                         msg_icon );
        callback_func ( '' );
      
      } else if (response.mlist.length<=0)  {
      
        new MessageBox ( 'Search results',
                         '<div style="width:350px"><h2>No matches found</h2>' + 
                         'No matches, satisfying chosen search filters, were ' +
                         'found. Modify search parameters.</div>',
                         'msg_stop' );
        callback_func ( '' );

      } else  {

        // alert ( JSON.stringify(response.mlist) );
        new ArchiveMatchlistDialog ( response.mlist,function(archiveID){
          callback_func ( archiveID );
        });

      }
     
  },null,'persist' );

  return;

}
