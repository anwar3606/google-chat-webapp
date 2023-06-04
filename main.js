const {
    app,
    BrowserWindow,
    Tray,
    globalShortcut,
    Menu,
    MenuItem,
    shell,
    ipcMain,
    Notification,
    nativeImage
} = require("electron");
const path = require("path");
const {autoUpdater} = require("electron-updater")

app.setName('Chat');
app.setAppUserModelId('com.anwarh.googlechat');

// Check if this is the first instance of the app
const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
    app.quit();
}

let mainWindow;
let tray;
let isQuiting = false;

async function setTrayIcon(total) {
    let strippedPath = __dirname.replace('app.asar', '');
    let iconPath = path.join(strippedPath, 'icon.png');

    if (total === 0) {
        tray.setImage(iconPath);
    } else {
        const sharp = require('sharp');
        let img = sharp(iconPath);

        // draw notification count and get the node buffer
        img = img
            .resize(128, 128)
            .composite([{
                input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                    <circle cx="48" cy="80" r="40" fill="#ffffff95" />
                    <text x="42" y="110" text-anchor="middle" alignment-baseline="central" 
                    fill="red" font-size="90px" font-family="sans-serif" font-weight="900"
                    >${total}</text>
                </svg>`),
                left: 0,
                top: 0
            }])
            .png()

        let node_buffer = await img.toBuffer();

        // convert to native image and set tray icon
        let icon = nativeImage.createFromBuffer(node_buffer);
        tray.setImage(icon);
    }
}

let notifications = [];

function createNotification(title, options, iconBase64) {
    let icon = nativeImage.createFromDataURL(iconBase64);
    let notification = new Notification({
        title: title,
        body: options.body,
        icon: icon,
        silent: true
    })
    notifications.push(notification);
    // increaseNotificationCount(message.title);

    notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus()
        mainWindow.webContents.send('notification-clicked', options.tag)
    })

    notification.show();
}

// Create the main window
const createWindow = () => {
    let monitor_size = require("electron").screen.getPrimaryDisplay().size;
    let window_size = {
        width: Math.round(monitor_size.width * 0.5),
        height: Math.round(monitor_size.height * 0.7),
    }

    // user agent to firefox
    mainWindow = new BrowserWindow({
        // frame: false,
        width: window_size.width,
        height: window_size.height,
        // transparent: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            partition: "persist:webviewsession",
            nodeIntegration: true, // required for ipcMain and ipcRenderer
            contextIsolation: false, // must be false if nodeIntegration is true

        },

        icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        // hide menu bar
        autoHideMenuBar: true,
    });


    let browserOptions = {}
    // if linux
    if (process.platform === 'linux') {
        browserOptions.userAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0";
    }

    // with firefox user agent
    mainWindow.loadURL("https://chat.google.com", browserOptions);

    // dev tools
    // mainWindow.webContents.openDevTools();

    // listen for messages from the renderer process
    ipcMain.on('notify', (event, message) => {
        createNotification(message.title, message.options, message.iconBase64)

    });

    ipcMain.on('unread-fetched', (event, count) => {
        app.setBadgeCount(count)
        setTrayIcon(count)
    })

    // open externel link in default browser
    mainWindow.webContents.on('did-create-window', (window, details) => {
        window.close()
        shell.openExternal(details.url);
    })

};

// creates a context menu for spellchecking and suggestions
function createContextMenu() {
    mainWindow.webContents.on('context-menu', (event, params) => {
        const menu = new Menu()

        // Add each spelling suggestion
        for (const suggestion of params.dictionarySuggestions) {
            menu.append(new MenuItem({
                label: suggestion,
                click: () => mainWindow.webContents.replaceMisspelling(suggestion)
            }))
        }

        // Allow users to add the misspelled word to the dictionary
        if (params.misspelledWord) {
            menu.append(
                new MenuItem({
                    label: 'Add to dictionary',
                    click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                })
            )
        }

        menu.popup()
    })
}


// Create the tray icon and context menu
const createTray = () => {
    tray = new Tray(path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show App",
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: "Quit",
            click: () => {
                isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
};

// Override the close button to minimize instead
const overrideCloseButton = () => {
    mainWindow.on("close", (event) => {

        if (!isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

};

// Override Alt+F4 to minimize instead
const overrideAltF4 = () => {
    mainWindow.on("keydown", (event) => {
        if (event.altKey && event.key === "F4") {
            event.preventDefault();
            mainWindow.hide();
        }
    });
};

// Toggle the window when the tray icon is clicked
const toggleWindow = () => {
    tray.on("click", () => {
        mainWindow.show();
    });
};

// Create the main window and tray icon, and register event listeners
app.whenReady().then(() => {
    createWindow();
    createContextMenu();
    createTray();
    overrideCloseButton();
    overrideAltF4();
    toggleWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    autoUpdater.checkForUpdatesAndNotify();
});

// Unregister the global shortcut when the app is quitting
app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

// Handle second instance of the app
app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }

        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }

        mainWindow.focus();
    }
});

// Start the app when OS starts
app.setLoginItemSettings({
    openAtLogin: true
})


autoUpdater.on('error', (err) => {
    new Notification({
        title: 'Failed to update',
        body: 'Reason: ' + err
    }).show()
})

autoUpdater.on('update-downloaded', (info) => {
    new Notification({
        title: 'Update downloaded',
        body: 'Update will be installed on restart'
    }).show()
});