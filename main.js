const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    MenuItem,
    shell,
    screen,
    ipcMain,
    Notification,
    nativeImage
} = require("electron");
const path = require("path");
const {autoUpdater} = require("electron-updater")

app.setName('Chat');
app.setAppUserModelId('com.anwarh.googlechat');
Menu.setApplicationMenu(null)
// app.commandLine.appendSwitch('disable-site-isolation-trials')


// Check if this is the first instance of the app
const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
    app.quit();

}

let mainWindow;
let tray;
let isQuiting = false;
let notifications = [];

async function setTrayIcon(total) {
    if (!tray) return;

    const strippedPath = __dirname.replace('app.asar', '');
    const iconPath = path.join(strippedPath, 'icon.png');

    if (total === 0) {
        tray.setImage(iconPath);
        return;
    }

    const sharp = require('sharp');
    const img = await sharp(iconPath)
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
        .toBuffer();

    const icon = nativeImage.createFromBuffer(img);
    tray.setImage(icon);
}


function createNotification(title, options, iconBase64) {
    const icon = nativeImage.createFromDataURL(iconBase64);
    const notification = new Notification({title, body: options.body, icon, silent: true});
    notifications.push(notification);

    notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('notification-clicked', options.tag);
    });

    notification.show();
}

// Create the main window
const createWindow = () => {
    const monitorSize = screen.getPrimaryDisplay().size;
    const windowSize = {
        width: Math.round(monitorSize.width * 0.5),
        height: Math.round(monitorSize.height * 0.7),
    };

    mainWindow = new BrowserWindow({
        width: windowSize.width,
        height: windowSize.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            partition: 'persist:webviewsession',
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        autoHideMenuBar: true,
    });

    if (process.platform === 'linux') {
        mainWindow.webContents.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0';
    }

    mainWindow.loadURL('https://chat.google.com');

    // dev tools
    // mainWindow.webContents.openDevTools();

    // open externel link in default browser
    mainWindow.webContents.on('did-create-window', (window, details) => {
        window.close();
        shell.openExternal(details.url);
    });
};

// creates a context menu for spellchecking and suggestions
function createContextMenu() {
    mainWindow.webContents.on('context-menu', (event, params) => {
        const menu = new Menu();

        params.dictionarySuggestions.forEach(suggestion => {
            menu.append(new MenuItem({
                label: suggestion,
                click: () => mainWindow.webContents.replaceMisspelling(suggestion)
            }));
        });

        if (params.misspelledWord) {
            menu.append(new MenuItem({
                label: 'Add to dictionary',
                click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
            }));
        }

        menu.popup();
    });
}


// Create the tray icon and context menu
const createTray = () => {
    if (tray) tray.destroy();
    tray = new Tray(path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'));

    const templates = [
        {label: 'Show App', click: () => mainWindow.show()},
        {
            label: 'Quit', click: () => {
                isQuiting = true;
                app.quit();
            }
        },
    ];

    tray.setContextMenu(Menu.buildFromTemplate(templates));
    tray.on('click', () => mainWindow.show());
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


// listen for messages from the renderer process
ipcMain.on('notify', (event, message) => {
    createNotification(message.title, message.options, message.iconBase64)
});

ipcMain.on('unread-fetched', (event, count) => {
    app.setBadgeCount(count)
    setTrayIcon(count)
})

app.whenReady().then(() => {
    createWindow()
    createContextMenu()
    overrideCloseButton()
    overrideAltF4()
    createTray()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
})

autoUpdater.checkForUpdatesAndNotify()

// Handle second instance of the app
app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        if (!mainWindow.isVisible()) mainWindow.show()
        mainWindow.focus()
    }
});
// Start the app when OS starts
app.setLoginItemSettings({openAtLogin: true})


autoUpdater.on('error', err => new Notification({title: 'Failed to update', body: `Reason: ${err}`}).show());
autoUpdater.on('update-downloaded', () => new Notification({
    title: 'Update downloaded',
    body: 'Update will be installed on restart'
}).show())