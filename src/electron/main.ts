import { app, BrowserWindow, Menu } from 'electron';
import { isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { registerInferenceIPC } from './ipc/inference.ipc.js';
import { registerFeedbackIPC } from './ipc/feedback.ipc.js';

// Menu.setApplicationMenu(null);

registerInferenceIPC();
registerFeedbackIPC();

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
