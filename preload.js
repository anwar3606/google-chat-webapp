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
    const count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText)
        + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);

    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);
}

async function sendPinnedChatsToMainProcess() {
    const pinnedChats = [];

    for (const iframe of document.querySelectorAll('iframe[title="Chat"], iframe[title="Spaces"]')) {
        const type = iframe.title;
        const pinnedChatsElement = iframe.contentDocument.querySelectorAll(`span[data-starred="true"]`);

        for (const chat of pinnedChatsElement) {
            const chatId = chat.id;
            const name = type === 'Chat' ? chat.querySelector('span[data-name]').innerText : chat.querySelector('span[title]').title;
            const avatarUrl = chat.querySelector('img').src;
            const iconBase64 = await downloadIcon(avatarUrl);

            pinnedChats.push({chatId, name, iconBase64, type});
        }
    }

    ipcRenderer.send('pinned-chats', pinnedChats);
}

// Calling the function when the window is loaded
window.onload = () => {
    fetchUnreadMessagesCount();

    const observer = new MutationObserver(fetchUnreadMessagesCount);
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true});

    setTimeout(sendPinnedChatsToMainProcess, 5000);
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

ipcRenderer.on('chat-clicked', (event, chatId) => {
    const iframes = document.querySelectorAll('iframe[title="Chat"], iframe[title="Spaces"]');
    for (const iframe of iframes) {
        const chat = iframe.contentDocument.getElementById(chatId);
        if (chat) {
            chat.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window}));
            break;
        }
    }
});

