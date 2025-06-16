import { ipcMain } from 'electron';
import { getUserProfile, saveUserProfile } from '../services/profile.service.js';

export function registerProfileIPC() {
  // Get the user profile
  ipcMain.handle('getUserProfile', async () => {
    try {
      const profile = getUserProfile();
      
      if (!profile) {
        return { success: false, error: 'No profile found' };
      }
      
      return { success: true, profile };
    } catch (error) {
      console.error('Error getting user profile via IPC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve profile';
      return { success: false, error: errorMessage };
    }
  });

  // Save or update the user profile
  ipcMain.handle('saveUserProfile', async (_event, profile) => {
    try {
      const saved = saveUserProfile(profile);
      
      if (!saved) {
        return { success: false, error: 'Failed to save profile' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving user profile via IPC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      return { success: false, error: errorMessage };
    }
  });

  console.log('Profile IPC handlers registered');
}
