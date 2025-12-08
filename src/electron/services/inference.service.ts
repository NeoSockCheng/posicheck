import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { runOnnxInferenceWithProbabilities } from './onnx-inference.service.js';

const errorCols = [
    'chin_high', 'chin_low', 'pos_forward', 'pos_backward',
    'head_tilt', 'head_rotate', 'tongue_fail', 'slumped_pos',
    'movement', 'no_bite_block'
];

// Path to ONNX model
const ONNX_MODEL_PATH = path.join(
    app.getAppPath(), 
    'src', 
    'electron', 
    'model', 
    'model.onnx'
);

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
          // Use ONNX model for inference
        console.log('Running ONNX inference on:', imagePath);
        const probabilities = await runOnnxInferenceWithProbabilities(imagePath, ONNX_MODEL_PATH);
        
        // Convert array to object format expected by the app
        const predictions: Record<string, number> = {};
        errorCols.forEach((errorType, index) => {
            predictions[errorType] = probabilities[index];
        });
        
        console.log('ONNX predictions:', predictions);
        
        return { 
            success: true, 
            predictions,
            imagePath   // Return the image path instead of historyId
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
