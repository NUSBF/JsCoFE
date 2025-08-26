/*
 *  =================================================================
 *
 *    26.08.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.session_persistence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Session persistence across page reloads
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2025
 *
 *  =================================================================
 *
 */

'use strict';

// Save session data to localStorage
function saveSessionToStorage() {
    if (__login_token) {
        const sessionData = {
            login_token: __login_token,
            login_id: __login_id,
            login_user: __login_user,
            user_role: __user_role,
            user_licence: __user_licence,
            globus_id: __globus_id,
            dormant: __dormant,
            cloud_storage: __cloud_storage,
            user_settings: __user_settings,
            timestamp: new Date().getTime()
        };
        
        localStorage.setItem('ccp4cloud_session', JSON.stringify(sessionData));
        console.log('[' + getCurrentTimeString() + '] Session saved to localStorage for user: ' + __login_user);
        console.log('[' + getCurrentTimeString() + '] Token: ' + __login_token.substring(0, 5) + '...');
        
        // Also log the current page if available
        if (__current_page) {
            const pageName = __current_page._type.replace('Page', '').toLowerCase();
            console.log('[' + getCurrentTimeString() + '] Current page: ' + pageName);
        }
    }
}

// Load session data from localStorage
function loadSessionFromStorage() {
    const sessionDataStr = localStorage.getItem('ccp4cloud_session');
    
    if (sessionDataStr) {
        try {
            const sessionData = JSON.parse(sessionDataStr);
            
            // Check if session is still valid (24 hour expiration)
            const currentTime = new Date().getTime();
            const sessionTime = sessionData.timestamp || 0;
            const sessionAge = (currentTime - sessionTime) / (1000 * 60 * 60); // in hours
            
            if (sessionAge < 24) {
                // Restore session variables
                __login_token = sessionData.login_token;
                __login_id = sessionData.login_id;
                __login_user = sessionData.login_user;
                __user_role = sessionData.user_role;
                __user_licence = sessionData.user_licence;
                __globus_id = sessionData.globus_id;
                __dormant = sessionData.dormant;
                __cloud_storage = sessionData.cloud_storage;
                
                // Only restore settings if they exist
                if (sessionData.user_settings) {
                    __user_settings = sessionData.user_settings;
                }
                
                console.log('[' + getCurrentTimeString() + '] Session restored from localStorage for user: ' + __login_user);
                console.log('[' + getCurrentTimeString() + '] Token: ' + __login_token.substring(0, 5) + '...');
                return true;
            } else {
                console.log('[' + getCurrentTimeString() + '] Session expired (age: ' + sessionAge.toFixed(2) + ' hours)');
                // Clear expired session
                clearSessionStorage();
            }
        } catch (e) {
            console.error('Error parsing session data:', e);
            // Clear invalid session data
            clearSessionStorage();
        }
    } else {
        console.log('[' + getCurrentTimeString() + '] No session found in localStorage');
    }
    
    return false;
}

// Clear session data from localStorage
function clearSessionStorage() {
    localStorage.removeItem('ccp4cloud_session');
    console.log('[' + getCurrentTimeString() + '] Session cleared from localStorage');
}

// Save session when page is unloaded
window.addEventListener('beforeunload', function() {
    saveSessionToStorage();
});

// Automatically save session every 5 minutes
setInterval(saveSessionToStorage, 5 * 60 * 1000);