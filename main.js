const { app, BrowserWindow } = require('electron');

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.toggleDevTools();

  mainWindow.loadURL('file://' + __dirname + '/src/index.html');
});
