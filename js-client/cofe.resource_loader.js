/*
 *  =================================================================
 *
 *    26.08.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.resource_loader.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Resource loading with retry mechanism
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2025
 *
 *  =================================================================
 *
 */

'use strict';

// Keep track of scripts that need to be loaded
const pendingScripts = new Set();
const loadedScripts = new Set();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Function to load a script with retry mechanism
function loadScriptWithRetry(src, retryCount = 0) {
    // Skip if already loaded
    if (loadedScripts.has(src)) {
        return Promise.resolve();
    }
    
    // Skip if already pending
    if (pendingScripts.has(src)) {
        return new Promise((resolve, reject) => {
            // Check every 100ms if the script has been loaded
            const checkInterval = setInterval(() => {
                if (loadedScripts.has(src)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`Timeout waiting for script: ${src}`));
            }, 10000);
        });
    }
    
    // Add to pending scripts
    pendingScripts.add(src);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        
        script.onload = () => {
            // Success logs removed to reduce console clutter
            pendingScripts.delete(src);
            loadedScripts.add(src);
            resolve();
        };
        
        script.onerror = () => {
            console.log(`[${getCurrentTimeString()}] Failed to load: ${src}, retry: ${retryCount + 1}/${MAX_RETRIES}`);
            pendingScripts.delete(src);
            
            if (retryCount < MAX_RETRIES) {
                // Retry after delay
                setTimeout(() => {
                    loadScriptWithRetry(src, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                }, RETRY_DELAY);
            } else {
                console.error(`[${getCurrentTimeString()}] Failed to load after ${MAX_RETRIES} retries: ${src}`);
                reject(new Error(`Failed to load after ${MAX_RETRIES} retries: ${src}`));
            }
        };
        
        document.head.appendChild(script);
    });
}

// Function to load multiple scripts in sequence
function loadScriptsSequentially(scripts) {
    return scripts.reduce((promise, script) => {
        return promise.then(() => loadScriptWithRetry(script));
    }, Promise.resolve());
}

// Function to load multiple scripts in parallel
function loadScriptsInParallel(scripts) {
    return Promise.all(scripts.map(script => loadScriptWithRetry(script)));
}

// Function to load common.tasks.* scripts
function loadTaskScripts() {
    // Get all script tags with src containing "common.tasks"
    const scriptTags = document.querySelectorAll('script[src*="common.tasks"]');
    const scriptSrcs = Array.from(scriptTags).map(script => script.src);
    
    // Log only if debugging is needed
    // console.log(`[${getCurrentTimeString()}] Found ${scriptSrcs.length} task scripts to load`);
    
    // Remove the script tags from the DOM
    scriptTags.forEach(script => {
        script.parentNode.removeChild(script);
    });
    
    // If no scripts found, return resolved promise
    if (scriptSrcs.length === 0) {
        // console.log(`[${getCurrentTimeString()}] No task scripts found to load`);
        return Promise.resolve();
    }
    
    // Load the scripts in parallel with retry
    return loadScriptsInParallel(scriptSrcs)
        .then(() => {
            // Success message removed to reduce console clutter
            // console.log(`[${getCurrentTimeString()}] All ${scriptSrcs.length} task scripts loaded successfully`);
        })
        .catch(error => {
            // Keep error logs for debugging purposes
            console.error(`[${getCurrentTimeString()}] Error loading task scripts:`, error);
        });
}

// Add event listener for online/offline events
window.addEventListener('online', () => {
    console.log(`[${getCurrentTimeString()}] Network connection restored, retrying pending scripts`);
    // Retry any pending scripts
    const pendingScriptsCopy = [...pendingScripts];
    pendingScripts.clear();
    loadScriptsInParallel(pendingScriptsCopy);
});

window.addEventListener('offline', () => {
    console.log(`[${getCurrentTimeString()}] Network connection lost`);
});

// Export functions
window.loadScriptWithRetry = loadScriptWithRetry;
window.loadScriptsSequentially = loadScriptsSequentially;
window.loadScriptsInParallel = loadScriptsInParallel;
window.loadTaskScripts = loadTaskScripts;