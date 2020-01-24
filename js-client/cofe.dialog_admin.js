
/*
 *  =================================================================
 *
 *    22.01.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_announce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Announcement Dialog
 *       ~~~~~~~~~  Dorman Users Dialog
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// User announcement dialog class

function AnnounceDialog()  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Announcement' );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h2>Announcement for all users</h2>',0,0,1,3 );

  var header = grid.setLabel ( 'Dear &lt;User Name&gt;,<p>' +
                  'You receive this e-mail bacause you are registered as a ' +
                  appName() + ' user.',1,0,1,3 );

  var textarea = grid.setTextArea ( '','Place text of the announcement here',
                   5,80, 2,0,1,3 );

  grid.setLabel ( '&nbsp;',3,0,1,3 );

  var footer = grid.setLabel ( 'This e-mail was sent from unmanned ' +
                  'mailbox, please do not reply as replies cannot be<br>' +
                  'received. For any questions, please contact ' + appName() +
                  ' maintainer at ' +
                  '<a href="mailto:' + __maintainerEmail +
                    '?Subject=jsCoFE%20Question">' + __maintainerEmail +
                  '</a>.<p>Kind regards<p>' + appName() + ' maintenance.',
                  4,0,1,3 );


  //w = 3*$(window).width()/5 + 'px';

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
          var message = header  .getText () + '<p>' +
                        textarea.getValue() + '<p>' +
                        footer  .getText ();
          serverRequest ( fe_reqtype.sendAnnouncement,message,'Admin Page',
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

//  $('#choose_btn').button ( 'disable' );


}

AnnounceDialog.prototype = Object.create ( Widget.prototype );
AnnounceDialog.prototype.constructor = AnnounceDialog;



// -------------------------------------------------------------------------
// User dormant users dialog class

function DormantUsersDialog ( callback_func )  {

  function getInteger ( param_inp )  {
  var text = param_inp.getValue().trim();
    if ((text.length>0) && (isInteger(text)))
      return parseInt ( text );
    return 'NaN';
  }

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Dormant Users' );
  document.body.appendChild ( this.element );

  var grid = new Grid('-compact');
  var row  = 0;
  this.addWidget    ( grid );
  grid.setLabel     ( '<h2>Dormant users management</h2>',row++,0,1,5 );

  grid.setLabel     ( '<b>&#8226; <i>declare user account as dormant, if</i></b>',row,0,1,5 );
  grid.setAlignment ( row++,0,'middle','left' );
  grid.setLabel     ( '&nbsp;&nbsp;&nbsp;&nbsp;user is inactive during last',row,0,1,1 );
  grid.setAlignment ( row  ,0,'middle','right' );
  var period1_inp = grid.setInputText ( '365', row,1,1,1 )
                        .setStyle ( 'text','integer','365',
                                    'Inactivity period for making a user dormant' )
                        .setWidth_px ( 50 );
  grid.setLabel     ( 'days, <b><i>or</i></b>',row,2,1,1 );
  grid.setAlignment ( row++,2,'middle','left' );
  grid.setLabel     ( 'has run fewer than',row,0,1,1 );
  grid.setAlignment ( row,0,'middle','right' );
  var njobs_inp = grid.setInputText ( '5', row,1,1,1 )
                      .setStyle ( 'text','integer','5',
                                  'Maximum number of jobs for making a user dormant' )
                      .setWidth_px ( 50 );
  grid.setLabel     ( 'jobs <b><i>and</i></b> is inactive during last',row,2,1,1 );
  grid.setAlignment ( row,2,'middle','left' );
  var period2_inp = grid.setInputText ( '90', row,3,1,1 )
                        .setStyle ( 'text','integer','90',
                                    'Inactivity period for making a user dormant' )
                        .setWidth_px ( 50 );
  grid.setLabel     ( 'days',row,4,1,1 );
  grid.setAlignment ( row++,4,'middle','left' );

  grid.setLabel     ( '&nbsp;',row++,0,1,1 );

  grid.setLabel     ( '<b>&#8226; <i>delete user account, if</i></b>',row,0,1,5 );
  grid.setAlignment ( row++,0,'middle','left' );
  grid.setLabel     ( '&nbsp;&nbsp;&nbsp;&nbsp;it remains dormant during',row,0,1,1 );
  grid.setAlignment ( row  ,0,'middle','right' );
  var period3_inp = grid.setInputText ( '90', row,1,1,1 )
                        .setStyle ( 'text','integer','90',
                                    'Inactivity period for deleting a dormant account' )
                        .setWidth_px ( 50 );
  grid.setLabel     ( 'days',row,2,1,1 );
  grid.setAlignment ( row++,2,'middle','left' );

  grid.setLabel ( '&nbsp;<br><i>Affected users will be notified by e-mail.</i>',row,0,1,5 );

  //w = 3*$(window).width()/5 + 'px';

  (function(dlg){
    $(dlg.element).dialog({
      resizable : false,
      height    : 'auto',
      maxHeight : 600,
      width     : 700,
      modal     : true,
      buttons: [
        {
          id   : "apply_btn",
          text : "Apply",
          click: function() {

            var _params = {
              'period1'   : getInteger(period1_inp),
              'period2'   : getInteger(period2_inp),
              'njobs'     : getInteger(njobs_inp),
              'period3'   : getInteger(period3_inp),
              'checkOnly' : true
            };
            if ((_params.period1=='NaN') || (_params.period2=='NaN') ||
                (_params.period3=='NaN') || (_params.njobs=='NaN'))  {
              new MessageBox ( 'Wrong integer input',
                               '<h2>Wrong integer input</h2>Please check input fields' );
              return;
            }

            serverRequest ( fe_reqtype.manageDormancy,_params,'Admin Page',
                            function(data){
              if (data.status!='ok')  {
                new MessageBox ( 'Dormancy management',
                                 '<h2>Failure</h2>' + data.status );
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
                      '</tr></table>',
                      'Confirm',function(){
                        _params.checkOnly = false;
                        serverRequest ( fe_reqtype.manageDormancy,_params,'Admin Page',
                                        function(data){
                          if (data.status!='ok')  {
                            new MessageBox ( 'Dormancy management',
                                             '<h2>Failure</h2>' + data.status );
                          } else  {
                            new MessageBox ( 'Dormancy management',
                               '<h2>Summary</h2>Out of ' + data.total_users +
                               ' users accounts, ' +
                               data.dormant_users + ' were declared dormant,<br>and ' +
                               data.deleted_users + ' were deleted. ' +
                               (data.disk_freed + data.disk_released) +
                               ' MBytes of disk released.' );
                            $(dlg.element).dialog("close");
                            if (callback_func)
                              callback_func();
                          }
                        },null,'persist' );
                      },
                      'Cancel' ,function(){});
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
