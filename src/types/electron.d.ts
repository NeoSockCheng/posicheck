declare global {
  interface Window {
    electron: {
      sendFileForInference: (file: { name: string; data: string }) => Promise<any>;
      sendFileForFeedback: (file: { name: string; data: string; feedbackData?: any }) => Promise<any>;
      saveToHistory: (data: any) => Promise<any>;
      getAllHistory: (params?: any) => Promise<any>;
      getHistoryItem: (id: number) => Promise<any>;
      deleteHistoryItem: (id: number) => Promise<any>;
      getUserProfile: () => Promise<any>;
      saveUserProfile: (profile: any) => Promise<any>;
      getAllFeedback: (params?: any) => Promise<any>;
      getFeedbackImage: (params: any) => Promise<any>;
      exportFeedback: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      getModelInfo: () => Promise<any>;
    };
  }
}

export {};
