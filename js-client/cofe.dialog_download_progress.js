
/*
 *  =================================================================
 *
 *    04.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_download_progress.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Download Progress Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Export job dialog class

function DownloadProgressDialog()  {

  InputBox.call ( this,'Download progress' );

  this.setText ( '','export' );

  this.title_lbl = this.grid.setLabel ( '<h2>Downloading ...</h2>',0,2,2,3 );

  this.progressBar = new ProgressBar ( 0 );
  this.grid.setWidget ( this.progressBar, 3,2,1,3 );
  this.progressBar.setWidth_px  ( 400 );
  // this.progressBar.setHeight_px ( 16  );
  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 'auto',
    modal     : true,
    open      : function(event, ui) {
      $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
    },
    buttons   : [
      {
        id    : "close_btn",
        text  : "Close",
        click : function() {
          $(this).dialog("close");
        }
      }
    ]
  });

  window.setTimeout ( function(){ $('#close_btn').hide(); },0 );

}

DownloadProgressDialog.prototype = Object.create ( InputBox.prototype );
DownloadProgressDialog.prototype.constructor = DownloadProgressDialog;

DownloadProgressDialog.prototype.setProgress = function ( value )  {
  // console.log ( ' >>>>> value=' + value );
  // this.progressBar.setValue ( value );
}

DownloadProgressDialog.prototype.setComplete = function ( savePath )  {
  this.title_lbl.setText ( '<h2>Download complete</h2>Find it at <pre>' + 
                           savePath + '</pre>' );
  this.progressBar.hide();
  $('#close_btn').show();
}

DownloadProgressDialog.prototype.setFailed = function ( savePath )  {
  this.title_lbl.setText ( '<h2>Download failed.</h2>Try it again.' );
  this.progressBar.hide();
  $('#close_btn').show();
}
