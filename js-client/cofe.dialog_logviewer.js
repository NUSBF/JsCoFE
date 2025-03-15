
/*
 *  =================================================================
 *
 *    15.03.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_licence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Log Viewer Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2025
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// License dialog class

function LogViewerDialog ( log_ref,title )  {

  this.log_ref = log_ref;  // -1: client server 
                           //  0: FE 
                           //  1: NC #log_ref

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  let grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>' + title + '</h3>',0,0,1,1 );

  this.logPanel = grid.setPanel ( 1,0,1,1 );
  this.logPanel.setWidth ( '100%' );
  $(this.logPanel.element).css({
    'font-family'      : 'courier',
    'font-size'        : '14px',
    'width'            : '100%',
    'height'           : 'calc(100vh - 100px)',
    'border'           : '1px solid lightgray',
    // 'box-shadow'       : '5px 5px 6px #888888',
    'white-space'      : 'nowrap',
    'overflow-x'       : 'auto',
    'overflow-y'       : 'auto',
    'padding'          : '6px 6px 6px 6px'
  });

  this.setScrollable ( 'hidden','hidden' );

  let w = 3*$(window).width()/5;
  let h = 5*$(window).height()/6;

  let self = this;

  $(this.element).dialog({
    resizable : true,
    width     : w,
    height    : h,
    modal     : false,
    open      : function (e, ui) {
      self.logPanel.setHeight_px ( $(this).height()-70 );
      self.logPanel.setWidth_px  ( $(this).width() -12 );
      self.showLog();
    },
    resize: function() {
      self.logPanel.setHeight_px ( $(this).height()-70 );
      self.logPanel.setWidth_px  ( $(this).width() -12 );
    },
    buttons: [{
        id   : 'close_btn' + __id_cnt++,
        text : 'Close',
        click: function() {
          $(this).dialog('close');
        }
      }
    ]
  });

}

LogViewerDialog.prototype = Object.create ( Widget.prototype );
LogViewerDialog.prototype.constructor = LogViewerDialog;

LogViewerDialog.prototype.showLog = function()  {
  let self = this;
  serverRequest ( fe_reqtype.getLogFile,{
    log_ref : self.log_ref
  },'Log File Viewer',
    function(rdata){
      self.logPanel.setText ( '<pre>' + rdata.content + '</pre>' );
    },
    null,null
  );
}