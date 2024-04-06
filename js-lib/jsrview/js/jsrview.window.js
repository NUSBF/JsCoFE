//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.window.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's window module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';


function popupWindow ( uri )  {
  winref = window.open ( uri,"",toolbar=0,directories=0,status=0,menubar=0,resizable=1 );
}

function close_window()  {
  if (window.rvGate)   // running in jsrview browser
    window.rvGate.closeWindow();
  else  {  // running in a normal browser
    // working trick, without which window.close() does not work
    // when invoked after multiple reloads
    window.open('', '_self', '');
    window.close();
  }
  return false;
}

function print_window()  {
  if (window.rvGate)  window.rvGate.printWindow();
                else  window.print();
}

function pref_dialog()  {
  if (window.rvGate)
    window.rvGate.prefDialog();
}


function setWaitDialog ( title,message,delay )  {
  _waitDialogTitle     = title;
  _waitDialogMessage   = message;
  _waitDialogCountdown = delay;
}
