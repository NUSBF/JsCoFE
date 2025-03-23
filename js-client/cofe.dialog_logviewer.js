
/*
 *  =================================================================
 *
 *    23.03.25   <--  Date of Last Modification.
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
  let stdoutTab  = tabs.addTab ( 'Standard log',true  );
  let stderrTab  = tabs.addTab ( 'Error log'   ,false );
  this.stdoutPanel = stdoutTab.grid.setLabel  ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.stderrPanel = stderrTab.grid.setLabel  ( '',0,0,1,1 ).setHeight_px ( 32 );
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
      self.showLog();
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


LogViewerDialog.prototype.showLog = function()  {
  let self = this;
  if (this.log_ref>=0)  {
    serverRequest ( fe_reqtype.getLogFiles,{
      log_ref : self.log_ref
    },'Log File Viewer',
      function(rdata){
        self.stdoutPanel.setText ( '<pre>' + rdata.stdout + '</pre>' );
        self.stderrPanel.setText ( '<pre>' + rdata.stderr + '</pre>' );
      },
      function(){
        self.timer = setTimeout ( function(){
          self.showLog();
        },5000);
      },null
    );
  } else  {
    // client NC log
    localCommand ( nc_command.getLogFiles,{},'Log File Viewer',
      function(response){
        self.stdoutPanel.setText ( '<pre>' + response.data.stdout + '</pre>' );
        self.stderrPanel.setText ( '<pre>' + response.data.stderr + '</pre>' );
        self.timer = setTimeout ( function(){
          self.showLog();
        },5000);
        return true;
      });
  }
}
