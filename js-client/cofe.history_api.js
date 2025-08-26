/*
 *  =================================================================
 *
 *    26.08.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.history_api.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  History API State Preservation
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2025
 *
 *  =================================================================
 *
 */

'use strict';

// Store the current page state before unload
window.addEventListener('beforeunload', function() {
    // Only store state if we have a current page
    if (__current_page) {
        const pageName = __current_page._type.replace('Page', '').toLowerCase();
        localStorage.setItem('lastPage', pageName);
    }
});

// Restore page state on load
// Note: The actual page restoration is now handled by the verifySession function
// This listener is kept for backward compatibility but doesn't actively restore pages
window.addEventListener('load', function() {
    // The session verification process in cofe.session.js now handles page restoration
    // This prevents race conditions and ensures the session is valid before restoring pages
    
    // Log that we're deferring to the session verification process
    if (localStorage.getItem('lastPage') && !window.location.search) {
        console.log('[' + getCurrentTimeString() + '] Page restoration deferred to session verification process');
    }
});

// Add a function to update browser history without changing page
function updateBrowserHistory(pageName) {
    if (window.history && window.history.replaceState) {
        window.history.replaceState({page: pageName}, pageName, `/${pageName}`);
    }
}

// Extend the existing page creation functions to update history
const originalMakeAdminPage = window.makeAdminPage;
window.makeAdminPage = function(sceneId) {
    originalMakeAdminPage(sceneId);
    updateBrowserHistory('admin');
    localStorage.setItem('lastPage', 'admin');
};

const originalMakeAccountPage = window.makeAccountPage;
window.makeAccountPage = function(sceneId) {
    originalMakeAccountPage(sceneId);
    updateBrowserHistory('account');
    localStorage.setItem('lastPage', 'account');
};

const originalMakeProjectListPage = window.makeProjectListPage;
window.makeProjectListPage = function(sceneId) {
    originalMakeProjectListPage(sceneId);
    updateBrowserHistory('projects');
    localStorage.setItem('lastPage', 'projects');
};

const originalMakeProjectPage = window.makeProjectPage;
window.makeProjectPage = function(sceneId) {
    originalMakeProjectPage(sceneId);
    updateBrowserHistory('project');
    localStorage.setItem('lastPage', 'project');
};

const originalMakeRegisterPage = window.makeRegisterPage;
window.makeRegisterPage = function(sceneId) {
    originalMakeRegisterPage(sceneId);
    updateBrowserHistory('register');
    localStorage.setItem('lastPage', 'register');
};