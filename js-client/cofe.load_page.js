
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
  
  // If we're coming from a page reload, load task scripts first
  if (fromPageReload) {
    // Load task scripts with retry mechanism
    loadTaskScripts().then(() => {
      console.log('[' + getCurrentTimeString() + '] Task scripts loaded, starting session');
      let dev_switch = 0;
      startSession('scene', dev_switch);
    }).catch(error => {
      console.error('[' + getCurrentTimeString() + '] Failed to load task scripts:', error);
      // Start session anyway
      let dev_switch = 0;
      startSession('scene', dev_switch);
    });
  } else {
    // Normal flow - start session first, then load task scripts
    let dev_switch = 0;
    startSession('scene', dev_switch);
    
    // Load task scripts in the background
    setTimeout(() => {
      loadTaskScripts().then(() => {
        console.log('[' + getCurrentTimeString() + '] Task scripts loaded in background');
      });
    }, 1000);
  }
});


