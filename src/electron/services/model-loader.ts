import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { URL } from 'url';

/**
 * Custom model loader that serves model files via a local HTTP server
 * This is more reliable than using file:// URLs in Electron
 */
export class ElectronModelLoader {
  private server: http.Server | null = null;
  private port = 0;
  private baseDir = '';
  private isReady = false;
  
  /**
   * Start a local HTTP server to serve model files
   * @param modelDir Directory containing model files
   * @returns The base URL of the server
   */
  async startServer(modelDir: string): Promise<string> {
    if (this.server) {
      return `http://localhost:${this.port}`;
    }
    
    this.baseDir = modelDir;
    
    // Create a server that serves files from the model directory
    this.server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://localhost:${this.port}`);
        const filePath = path.join(this.baseDir, url.pathname);
        
        console.log(`Serving: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        
        const data = fs.readFileSync(filePath);
        
        // Set appropriate content type
        if (filePath.endsWith('.json')) {
          res.setHeader('Content-Type', 'application/json');
        } else if (filePath.endsWith('.bin')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        // Important for TF.js model loading
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        res.writeHead(200);
        res.end(data);
      } catch (error) {
        console.error('Error serving file:', error);
        res.writeHead(500);
        res.end('Internal server error');
      }
    });
    
    // Start the server on a random port
    return new Promise((resolve) => {
      this.server?.listen(0, () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          this.isReady = true;
          const baseUrl = `http://localhost:${this.port}`;
          console.log(`Model server started at ${baseUrl}`);
          resolve(baseUrl);
        } else {
          throw new Error('Failed to start model server');
        }
      });
    });
  }
  
  /**
   * Load a model from the local server
   * @param modelJsonPath Path to the model.json file
   * @returns Loaded model
   */
  async loadModel(modelJsonPath: string): Promise<tf.LayersModel> {
    const modelDir = path.dirname(modelJsonPath);
    const modelFileName = path.basename(modelJsonPath);
    
    // Start the server if not already started
    const baseUrl = await this.startServer(modelDir);
    
    // Load the model from the local server
    const modelUrl = `${baseUrl}/${modelFileName}`;
    console.log(`Loading model from: ${modelUrl}`);
    
    return await tf.loadLayersModel(modelUrl);
  }
  
  /**
   * Stop the server
   */
  stopServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.isReady = false;
      console.log('Model server stopped');
    }
  }
}
