// @filename main.js

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  win = new BrowserWindow({width: 800, height: 600})
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  win.openDevTools();

  win.on('closed', function() {
    win = null;
  });
});
