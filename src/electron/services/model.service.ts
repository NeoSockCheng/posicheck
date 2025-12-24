// Import TensorFlow.js without Node.js native bindings
import * as tf from '@tensorflow/tfjs';
// Import our custom model loader
import { ElectronModelLoader } from './model-loader.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import sharp from 'sharp';

// Define error categories that the model predicts
const errorCategories = [
    'chin_high', 'chin_low', 'pos_forward', 'pos_backward',
    'head_tilt', 'head_rotate', 'tongue_fail', 'slumped_pos',
    'movement', 'no_bite_block'
];

/**
 * Generate mock predictions for testing when model is not available
 */
function generateMockPredictions(): Record<string, number> {
    const predictions: Record<string, number> = {};
    
    // Generate random values between 0-1 for each error type
    errorCategories.forEach(errorType => {
        // Generate some high values to simulate detections
        const isDetected = Math.random() > 0.7;
        predictions[errorType] = isDetected
            ? Math.random() * 0.5 + 0.5  // 0.5 to 1.0 (high probability)
            : Math.random() * 0.3;       // 0 to 0.3 (low probability)
    });
    
    // Ensure at least one error is detected with high probability
    const randomErrorIndex = Math.floor(Math.random() * errorCategories.length);
    predictions[errorCategories[randomErrorIndex]] = Math.random() * 0.3 + 0.7;  // 0.7-1.0
    
    console.log('Generated mock predictions:', predictions);
    return predictions;
}

// Global variables to store the loaded model
let model: tf.LayersModel | null = null;
const TFJS_MODEL_PATH = path.join(app.getAppPath(), 'src', 'electron', 'model', 'tfjs_model', 'model.json');
// Create an instance of our custom model loader
export const modelLoader = new ElectronModelLoader();

/**
 * Load the model for inference
 * 
 * Loads the converted TensorFlow.js model from the file system
 */
export async function loadModel(): Promise<tf.LayersModel> {
    if (model) {
        return model; // Return cached model if already loaded
    }

    try {
        console.log(`Loading TensorFlow.js model from: ${TFJS_MODEL_PATH}`);
        
        // Use our custom model loader to load the model via a local HTTP server
        model = await modelLoader.loadModel(TFJS_MODEL_PATH);
        
        console.log('Model loaded successfully');
        
        // Log model info
        console.log(`Model input shape: ${JSON.stringify(model.inputs[0].shape)}`);
        console.log(`Model output shape: ${JSON.stringify(model.outputs[0].shape)}`);
        
        return model;
    } catch (error) {
        console.error('Failed to load the model:', error);
        throw new Error(`Model loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Preprocess the image for the model following Xception preprocessing requirements
 * @param imagePath Path to the image file
 */
async function preprocessImage(imagePath: string): Promise<tf.Tensor> {
    try {
        console.log(`Preprocessing image: ${imagePath}`);
        
        // Use sharp to resize and process the image
        // Xception expects 299x299 RGB images
        const processedImageBuffer = await sharp(imagePath)
            .resize(299, 299) // Xception standard input size
            .removeAlpha() // Ensure RGB (remove alpha if present)
            .raw() // Get raw pixel data
            .toBuffer();
            
        // Create a tensor from the processed image data
        const imageBufferLength = processedImageBuffer.length;
        const numPixels = 299 * 299;
        const numChannels = imageBufferLength / numPixels;
        
        if (numChannels !== 3) {
            console.warn(`Image has ${numChannels} channels, expected 3 (RGB)`);
        }
        
        // Xception preprocessing requires:
        // 1. Scaling pixel values to [0,1]
        // 2. Subtracting the mean
        // 3. Dividing by standard deviation
        // For ImageNet models, normalization is typically (pixel - mean) / std where:
        // mean = [0.485, 0.456, 0.406] and std = [0.229, 0.224, 0.225]
        
        // Create a tensor with shape [1, 299, 299, 3]
        const tensorBuffer = tf.buffer([1, 299, 299, 3]);
        
        // Fill the tensor with normalized values
        let offset = 0;
        for (let y = 0; y < 299; y++) {
            for (let x = 0; x < 299; x++) {
                // Extract RGB values
                const r = processedImageBuffer[offset] / 255;
                const g = processedImageBuffer[offset + 1] / 255;
                const b = processedImageBuffer[offset + 2] / 255;
                
                // Normalize using ImageNet mean/std
                tensorBuffer.set((r - 0.485) / 0.229, 0, y, x, 0);
                tensorBuffer.set((g - 0.456) / 0.224, 0, y, x, 1);
                tensorBuffer.set((b - 0.406) / 0.225, 0, y, x, 2);
                
                offset += 3;
            }
        }
        
        console.log(`Image preprocessing complete for: ${path.basename(imagePath)}`);
        return tensorBuffer.toTensor();
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        throw new Error(`Failed to preprocess the image: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Run inference on an image using the Xception model
 * @param imagePath Path to the image file
 */
export async function runModelInference(imagePath: string): Promise<Record<string, number>> {
    try {
        // Check if model is loaded
        if (!model) {
            console.warn('Model not loaded, using mock predictions');
            return generateMockPredictions();
        }
        
        // Preprocess the image
        const tensor = await preprocessImage(imagePath);
        
        // Run inference
        console.log('Running inference on processed image...');
        const predictions = model.predict(tensor) as tf.Tensor;
        
        // Convert predictions to JavaScript array
        const predictionArray = await predictions.data();
        console.log('Raw prediction values:', predictionArray);
        
        // Create a map of error types to prediction values
        const results: Record<string, number> = {};
        
        // Map the prediction values to error categories
        errorCategories.forEach((category, index) => {
            // If index is within the prediction array bounds
            if (index < predictionArray.length) {
                results[category] = predictionArray[index];
            } else {
                console.warn(`Index ${index} out of bounds for prediction array of length ${predictionArray.length}`);
                // Assign a default value (no error detected)
                results[category] = 0;
            }
        });
        
        console.log('Processed predictions:', results);
        
        // Cleanup
        tensor.dispose();
        predictions.dispose();
        
        return results;
    } catch (error) {
        console.error('Inference failed:', error);
        throw new Error(`Inference failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Initialize the model service
 */
export async function initializeModelService(): Promise<void> {
    try {
        // Check if model path is accessible
        try {
            await fs.promises.access(TFJS_MODEL_PATH, fs.constants.R_OK);
            console.log(`Model file exists at: ${TFJS_MODEL_PATH}`);
        } catch (err) {
            console.warn(`Model file not accessible at path: ${TFJS_MODEL_PATH}. Cannot load model.`);
            console.warn('Will use mock predictions for inference');
            return; // Early return, we'll use mock predictions
        }
        
        // Attempt to preload the model
        try {
            await loadModel();
            console.log('Model service initialized successfully');
        } catch (modelError) {
            console.error('Failed to load model:', modelError);
            console.warn('Will use mock predictions for inference');
            // We don't re-throw here, just log the error and continue.
            // The inference service will fall back to mock predictions when model is null.
        }
    } catch (error) {
        console.error('Failed to initialize model service:', error);
        // We don't throw here, we'll use mock predictions
        console.warn('Will use mock predictions for inference');
    }
}
