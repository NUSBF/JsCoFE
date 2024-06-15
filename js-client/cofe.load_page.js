
/*
 *  =================================================================
 *
 *    02.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_licence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Licence Dialog
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

// now in main-page css
// document.body.style.fontSize = '16px';   // this is necessary for jquery
//                                          // dialogs to have correct layout
//                                          // despite explicit sizing set in
//                                          // main-page CSS class; it is
//                                          // unclear why
// document.body.style.overflow = 'hidden'; // this is because of buggy Chrome
//$(window).on ( 'load', function(){


$(document).ready ( function(){
  // setDarkMode ( isDarkMode() );
  // document.body.style.cursor = "default"; 
  bindToBrowserColorMode();
  //console.log ( '   ready=' + document.readyState );
  /*
  alert ( window.location.search );
  window.history.replaceState({}, document.title, "/" );
  */
  let dev_switch = 0; //3;
  startSession ( 'scene',dev_switch );
});


