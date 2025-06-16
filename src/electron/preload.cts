const electron = require('electron');

function ipcInvoke<Key extends keyof EventPayloadMapping>(
    key: Key,
    payload: EventPayloadMapping[Key] extends { request: infer Req } ? Req : EventPayloadMapping[Key]
): Promise<EventPayloadMapping[Key] extends { response: infer Res } ? Res : EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, payload);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
    key: Key,
    callback: (payload: EventPayloadMapping[Key] extends { response: infer Res } ? Res : EventPayloadMapping[Key]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
    key: Key,
    payload: EventPayloadMapping[Key] extends { request: infer Req } ? Req : EventPayloadMapping[Key]
) {
    electron.ipcRenderer.send(key, payload);
}

electron.contextBridge.exposeInMainWorld('electron', {
  // File sending methods
  sendFile: (file: { name: string; data: string }) => 
    ipcSend('uploadFile', file),
  sendFileForInference: (file: { name: string; data: string }) => 
    ipcInvoke('sendFileForInference', file),
  sendFileForFeedback: (file: { name: string; data: string; feedbackData?: any }) => 
    ipcInvoke('sendFileForFeedback', file),
      // History methods
  getHistoryItems: (options: { limit?: number; offset?: number }) => 
    ipcInvoke('getHistoryItems', options),
  getHistoryById: (id: number) => 
    ipcInvoke('getHistoryById', { id }),
  deleteHistoryItem: (id: number) => 
    ipcInvoke('deleteHistoryItem', { id }),
  updateHistoryNotes: (id: number, notes: string) => 
    ipcInvoke('updateHistoryNotes', { id, notes }),
  getHistoryImageAsBase64: (params: { imagePath: string }) => 
    ipcInvoke('getHistoryImageAsBase64', params),
    
  // Profile methods
  getUserProfile: () => 
    ipcInvoke('getUserProfile', {}),
  saveUserProfile: (profile: any) => 
    ipcInvoke('saveUserProfile', profile),
    
  // App control methods
  exitApp: () => ipcSend('exitApp', {})
} satisfies Window['electron']);