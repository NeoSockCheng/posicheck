import { ipcMain } from 'electron';
import { 
  processFeedback, 
  getAllFeedback, 
  getFeedbackById,
  getFeedbackImage,
  exportFeedback
} from '../services/feedback.service.js';

export function registerFeedbackIPC() {
  // Submit feedback
  ipcMain.handle('sendFileForFeedback', async (_event, { name, data, feedbackData }) => {
    console.log(`Received file for feedback: ${name}`);
    return await processFeedback(name, data, feedbackData);
  });

  // Get all feedback entries
  ipcMain.handle('getAllFeedback', async (_event, { limit = 50, offset = 0 }) => {
    console.log(`Getting all feedback entries (limit: ${limit}, offset: ${offset})`);
    return getAllFeedback(limit, offset);
  });

  // Get a feedback entry by ID
  ipcMain.handle('getFeedbackById', async (_event, { id }) => {
    console.log(`Getting feedback entry: ${id}`);
    return getFeedbackById(id);
  });

  // Get an image for a feedback entry
  ipcMain.handle('getFeedbackImage', async (_event, { imagePath, quality = 90, maxWidth }) => {
    console.log(`Getting feedback image: ${imagePath}`);
    return getFeedbackImage(imagePath, quality, maxWidth);
  });

  // Export all feedback as CSV and images as ZIP
  ipcMain.handle('exportFeedback', async () => {
    console.log('Exporting all feedback data');
    return await exportFeedback();
  });
  
  console.log('Feedback IPC handlers registered');
}
