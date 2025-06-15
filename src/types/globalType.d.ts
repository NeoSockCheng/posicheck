type EventPayloadMapping = {
    uploadFile: { name: string; data: string };
    sendFileForInference: { 
        request: { name: string; data: string }; 
        response: { 
            success: boolean; 
            predictions?: Record<string, number>; 
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
    exitApp: {};
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        sendFile: (file: { name: string; data: string }) => void;
        sendFileForInference: (file: { name: string; data: string }) => Promise<{
            success: boolean;
            predictions?: Record<string, number>;
            error?: string;
        }>;
        sendFileForFeedback: (file: { name: string; data: string; feedbackData?: any }) => Promise<{
            success: boolean;
            message?: string;
            id?: string;
            error?: string;
        }>;
        exitApp: () => void;
    };
}

