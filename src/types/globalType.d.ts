type EventPayloadMapping = {
    uploadFile: { name: string; data: string };
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        sendFile: (file: { name: string; data: string }) => void;
    };
}

