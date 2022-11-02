
/*
 *  =================================================================
 *
 *    01.11.22   <--  Date of Last Modification.
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
  this.element.setAttribute ( 'title','Access archive' );
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
    'overflow-y' : 'scroll'
  });

  var pgrid = new Grid ( '-compact' );
  panel.addWidget ( pgrid );

  pgrid.setLabel ( 'Archive ID:',0,0,1,1 ).setNoWrap();
  this.aID_inp = pgrid.setInputText ( '',0,1,1,1 ).setWidth ( '440px' )
                     .setStyle ( 'text','','CCP4-XXX.YYYY',
                                 appName() + ' Archve ID of project to access' );

  pgrid.setVerticalAlignment ( 0,0,'middle' );
  pgrid.setVerticalAlignment ( 0,1,'middle' );

}


AccessArchiveDialog.prototype.accessProject = function()  {

  var 

  stopSessionChecks();

  // $('#archdlg_archive_btn').button().hide();
  // $('#archdlg_cancel_btn' ).button('disable');

  var self = this;

  serverRequest ( fe_reqtype.archiveProject,{
    pdesc      : this.projectDesc,
    annotation : {
      coauthors : this.coauthors,
      pdbs      : this.pdbs,
      dois      : this.dois,
      kwds      : this.kwds
    }
  },'Start Project Archiving', function(response){

    $('#archdlg_cancel_btn' ).button('enable');

    var message = '';
    switch (response.code)  {

      case 'no_space'  : message = '<h2>No space left in Archive</h2>' +
                           'Your project cannot be archived because there is ' +
                           'no space left<br>in the Archive. Please inform ' +
                           report_problem ( 
                             appName() + ' archiving problem',
                              'No space left in the Archive, please increase',
                              ''
                           ) + '.<p>Sincere apologies for any inconvenience ' +
                           'this may have caused.';
                      break;

      case 'ok'        : self.archiving_started = true;
                         $('#archdlg_cancel_btn' ).button().text('Log out');
                         message = '<h2>Project "' + self.projectDesc.name + 
                           '" is being archived</h2>Archiving is currently in ' +
                           'progress. The following Archive ID was issued for ' +
                           'your project:<p><center><b>' + response.archiveID +
                           '</b></center><p>please take a note of it. Archive ID ' +
                           'is used for accessing archived projects and referencing ' +
                           'them in publication and elsewhere.' +
                           '<p>For the process to complete uninterrupted, your ' + 
                           appName() + ' account is now suspended. ' +
                           '<p>Please log out now. Your account will be released ' +
                           'automatically when archiving ends.<br>Contact ' + 
                           report_problem ( 
                             appName() + ' archiving problem',
                              'Archiving project ' + self.projectDesc.name + 
                              ' seems to be stuck',
                              ''
                           ) + ' if your account is not released after 2 hours.';
                      break;

      default :  message = '<h2>Unknown return code ' + response.code + 
                           '</h2><i>Please report as a bug</h2>';
    }
    
    self.grid.setLabel ( message,0,2,2,1 );
    self.grid.truncateRows ( 1 );


    // var stop_reason = '';
    // switch (response.code)  {
    //   case 'duplicate_users': stop_reason = 'Unsuitable successor name';
    //                 break;
    //   case 'no_privileges'  : stop_reason = 'No privileges';
    //                 break;
    //   case 'duplicate_ids'  : stop_reason = 'Duplicate project IDs';
    //                 break;
    //   case 'started'        : break;
    //   default : alert ( 'Unknown stop code.\nresponse=' +
    //           JSON.stringify(response) );
    //   }
    //   if (stop_reason)  {
    //   new MessageBox ( stop_reason,'<div style="width:400px"><h2>' +
    //             stop_reason + '</h2>' + response.message +
    //             '.</div>','msg_stop' );
    //   } else  {
    //   onExit_func();
    //   $(dlg.element).dialog("close");
    //   }
  },null,'persist' );

}