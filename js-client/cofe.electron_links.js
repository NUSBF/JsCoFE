
/*
 *  ==========================================================================
 *
 *    23.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.electron_links.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Links with Electron
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2024
 *
 *  ==========================================================================
 *
 */

'use strict';

// ===========================================================================

var __electron_download_progress = null;
var __electron_find_text_dialog  = null;

// ---------------------------------------------------------------------------

function isElectronAPI()  {
  return ('electronAPI' in window);
}

function sendMessageToElectron ( message )  {
  if ('electronAPI' in window)
    window.electronAPI.sendMessage ( 'message-from-app',message );
}

// ---------------------------------------------------------------------------

function DownloadProgressDialog()  {

  InputBox.call ( this,'Download progress' );

  this.setText ( '','export' );

  this.title_lbl   = this.grid.setLabel ( '<h2>Downloading ...</h2>',0,2,2,3 );
  this.progressBar = new ProgressBar ( 0 );
  this.grid.setWidget ( this.progressBar, 2,2,1,3 );
  this.progressBar.setWidth_px  ( 400 );
  this.message_lbl = this.grid.setLabel ( 
      '<i style="font-size:90%;width:400px;">in progress, please wait ...</i>',
      3,2,1,3 );
  this.grid.setHorizontalAlignment ( 3,2,"right" );

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
  this.title_lbl  .setText ( '<h2>Download complete</h2>Find it at <pre>' + 
                             savePath + '</pre>' );
  this.message_lbl.hide();
  this.progressBar.hide();
  $('#close_btn') .show();
}

DownloadProgressDialog.prototype.setFailed = function ( savePath )  {
  this.title_lbl  .setText ( '<h2>Download failed.</h2>Try it again.' );
  this.message_lbl.hide();
  this.progressBar.hide();
  $('#close_btn') .show();
}

// ---------------------------------------------------------------------------

let __electron_search_text = '';

function FindTextDialog()  {

  InputBox.call ( this,'Find text' );

  this.setText ( 'Find text','find' );

  this.grid.setLabel ( '<h2>Find text</h2>',0,2,2,2 );
  this.grid.setLabel ( 'Find:&nbsp;',2,2,1,1 );
  let findtext_inp = this.grid.setInputText ( __electron_search_text,2,3,1,1 )
      .setStyle      ( 'text','','Put a search string here','' )
      .setFontItalic ( true )
      .setWidth      ( '220px' );
  this.setNoWrap     ( 0,2 );
  this.setNoWrap     ( 2,2 );
  this.setVerticalAlignment ( 2,2,'middle' );

  let find_btn_id = 'find_btn_' + __id_cnt++;

  this.options = {
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : false,
    buttons   : [
      {
        id    : find_btn_id,
        text  : "Find",
        click : function() {
          __electron_search_text = findtext_inp.getValue();
          window.electronAPI.searchText ( __electron_search_text );
        }
      }, {
        text  : "Next",
        click : function() {
          window.electronAPI.findNext();
        }
      }, {
        text  : "Previous",
        click : function() {
          window.electronAPI.findPrevious();
        }
      }, {
        text  : "Close",
        click : function() {
          window.electronAPI.stopSearch();
          __electron_find_text_dialog = null;
          $(this).dialog ( 'close' );
        }
      }
    ]
  };

  $(this.element).dialog ( this.options );

  $(this.element).keydown(function (e) {
    if (e.key == "Enter") {
      // unsetDefaultButton ( button,context_widget );
      // handle click logic here
      __electron_search_text = findtext_inp.getValue();
      window.electronAPI.searchText ( __electron_search_text );
      e.preventDefault();
      return true;
    }
  });

}

FindTextDialog.prototype = Object.create ( InputBox.prototype );
FindTextDialog.prototype.constructor = FindTextDialog;

FindTextDialog.prototype.close = function()  {
  $(this.element).dialog ( 'close' );
}


// ===========================================================================

if (isElectronAPI())  {

  sendMessageToElectron ( 'version:' + appVersion() );

  // document.getElementById('download-button').addEventListener('click', () => {
  //   const downloadUrl = 'https://example.com/file-to-download.zip';
  //   window.electronAPI.startDownload(downloadUrl);
  // });

  window.electronAPI.onDownloadProgress ( (event,progress) => {
    if (!__electron_download_progress)
      __electron_download_progress = new DownloadProgressDialog();
    if (isFloat(progress))
      __electron_download_progress.setProgress ( 100*progress );
  });

  window.electronAPI.onDownloadComplete ( (event,savePath) => {
    __electron_download_progress.setComplete ( savePath );
    // alert(`Download Complete: ${savePath}`);
    // __electron_download_progress.close();
    __electron_download_progress = null;
  });

  window.electronAPI.onDownloadFailed(() => {
    __electron_download_progress.setFailed();
    __electron_download_progress = null;
    // alert('Download Failed');
  });

  window.electronAPI.onDownloadCancelled(() => {
    __electron_download_progress = null;
    alert('Download Cancelled');
  });

  window.electronAPI.onNavigateBack(() => {
    window.history.back();
  });

  window.electronAPI.onNavigateForward(() => {
    window.history.forward();
  });

  window.electronAPI.onStartSearch(() => {
    if (__electron_find_text_dialog)
      __electron_find_text_dialog.close();
    __electron_find_text_dialog = new FindTextDialog();
  });

}


