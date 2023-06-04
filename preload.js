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
    const count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText)
        + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);

    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);
}

async function sendPinnedChatsToMainProcess() {
    let pinnedChats = []

    let iframes = document.querySelectorAll('iframe[title="Chat"], iframe[title="Spaces"]');
    for (let i = 0; i < iframes.length; i++) {
        let iframe = iframes[i];
        // ipcRenderer.send('pinned-chat', {type: iframe.title, src: iframe.src})
        let pinnedChatsElement = iframe.contentDocument.documentElement.querySelectorAll('span[data-starred="true"]');
        for (let j = 0; j < pinnedChatsElement.length; j++) {
            let chat = pinnedChatsElement[j];
            let chatId = chat.id
            let type = iframe.title

            let name;
            if (iframe.title === 'Chat') {
                name = chat.querySelector('span[data-name]').innerText;
            } else {
                name = chat.querySelector('span[title]').title
            }
            let avatarUrl = chat.querySelector('img').src;

            // download the avatar
            let iconBase64 = await downloadIcon(avatarUrl)
            pinnedChats.push({chatId, name, iconBase64, type})
        }
    }

    ipcRenderer.send('pinned-chats', pinnedChats)
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

    setTimeout(() => {
        sendPinnedChatsToMainProcess();
    }, 5000)
}


const oldNotification = window.Notification;

async function downloadIcon(iconUrl) {
    let response = await fetch(iconUrl);
    let blob = await response.blob();
    let base64data = await new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    return base64data;
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

ipcRenderer.on('chat-clicked', (event, chatId) => {
    let iframes = document.querySelectorAll('iframe[title="Chat"], iframe[title="Spaces"]');
    for (let i = 0; i < iframes.length; i++) {
        let iframe = iframes[i];
        let chat = iframe.contentDocument.getElementById(chatId);
        if (chat) {
            let downEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            chat.dispatchEvent(downEvent);
            break;
        }
    }
})

// Assign the CustomNotification class to the Notification object
window.Notification = CustomNotification;
