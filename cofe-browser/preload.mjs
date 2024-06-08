
/*
 *  ===========================================================================
 *
 *    08.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  cofe-browser/preload.mjs
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Preload module for Electron-based browser
 *       ~~~~~~~~~  
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  ===========================================================================
 *
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => {
    const validChannels = ['message-from-app'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  onNavigateBack     : (callback) => ipcRenderer.on('navigate-back'     , callback),
  onNavigateForward  : (callback) => ipcRenderer.on('navigate-forward'  , callback),
  onDownloadProgress : (callback) => ipcRenderer.on('download-progress' , callback),
  onDownloadComplete : (callback) => ipcRenderer.on('download-complete' , callback),
  onDownloadFailed   : (callback) => ipcRenderer.on('download-failed'   , callback),
  onDownloadCancelled: (callback) => ipcRenderer.on('download-cancelled', callback),
  startDownload      : (url)      => ipcRenderer.send('start-download'  , url)
});
