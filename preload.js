const {ipcRenderer} = require('electron');

window.renderer = ipcRenderer;
const notificationStore = {};

// Get Element by using Xpath
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Fetching the unread messages count
function fetchUnreadMessagesCount() {
    // Perform the unread messages count fetching using the DOM
    const count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText) + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);

    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);
}

// Calling the function when the window is loaded
window.onload = () => {
    fetchUnreadMessagesCount();
    const observer = new MutationObserver(() => {
        // console.log("I am mutation observer");
        fetchUnreadMessagesCount()
    })

    const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    }

    observer.observe(document.body, observerConfig)
}


const oldNotification = window.Notification;

async function downloadIcon(iconUrl) {
    let response = await fetch(iconUrl);
    let blob = await response.blob();
    let reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onloadend = function () {
            let base64data = reader.result;
            resolve(base64data);
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


class CustomNotification {
    constructor(title, options) {
        // store the parameters
        this.title = title;
        this.options = options;

        downloadIcon(options.icon).then(iconBase64 => {
            ipcRenderer.send('notify', {title, options, iconBase64})
        })
    }

    // pass along all other methods
    static async requestPermission() {
        await oldNotification.requestPermission();
    }

    static get permission() {
        return oldNotification.permission;
    }

    addEventListener(...args) {
        if (args[0] === 'click') {
            notificationStore[this.options.tag] = args[1];
        }
    }

    close() {
        // console.log('close')
    }
}

ipcRenderer.on('notification-clicked', (event, tag) => {
    notificationStore[tag]();
})

// Assign the CustomNotification class to the Notification object
window.Notification = CustomNotification;
