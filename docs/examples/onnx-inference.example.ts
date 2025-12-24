/**
 * Example usage of the ONNX inference service
 * 
 * This file demonstrates how to use the ONNX inference service
 * in your Electron application.
 */

import path from 'path';
import { app } from 'electron';
import { 
    loadOnnxModel, 
    runOnnxInference, 
    runOnnxInferenceWithProbabilities,
    releaseOnnxModel 
} from './onnx-inference.service.js';

// Define your class labels (adjust based on your model)
const ERROR_CLASSES = [
    'chin_high', 'chin_low', 'pos_forward', 'pos_backward',
    'head_tilt', 'head_rotate', 'tongue_fail', 'slumped_pos',
    'movement', 'no_bite_block'
];

/**
 * Example 1: Simple inference - get predicted class index
 */
export async function simpleInferenceExample(imagePath: string): Promise<void> {
    try {
        // Path to your ONNX model (adjust to your actual model location)
        const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'mobilenet_v2.onnx');
        
        console.log('Running simple inference...');
        const predictedClassIndex = await runOnnxInference(imagePath, modelPath);
        
        const predictedClassName = ERROR_CLASSES[predictedClassIndex];
        console.log(`Predicted class: ${predictedClassName} (index: ${predictedClassIndex})`);
        
    } catch (error) {
        console.error('Simple inference failed:', error);
    }
}

/**
 * Example 2: Get all probabilities for detailed analysis
 */
export async function fullProbabilitiesExample(imagePath: string): Promise<Record<string, number>> {
    try {
        const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'mobilenet_v2.onnx');
        
        console.log('Running inference with full probabilities...');
        const probabilities = await runOnnxInferenceWithProbabilities(imagePath, modelPath);
        
        // Create a map of class names to probabilities
        const results: Record<string, number> = {};
        ERROR_CLASSES.forEach((className, index) => {
            results[className] = probabilities[index];
        });
        
        // Log results sorted by probability
        const sorted = Object.entries(results)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        console.log('Top 5 predictions:');
        sorted.forEach(([className, prob]) => {
            console.log(`  ${className}: ${(prob * 100).toFixed(2)}%`);
        });
        
        return results;
        
    } catch (error) {
        console.error('Full probabilities inference failed:', error);
        throw error;
    }
}

/**
 * Example 3: Pre-load model for faster subsequent inferences
 */
export async function preloadModelExample(): Promise<void> {
    try {
        const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'mobilenet_v2.onnx');
        
        console.log('Pre-loading ONNX model...');
        await loadOnnxModel(modelPath);
        console.log('Model pre-loaded and cached!');
        
        // Now subsequent calls don't need modelPath parameter
        // const prediction = await runOnnxInference(imagePath);
        
    } catch (error) {
        console.error('Model pre-loading failed:', error);
    }
}

/**
 * Example 4: Batch processing multiple images
 */
export async function batchInferenceExample(imagePaths: string[]): Promise<void> {
    try {
        const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'mobilenet_v2.onnx');
        
        // Pre-load model once
        await loadOnnxModel(modelPath);
        
        console.log(`Processing ${imagePaths.length} images...`);
        
        for (let i = 0; i < imagePaths.length; i++) {
            const imagePath = imagePaths[i];
            console.log(`\nProcessing image ${i + 1}/${imagePaths.length}: ${path.basename(imagePath)}`);
            
            const predictedClass = await runOnnxInference(imagePath);
            const className = ERROR_CLASSES[predictedClass];
            
            console.log(`  Result: ${className}`);
        }
        
        console.log('\nBatch processing complete!');
        
    } catch (error) {
        console.error('Batch inference failed:', error);
    }
}

/**
 * Example 5: Integrate with existing inference service
 * Replace the TensorFlow.js model with ONNX
 */
export async function integrateWithExistingService(imagePath: string): Promise<Record<string, number>> {
    try {
        const modelPath = path.join(app.getAppPath(), 'src', 'electron', 'model', 'mobilenet_v2.onnx');
        
        // Get all probabilities
        const probabilities = await runOnnxInferenceWithProbabilities(imagePath, modelPath);
        
        // Convert to the format expected by your existing code
        const predictions: Record<string, number> = {};
        ERROR_CLASSES.forEach((errorType, index) => {
            predictions[errorType] = probabilities[index];
        });
        
        console.log('Predictions for existing service:');
        Object.entries(predictions).forEach(([key, value]) => {
            if (value > 0.5) { // Threshold for detection
                console.log(`  ${key}: ${(value * 100).toFixed(1)}%`);
            }
        });
        
        return predictions;
        
    } catch (error) {
        console.error('Integration failed:', error);
        throw error;
    }
}

/**
 * Cleanup when app is closing
 */
export async function cleanupExample(): Promise<void> {
    console.log('Cleaning up ONNX resources...');
    await releaseOnnxModel();
    console.log('Cleanup complete');
}

/* 
 * USAGE IN YOUR IPC HANDLER:
 * 
 * import { integrateWithExistingService } from './path/to/onnx-inference.example.js';
 * 
 * ipcMain.handle('inference:run', async (event, imagePath: string) => {
 *     try {
 *         const predictions = await integrateWithExistingService(imagePath);
 *         return { success: true, predictions };
 *     } catch (error) {
 *         return { 
 *             success: false, 
 *             error: error instanceof Error ? error.message : 'Unknown error' 
 *         };
 *     }
 * });
 */
