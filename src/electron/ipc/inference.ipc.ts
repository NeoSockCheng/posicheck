import { ipcMain } from 'electron';
import { runInference } from '../services/inference.service.js';

export function registerInferenceIPC() {
  ipcMain.handle('sendFileForInference', async (_event, { name, data }) => {
    try {
      console.log(`Received file for inference: ${name}`);
      
      if (!name || !data) {
        console.error('Invalid file data received');
        return { 
          success: false, 
          error: 'Invalid file data. Please ensure the file is properly selected.' 
        };
      }
      
      const result = await runInference(name, data);
      console.log('Inference completed with result:', result ? 'success' : 'failure');
      return result;
    } catch (error) {
      console.error('Unhandled error in inference IPC handler:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unexpected error during inference' 
      };
    }
  });
  
  console.log('Inference IPC handlers registered');
}
