import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';

Menu.setApplicationMenu(null);

app.on('ready', () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
        },
        // frame: false,
    });
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
    } else {
        mainWindow.loadFile(getUIPath());
    }
});
