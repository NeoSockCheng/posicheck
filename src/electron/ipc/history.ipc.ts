import { ipcMain } from 'electron';
import { getHistoryItems, getHistoryById, deleteHistoryItem, updateHistoryNotes, getHistoryImageAsBase64, saveDetectionHistory } from '../services/history.service.js';

export function registerHistoryIPC() {
  // Get history items with pagination
  ipcMain.handle('getHistoryItems', async (_event, { limit = 50, offset = 0 }) => {
    try {
      const items = getHistoryItems(limit, offset);
      return { success: true, items };
    } catch (error) {
      console.error('Error getting history items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve history';
      return { success: false, error: errorMessage };
    }
  });

  // Get a specific history item by ID
  ipcMain.handle('getHistoryById', async (_event, { id }) => {
    if (!id) {
      return { success: false, error: 'No history ID provided' };
    }

    try {
      const item = getHistoryById(Number(id));
      if (!item) {
        return { success: false, error: 'History item not found' };
      }
      return { success: true, item };
    } catch (error) {
      console.error(`Error getting history item ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve history item';
      return { success: false, error: errorMessage };
    }
  });

  // Save detection results to history
  ipcMain.handle('saveToHistory', async (_event, { imagePath, predictions, notes }) => {
    if (!imagePath || !predictions) {
      return { success: false, error: 'Missing required data (image path or predictions)' };
    }

    try {
      const historyId = await saveDetectionHistory(imagePath, predictions, notes);
      return { success: true, historyId };
    } catch (error) {
      console.error('Error saving to history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save to history';
      return { success: false, error: errorMessage };
    }
  });

  // Delete a history item
  ipcMain.handle('deleteHistoryItem', async (_event, { id }) => {
    if (!id) {
      return { success: false, error: 'No history ID provided' };
    }

    try {
      const deleted = deleteHistoryItem(Number(id));
      if (!deleted) {
        return { success: false, error: 'Failed to delete history item' };
      }
      return { success: true };
    } catch (error) {
      console.error(`Error deleting history item ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete history item';
      return { success: false, error: errorMessage };
    }
  });

  // Update notes for a history item
  ipcMain.handle('updateHistoryNotes', async (_event, { id, notes }) => {
    if (!id) {
      return { success: false, error: 'No history ID provided' };
    }

    try {
      const updated = updateHistoryNotes(Number(id), notes);
      if (!updated) {
        return { success: false, error: 'Failed to update history notes' };
      }
      return { success: true };
    } catch (error) {
      console.error(`Error updating notes for history item ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update history notes';
      return { success: false, error: errorMessage };
    }
  });
  // Get image as base64
  ipcMain.handle('getHistoryImageAsBase64', async (_event, { imagePath, quality, maxWidth, isThumb }) => {
    if (!imagePath) {
      return { success: false, error: 'No image path provided' };
    }

    try {
      // Use different quality settings for thumbnails vs full-size images
      let imgQuality = quality || 85; // default quality
      let imgMaxWidth = maxWidth || 1200; // default max width
      
      // For thumbnails, we can use lower quality and smaller max width
      if (isThumb) {
        imgQuality = 70;
        imgMaxWidth = 600;
      }
      
      const base64Image = getHistoryImageAsBase64(imagePath, imgQuality, imgMaxWidth);
      if (!base64Image) {
        return { success: false, error: 'Failed to load image' };
      }
      return { success: true, base64Image };
    } catch (error) {
      console.error(`Error loading image ${imagePath}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load image';
      return { success: false, error: errorMessage };
    }
  });

  console.log('History IPC handlers registered');
}
