
/*
 *  =================================================================
 *
 *    14.02.23   <--  Date of Last Modification.
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

function SearchArchiveDialog(callback_func) {

  Widget.call(this,'div');
  this.element.setAttribute('title','Search ' + appName() + ' archive');
  document.body.appendChild(this.element);

  this.makeLayout();

  var self = this;
  $(this.element).dialog({
    resizable: false,
    height: 'auto',
    width: 'auto',
    // maxHeight : 600,
    // width     : 820,
    modal: true,
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
  pgrid.setLabel('Depositor name:',r,0,1,1).setNoWrap();
  this.dname   = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                      .setStyle('text','','John R. Nobody','Depositor name if known');
  pgrid.setLabel('Depositor login:',r,0,1,1).setNoWrap();
  this.dlogin  = pgrid.setInputText('',r++,1,1,1).setWidth('300px')
                      .setStyle('text','','j.r.nobody','Depositor login name if known');
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
    'pdbcode' : this.pdbcode .getValue(),
    'dname'   : this.dname   .getValue(),
    'dlogin'  : this.dlogin  .getValue(),
    'year'    : this.year_sel.getValue(),
    'doiref'  : this.doiref  .getValue(),
    'kwds'    : this.kwds    .getValue()
  };

  if ((!search_options.pdbcode) && (!search_options.dname)  &&
      (!search_options.dlogin)  && (!search_options.doiref) &&
      (!search_options.kwds)    && (search_options.year=='any'))  {
    new MessageBox ( 'No filter applied',
        '<div style="width:300px"><h2>No filter applied</h2>' +
        'At least one filter must be applied for searching in ' +
        appName() + ' Archive.</div>','msg_stop' );
    callback_func ( '' );
    return;
  }
  
  serverRequest ( fe_reqtype.searchArchive,search_options,
                  'Search ' + appName() + ' Archive',
                  function(response){
  
      // $( '#archdlg_access_btn' ).button('enable');
      // $( '#archdlg_cancel_btn' ).button('enable');
  
      // var message  = '';
      // var aid      = '<b>' + archiveID + '</b>';
      // var archive  = appName() + ' Archive';
      // var done     = false;
      // var msg_icon = 'msg_system';
      // switch (response.code)  {
      //   case 'project_not_found'    :  message = '<h2>Project not found</h2>' +
      //                                  'Project ' + aid + ' is not found in ' +
      //                                  archive;
      //                                  msg_icon = 'msg_excl_yellow';
      //                               break;
      //   case 'already_accessed'     :  message = '<h2>Project already accessed</h2>' +
      //                                  'Project ' + aid + ' is in your <i>"' + 
      //                                  archive    + '"</i> folder already.';
      //                                  msg_icon = 'msg_information'; 
      //                               break;
      //   case 'error_read_project'   :  message = '<h2>Project cannot be accessed</h2>' +
      //                                  'There are read errors when accessing project ' +
      //                                  aid + '. This project cannot be accessed ' +
      //                                  'without repairs. Please inform ' +
      //                                  report_problem(
      //                                    'Errors reading archived projwect ' + archiveID,
      //                                    'Read errors encountered at accessing archived ' +
      //                                    'project ' + archiveID,'' );
      //                               break;
      //   case 'duplicate_name'       :  message = '<h2>Duplicate project name</h2>' +
      //                                  'Project ' + aid + ' cannot be accessed in ' +
      //                                  archive + ' because a project with this ' +
      //                                  'name is found in your work folder(s). Rename or ' +
      //                                  'delete your project before accessing it in ' +
      //                                  archive;
      //                                  msg_icon = 'msg_stop'; 
      //                               break;
      //   case 'author_archive'       :  message = '<h2>Project archived by you</h2>' +
      //                                  'Project ' + aid + ' was archived by you ' +
      //                                  'and can be found in your ' +
      //                                  '<i>"Projects archived by me"</i> folder.';
      //                                  msg_icon = 'msg_information'; 
      //                               break;
      //   case 'error_access_project' :  message = '<h2>Access errors (1)</h2>' +
      //                                  'There are link errors when accessing project ' +
      //                                  aid + '. This project cannot be accessed ' +
      //                                  'without repairs. Please inform ' +
      //                                  report_problem(
      //                                    'Errors accessing archived project ' + archiveID,
      //                                    'Link errors encountered at accessing archived ' +
      //                                    'project ' + archiveID,'' );
      //                               break;
      //   case 'error_write_plist'    :  message = '<h2>Access errors (2)</h2>' +
      //                                  'There are write errors when accessing project ' +
      //                                  aid + '. This project cannot be accessed ' +
      //                                  'without repairs. Please inform ' +
      //                                  report_problem(
      //                                    'Errors accessing archived project ' + archiveID,
      //                                    'Project list write errors encountered at ' +
      //                                    'accessing archived project ' + archiveID,'' );
      //                               break;
      //   case 'error_update_plist'   :  message = '<h2>Access errors (3)</h2>' +
      //                                  'There are general errors when accessing project ' +
      //                                  aid + '. This project cannot be accessed ' +
      //                                  'without repairs. Please inform ' +
      //                                  report_problem(
      //                                    'Errors accessing archived project ' + archiveID,
      //                                    'Project list update errors encountered at ' +
      //                                    'accessing archived project ' + archiveID,'' );
      //                               break;
      //   case 'ok'                   :  message = '<h2>Access acquired</h2>' +
      //                                  'Project ' + aid + ' is now accessible to you ' +
      //                                  'via your "' + archive + '" folder.';
      //                                  msg_icon = 'msg_ok'; 
      //                                  done = true;
      //                               break;
      //   default                     :  message = '<h2>Access errors (4)</h2>' +
      //                                  'Unknown return code encountered when accessing project ' +
      //                                  aid + '. Please inform ' +
      //                                  report_problem(
      //                                    'Errors accessing archived project '  + archiveID,
      //                                    'Unknown return code encountered at accessing ' +
      //                                    'archived project ' + archiveID,'' );
      //                               break;
      // }
  
      // new MessageBox ( 'Accessing project ' + archiveID,
      //                  '<div style="width:350px">' + message + '</div>',
      //                  msg_icon );
      // callback_func ( done );
     
  },null,'persist' );

  return;

}
