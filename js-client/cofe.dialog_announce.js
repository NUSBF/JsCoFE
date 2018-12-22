
/*
 *  =================================================================
 *
 *    03.09.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_announce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Announcement Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// License dialog class



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
                  '<a href="mailto:' + maintainerEmail +
                    '?Subject=jsCoFE%20Question">' + maintainerEmail +
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

  $('#choose_btn').button ( 'disable' );


}

AnnounceDialog.prototype = Object.create ( Widget.prototype );
AnnounceDialog.prototype.constructor = AnnounceDialog;
