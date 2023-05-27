const {app, BrowserWindow, Tray, globalShortcut, Menu} = require("electron");
const path = require("path");
const fs = require("fs");
const {ipcMain, Notification, nativeImage} = require('electron');
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

// Create the main window
const createWindow = () => {
    let monitor_size = require("electron").screen.getPrimaryDisplay().size;
    let window_size = {
        width: Math.round(monitor_size.width * 0.5),
        height: Math.round(monitor_size.height * 0.7),
    }

    mainWindow = new BrowserWindow({
        width: window_size.width,
        height: window_size.height,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            partition: "persist:webviewsession",
            nodeIntegration: true, // required for ipcMain and ipcRenderer
            contextIsolation: false, // must be false if nodeIntegration is true
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, "icon.ico"),
    });

    // Load the chat app and apply custom CSS
    mainWindow.loadURL("https://chat.google.com");


    // listen for messages from the renderer process
    ipcMain.on('notify', (event, message) => {
        console.log('Notificaton: ', message.options);
        let icon = nativeImage.createFromDataURL(message.iconBase64);
        let notification = new Notification({
            title: message.title,
            body: message.options.body,
            icon: icon,
        })

        notification.on('click', () => {
            mainWindow.show();
        })

        notification.show();

    });


    // Hide the window when it loses focus
    mainWindow.on("blur", () => {
        // mainWindow.hide();
    });

};

// Create the tray icon and context menu
const createTray = () => {
    tray = new Tray(path.join(__dirname, "icon.ico"));

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
    createTray();
    overrideCloseButton();
    overrideAltF4();
    toggleWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });


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
        mainWindow.focus();
    }
});


