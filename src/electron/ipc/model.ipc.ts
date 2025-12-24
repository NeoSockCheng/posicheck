import { ipcMain } from 'electron';
import { initializeModelService } from '../services/model.service.js';

export function registerModelIPC() {
  ipcMain.handle('initializeModel', async () => {
    try {
      console.log('Initializing model service via IPC...');
      await initializeModelService();
      return { success: true };
    } catch (error) {
      console.error('Error initializing model service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize model service' 
      };
    }
  });
  
  console.log('Model IPC handlers registered');
}
