import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { createRequire } from 'module';
import { app } from 'electron';

// Use require for CommonJS modules in ES module context
// This works in the Electron main process but not in Jest (which uses the mock instead)
const require = createRequire(import.meta.url);
const dicomParser = require('dicom-parser');

/**
 * DICOM Service for PosiCheck
 * 
 * Handles parsing and converting DICOM medical imaging files to standard
 * image formats (PNG/JPEG) for use with the ML inference pipeline.
 * 
 * Uses dcmjs-imaging for full support of compressed DICOM transfer syntaxes.
 */

// Lazy-loaded dcmjs-imaging components
let DicomImage: any = null;
let NativePixelDecoder: any = null;
let decoderInitialized = false;

async function initializeDicomDecoder() {
    if (decoderInitialized) return;
    
    try {
        console.log('Initializing DICOM decoder...');
        
        // Use require for dcmjs-imaging (CommonJS style)
        const dcmjsImaging = require('dcmjs-imaging');
        DicomImage = dcmjsImaging.DicomImage;
        NativePixelDecoder = dcmjsImaging.NativePixelDecoder;
        
        // Get the path to the WebAssembly module in dcmjs-codecs
        // Use app.getAppPath() for better compatibility with Electron
        const wasmPath = path.join(
            app.getAppPath(),
            'node_modules',
            'dcmjs-codecs',
            'build',
            'dcmjs-native-codecs.wasm'
        );
        
        console.log('DICOM WASM path:', wasmPath);
        console.log('WASM file exists:', fs.existsSync(wasmPath));
        
        // Initialize the native pixel decoder with WebAssembly codecs
        // Use plain path - the library will handle it correctly
        await NativePixelDecoder.initializeAsync({
            webAssemblyModulePathOrUrl: wasmPath,
            logNativeDecodersMessages: true
        });
        
        decoderInitialized = true;
        console.log('✅ DICOM decoder initialized successfully with codecs');
    } catch (error) {
        console.error('❌ Failed to initialize DICOM decoder:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
        decoderInitialized = false;
        
        throw new Error(
            `Failed to initialize DICOM decoder: ${error instanceof Error ? error.message : String(error)}.\n` +
            `This will prevent compressed DICOM files from being processed. ` +
            `Please ensure dcmjs-codecs is properly installed and the WASM file is accessible.`
        );
    }
}

/**
 * Check if a file is a DICOM file based on extension or magic bytes
 * @param filePath Path to the file to check
 * @returns true if the file appears to be a DICOM file
 */
export function isDicomFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.dcm' || ext === '.dicom') {
        return true;
    }
    
    // Check for DICOM magic bytes (DICM at offset 128)
    try {
        const buffer = Buffer.alloc(132);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 132, 0);
        fs.closeSync(fd);
        
        // Check for 'DICM' magic at offset 128
        const magic = buffer.slice(128, 132).toString('ascii');
        return magic === 'DICM';
    } catch {
        return false;
    }
}

/**
 * Check if base64 data represents a DICOM file
 * @param base64Data Base64 encoded data (may include data URL prefix)
 * @returns true if the data appears to be DICOM
 */
