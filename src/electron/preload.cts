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
  sendFile: (file: { name: string; data: string }) => 
    ipcSend('uploadFile', file),
  sendFileForInference: (file: { name: string; data: string }) => 
    ipcInvoke('sendFileForInference', file),
  sendFileForFeedback: (file: { name: string; data: string; feedbackData?: any }) => 
    ipcInvoke('sendFileForFeedback', file),
  exitApp: () => ipcSend('exitApp', {})
} satisfies Window['electron']);