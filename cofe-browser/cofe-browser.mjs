
/*
 *  ===========================================================================
 *
 *    22.07.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  cofe-browser/cofe-browser.mjs
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Electron-based browser
 *       ~~~~~~~~~  
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  ===========================================================================
 *
 */

import path  from 'path';
import { app, BrowserWindow, Menu, clipboard, MenuItem, ipcMain, dialog, session } from 'electron';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';


// ===========================================================================

const isMac      = process.platform === 'darwin';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// persistent settings
const store = new Store();

let mainWindow;
let secondaryWindows = [];
let ccp4cloud_version = 'xxx.xxx.xxx';

// ===========================================================================

// Define a secret key for encryption (in a real app, use a more secure method to manage this key)
const SECRET_KEY = 'CoFE-Browser-secret-key';

// Function to encrypt data
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

// Function to decrypt data
const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const get_loc_name = ( location,name ) => {
  return location + '-' + name;
}

// Function to save login credentials
const saveCredentials = (location,username, password) => {
  store.set ( get_loc_name(location,'username'), encrypt(username) );
  store.set ( get_loc_name(location,'password'), encrypt(password) );
};

// Function to get login credentials
const getCredentials = ( location ) => {
  const uname = get_loc_name(location,'username');
  const upwd  = get_loc_name(location,'password');
  const username = store.get(uname) ? decrypt(store.get(uname)) : null;
  const password = store.get(upwd)  ? decrypt(store.get(upwd))  : null;
  return { 'username' : username, 'password' : password };
};

// ===========================================================================

