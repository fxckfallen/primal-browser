const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', function(){ 

const links = document.querySelectorAll('a[target="_blank"]')


for (let link of links) {
    link.addEventListener('mousedown', (e) => {
        ipcRenderer.sendToHost('new-tab', {"link": link.href});
    })
}

//ipcRenderer.sendToHost('test', {"asd": JSON.stringify(x)});

});