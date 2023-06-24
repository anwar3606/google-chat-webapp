const {ipcRenderer} = require('electron');

window.renderer = ipcRenderer;
const notificationStore = {};


class CustomNotification {
    constructor(title, options) {
        this.title = title;
        this.options = options;
        downloadIcon(options.icon).then(iconBase64 => ipcRenderer.send('notify', {title, options, iconBase64}));
    }

    static async requestPermission() {
        await oldNotification.requestPermission();
    }

    static get permission() {
        return oldNotification.permission;
    }

    addEventListener(...args) {
        if (args[0] === 'click') notificationStore[this.options.tag] = args[1];
    }

    close() {
        // console.log('close')
    }
}

const oldNotification = window.Notification;
window.Notification = CustomNotification;


// Get Element by using Xpath
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Fetching the unread messages count
function fetchUnreadMessagesCount() {
    // Perform the unread messages count fetching using the DOM
    let count = 0
    try {
        count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText)
            + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);
    } catch (e) {
        console.log(e)
    }

    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);
}

// Calling the function when the window is loaded
window.onload = () => {
    fetchUnreadMessagesCount();

    const observer = new MutationObserver(fetchUnreadMessagesCount);
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true});

};

async function downloadIcon(iconUrl) {
    const response = await fetch(iconUrl);
    const blob = await response.blob();
    return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

ipcRenderer.on('notification-clicked', (event, tag) => {
    notificationStore[tag]();
})
