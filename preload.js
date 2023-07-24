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

function make_all_children_transparent(mutationsList) {
    // check if .transparent class exists
    if (document.querySelector('.transparent')) return;

    // create a transparent class
    const style = document.createElement('style');
    style.innerHTML = `
        .transparent {
            background: transparent;
        }
        
        .blur-transparent {
            background: #00000036;
            backdrop-filter: blur(10px);
        }
    `;
    document.head.appendChild(style);

    // add style to body
    document.body.classList.add('transparent');

    // // for all the elements
    for (const element of document.querySelectorAll('*')) {
        // if body
        if (element.tagName === 'BODY') {
            // add the transparent class if it doesn't have it
            if (!element.classList.contains('blur-transparent')) element.classList.add('blur-transparent');
        }
        // add the transparent class if it doesn't have it
        else if (!element.classList.contains('transparent')) element.classList.add('transparent');
    }
}

// Fetching the unread messages count
function fetchUnreadMessagesCount(mutationsList) {
    // Perform the unread messages count fetching using the DOM
    const count = parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[1]/div[1]/span/span[2]/span").innerText)
        + parseInt(getElementByXpath("/html/body/div[6]/div[3]/div/div[2]/div[1]/div[1]/div[2]/div[2]/span/span[2]/span").innerText);

    // Send the fetched count back to the main process
    ipcRenderer.send('unread-fetched', count);

    // check if any new iframe is added
    // for (const iframe of document.querySelectorAll('iframe')) {
    //     make_all_children_transparent(iframe.contentWindow.document.body);
    //
    //     // also set mutation observer for the new iframes
    //     const observer = new MutationObserver(fetchUnreadMessagesCount);
    //     observer.observe(iframe.contentWindow.document.body, {
    //         childList: true,
    //         subtree: true,
    //         attributes: true,
    //         characterData: true
    //     });
    // }

}

// Calling the function when the window is loaded
window.onload = () => {
    fetchUnreadMessagesCount();

    const observer = new MutationObserver(fetchUnreadMessagesCount);
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true});

    make_all_children_transparent()
    const observer2 = new MutationObserver(make_all_children_transparent);
    observer2.observe(document.body, {subtree: true, childList: true});

    // // make background to transparent for all components
    // for (const element of document.querySelectorAll('*')) {
    //     // also make it important to override the default background
    //     element.style.setProperty('background', 'transparent');
    // }

    // also do this to all the iframes and their children
    // for (const iframe of document.querySelectorAll('iframe')) {
    //     console.log(iframe.contentWindow.document)
    //     for (const element of iframe.contentWindow.document.querySelectorAll('*')) {
    //         element.style.setProperty('background', 'transparent');
    //     }
    // }
    console.info('loaded')
    //slightly darken only the body to make it more visible
    // document.body.style.setProperty('background', 'rgba(0,0,0,0.2)');


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

