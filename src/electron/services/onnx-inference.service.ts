import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import path from 'path';

/**
 * ONNX Inference Service for MobileNet_V2
 * 
 * This service handles image preprocessing and inference for a PyTorch-based
 * MobileNet_V2 model converted to ONNX format.
 * 
 * Technical Specifications:
 * - Input Shape: (1, 3, 224, 224) -> NCHW format (Batch, Channels, Height, Width)
 * - Normalization: ImageNet standard (Mean: [0.485, 0.456, 0.406], Std: [0.229, 0.224, 0.225])
 * - Data Layout: Converts from NHWC (sharp output) to NCHW (model input)
 */

// ImageNet normalization constants
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

// Model input dimensions
const INPUT_WIDTH = 224;
const INPUT_HEIGHT = 224;
const INPUT_CHANNELS = 3;

// Global session cache
let inferenceSession: ort.InferenceSession | null = null;

/**
 * Load the ONNX model from file system
 * @param modelPath Absolute path to the .onnx model file
 * @returns Promise resolving to the loaded InferenceSession
 */
export async function loadOnnxModel(modelPath: string): Promise<ort.InferenceSession> {
    if (inferenceSession) {
        console.log('ONNX model already loaded, returning cached session');
        return inferenceSession;
    }

    try {
        console.log(`Loading ONNX model from: ${modelPath}`);
        
        // Create inference session with CPU execution provider
        inferenceSession = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all'
        });
        
        console.log('ONNX model loaded successfully');
        console.log(`Input names: ${inferenceSession.inputNames}`);
        console.log(`Output names: ${inferenceSession.outputNames}`);
        
        return inferenceSession;
    } catch (error) {
        console.error('Failed to load ONNX model:', error);
        throw new Error(`ONNX model loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Preprocess image for MobileNet_V2 inference
 * 
 * Steps:
 * 1. Resize to 224x224
 * 2. Convert to RGB (remove alpha if present)
 * 3. Extract raw pixel data
 * 4. Reorder from NHWC to NCHW format
 * 5. Apply ImageNet normalization
 * 
 * @param imagePath Path to the image file
 * @returns Float32Array in NCHW format, ready for model input
 */
async function preprocessImage(imagePath: string): Promise<Float32Array> {
    try {
        console.log(`Preprocessing image: ${path.basename(imagePath)}`);
        
        // Step 1 & 2: Resize and convert to RGB
        const imageBuffer = await sharp(imagePath)
            .resize(INPUT_WIDTH, INPUT_HEIGHT, {
                fit: 'fill' // Ensure exact dimensions
            })
            .removeAlpha() // Ensure RGB (no alpha channel)
            .raw() // Get raw pixel data
            .toBuffer();
        
        // Verify buffer size
        const expectedSize = INPUT_WIDTH * INPUT_HEIGHT * INPUT_CHANNELS;
        if (imageBuffer.length !== expectedSize) {
            throw new Error(`Unexpected buffer size: ${imageBuffer.length}, expected: ${expectedSize}`);
        }
        
        // Step 3: Create Float32Array for NCHW format
        // Shape: (1, 3, 224, 224) = 1 * 3 * 224 * 224 = 150,528 elements
        const float32Data = new Float32Array(1 * INPUT_CHANNELS * INPUT_HEIGHT * INPUT_WIDTH);
        
        // Step 4 & 5: Reorder from NHWC to NCHW and apply normalization
        // NHWC (Pixels): H x W x C -> imageBuffer[y * width * 3 + x * 3 + c]
        // NCHW (Planes): C x H x W -> float32Data[c * height * width + y * width + x]
        
        let pixelIndex = 0; // Index in NHWC format (imageBuffer)
        
        for (let y = 0; y < INPUT_HEIGHT; y++) {
            for (let x = 0; x < INPUT_WIDTH; x++) {
                // Extract RGB values from NHWC format
                const r = imageBuffer[pixelIndex];     // Red channel
                const g = imageBuffer[pixelIndex + 1]; // Green channel
                const b = imageBuffer[pixelIndex + 2]; // Blue channel
                
                // Normalize to [0, 1]
                const rNorm = r / 255.0;
                const gNorm = g / 255.0;
                const bNorm = b / 255.0;
                
                // Apply ImageNet normalization: (pixel - mean) / std
                const rStandardized = (rNorm - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
                const gStandardized = (gNorm - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
                const bStandardized = (bNorm - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
                
                // Convert to NCHW format
                // Channel 0 (R): index = 0 * H * W + y * W + x
                // Channel 1 (G): index = 1 * H * W + y * W + x
                // Channel 2 (B): index = 2 * H * W + y * W + x
                const baseIndex = y * INPUT_WIDTH + x;
                float32Data[0 * INPUT_HEIGHT * INPUT_WIDTH + baseIndex] = rStandardized; // R channel
                float32Data[1 * INPUT_HEIGHT * INPUT_WIDTH + baseIndex] = gStandardized; // G channel
                float32Data[2 * INPUT_HEIGHT * INPUT_WIDTH + baseIndex] = bStandardized; // B channel
                
                pixelIndex += 3; // Move to next pixel (skip 3 bytes for RGB)
            }
        }
        
        console.log(`Image preprocessing complete. Output shape: [1, ${INPUT_CHANNELS}, ${INPUT_HEIGHT}, ${INPUT_WIDTH}]`);
        return float32Data;
        
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        throw new Error(`Failed to preprocess image: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Run inference on an image and return the predicted class index
 * 
 * @param imagePath Absolute path to the image file
 * @param modelPath Absolute path to the ONNX model file (optional if already loaded)
 * @returns Promise resolving to the index of the class with highest probability
 */
export async function runOnnxInference(
    imagePath: string,
    modelPath?: string
): Promise<number> {
    try {
        // Load model if not already loaded
        if (!inferenceSession && modelPath) {
            await loadOnnxModel(modelPath);
        }
        
        if (!inferenceSession) {
            throw new Error('ONNX model not loaded. Please provide modelPath on first call.');
        }
        
        // Preprocess the image
        const preprocessedData = await preprocessImage(imagePath);
        
        // Create input tensor
        const inputTensor = new ort.Tensor(
            'float32',
            preprocessedData,
            [1, INPUT_CHANNELS, INPUT_HEIGHT, INPUT_WIDTH] // NCHW format
        );
        
        // Get the input name from the model
        const inputName = inferenceSession.inputNames[0];
        
        // Run inference
        console.log('Running ONNX inference...');
        const feeds = { [inputName]: inputTensor };
        const results = await inferenceSession.run(feeds);
        
        // Get output tensor
        const outputName = inferenceSession.outputNames[0];
        const outputTensor = results[outputName];
        
        if (!outputTensor || !outputTensor.data) {
            throw new Error('Invalid output from model');
        }
        
        // Convert output to array
        const outputData = Array.from(outputTensor.data as Float32Array);
        console.log(`Model output shape: ${outputTensor.dims}`);
        console.log(`Output probabilities (first 10):`, outputData.slice(0, 10).map(v => v.toFixed(4)));
        
        // Find index of maximum probability
        let maxIndex = 0;
        let maxValue = outputData[0];
        
        for (let i = 1; i < outputData.length; i++) {
            if (outputData[i] > maxValue) {
                maxValue = outputData[i];
                maxIndex = i;
            }
        }
        
        console.log(`Predicted class: ${maxIndex} (confidence: ${(maxValue * 100).toFixed(2)}%)`);
        
        return maxIndex;
        
    } catch (error) {
        console.error('ONNX inference failed:', error);
        throw new Error(`Inference failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Run inference and return full output probabilities
 * Useful when you need all class probabilities, not just the argmax
 * 
 * @param imagePath Absolute path to the image file
 * @param modelPath Absolute path to the ONNX model file (optional if already loaded)
 * @returns Promise resolving to array of probabilities for each class
 */
export async function runOnnxInferenceWithProbabilities(
    imagePath: string,
    modelPath?: string
): Promise<number[]> {
    try {
        // Load model if not already loaded
        if (!inferenceSession && modelPath) {
            await loadOnnxModel(modelPath);
        }
        
        if (!inferenceSession) {
            throw new Error('ONNX model not loaded. Please provide modelPath on first call.');
        }
        
        // Preprocess the image
        const preprocessedData = await preprocessImage(imagePath);
        
        // Create input tensor
        const inputTensor = new ort.Tensor(
            'float32',
            preprocessedData,
            [1, INPUT_CHANNELS, INPUT_HEIGHT, INPUT_WIDTH]
        );
        
        // Run inference
        const inputName = inferenceSession.inputNames[0];
        const feeds = { [inputName]: inputTensor };
        const results = await inferenceSession.run(feeds);
        
        // Get output
        const outputName = inferenceSession.outputNames[0];
        const outputTensor = results[outputName];
        
        if (!outputTensor || !outputTensor.data) {
            throw new Error('Invalid output from model');
        }
        
        // Return all probabilities
        return Array.from(outputTensor.data as Float32Array);
        
    } catch (error) {
        console.error('ONNX inference with probabilities failed:', error);
        throw new Error(`Inference failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Cleanup function to release model resources
 */
export async function releaseOnnxModel(): Promise<void> {
    if (inferenceSession) {
        console.log('Releasing ONNX model session...');
        await inferenceSession.release();
        inferenceSession = null;
        console.log('ONNX model released');
    }
}