export function isDicomData(base64Data: string): boolean {
    try {
        // Remove data URL prefix if present
        const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(base64, 'base64');
        
        // Check for 'DICM' magic at offset 128
        if (buffer.length > 132) {
            const magic = buffer.slice(128, 132).toString('ascii');
            return magic === 'DICM';
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Convert DICOM buffer to PNG using dcmjs-imaging
 * This handles all transfer syntaxes including compressed ones
 */
async function convertDicomBufferToPng(dicomBuffer: Buffer): Promise<Buffer> {
    console.log('🔍 Starting DICOM conversion...');
    
    try {
        await initializeDicomDecoder();
    } catch (initError) {
        console.error('❌ Decoder initialization failed:', initError);
        throw initError; // Re-throw to prevent attempting conversion
    }
    
    // Verify decoder is actually ready
    if (!DicomImage || !NativePixelDecoder || !decoderInitialized) {
        const errorMsg = 'DICOM decoder not properly initialized - DicomImage or NativePixelDecoder is null';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
    }
    console.log('✅ Decoder verified and ready');
    
    const arrayBuffer = dicomBuffer.buffer.slice(
        dicomBuffer.byteOffset,
        dicomBuffer.byteOffset + dicomBuffer.byteLength
    );
    
    // Parse using dicom-parser first to get metadata
    const byteArray = new Uint8Array(dicomBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    // Log diagnostic info
    const transferSyntax = dataSet.string('x00020010');
    const width = dataSet.uint16('x00280011') || 0;
    const height = dataSet.uint16('x00280010') || 0;
    const bitsAllocated = dataSet.uint16('x00280100') || 16;
    const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2';
    
    console.log('DICOM Metadata:');
    console.log('  Transfer Syntax:', transferSyntax);
    console.log('  Dimensions:', width, 'x', height);
    console.log('  Bits Allocated:', bitsAllocated);
    console.log('  Photometric:', photometricInterpretation);
    
    try {
        console.log('Step 1: Creating DicomImage from ArrayBuffer...');
        // Use dcmjs-imaging to decode the pixel data (handles all transfer syntaxes)
        const dicomImage = new DicomImage(arrayBuffer);
        console.log('Step 2: DicomImage created successfully');
        
        // Render to RGBA pixels directly (no need to call getFrame for single-frame images)
        console.log('Step 3: Rendering DICOM image...');
        const renderingResult = await dicomImage.render();
        console.log('Step 4: Render complete, extracting pixels...');
        
        if (!renderingResult || !renderingResult.pixels) {
            throw new Error('Render returned no pixels');
        }
        
        const pixels = renderingResult.pixels; // Uint8Array of RGBA data
        const renderWidth = renderingResult.width;
        const renderHeight = renderingResult.height;
        
        console.log('Step 5: Got pixels:', renderWidth, 'x', renderHeight, 'size:', pixels.length);
        
        // Convert RGBA to PNG using Sharp
        const pngBuffer = await sharp(Buffer.from(pixels), {
            raw: {
                width: renderWidth,
                height: renderHeight,
                channels: 4 // RGBA
            }
        }).png().toBuffer();
        
        console.log('Step 6: PNG created, size:', pngBuffer.length);
        return pngBuffer;
    } catch (dcmjsError: any) {
        console.error('dcmjs-imaging failed:', dcmjsError?.message || dcmjsError);
        
        // Check if it's a compressed data issue or other error
        const errorMessage = dcmjsError?.message || String(dcmjsError);
        
        // Try fallback only for non-compression related errors
        if (errorMessage.includes('encapsulated') || errorMessage.includes('compressed') || errorMessage.includes('transfer syntax')) {
            throw new Error('DICOM decoding failed: ' + errorMessage);
        }
        
        // Fallback to manual parsing for other errors (e.g., uncompressed data)
        console.log('Trying fallback parser...');
        return await fallbackDicomConversion(dicomBuffer, width, height, bitsAllocated, photometricInterpretation, dataSet);
    }
}

/**
 * Fallback conversion for uncompressed DICOM files
 */
async function fallbackDicomConversion(
    dicomBuffer: Buffer,
    width: number,
    height: number,
    bitsAllocated: number,
    photometricInterpretation: string,
    dataSet: any
): Promise<Buffer> {
    const byteArray = new Uint8Array(dicomBuffer);
    
    // Get pixel data element
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
    }
    
    // Check if encapsulated (compressed)
    if (pixelDataElement.encapsulatedPixelData) {
        throw new Error('This DICOM file uses compressed pixel data. Please ensure dcmjs-codecs is properly installed.');
    }
    
    const pixelRepresentation = dataSet.uint16('x00280103') || 0;
    const rescaleIntercept = dataSet.floatString('x00281052') || 0;
    const rescaleSlope = dataSet.floatString('x00281053') || 1;
    const windowCenter = dataSet.floatString('x00281050');
    const windowWidth = dataSet.floatString('x00281051');
    
    // Extract raw pixel data
    const rawPixelData = new Uint8Array(
        byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length
    );
    
    const pixelCount = width * height;
    const output = new Uint8Array(pixelCount);
    const bytesPerPixel = bitsAllocated / 8;
    
    // Convert to float array first
    const pixelValues = new Float32Array(pixelCount);
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    for (let i = 0; i < pixelCount; i++) {
        let value: number;
        
        if (bytesPerPixel === 2) {
            const offset = i * 2;
            if (pixelRepresentation === 1) {
                value = (rawPixelData[offset] | (rawPixelData[offset + 1] << 8));
                if (value > 32767) value -= 65536;
            } else {
                value = rawPixelData[offset] | (rawPixelData[offset + 1] << 8);
            }
        } else {
            value = rawPixelData[i];
        }
        
        value = value * rescaleSlope + rescaleIntercept;
        pixelValues[i] = value;
        
        if (value < minVal) minVal = value;
        if (value > maxVal) maxVal = value;
    }
    
    // Apply window/level
    let wc = windowCenter ?? (minVal + maxVal) / 2;
    let ww = windowWidth ?? (maxVal - minVal);
    if (ww < 1) ww = 1;
    
    const minWindow = wc - ww / 2;
    const maxWindow = wc + ww / 2;
    
    for (let i = 0; i < pixelCount; i++) {
        let value = pixelValues[i];
        
        if (value <= minWindow) {
            value = 0;
        } else if (value >= maxWindow) {
            value = 255;
        } else {
            value = ((value - minWindow) / ww) * 255;
        }
        
        if (photometricInterpretation.includes('MONOCHROME1')) {
            value = 255 - value;
        }
        
        output[i] = Math.round(value);
    }
    
    // Convert to PNG
    const pngBuffer = await sharp(Buffer.from(output), {
        raw: {
            width: width,
            height: height,
            channels: 1
        }
    }).png().toBuffer();
    
    return pngBuffer;
}

/**
 * Convert a DICOM file to PNG format
 * @param inputPath Path to the DICOM file
 * @param outputPath Path for the output PNG file
 * @returns Path to the converted PNG file
 */
export async function convertDicomToImage(inputPath: string, outputPath: string): Promise<string> {
    console.log(`Converting DICOM file: ${inputPath}`);
    
    const dicomBuffer = fs.readFileSync(inputPath);
    const pngBuffer = await convertDicomBufferToPng(dicomBuffer);
    
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`DICOM converted to: ${outputPath}`);
    
    return outputPath;
}

/**
 * Convert DICOM data from base64 to PNG format
 * @param base64Data Base64 encoded DICOM data
 * @param outputPath Path for the output PNG file
 * @returns Path to the converted PNG file
 */
export async function convertDicomBase64ToImage(base64Data: string, outputPath: string): Promise<string> {
    // Remove data URL prefix if present
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const dicomBuffer = Buffer.from(base64, 'base64');
    
    const pngBuffer = await convertDicomBufferToPng(dicomBuffer);
    
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`DICOM converted to: ${outputPath}`);
    
    return outputPath;
}
