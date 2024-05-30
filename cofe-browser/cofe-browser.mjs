
import { app, BrowserWindow, Menu, clipboard, MenuItem } from 'electron';
import Store from 'electron-store';


// ===========================================================================

// persistent settings
const store = new Store();

let mainWindow;
let secondaryWindows = [];

// ===========================================================================

function createWindow ( url ) {
  // Create the browser window.

  const windowState = store.get('windowState') || { width: 1200, height: 800 };

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true
      // preload: path.join(__dirname, 'preload.js') // Optional: if you have a preload script
    }
  });

  // Load your web application
  mainWindow.loadURL(url).catch ( err => {
    console.error('Failed to load URL:', err);
  });

  mainWindow.webContents.on ( 'did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
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

  // Open the DevTools (optional)
  // mainWindow.webContents.openDevTools();

    // Create the custom menu
  const menuTemplate = [
    {
      label: 'Application',
      submenu: [
        {
          label       : 'Exit',
          accelerator : 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    }, {
      label: 'Edit ',
      submenu: [
        {
          id          : 'copyURL',
          label       : 'Copy URL',
          accelerator : 'CmdOrCtrl+C',
          click() {
            copyURL();
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
        }
      ]
    }, {
      id: 'windows',
      label: 'Windows',
      submenu: []
    }
   ];

  const menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(menu);

  // Save the window state on close
  mainWindow.on ( 'close', () => {
    const bounds = mainWindow.getBounds();
    store.set ( 'windowState',bounds );
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
  secondaryWindow.on('closed', () => {
    const index = secondaryWindows.indexOf(secondaryWindow);
    if (index !== -1) {
      secondaryWindows.splice(index, 1);
    }
    updateMenu();
  });

  updateMenu();
  
  // Return the window options for override
  return {
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  };

}

function copyURL() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    const currentURL = focusedWindow.webContents.getURL();
    clipboard.writeText(currentURL);
  }
}

function printInstructions()  {
  console.log ( 
    'Usage:\n' +
    '~~~~~~\n\n' +
    'npm start ' + ' dirpath -u url\n\n' +
    'where "url" is the the CCP4 Cloud Front End URL.\n'    
  );
}

// ===========================================================================
// Main body

// Get command-prompt parameters

printInstructions();
process.exit(1);

let fe_url = 'http://localhost:58085';

for (let i=2;i<process.argv.length;i++)

// This method will be called when Electron has finished initialization.
app.on ( 'ready',function(){ 
  createWindow(fe_url); 
});

// Quit when all windows are closed.
app.on ( 'window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on ( 'activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
