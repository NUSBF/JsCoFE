
/*
 *  =================================================================
 *
 *    12.05.25   <--  Date of Last Modification.
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

  this.timer = null;

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element  );

  // make tabs
  let tabs = new Tabs();
  this.stdoutTab   = tabs.addTab ( 'Standard log',true  );
  this.stderrTab   = tabs.addTab ( 'Error log'   ,false );
  this.stdoutPanel = this.stdoutTab.grid.setLabel ( '',0,0,1,1 ); //.setHeight_px ( 32 );
  this.stderrPanel = this.stderrTab.grid.setLabel ( '',0,0,1,1 ); //.setHeight_px ( 32 );
  this.addWidget ( tabs );

  this.setScrollable ( 'hidden','hidden' );

  let w = 5*$(window).width()/6;
  let h = 5*$(window).height()/6;

  let self = this;

  $(this.element).dialog({
    resizable : true,
    width     : w,
    height    : h,
    modal     : false,
    open      : function ( e,ui ) {
      self.stdoutPanel.setHeight_px ( $(this).height()-100 );
      self.stderrPanel.setHeight_px ( $(this).height()-100 );
      self.showLogs();
    },
    resize    : function() {
      self.stdoutPanel.setHeight_px ( $(this).height()-100 );
      self.stderrPanel.setHeight_px ( $(this).height()-100 );
    },
    close     : function ( e,ui ) {
      if (self.timer)
        clearTimeout ( self.timer );
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


LogViewerDialog.prototype.setLogs = function ( rdata )  {
  let scrollPos_stdout = this.stdoutTab.getScrollPosition();
  let scrollPos_stderr = this.stderrTab.getScrollPosition();
  this.stdoutPanel.setText ( '<pre>' + rdata.stdout + '</pre>' );
  this.stderrPanel.setText ( '<pre>' + rdata.stderr + '</pre>' );
  if (scrollPos_stdout.top+scrollPos_stdout.clientHeight>scrollPos_stdout.height-6) {
    // keep scrolled down
    let sc = this.stdoutTab.getScrollPosition();
    scrollPos_stdout.top = sc.height - sc.clientHeight;
  }
  if (scrollPos_stderr.top+scrollPos_stderr.clientHeight>scrollPos_stderr.height-6) {
    // keep scrolled down
    let sc = this.stderrTab.getScrollPosition();
    scrollPos_stderr.top = sc.height - sc.clientHeight;
  }
  this.stdoutTab.setScrollPosition ( scrollPos_stdout );
  this.stderrTab.setScrollPosition ( scrollPos_stderr );  
}


LogViewerDialog.prototype.showLogs = function()  {
  let self = this;
  if (this.log_ref>=0)  {
    serverRequest ( fe_reqtype.getLogFiles,{
      log_ref : self.log_ref
    },'Log File Viewer',
      function(rdata){
        self.setLogs ( rdata );
      },
      function(){
        self.timer = setTimeout ( function(){
          self.showLogs();
        },5000);
      },null
    );
  } else  {
    // client NC log
    localCommand ( nc_command.getLogFiles,{},'Log File Viewer',
      function(response){
        self.setLogs ( response.data );
        self.timer = setTimeout ( function(){
          self.showLogs();
        },5000);
        return true;
      });
  }
}
