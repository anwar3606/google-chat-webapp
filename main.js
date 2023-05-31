const {app, BrowserWindow, Tray, globalShortcut, Menu, shell} = require("electron");
const path = require("path");
const fs = require("fs");
const {ipcMain, Notification, nativeImage} = require('electron');
const {autoUpdater} = require("electron-updater")
const {log} = require("electron-log")

app.setName('Chat');
app.setAppUserModelId('Google Chat');


// Check if this is the first instance of the app
const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
    app.quit();
}

let mainWindow;
let tray;
let isQuiting = false;

function setTrayIcon(total) {
    if (total === 0) {
        tray.setImage(path.join(__dirname, 'icon.png'));
    } else {
        tray.setImage(path.join(__dirname, 'icon_unread.png'));
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
        console.log('Notification clicked: ', options.tag)
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
        console.log('Notification: ', message.options);
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
        // app.setBadgeCount(getTotalNotificationCount());
    });
};

// Create the main window and tray icon, and register event listeners
app.whenReady().then(() => {
    createWindow();
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
        mainWindow.show();
        mainWindow.focus();
    }
});

// Start the app when OS starts
app.setLoginItemSettings({
    openAtLogin: true
})


autoUpdater.on('checking-for-update', () => {
    new Notification({
        title: 'Checking for update',
        body: 'Checking for update'
    }).show()
})
autoUpdater.on('update-available', (info) => {
    new Notification({
        title: 'Update available',
        body: 'Update available'
    }).show()
})
autoUpdater.on('update-not-available', (info) => {
    new Notification({
        title: 'Update not available',
        body: 'Update not available'
    }).show()
})
autoUpdater.on('error', (err) => {
    new Notification({
        title: 'Error',
        body: 'Error'
    }).show()
})
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
    new Notification({
        title: 'Update downloaded',
        body: 'Update downloaded'
    }).show()
});