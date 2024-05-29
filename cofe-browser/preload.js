// preload.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add functions you want to expose to the renderer process here
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  if (typeof jQuery !== 'undefined') {
    console.log("jQuery is loaded in preload!");
  }
});
