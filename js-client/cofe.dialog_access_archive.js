
/*
 *  =================================================================
 *
 *    02.11.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_access_archive.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project Archive Dialog (archives given project)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// AccessArchiveDialog class

function AccessArchiveDialog ( callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Access ' + appName() + ' archive' );
  document.body.appendChild ( this.element );

  this.aID_inp = null;
  this.makeLayout();

  var self = this;
  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 600,
    width     : 820,
    modal     : true,
    closeOnEscape : false,
    open      : function(event,ui) {
                  //hide close button.
                  $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                },
    buttons   : [
      { id    : 'archdlg_access_btn',
        text  : 'Access',
        click : function() { 
                  self.accessProject ( function(done){
                    if (done)
                      $(this).dialog('close');
                  });
                }
      }, {
        id    : 'archdlg_cancel_btn',
        text  : 'Cancel', 
        click : function() { $(this).dialog('close'); }
      }
    ]

  });

}

AccessArchiveDialog.prototype = Object.create ( Widget.prototype );
AccessArchiveDialog.prototype.constructor = AccessArchiveDialog;

AccessArchiveDialog.prototype.makeLayout = function()  {

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  this.grid.setLabel    ( ' ',0,0,1,1 );
  this.grid.setCellSize ( '','6px', 0,0 );
  this.grid.setImage    ( image_path('folder_cloud_archive'),'48px','48px', 1,0,1,1 );
  this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );

  this.grid.setLabel    ( '<h2>Access ' + appName() + ' Archive</h2>',0,2,2,1 );        

  this.grid.setVerticalAlignment ( 0,2,'middle' );

  this.grid.setHLine ( 2, 2,2, 1,1 );

  var panel = this.grid.setPanel ( 3,2,1,1 );
  $(panel.element).css({
    'width'      : 700,
    'height'     : 300,
    'overflow-y' : 'auto'
  });

  var pgrid = new Grid ( '-compact' );
  panel.addWidget ( pgrid );

  pgrid.setLabel ( 'Access project with Archive ID:',0,0,1,1 ).setNoWrap();
  this.aID_inp = pgrid.setInputText ( '',0,1,1,1 ).setWidth ( '200px' )
                     .setStyle ( 'text','','CCP4-XXX.YYYY',
                                 appName() + ' Archive ID of project to access' );

  pgrid.setVerticalAlignment ( 0,0,'middle' );
  pgrid.setVerticalAlignment ( 0,1,'middle' );

}


AccessArchiveDialog.prototype.accessProject = function ( callback_func )  {

  var archiveID = this.aID_inp.getValue().trim().toUpperCase();
  
  if (!archiveID)  {
    new MessageBox ( 'Archive ID not given',
        '<div style="width:300px"><h2>Archive ID not given</h2>' +
        '<i>Please provide a valid ' + appName() + ' Archive ID.</i></div>',
        'msg_stop' );
    callback_func ( false );
    return;
  }

  var lst = archiveID.split('-');
  if (lst.length!=2)
    archiveID = '';
  else  {
    lst = lst[1].split('.');
    if ((lst.length!=2) || (lst[0].length!=3) || (lst[1].length!=4))
      archiveID = '';
  }
  if (!archiveID)  {
    new MessageBox ( 'Invalid Archive ID',
        '<div style="width:300px"><h2>Invalid Archive ID</h2>' +
        '<i>Please provide a valid ' + appName() + ' Archive ID, which '+
        'follows the following pattern: "ABCD-XXX.YYY".</i></div>',
        'msg_stop' );
    callback_func ( false );
    return;
  }

  $( '#archdlg_access_btn' ).button('disable');
  $( '#archdlg_cancel_btn' ).button('disable');

  serverRequest ( fe_reqtype.accessArchivedPrj,{
    archiveID : archiveID
  },'Access Archived Project', function(response){

    $( '#archdlg_access_btn' ).button('enable');
    $( '#archdlg_cancel_btn' ).button('enable');

    // var message = '';
    // switch (response.code)  {

    //   case 'no_space'  : message = '<h2>No space left in Archive</h2>' +
    //                        'Your project cannot be archived because there is ' +
    //                        'no space left<br>in the Archive. Please inform ' +
    //                        report_problem ( 
    //                          appName() + ' archiving problem',
    //                           'No space left in the Archive, please increase',
    //                           ''
    //                        ) + '.<p>Sincere apologies for any inconvenience ' +
    //                        'this may have caused.';
    //                   break;

    //   case 'ok'        : self.archiving_started = true;
    //                      $('#archdlg_cancel_btn' ).button().text('Log out');
    //                      message = '<h2>Project "' + self.projectDesc.name + 
    //                        '" is being archived</h2>Archiving is currently in ' +
    //                        'progress. The following Archive ID was issued for ' +
    //                        'your project:<p><center><b>' + response.archiveID +
    //                        '</b></center><p>please take a note of it. Archive ID ' +
    //                        'is used for accessing archived projects and referencing ' +
    //                        'them in publication and elsewhere.' +
    //                        '<p>For the process to complete uninterrupted, your ' + 
    //                        appName() + ' account is now suspended. ' +
    //                        '<p>Please log out now. Your account will be released ' +
    //                        'automatically when archiving ends.<br>Contact ' + 
    //                        report_problem ( 
    //                          appName() + ' archiving problem',
    //                           'Archiving project ' + self.projectDesc.name + 
    //                           ' seems to be stuck',
    //                           ''
    //                        ) + ' if your account is not released after 2 hours.';
    //                   break;

    //   default :  message = '<h2>Unknown return code ' + response.code + 
    //                        '</h2><i>Please report as a bug</h2>';
    // }
    
  },null,'persist' );

}