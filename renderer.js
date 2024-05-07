// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer
const win = remote.getCurrentWindow(); /* Note this is different to the
html global `window` variable */
let webview;
// When document has loaded, initialise
document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();

        document.getElementById('electron-ver').innerHTML = `${process.versions.electron}`
    }
};

window.onbeforeunload = (event) => {
    /* If window is reloaded, remove win event listeners
    (DOM element listeners get auto garbage collected but not
    Electron win listeners as the win is not dereferenced unless closed) */
    win.removeAllListeners();
}

function handleWindowControls() {
    // Make minimise/maximise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", event => {
        win.minimize();
    });

    document.getElementById('max-button').addEventListener("click", event => {
        win.maximize();
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        win.unmaximize();
    });

    document.getElementById('close-button').addEventListener("click", event => {
        win.close();
    });

    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}

class Tabs {
    constructor() {
        this.currentTab = 0;
        this.tabs = []
    }

    create(url) {
        const lastTab = this.tabs.length;
        document.querySelector('.tab-new').remove();
        const newTab = `
            <div class="tab" data-url="${url}" data-id="${lastTab}">
                <img src="http://www.google.com/s2/favicons?domain=${new URL(url).hostname}" alt="" class="tab-icon">
                <p class="tab-title">
                    Google
                </p>
                <img src="icons/close-k-10.png" alt="tab-close" class="tab-close">
            </div>
            <div class="tab tab-new">
                <img src="icons/plus.png" alt="new-tab" class="">
            </div>
        `
        // const newView = `
        //     <webview class="view" data-id="${lastTab}" src="${url}" style="width:100%; height:96%"></webview>
        // `
        const newView = document.createElement('webview')
        newView.className = 'view'
        newView.dataset.id = lastTab
        newView.src = url
        newView.style.width = "100%"
        newView.style.height = "96%"
        newView.setAttribute(
            'preload',
            `${__dirname}/webview-preload`,
          );
        newView.addEventListener('ipc-message', (event) => {
            if (event.channel == 'new-tab') {
                // console.log(event.args, event.args[0].link)
                this.create(event.args[0]['link'])
                
            }
          });
        
        newView.addEventListener('did-navigate-in-page', (e) => {
            this.update(`http://www.google.com/s2/favicons?domain=${new URL(e.url).hostname}`, this.currentTab.getTitle())
        })
        newView.addEventListener('did-start-navigation', (e) => {
            this.update(`http://www.google.com/s2/favicons?domain=${new URL(this.currentTab.getURL()).hostname}`, this.currentTab.getTitle())
        })
        if (this.currentTab) {
            this.currentTab.style.width = 0
            this.currentTab.style.height = 0
        }
        this.currentTab = newView;
        
        document.querySelector('.tabs').innerHTML += newTab;
        document.querySelector('#main').appendChild(newView);
        const tabs = document.querySelectorAll(".tab:not(.tab-new)");
        for (let tab of tabs)
        tab.addEventListener("click", (e) => {
            this.show(tab.dataset.id)
            console.log(tab.dataset.id)
            
        })
        document.querySelector('.tab-new').addEventListener('click', () => { this.create('http://google.com') })
        this.tabs.push(newView)
        
    }

    show(tabIndex) {
        this.currentTab.style.width = 0
        this.currentTab.style.height = 0
        this.currentTab = this.tabs[tabIndex]
        this.currentTab.style.width = "100%"
        this.currentTab.style.height = "96%"
    }
    update(favicon = "", title = "") {
        let tabs = document.querySelectorAll(".tab");
        if (title) tabs[this.currentTab.dataset.id].querySelector('.tab-title').innerHTML = title;
        if (favicon) tabs[this.currentTab.dataset.id].querySelector('.tab-icon').src = favicon;
    }
}
class Downloads {
    constructor() {
        this.downloads = {}
        this.urls = []
    }

    createDownload(filename, url, totalBytes, receivedBytes, savePath) {
        this.downloads[url] = {
            filename: filename,
            url: url,
            totalBytes: totalBytes,
            receivedBytes: receivedBytes,
            savePath: savePath
        }
        this.urls.push[url]
        document.querySelector(`.downloads-modal`).innerHTML += `
        <li class="download-item" data-url="${url}">
          <img class="favicon" />
          <div style="display: block;">
            <span class="filename">${filename}</span>
            <progress id="file" max="${totalBytes}" value="${receivedBytes}"></progress>
          </div>
          <div class="controls">
            <button class="control pause">⏸</button>
            <button class="control cancel">✕</button>
          </div>
        </li>
      `
    }
    updateDownload(filename, url, totalBytes, receivedBytes, savePath) {
        this.downloads[url] = {
            filename: filename,
            url: url,
            totalBytes: totalBytes,
            receivedBytes: receivedBytes,
            savePath: savePath
        }

        document.querySelector(`.download-item[data-url="${url}"`).remove()

        document.querySelector(`.downloads-modal`).innerHTML += `
        <li class="download-item" data-url="${url}">
          <img class="favicon" />
          <div style="display: block;">
            <span class="filename">${filename}</span>
            <progress id="file" max="${totalBytes}" value="${receivedBytes}"></progress>
          </div>
          <div class="controls">
            <button class="control pause">⏸</button>
            <button class="control cancel">✕</button>
          </div>
        </li>
      `
    }
    pause(url) {
        ipc.send('pause-download', url)
    }
    cancel(url) {
        ipc.send('cancel-download', url)
    }
}

const downloads = new Downloads()
const tabs = new Tabs()
tabs.create('https://google.com')


ipc.on("download-started", (e, msg) => {
    const item = JSON.parse(msg)
    downloads.createDownload(item.filename, item.url, item.totalBytes, item.receivedBytes, item.savePath)
    console.log(`download started: ${item}`)
})
ipc.on("download-updated", (e, msg) => {
    const item = JSON.parse(msg)
    downloads.updateDownload(item.filename, item.url, item.totalBytes, item.receivedBytes, item.savePath)
    console.log(`download updated: ${item}`)
})
window.tabs = tabs
window.downloads = downloads