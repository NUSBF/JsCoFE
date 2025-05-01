
/*
 *  =================================================================
 *
 *    23.04.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2022-2025
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

  this.callback_func = callback_func;
  this.aID_inp       = null;
  this.makeLayout();

  var self = this;
  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    // maxHeight : 600,
    // width     : 820,
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
                  (function(dlg){
                    self.accessProject ( function(done){
                      if (done)  {
                        callback_func ( true );
                        $(dlg).dialog('close');
                      }
                    });
                  }(this))
                }
      }, {
        id    : 'archdlg_cancel_btn',
        text  : 'Cancel', 
        click : function() { 
                  callback_func ( false );
                  $(this).dialog('close'); 
                }
      }
    ]

  });

}

AccessArchiveDialog.prototype = Object.create ( Widget.prototype );
AccessArchiveDialog.prototype.constructor = AccessArchiveDialog;

AccessArchiveDialog.prototype.makeLayout = function()  {

  var self = this;

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
  // $(panel.element).css({
  //   'width'      : 700,
  //   'height'     : 300,
  //   'overflow-y' : 'auto'
  // });

  var pgrid = new Grid ( '-compact' );
  panel.addWidget ( pgrid );

  pgrid.setLabel ( 'Access project with Archive ID:',0,0,1,1 ).setNoWrap();
  this.aID_inp = pgrid.setInputText ( '',0,1,1,1 ).setWidth ( '200px' )
                      .setStyle ( 'text','','CCP4-XXX.YYYY',
                                  appName() + ' Archive ID of project to access' )
                      .addOnInputListener(function(){
                        var s = this.value.trim().toUpperCase();
                        if (s && (!s.match(/^[0-9A-Z.\\-]+$/)))
                          s = s.slice(0,-1);
                        this.value = s;
                      });

  pgrid.setVerticalAlignment   ( 0,0,'middle' );
  pgrid.setVerticalAlignment   ( 0,1,'middle' );

  pgrid.setLabel ( '&nbsp;',1,0,1,1 ).setNoWrap();

  pgrid.setLabel ( 'Do not have Archive ID?',2,0,1,1 ).setFontItalic(true).setNoWrap();
  pgrid.setButton ( 'find Archive ID',image_path('search'),2,1,1,1 )
      .addOnClickListener(function(){
        new SearchArchiveDialog ( function(aid){
          if (aid)  {
            self.aID_inp.setValue ( aid );
            self.accessProject ( function(done){
              if (done)  {
                self.callback_func ( true );
                $(self.element).dialog('close');
              }
            });
          }
        });
      });

  pgrid.setVerticalAlignment   ( 2,0,'middle' );
  pgrid.setHorizontalAlignment ( 2,0,'right'  );
  pgrid.setVerticalAlignment   ( 2,1,'middle' );

}


// function isValidArchiveID ( archiveID )  {
// var lst = archiveID.split('-');
//   if (lst.length==2)  {
//     // lst = lst[1].split('.');
//     // return ((lst.length==2) && (lst[0].length==3) && (lst[1].length==4));
//     return (lst[1].length>0) && (lst[1].length<=8);
//   }
//   return false;
// }


function accessArchProject ( archiveID,mode,callback_func )  {

  serverRequest ( fe_reqtype.accessArchivedPrj,{
    archiveID : archiveID,
    mode      : mode
  },'Access Archived Project', function(response){

    let message  = '';
    let aid      = '<b>' + archiveID + '</b>';
    let archive  = appName() + ' Archive';
    let done     = false;
    let msg_icon = 'msg_system';
    switch (response.code)  {
      case 'project_not_found'    :  message = '<h2>Project not found</h2>' +
                                     'Project ' + aid + ' is not found in ' +
                                     archive;
                                     msg_icon = 'msg_excl_yellow';
                                  break;
      case 'already_accessed'     :  message = '<h2>Project already accessed</h2>' +
                                     'Project ' + aid + ' is in your <i>"' + 
                                     archive    + '"</i> folder already.';
                                     msg_icon = 'msg_information'; 
                                  break;
      case 'error_read_project'   :  message = '<h2>Project cannot be accessed</h2>' +
                                     'There are read errors when accessing project ' +
                                     aid + '. This project cannot be accessed ' +
                                     'without repairs. Please inform ' +
                                     report_problem(
                                       'Errors reading archived projwect ' + archiveID,
                                       'Read errors encountered at accessing archived ' +
                                       'project ' + archiveID,'' );
                                  break;
      case 'duplicate_name'       :  message = '<h2>Duplicate project name</h2>' +
                                     'Project ' + aid + ' cannot be accessed in ' +
                                     archive + ' because a project with this ' +
                                     'name is found in your work folder(s). Rename or ' +
                                     'delete your project before accessing it in ' +
                                     archive;
                                     msg_icon = 'msg_stop'; 
                                  break;
      case 'author_archive'       :  message = '<h2>Project archived by you</h2>' +
                                     'Project ' + aid + ' was archived by you ' +
                                     'and can be found in your ' +
                                     '<i>"Projects archived by me"</i> folder.';
                                     msg_icon = 'msg_information'; 
                                  break;
      case 'error_access_project' :  message = '<h2>Access errors (1)</h2>' +
                                     'There are link errors when accessing project ' +
                                     aid + '. This project cannot be accessed ' +
                                     'without repairs. Please inform ' +
                                     report_problem(
                                       'Errors accessing archived project ' + archiveID,
                                       'Link errors encountered at accessing archived ' +
                                       'project ' + archiveID,'' );
                                  break;
      case 'error_write_plist'    :  message = '<h2>Access errors (2)</h2>' +
                                     'There are write errors when accessing project ' +
                                     aid + '. This project cannot be accessed ' +
                                     'without repairs. Please inform ' +
                                     report_problem(
                                       'Errors accessing archived project ' + archiveID,
                                       'Project list write errors encountered at ' +
                                       'accessing archived project ' + archiveID,'' );
                                  break;
      case 'error_update_plist'   :  message = '<h2>Access errors (3)</h2>' +
                                     'There are general errors when accessing project ' +
                                     aid + '. This project cannot be accessed ' +
                                     'without repairs. Please inform ' +
                                     report_problem(
                                       'Errors accessing archived project ' + archiveID,
                                       'Project list update errors encountered at ' +
                                       'accessing archived project ' + archiveID,'' );
                                  break;
      case 'ok'                   :  message = '<h2>Access acquired</h2>' +
                                     'Project ' + aid + ' is now accessible to you ' +
                                     'via your "' + archive + '" folder.';
                                     msg_icon = 'msg_ok'; 
                                     done = true;
                                  break;
      default                     :  message = '<h2>Access errors (4)</h2>' +
                                     'Unknown return code encountered when accessing project ' +
                                     aid + '. Please inform ' +
                                     report_problem(
                                       'Errors accessing archived project '  + archiveID,
                                       'Unknown return code encountered at accessing ' +
                                       'archived project ' + archiveID,'' );
                                  break;
    }

    if ((mode!='strict') && 
        (['already_accessed','author_archive','ok'].indexOf(response.code)>=0))  {
      done = true;
    } else  {
      new MessageBox ( 'Accessing project ' + archiveID,
                       '<div style="width:350px">' + message + '</div>',
                       msg_icon );
    }
 
    callback_func ( done );

  },null,'persist' );
 
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
  
  // if (!isValidArchiveID(archiveID))  {
  //   new MessageBox ( 'Invalid Archive ID',
  //       '<div style="width:300px"><h2>Invalid Archive ID</h2>' +
  //       '<i>Please provide a valid ' + appName() + ' Archive ID, which '+
  //       'follows the following pattern: "ABCD-XXX.YYY".</i></div>',
  //       'msg_stop' );
  //   callback_func ( false );
  //   return;
  // }

  $( '#archdlg_access_btn' ).button('disable');
  $( '#archdlg_cancel_btn' ).button('disable');

  accessArchProject ( archiveID,'strict',function(done){
    $( '#archdlg_access_btn' ).button('enable');
    $( '#archdlg_cancel_btn' ).button('enable');
    callback_func ( done );
  });

}