function createWindow ( url ) {
  // Create the browser window.

  const windowState = store.get('cofe-browser.state') ||
                      { width: 1200, height: 800, x: 100, y: 75 };

  mainWindow = new BrowserWindow ({
    width  : windowState.width,
    height : windowState.height,
    x      : windowState.x,
    y      : windowState.y,
    icon   : path.join(__dirname,'icons','ccp4cloud_local.png'),
    webPreferences : {
      nodeIntegration    : false,
      sandbox            : false,
      contextIsolation   : true,
      webSecurity        : true,
      enableRemoteModule : false,
      preload            : path.join(__dirname,'preload.mjs')
    }
  });

  // Load your web application
  mainWindow.loadURL(url).catch ( err => {
    console.error ( 'Failed to load URL:', err );
  });

  // // Set the CSP through HTTP headers (if using a server to serve your files)
  // mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  //     callback({
  //         responseHeaders: Object.assign({
  //             'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none';"]
  //         }, details.responseHeaders)
  //     });
  // });

  mainWindow.webContents.on ( 'did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error ( `Failed to load ${validatedURL}: ${errorDescription} (${errorCode})` );
  });

  mainWindow.webContents.on ( 'did-navigate', () => {
    // When the window navigates to a new page, update the menu item
    updateMenu();
  });

  mainWindow.webContents.setWindowOpenHandler ( ({ url, features, disposition }) => {
    const secondaryWindow = createSecondaryWindow(url, features);
    return {
      action: 'deny',
      overrideBrowserWindowOptions: secondaryWindow
    };
  });


  const ses = session.defaultSession;

  ses.on('will-download', async (event, item) => {
    const defaultPath = path.join(app.getPath('downloads'), item.getFilename());

    const filePath = dialog.showSaveDialogSync ( mainWindow, {
      title      : 'Save File',
      defaultPath: defaultPath,
      buttonLabel: 'Save'
    });

    if (filePath) {

      item.setSavePath(filePath);

      item.on('updated', (event, state) => {
        if (state === 'progressing') {
          if (item.isPaused()) {
            console.log('Download is paused');
          } else {
            const progress = item.getReceivedBytes() / item.getTotalBytes();
            mainWindow.webContents.send('download-progress', progress);
          }
        }
      });

      item.on('done', (event, state) => {
        if (state === 'completed') {
          // console.log('Download successfully');
          mainWindow.webContents.send('download-complete', filePath);
        } else {
          console.log(`Download failed: ${state}`);
          mainWindow.webContents.send('download-failed');
        }
      });
      
      // item.resume();
      
    } else {
      item.cancel();
      mainWindow.webContents.send('download-cancelled');
    }

  });

  // Open the DevTools (optional)
  // mainWindow.webContents.openDevTools();

  // Create the custom menu
  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        {
          label: 'About',
          click: () => {
            showCustomAboutDialog();
          }
        },
        ...(isMac ? [
            { type: 'separator'  },
            { role: 'services'   },
            { type: 'separator'  },
            { role: 'hide'       },
            { role: 'hideothers' },
            { role: 'unhide'     }
          ] : 
          []
        ),
        { type: 'separator'  },
        {
          label       : 'Quit',
          accelerator : 'CmdOrCtrl+Q',
          click() {
            sendStopSignal ( url );
            app.quit();
          }
        }
      ]
    }, {
      label: 'Edit ',
      submenu: [
        {
          id          : 'findText',
          label       : 'Find',
          accelerator : 'CmdOrCtrl+F',
          click() {
            mainWindow.webContents.send('start-search');
          }
        },
        { type: 'separator'          },
        { role: 'undo'               },
        { role: 'redo'               },
        { type: 'separator'          },
        { role: 'cut'                },
        { role: 'copy'               },
        { role: 'paste'              },
        { role: 'pasteandmatchstyle' },
        { role: 'delete'             },
        { role: 'selectall'          },
        { type: 'separator'          },
        {
          id          : 'copyURL',
          label       : 'Copy URL',
          // accelerator : 'CmdOrCtrl+C',
          click() {
            copyURL();
          }
        }, {
          label       : 'Reload',
          accelerator : 'CmdOrCtrl+R',
          click() {
            mainWindow.loadURL(url).catch ( err => {
              console.error ( 'Failed to load URL:', err );
            });
          }
        }
      ]
    }, {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+<',
          click: () => {
            mainWindow.webContents.send('navigate-back');
          }
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+>',
          click: () => {
            mainWindow.webContents.send('navigate-forward');
          }
        }
      ]
    }, {
      label: 'Development',
      submenu: [
        {
          label       : 'Toggle Developer Tools',
          accelerator : 'Alt+CmdOrCtrl+I',
          click ( item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          }
        },
        {
          label: 'Clear Cache',
          click () {
            // mainWindow.webContents.send('clear-cache');
            session.defaultSession.clearCache().then(() => {
              console.log('Cache successfully cleared');
              // Optionally, notify the user with a dialog or other means
              // mainWindow.webContents.send('cache-cleared');
            }).catch((error) => {
              console.error(`Failed to clear cache: ${error}`);
              // mainWindow.webContents.send('cache-clear-failed', error);
            });
           }
        }
      ]
    }, {
      id: 'windows',
      label: 'Windows',
      submenu: []
    }
  ];

  const menu = Menu.buildFromTemplate ( menuTemplate );

  Menu.setApplicationMenu ( menu );

  // Save the window state on close
  mainWindow.on ( 'close', () => {
    const bounds = mainWindow.getBounds();
    store.set ( 'cofe-browser.state',bounds );
  });

}

function updateMenu() {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const copyURLItem = menu.getMenuItemById('copyURL');
    if (copyURLItem)
      copyURLItem.enabled = true;
    const windowsMenu = menu.getMenuItemById('windows');
    if (windowsMenu) {
      windowsMenu.submenu.clear(); // Clear previous window items
      windowsMenu.submenu.append ( new MenuItem({
        label: 'Main Window',
        click() {
          mainWindow.show();
          mainWindow.focus();
        }
      }));
      secondaryWindows.forEach ( (win, index) => {
        windowsMenu.submenu.append ( new MenuItem({
          label: `Window ${index + 2}`, // Start from index 2 for secondary windows
          click() {
            win.show();
            win.focus();
          }
        }));
      });
      // Rebuild the menu to ensure the changes are applied
      const newMenu = Menu.buildFromTemplate(menu.items);
      Menu.setApplicationMenu(newMenu);
    }
  }
}


