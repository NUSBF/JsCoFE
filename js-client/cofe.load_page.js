
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
  
  // Load task scripts with retry mechanism
  console.log('[' + getCurrentTimeString() + '] Starting task scripts loading with retry mechanism');
  
  // Check if we're coming from a page reload
  const fromPageReload = localStorage.getItem('fromPageReload') === 'true';
  // Clear the reload flag immediately to prevent issues with subsequent visits
  localStorage.removeItem('fromPageReload');
  
  // Try to restore session from localStorage first
  let sessionRestored = false;
  if (typeof loadSessionFromStorage === 'function') {
    sessionRestored = loadSessionFromStorage();
    console.log('[' + getCurrentTimeString() + '] Session restoration attempt: ' + (sessionRestored ? 'successful' : 'failed'));
    if (sessionRestored) {
      console.log('[' + getCurrentTimeString() + '] Page reload detected: ' + fromPageReload);
    }
  }
  
  // Start session
  let dev_switch = 0;
  // Pass the session restoration status to startSession
  startSession('scene', dev_switch, sessionRestored);
  
  // Only check for missing scripts after a short delay
  setTimeout(() => {
    // Only load missing scripts if needed
    loadTaskScripts().then(() => {
      console.log('[' + getCurrentTimeString() + '] Task scripts check completed');
    }).catch(error => {
      console.error('[' + getCurrentTimeString() + '] Error checking task scripts:', error);
    });
  }, 1000);
});


