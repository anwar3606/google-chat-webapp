const {ipcRenderer} = require('electron');

window.renderer = ipcRenderer;

document.addEventListener("DOMContentLoaded", function () {
    console.log('Anwar: DOMContentLoaded')
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
        // return this.notification.addEventListener(...args);
        console.log('addEventListener', args)
    }

    removeEventListener(...args) {
        // return this.notification.removeEventListener(...args);
        console.log('removeEventListener', args)
    }

    dispatchEvent(...args) {
        // return this.notification.dispatchEvent(...args);
        console.log('dispatchEvent', args)
    }

    close() {
        // return this.notification.close();
        console.log('close')
    }

    emit(...args) {
        console.log('console', args)
    }

    // Add more methods as needed

}

// Assign the CustomNotification class to the Notification object
window.Notification = CustomNotification;
