import { app, BrowserWindow, Menu } from 'electron';
import { isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { registerInferenceIPC } from './ipc/inference.ipc.js';
import { registerFeedbackIPC } from './ipc/feedback.ipc.js';
import { registerHistoryIPC } from './ipc/history.ipc.js';
import { registerProfileIPC } from './ipc/profile.ipc.js';
import { registerAppIPC } from './ipc/app.ipc.js';
import { registerModelIPC } from './ipc/model.ipc.js';
import { migrateHistoryFromJson } from './services/history.service.js';
import { initializeDefaultProfile } from './services/profile.service.js';
import { loadOnnxModel, releaseOnnxModel } from './services/onnx-inference.service.js';
import path from 'path';
import './db/database.js'; // Initialize the database

Menu.setApplicationMenu(null);

registerInferenceIPC();
registerFeedbackIPC();
registerHistoryIPC();
registerProfileIPC(); // Register profile IPC handlers
registerAppIPC();
registerModelIPC(); // Register model IPC handlers

app.on('ready', async () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
        },
        width: 1200,
        height: 800,
        // frame: false,
    });
    
    // Migrate data from JSON files to SQLite if needed
    try {
        const migratedCount = migrateHistoryFromJson();
        if (migratedCount > 0) {
            console.log(`Successfully migrated ${migratedCount} history records to SQLite database`);
        }
          // Initialize default profile if needed
        initializeDefaultProfile();
        console.log('Profile initialization check completed');
        
        // Initialize the ONNX model
        try {
            const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'model.onnx');
            await loadOnnxModel(modelPath);
            console.log('ONNX model initialization completed');
        } catch (modelError) {
            console.error('Error initializing ONNX model:', modelError);
            console.warn('App will attempt to load model on first inference');
        }
    } catch (error) {
        console.error('Error during data migration or initialization:', error);
    }
    
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
        // Open DevTools automatically in development mode
        mainWindow.webContents.openDevTools();    } else {
        mainWindow.loadFile(getUIPath());
    }
});

// Clean up resources when the app is quitting
app.on('quit', async () => {
    // Release the ONNX model if it's loaded
    console.log('Releasing ONNX model...');
    await releaseOnnxModel();
});
