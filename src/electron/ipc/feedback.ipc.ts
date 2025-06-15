import { ipcMain } from 'electron';
import { processFeedback } from '../services/feedback.service.js';

export function registerFeedbackIPC() {
  ipcMain.handle('sendFileForFeedback', async (_event, { name, data, feedbackData }) => {
    console.log(`Received file for feedback: ${name}`);
    return await processFeedback(name, data, feedbackData);
  });
  
  console.log('Feedback IPC handlers registered');
}
