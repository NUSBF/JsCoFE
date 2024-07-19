
/*
 *  =================================================================
 *
 *    13.07.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_announce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Send To All Dialog
 *       ~~~~~~~~~  Announcement Dialog
 *                  Dormant Users Dialog
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Send mail to all users dialog class

function SendToAllDialog()  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Send to all' );
  document.body.appendChild ( this.element );

  let grid = new Grid ( '' );
  let row  = 0;
  let col  = 2;
  this.addWidget   ( grid );
  grid.setLabel    ( ' ',row,0,1,1 );
  grid.setCellSize ( '','6px', row,0 );
  grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',row,1,2,1 );
  grid.setLabel    ( '<h2>Send message to all users</h2>',row,col,2,3 );
  grid.setAlignment ( row++,col,'middle','left' );
  grid.setImage    ( image_path('sendtoall'),'48px','48px', row++,0,1,1 );

  let header = grid.setLabel ( 'Dear &lt;User Name&gt;,<p>' +
                  'You receive this e-mail bacause you are registered as a ' +
                  appName() + ' user.',row++,col,1,3 );

  let textarea = grid.setTextArea ( '','Place text of the e-mail here',
                   5,72, row++,col,1,3 );

  let footer = grid.setLabel ( 'This e-mail was sent from unmanned ' +
                  'mailbox, please do not reply as replies cannot be ' +
                  'received. For any questions, please contact ' + appName() +
                  ' maintainer at ' +
                  '<a href="mailto:' + __maintainerEmail +
                    '?Subject=' + encodeURI(appName()) + '%20Question">' +
                     __maintainerEmail +
                  '</a>.<p>Kind regards<p>' + appName() + ' maintenance.',
                  row++,col,1,3 );

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 600,
    width     : 700,
    modal     : true,
    buttons: [
      {
        id   : "send_btn",
        text : "Send",
        click: function() {
          let message = header  .getText () + '<p>' +
                        textarea.getValue() + '<p>' +
                        footer  .getText ();
          serverRequest ( fe_reqtype.sendMailToAllUsers,message,'Admin Page',
                          function(data){},null,'persist' );
          $(this).dialog("close");
        }
      },
      {
        id   : "cancel_btn",
        text : "Cancel",
        click: function() {
          $(this).dialog("close");
        }
      }
    ]
  });

}

SendToAllDialog.prototype = Object.create ( Widget.prototype );
SendToAllDialog.prototype.constructor = SendToAllDialog;


// -------------------------------------------------------------------------
// User announcement dialog class

function AnnouncementDialog()  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Announcement' );
  document.body.appendChild ( this.element );

  // let grid = new Grid('');
  // this.addWidget ( grid );
  // grid.setLabel ( '<h2>Announcement for all users</h2>',0,0,1,3 );

  let grid = new Grid ( '' );
  let row  = 0;
  let col  = 2;
  this.addWidget   ( grid );
  grid.setLabel    ( ' ',row,0,1,1 );
  grid.setCellSize ( '','6px', row,0 );
  grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',row,1,2,1 );
  grid.setLabel    ( '<h2>Announcement</h2>',row,col,2,3 );
  // grid.setVerticalAlignment ( row,col,'middle' );
  grid.setAlignment ( row++,col,'middle','left' );
  grid.setImage    ( image_path('announce'),'48px','48px', row++,0,1,1 );

  grid.setLabel ( '<span style="font-size:90%"><i>' +
                  'Put text of the announcement in HTML format below. ' +
                  'It will appear as a pop-up message in login page.' +
                  '</i></span>',
                  row++,col,1,3 );

  let announcement = grid.setTextArea ( '','Place text of the announcement here',
                                        15,80, row++,col,1,3 );

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    // maxHeight : 600,
    width     : 'auto',
    modal     : true,
    buttons: [
      {
        id   : "on_btn",
        text : "Put up",
        click: function() {
          serverRequest ( fe_reqtype.makeAnnouncement,{
                            action : 'on',
                            text   : announcement.getValue()
                          },'Admin Page',
                          function(data){},null,'persist' );
          $(this).dialog("close");
        }
      },
      {
        id   : "off_btn",
        text : "Take down",
        click: function() {
          serverRequest ( fe_reqtype.makeAnnouncement,{
                            action : 'off',
                            text   : announcement.getValue()
                          },'Admin Page',
                          function(data){},null,'persist' );
          $(this).dialog("close");
        }
      }
    ]
  });

  serverRequest ( fe_reqtype.makeAnnouncement,{
                    action : 'read',
                    text   : '***'
                  },'Admin Page',
                  function(data){
                    announcement.setValue ( data.text )
                  },null,'persist' );

}

AnnouncementDialog.prototype = Object.create ( Widget.prototype );
AnnouncementDialog.prototype.constructor = AnnouncementDialog;



// -------------------------------------------------------------------------
// User dormant users dialog class

function DormantUsersDialog ( callback_func )  {

  function getInteger ( param_inp )  {
  let text = param_inp.getValue().trim();
    if ((text.length>0) && (isInteger(text)))
      return parseInt ( text );
    return 'NaN';
  }

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Dormant Users' );
  document.body.appendChild ( this.element );

  // let grid = new Grid('-compact');

  let grid = new Grid ( '' );
  let row  = 0;
  let col  = 2;
  this.addWidget   ( grid );
  grid.setLabel    ( ' ',row,0,1,1 );
  grid.setCellSize ( '','6px', row,0 );
  grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',row,1,2,1 );
  grid.setLabel    ( '<h2>Dormant users management</h2>' +
                     '<b>&#8226; <i>declare user account as dormant, if</i></b>',row,col,2,5 );
  // grid.setVerticalAlignment ( row,col,'middle' );
  grid.setAlignment ( row++,col,'middle','left' );
  grid.setImage    ( image_path('dormant'),'48px','48px', row++,0,1,1 );

  // this.addWidget    ( grid );
  // grid.setLabel     ( '<h2>Dormant users management</h2>',row++,0,1,5 );

  // grid.setLabel     ( '<b>&#8226; <i>declare user account as dormant, if</i></b>',row,0,1,5 );
  // grid.setAlignment ( row++,0,'middle','left' );
  grid.setLabel     ( '&nbsp;&nbsp;&nbsp;&nbsp;user is inactive during last&nbsp;',row,col,1,1 );
  grid.setAlignment ( row,col,'middle','right' );
  let period1_inp = grid.setInputText ( '730', row,col+1,1,1 )
                        .setStyle ( 'text','integer','365',
                                    'Inactivity period for making a user dormant' )
                        .setWidth_px ( 60 );
  grid.setLabel     ( '&nbsp;days, <b><i>or</i></b>',row,col+2,1,1 );
  grid.setAlignment ( row++,col+2,'middle','left' );
  grid.setLabel     ( 'has run fewer than&nbsp;',row,col,1,1 );
  grid.setAlignment ( row,col,'middle','right' );
  let njobs_inp = grid.setInputText ( '5', row,col+1,1,1 )
                      .setStyle ( 'text','integer','5',
                                  'Maximum number of jobs for making a user dormant' )
                      .setWidth_px ( 60 );
  grid.setLabel     ( '&nbsp;jobs <b><i>and</i></b> is inactive during last&nbsp;',row,col+2,1,1 );
  grid.setAlignment ( row,col+2,'middle','left' );
  let period2_inp = grid.setInputText ( '730', row,col+3,1,1 )
                        .setStyle ( 'text','integer','90',
                                    'Inactivity period for making a user dormant' )
                        .setWidth_px ( 60 );
  grid.setLabel     ( '&nbsp;days',row,col+4,1,1 );
  grid.setAlignment ( row++,col+4,'middle','left' );

  grid.setLabel     ( '&nbsp;',row++,col,1,1 );

  grid.setLabel     ( '<b>&#8226; <i>delete user account, if</i></b>',row,col,1,5 );
  grid.setAlignment ( row++,col,'middle','left' );
  grid.setLabel     ( '&nbsp;&nbsp;&nbsp;&nbsp;it remains dormant during&nbsp;',row,col,1,1 );
  grid.setAlignment ( row  ,col,'middle','right' );
  let period3_inp = grid.setInputText ( '365000', row,col+1,1,1 )
                        .setStyle ( 'text','integer','90',
                                    'Inactivity period for deleting a dormant account' )
                        .setWidth_px ( 60 );
  grid.setLabel     ( '&nbsp;days',row,col+2,1,1 );
  grid.setAlignment ( row++,col+2,'middle','left' );

  grid.setLabel ( '&nbsp;<br><i>Affected users will be notified by e-mail.</i>',row,col,1,5 );

  //w = 3*$(window).width()/5 + 'px';

  (function(dlg){
    $(dlg.element).dialog({
      resizable : false,
      height    : 'auto',
      maxHeight : 600,
      width     : 750,
      modal     : true,
      buttons: [
        {
          id   : "apply_btn",
          text : "Apply",
          click: function() {

            let _params = {
              'period1'   : getInteger(period1_inp),
              'period2'   : getInteger(period2_inp),
              'njobs'     : getInteger(njobs_inp),
              'period3'   : getInteger(period3_inp),
              'checkOnly' : true
            };
            if ((_params.period1=='NaN') || (_params.period2=='NaN') ||
                (_params.period3=='NaN') || (_params.njobs=='NaN'))  {
              new MessageBox ( 'Wrong integer input',
                               '<h2>Wrong integer input</h2>Please check input fields', 'msg_error' );
              return;
            }

            serverRequest ( fe_reqtype.manageDormancy,_params,'Admin Page',
                            function(data){
              if (data.status!='ok')  {
                new MessageBox ( 'Dormancy management',
                                 '<h2>Failure</h2>' + data.status, 'msg_error');
              } else  {
                new QuestionBox ( 'Dormancy management',
                      '<h2>Changes about to be made</h2><table><tr>'     +
                          '<td></td>'         +
                          '<td><b><i>Number&nbsp;&nbsp;</b></i></td>'    +
                          '<td><b><i>Disk effect (MB)</b></i></td>'      +
                      '</tr><tr><td><b><i>Total user accounts:</b></i></td><td>' +
                          '&nbsp;&nbsp;&nbsp;' + data.total_users   + '</td><td></td>' +
                      '</tr><tr><td><b><i>To become dormant:&nbsp;&nbsp;</b></i></td><td>' +
                          '&nbsp;&nbsp;&nbsp;' + data.dormant_users + '</td><td>'      +
                          '&nbsp;&nbsp;&nbsp;' + data.disk_released + '</td>'          +
                      '</tr><tr><td><b><i>To be deleted:</b></i></td><td>' +
                          '&nbsp;&nbsp;&nbsp;' + data.deleted_users + '</td><td>'      +
                          '&nbsp;&nbsp;&nbsp;' + data.disk_freed    + '</td></tr>'     +
                      '</tr><tr><td><b><i>Total disk effect:</b></i></td><td>&nbsp;</td><td>' +
                          '&nbsp;&nbsp;&nbsp;' + (data.disk_freed + data.disk_released) + '</td>' +
                      '</tr></table>',[
                      { name    : 'Confirm',
                        onclick : function(){
                                    _params.checkOnly = false;
                                    serverRequest ( fe_reqtype.manageDormancy,_params,'Admin Page',
                                                    function(data){
                                      if (data.status!='ok')  {
                                        new MessageBox ( 'Dormancy management',
                                                         '<h2>Failure</h2>' + data.status, 'msg_error' );
                                      } else  {
                                        new MessageBox ( 'Dormancy management',
                                           '<h2>Summary</h2>Out of ' + data.total_users +
                                           ' users accounts, ' +
                                           data.dormant_users  + ' were declared dormant,<br>and ' +
                                           data.deleted_users  + ' were deleted. '   +
                                           (data.disk_freed    + data.disk_released) +
                                           ' MBytes of disk released.' );
                                        $(dlg.element).dialog("close");
                                        if (callback_func)
                                          callback_func();
                                      }
                                    },null,'persist' );
                                  }
                      },{
                        name    : 'Cancel',
                        onclick : function(){}
                      }
                    ],'msg_confirm');

              }
            },null,'persist' );

          }
        },
        {
          id   : "cancel_btn",
          text : "Cancel",
          click: function() {
            $(dlg.element).dialog("close");
          }
        }
      ]
    });
  }(this))

}

DormantUsersDialog.prototype = Object.create ( Widget.prototype );
DormantUsersDialog.prototype.constructor = DormantUsersDialog;
