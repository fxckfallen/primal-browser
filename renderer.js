// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer
const win = remote.getCurrentWindow(); /* Note this is different to the
html global `window` variable */

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

let currentTab = 0;
let lastTab = 2;
function setTabState (tabIndex, state = false) {
    let tabs = document.querySelectorAll(".view");
    
    for (let i = 0; i < tabs.length; ++i) {
        if (i == tabIndex) tabs[i].style.height = state ? "96%" : "0%"
    }
    currentTab = tabIndex
}

createTab = (url) => {
    lastTab++;
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
    const newView = `
        <webview class="view" data-id="${lastTab}" src="${url}" style="width:100%; height:96%"></webview>
    `
    
    document.querySelector('.tabs').innerHTML += newTab;
    document.querySelector('#main').innerHTML += newView;
    document.querySelector('.tab-new').addEventListener('click', () => {createTab('http://google.com')})
    currentTab = lastTab;
}

function splitTabs(tabLeft, tabRight) {
    let tabs = document.querySelectorAll(".view");
    
    for (let i = 0; i < tabs.length; ++i) {
        if (i == tabLeft)
        {
            tabs[i].style.height = "50%"
        }
        if (i == tabRight) {
            tabs[i].style.height = "50%"
        }
    }
}

updateTab = (currentTab, favicon = "", title = "") => {
    let tabs = document.querySelectorAll(".tabs");
    
    for (let i = 0; i < tabs.length; ++i) {
        if (i == currentTab)
        {
            if (title) tabs[i].querySelector('.tab-title').innerHTML = title; 
            if (favicon) tabs[i].querySelector('.tab-icon').src = favicon; 
        }
    }
}

let webview = document.querySelector('webview')
let tabs = document.querySelectorAll(".tab");

webview.openDevTools()

for (let tab of tabs) {
    tab.addEventListener("click",  (e) => {
        
            setTabState(currentTab, false);
            setTabState(e.target.dataset.id, true);
            currentTab = e.target.dataset.id;
        

    })
}

document.querySelector('.tab-new').addEventListener('click', () => {createTab('http://google.com')})
webview.addEventListener('did-navigate-in-page', (e) => {
    updateTab(currentTab, `http://www.google.com/s2/favicons?domain=${new URL(e.url).hostname}`, webview.getTitle())
})
webview.addEventListener('did-start-navigation', (e) => {
    updateTab(currentTab, `http://www.google.com/s2/favicons?domain=${new URL(webview.getURL()).hostname}`, webview.getTitle())
})
class Downloads {
    constructor () {
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
  }
  
const downloads = new Downloads()



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
