type EventPayloadMapping = {
    uploadFile: { name: string; data: string };
    sendFileForInference: { 
        request: { name: string; data: string }; 
        response: { 
            success: boolean; 
            predictions?: Record<string, number>; 
            historyId?: number;
            error?: string; 
        }
    };
    sendFileForFeedback: { 
        request: { name: string; data: string; feedbackData?: any }; 
        response: {
            success: boolean;
            message?: string;
            id?: string;
            error?: string;
        }
    };
    getHistoryItems: {
        request: { limit?: number; offset?: number };
        response: {
            success: boolean;
            items?: Array<{
                id: number;
                imagePath: string;
                timestamp: number;
                predictionData: Record<string, number>;
                notes?: string;
            }>;
            error?: string;
        }
    };
    getHistoryById: {
        request: { id: number };
        response: {
            success: boolean;
            item?: {
                id: number;
                imagePath: string;
                timestamp: number;
                predictionData: Record<string, number>;
                notes?: string;
            };
            error?: string;
        }
    };    getHistoryImageAsBase64: {
        request: { 
            imagePath: string;
            quality?: number;
            maxWidth?: number;
            isThumb?: boolean;
        };
        response: {
            success: boolean;
            base64Image?: string;
            error?: string;
        }
    };
    deleteHistoryItem: {
        request: { id: number };
        response: {
            success: boolean;
            error?: string;
        }
    };
    updateHistoryNotes: {
        request: { id: number; notes: string };
        response: {
            success: boolean;
            error?: string;
        }
    };
    getUserProfile: {
        request: {};
        response: {
            success: boolean;
            profile?: UserProfile;
            error?: string;
        }
    };
    saveUserProfile: {
        request: UserProfile;
        response: {
            success: boolean;
            error?: string;
        }
    };
    exitApp: {};
}

interface UserProfile {
    id?: number;
    name: string;
    email: string;
    phone: string;
    country: string;
    organization: string;
    createdAt?: number;
    updatedAt?: number;
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        // File sending methods
        sendFile: (file: { name: string; data: string }) => void;
        sendFileForInference: (file: { name: string; data: string }) => Promise<{
            success: boolean;
            predictions?: Record<string, number>;
            historyId?: number;
            error?: string;
        }>;
        sendFileForFeedback: (file: { name: string; data: string; feedbackData?: any }) => Promise<{
            success: boolean;
            message?: string;
            id?: string;
            error?: string;
        }>;
          // History methods
        getHistoryItems: (options: { limit?: number; offset?: number }) => Promise<{
            success: boolean;
            items?: Array<{
                id: number;
                imagePath: string;
                timestamp: number;
                predictionData: Record<string, number>;
                notes?: string;
            }>;
            error?: string;
        }>;
        getHistoryById: (id: number) => Promise<{
            success: boolean;
            item?: {
                id: number;
                imagePath: string;
                timestamp: number;
                predictionData: Record<string, number>;
                notes?: string;
            };
            error?: string;
        }>;
        deleteHistoryItem: (id: number) => Promise<{
            success: boolean;
            error?: string;
        }>;
        updateHistoryNotes: (id: number, notes: string) => Promise<{
            success: boolean;
            error?: string;
        }>;        getHistoryImageAsBase64: (params: { 
            imagePath: string;
            quality?: number;
            maxWidth?: number;
            isThumb?: boolean;
        }) => Promise<{
            success: boolean;
            base64Image?: string;
            error?: string;
        }>;
        
        // Profile methods
        getUserProfile: () => Promise<{
            success: boolean;
            profile?: UserProfile;
            error?: string;
        }>;
        saveUserProfile: (profile: UserProfile) => Promise<{
            success: boolean;
            error?: string;
        }>;
        
        // App control methods
        exitApp: () => void;
    };
}

