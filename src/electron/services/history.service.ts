import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { db } from '../db/database.js';

// Define types
export interface DetectionHistory {
  id: number;
  imagePath: string;
  timestamp: number;
  predictionData: Record<string, number>;
  notes?: string;
}

export interface DetectionError {
  historyId: number;
  errorType: string;
  confidence: number;
}

/**
 * Save detection result to the database
 */
export async function saveDetectionHistory(
  imagePath: string, 
  predictions: Record<string, number>,
  notes?: string
): Promise<number> {
  try {
    // Insert the main history record
    const timestamp = Date.now();
    const stmt = db.prepare(`
      INSERT INTO history (image_path, timestamp, prediction_data, notes)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      imagePath,
      timestamp,
      JSON.stringify(predictions),
      notes || null
    );
    
    const historyId = info.lastInsertRowid as number;
    
    // Insert individual errors with confidence > 0.1
    const errorInsertStmt = db.prepare(`
      INSERT INTO detection_errors (history_id, error_type, confidence)
      VALUES (?, ?, ?)
    `);
      // Start a transaction for inserting multiple errors
    const transaction = db.transaction((histId: number, preds: Record<string, number>) => {
      for (const [errorType, confidence] of Object.entries(preds)) {
        if (confidence > 0.1) { // Only record significant errors
          errorInsertStmt.run(histId, errorType, confidence);
        }
      }
    });
    
    transaction(historyId, predictions);
    
    return historyId;
  } catch (error) {
    console.error('Error saving detection history:', error);
    throw error;
  }
}

/**
 * Get history items with optional limit and offset
 */
export function getHistoryItems(limit = 50, offset = 0): DetectionHistory[] {
  try {
    const stmt = db.prepare(`
      SELECT id, image_path, timestamp, prediction_data, notes
      FROM history
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset) as any[];
    
    return rows.map(row => ({
      id: row.id,
      imagePath: row.image_path,
      timestamp: row.timestamp,
      predictionData: JSON.parse(row.prediction_data),
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error getting history items:', error);
    return [];
  }
}

/**
 * Get a specific history item by ID
 */
export function getHistoryById(id: number): DetectionHistory | null {
  try {
    const stmt = db.prepare(`
      SELECT id, image_path, timestamp, prediction_data, notes
      FROM history
      WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      imagePath: row.image_path,
      timestamp: row.timestamp,
      predictionData: JSON.parse(row.prediction_data),
      notes: row.notes
    };
  } catch (error) {
    console.error(`Error getting history item ${id}:`, error);
    return null;
  }
}

/**
 * Delete a history record by ID
 */
export function deleteHistoryItem(id: number): boolean {
  try {
    const stmt = db.prepare(`DELETE FROM history WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting history item ${id}:`, error);
    return false;
  }
}

/**
 * Update notes for a history record
 */
export function updateHistoryNotes(id: number, notes: string): boolean {
  try {
    const stmt = db.prepare(`UPDATE history SET notes = ? WHERE id = ?`);
    const result = stmt.run(notes, id);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating notes for history item ${id}:`, error);
    return false;
  }
}

/**
 * Migrate existing history from JSON file if needed
 */
export function migrateHistoryFromJson(): number {
  try {
    // Check if we have existing history.json file
    const userDataPath = app.getPath('userData');
    const historyPath = path.join(userDataPath, 'data', 'history.json');
    
    if (!fs.existsSync(historyPath)) {
      return 0;
    }
    
    console.log(`Migrating history from ${historyPath}`);
    const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    
    if (!Array.isArray(historyData)) {
      return 0;
    }
    
    let migratedCount = 0;
    
    // Start a transaction for the migration
    db.transaction(() => {
      for (const item of historyData) {
        if (item.imagePath && item.timestamp && item.predictionData) {
          const stmt = db.prepare(`
            INSERT INTO history (image_path, timestamp, prediction_data, notes)
            VALUES (?, ?, ?, ?)
          `);
          
          stmt.run(
            item.imagePath,
            item.timestamp,
            JSON.stringify(item.predictionData),
            item.notes || null
          );
          
          migratedCount++;
        }
      }
    })();
    
    // Rename the original file as backup
    if (migratedCount > 0) {
      fs.renameSync(historyPath, `${historyPath}.bak`);
    }
    
    return migratedCount;
  } catch (error) {
    console.error('Error migrating history from JSON:', error);
    return 0;
  }
}

/**
 * Get an image file as base64
 * @param imagePath Path to the image file
 * @param quality Optional quality parameter (0-100) for JPEG images
 * @param maxWidth Optional maximum width for large images
 * @returns Base64 encoded string of the image with data URL prefix
 */
export function getHistoryImageAsBase64(
  imagePath: string, 
  quality: number = 85, 
  maxWidth: number = 1200
): string | null {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file not found: ${imagePath}`);
      return null;
    }
    
    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Determine MIME type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    // For now, just use basic base64 encoding
    // Later we can add more sophisticated image processing if needed
    const base64Image = imageBuffer.toString('base64');
    
    // Return data URL format
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error reading image file:', error);
    return null;
  }
}
