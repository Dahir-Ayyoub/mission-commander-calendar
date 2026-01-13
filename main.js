
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    title: "Mission Commander",
    icon: path.join(__dirname, 'favicon.ico'),
    autoHideMenuBar: true, // Cache le menu Alt pour faire "logiciel"
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Nécessaire pour charger les fichiers locaux sans erreur CORS
    }
  });

  // Chargement du fichier index.html local
  win.loadFile('index.html');

  // Optimisation de l'affichage
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
