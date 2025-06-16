import { ipcMain, app } from 'electron';

export function registerAppIPC() {
  // Handle app exit request
  ipcMain.on('exitApp', () => {
    app.quit();
  });
  
  console.log('App IPC handlers registered');
}
