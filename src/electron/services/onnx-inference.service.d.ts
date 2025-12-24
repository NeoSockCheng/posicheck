/**
 * Type definitions for ONNX inference service
 */

/**
 * Result from ONNX inference
 */
export interface OnnxInferenceResult {
    success: boolean;
    predictedClass?: number;
    probabilities?: number[];
    error?: string;
}

/**
 * Configuration for ONNX model
 */
export interface OnnxModelConfig {
    modelPath: string;
    inputWidth: number;
    inputHeight: number;
    inputChannels: number;
    classNames?: string[];
}
