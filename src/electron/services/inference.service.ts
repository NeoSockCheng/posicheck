import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { saveDetectionHistory } from './history.service.js';

const errorCols = [
    'chin_high', 'chin_low', 'pos_forward', 'pos_backward',
    'head_tilt', 'head_rotate', 'tongue_fail', 'slumped_pos',
    'movement', 'no_bite_block'
];

/**
 * Generate mock predictions for testing
 */
function generateMockPredictions(): Record<string, number> {
    const predictions: Record<string, number> = {};
    
    // Generate random values between 0-1 for each error type
    errorCols.forEach(errorType => {
        // Generate some high values to simulate detections
        const isDetected = Math.random() > 0.7;
        predictions[errorType] = isDetected
            ? Math.random() * 0.5 + 0.5  // 0.5 to 1.0 (high probability)
            : Math.random() * 0.3;       // 0 to 0.3 (low probability)
    });
    
    // Ensure at least one error is detected with high probability
    const randomErrorIndex = Math.floor(Math.random() * errorCols.length);
    predictions[errorCols[randomErrorIndex]] = Math.random() * 0.3 + 0.7;  // 0.7-1.0
    
    return predictions;
}

export async function runInference(name: string, data: string) {
    // Create a permanent storage location for the image
    const timestamp = Date.now();
    const ext = path.extname(name) || '.jpg';
    const userDataPath = app.getPath('userData');
    const imagesPath = path.join(userDataPath, 'detection_images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
    }
    
    const imageName = `detection_${timestamp}${ext}`;
    const imagePath = path.join(imagesPath, imageName);
    const base64Data = data.split(',')[1]; // Remove data URL prefix
    
    if (!base64Data) {
        console.error('Invalid image data format');
        return { success: false, error: 'Invalid image data format' };
    }
    
    try {
        // Write the file to permanent storage
        fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
          // For now, always use mock predictions since we're in Electron context
        // and the web version of TensorFlow.js can't load files directly
        console.log('Using mock inference for demonstration');
        const predictions = generateMockPredictions();
        
        // Save the detection results to the database
        const historyId = await saveDetectionHistory(imagePath, predictions);
        
        return { 
            success: true, 
            predictions,
            historyId
        };
    } catch (error) {
        console.error('Inference error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Inference failed';
        
        // Clean up the image file if there was an error
        try {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up image file:', cleanupError);
        }
        
        return { success: false, error: errorMessage };
    }
}
