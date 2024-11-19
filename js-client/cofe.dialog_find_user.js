
/*
 *  =================================================================
 *
 *    19.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_search_archive.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Find User Dialog (used in Admin Page)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// FindUserDialog class

function FindUserDialog ( callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Find User' );
  document.body.appendChild ( this.element );

  this.makeLayout();

  let self = this;
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
        id    : 'usersearch_btn',
        text  : 'Find user',
        click : function () {
          callback_func ({
            logname : self.logname .getValue().trim(),
            email   : self.email   .getValue().trim(),
            uname   : self.uname   .getValue().trim(),
          });
          $(this).dialog('close');
        }
      },{
        id    : 'usersearch_reset_btn',
        text  : 'Reset',
        click : function () {
          callback_func ( null );
          $(this).dialog('close');
        }
      }
    ]

  });

}


FindUserDialog.prototype = Object.create(Widget.prototype);
FindUserDialog.prototype.constructor = FindUserDialog;

FindUserDialog.prototype.makeLayout = function () {

  this.grid = new Grid('');
  this.addWidget(this.grid);

  this.grid.setLabel(' ',0,0,1,1);
  this.grid.setCellSize('','6px',0,0);
  this.grid.setImage(image_path('search'),'48px','48px',1,0,1,1);
  this.grid.setLabel('&nbsp;&nbsp;&nbsp;',0,1,2,1);

  this.grid.setLabel('<h2>Find User</h2><hr/>' +
    '<span style="font-size:85%"><i>' +
    'Provide at least one filter for search, or push <i>Reset</i> to return ' +
    'to the full list<br>&nbsp;</span>',
    0,2,2,1);
  this.grid.setVerticalAlignment(0,2,'middle');

  let pgrid = this.grid.setGrid('-compact',2,2,1,1);
  let r = 0;
  pgrid.setLabel('Login name:',r,0,1,1).setNoWrap();
  this.logname = pgrid.setInputText('',r++,1,1,1).setWidth('160px')
                      .setStyle('text','','j.r.nobody',
                                'User login name (case-sensitive)');
  pgrid.setLabel('E-mail:',r,0,1,1).setNoWrap();
  this.email   = pgrid.setInputText('',r++,1,1,1).setWidth('400px')
                      .setStyle('text','','j.r.nobody@uni-nowhere.edu',
                                'E-mail address (case-insensitive)');
  pgrid.setLabel('User name(s):',r,0,1,1).setNoWrap();
  this.uname   = pgrid.setInputText('',r++,1,1,1).setWidth('400px')
                      .setStyle('text','','John R. Nobody',
                                'User name(s) (case-insensitive; will select ' +
                                'everything with full or partial match)');
  for (let i=0;i<r;i++)  {
    pgrid.setVerticalAlignment ( i,0,'middle' );
    pgrid.setVerticalAlignment ( i,1,'middle' );
  }

}
