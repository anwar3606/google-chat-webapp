const {ipcRenderer} = require('electron');

window.renderer = ipcRenderer;

document.addEventListener("DOMContentLoaded", function () {

});

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
  

function fetchUnreadMessagesCount() {
    // Perform the unread messages count fetching using the DOM
    const count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText) + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);
  
    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);
}

// Set up an interval to fetch data every 5 seconds
setInterval(fetchUnreadMessagesCount, 1000);

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
        console.log('addEventListener', args)
        if (args[0] === 'click') {
            ipcRenderer.on('notification-clicked', (event, tag) => {
                console.log('notification-clicked', tag)
                args[1]();
            })
        }
    }

    close() {
        // return this.notification.close();
        console.log('close')
    }
}

// Assign the CustomNotification class to the Notification object
window.Notification = CustomNotification;