function createSecondaryWindow ( url,features ) {

  const secondaryWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  secondaryWindow.loadURL ( url ); // Load the URL for the secondary window

  secondaryWindow.webContents.setWindowOpenHandler(({ url, features, disposition }) => {
    const newWindowOptions = createSecondaryWindow(url, features);
    return {
      action: 'deny',
      overrideBrowserWindowOptions: newWindowOptions,
    };
  });

  secondaryWindows.push(secondaryWindow);

  // Listen for window closed event to remove from the secondaryWindows array
  secondaryWindow.on ( 'closed', () => {
    const index = secondaryWindows.indexOf(secondaryWindow);
    if (index !== -1)
      secondaryWindows.splice(index, 1);
    updateMenu();
  });

  updateMenu();
  
  // Return the window options for override
  return {
    width          : 600,
    height         : 400,
    webPreferences : {
      nodeIntegration  : true,
      contextIsolation : true,
    }
  };

}

function showCustomAboutDialog() {
  // Using Electron's dialog module for a simple custom About dialog
  dialog.showMessageBox({
    type   : 'info',
    title  : 'About CoFE-Browser',
    message: 'CoFE Browser\n\nv. ' + ccp4cloud_version +
             '\n\nElectron-based browser for\n' + 
             'CCP4 Cloud.',
    buttons: ['OK']
  });
}

function copyURL() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    const currentURL = focusedWindow.webContents.getURL();
    clipboard.writeText(currentURL);
  }
}

function sendStopSignal ( url )  {
  fetch ( url + '/stop' )
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json(); // or response.text() for plain text
  })
  .then(data => {
    console.log(data); // Handle the data from the response
  })
  .catch(error => {
    console.error ( 'There was a problem with the stop operation:', error );
  });
}

function printInstructions()  {
  console.log ( 
    'Usage:\n'   +
    '~~~~~~\n\n' +
    'npm start url=URL\n\n' +
    'where "URL" is the CCP4 Cloud Front End URL. The command should be\n' +
    'invoked from directory containing this file.\n'    
  );
}

// ===========================================================================
// Main body

// Get command-prompt parameters

if (process.argv.length<=2)  {
  printInstructions();
  process.exit ( 1 );
}

let fe_url = null;

for (let i=2;(i<process.argv.length) && (!fe_url);i++)
  if (process.argv[i].startsWith('url=')) 
    fe_url = process.argv[i].slice(4);

if (!fe_url)  {
  console.log ( '***** ERROR: Front End URL not given\n' );
  printInstructions();
  process.exit ( 2 );
}


// This method will be called when Electron has finished initialization.
app.on ( 'ready',function(){ 
  createWindow ( fe_url ); 
});

// Quit when all windows are closed.
app.on ( 'window-all-closed', () => {
  sendStopSignal ( fe_url );
  app.quit();
});

app.on ( 'activate', () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createWindow();
});

// IPC listener
ipcMain.on('message-from-app', (event, arg) => {
  if (arg=='stop')  {
    sendStopSignal ( fe_url );
    app.quit();
  } else if (arg.startsWith('version:'))
    ccp4cloud_version = arg.slice('version:'.length);
});

ipcMain.on ( 'start-download', (event, url) => {
  mainWindow.webContents.downloadURL ( url );
});


let searchText = '';

ipcMain.on('search-text', (event, search_text) => {
  if (search_text)  {
    searchText = search_text;
    mainWindow.webContents.findInPage ( searchText, { findNext: true } );
  }
});

ipcMain.on('find-next', () => {
  mainWindow.webContents.findInPage ( searchText, { findNext: false } );
});

ipcMain.on('find-previous', () => {
  mainWindow.webContents.findInPage ( searchText, { findNext: false, forward: false } );
});

ipcMain.on('stop-search', () => {
  mainWindow.webContents.stopFindInPage ( 'clearSelection' );
});

ipcMain.on('save-credentials', ( event, location,username, password ) => {
  saveCredentials(location,username, password);
  event.sender.send('save-credentials-response', 'Credentials saved securely.');
});

ipcMain.on('get-credentials', ( event, location ) => {
  let credentials = getCredentials ( location );
  event.sender.send('get-credentials-response', credentials);
});
