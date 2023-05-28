const {ipcRenderer} = require('electron');

window.renderer = ipcRenderer;

document.addEventListener("DOMContentLoaded", function () {

});

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
