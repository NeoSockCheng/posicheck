import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { db } from '../db/database.js';
import archiver from 'archiver';
import { createObjectCsvWriter } from 'csv-writer';

// Define types for feedback data
export interface FeedbackData {
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    organization?: string;
  };
  accuracyRating: number;
  errorTypes: string[];
  extraFeedback?: string;
}

interface FeedbackEntry {
  id: number;
  imagePath: string;
  timestamp: number;
  accuracyRating: number;
  errorTypes: string[];
  extraFeedback?: string;
}

/**
 * Process feedback submission with uploaded image
 * @param name Filename of the uploaded image
 * @param data Base64 encoded image data
 * @param feedbackData Additional feedback data submitted by the user
 */
export async function processFeedback(name: string, data: string, feedbackData: FeedbackData) {
    // Create a permanent storage location for the image
    const timestamp = Date.now();
    const ext = path.extname(name) || '.jpg';
    const userDataPath = app.getPath('userData');
    const feedbackImagesPath = path.join(userDataPath, 'feedback_images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(feedbackImagesPath)) {
        fs.mkdirSync(feedbackImagesPath, { recursive: true });
    }
    
    const imageName = `feedback_${timestamp}${ext}`;
    const imagePath = path.join(feedbackImagesPath, imageName);
    
    // Extract and save the image
    const base64Data = data.split(',')[1]; // Remove data URL prefix if exists
    if (!base64Data) {
        return { success: false, error: 'Invalid image data format' };
    }
    
    try {
        // Write the image file
        fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
        
        console.log('Processing feedback submission with data:', feedbackData);
        console.log('Feedback image saved at:', imagePath);

        // Insert feedback data into the SQLite database
        const stmt = db.prepare(`
            INSERT INTO feedback (image_path, timestamp, accuracy_rating, error_types, extra_feedback)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
            imagePath,
            timestamp,
            feedbackData.accuracyRating || 0,
            JSON.stringify(feedbackData.errorTypes || []),
            feedbackData.extraFeedback || null
        );
        
        const feedbackId = info.lastInsertRowid;
        
        return { 
            success: true, 
            message: 'Thank you for your feedback!',
            id: feedbackId.toString()
        };
    } catch (error) {
        console.error('Feedback processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Feedback submission failed';
        
        // Clean up image file if there was an error
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        return { success: false, error: errorMessage };
    }
}

/**
 * Get all feedback entries
 * @param limit Maximum number of entries to return
 * @param offset Number of entries to skip (for pagination)
 */
export function getAllFeedback(limit = 50, offset = 0) {
    try {
        const stmt = db.prepare(`
            SELECT id, image_path, timestamp, accuracy_rating, error_types, extra_feedback
            FROM feedback
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        `);
        
        const rows = stmt.all(limit, offset) as any[];
        
        return { 
            success: true, 
            items: rows.map(row => ({
                id: row.id,
                imagePath: row.image_path,
                timestamp: row.timestamp,
                accuracyRating: row.accuracy_rating,
                errorTypes: JSON.parse(row.error_types || '[]'),
                extraFeedback: row.extra_feedback
            }))
        };
    } catch (error) {
        console.error('Error getting feedback entries:', error);
        return { success: false, error: 'Failed to retrieve feedback entries' };
    }
}

/**
 * Get a feedback entry by ID
 * @param id Feedback entry ID
 */
export function getFeedbackById(id: number) {
    try {
        const stmt = db.prepare(`
            SELECT id, image_path, timestamp, accuracy_rating, error_types, extra_feedback
            FROM feedback
            WHERE id = ?
        `);
        
        const row = stmt.get(id) as any;
        
        if (!row) {
            return { success: false, error: 'Feedback entry not found' };
        }
        
        return { 
            success: true, 
            item: {
                id: row.id,
                imagePath: row.image_path,
                timestamp: row.timestamp,
                accuracyRating: row.accuracy_rating,
                errorTypes: JSON.parse(row.error_types || '[]'),
                extraFeedback: row.extra_feedback
            }
        };
    } catch (error) {
        console.error('Error getting feedback entry:', error);
        return { success: false, error: 'Failed to retrieve feedback entry' };
    }
}

/**
 * Get an image for a feedback entry
 * @param imagePath Path to the image
 * @param quality Image quality (0-100)
 * @param maxWidth Maximum width of the image (optional)
 */
export function getFeedbackImage(imagePath: string, quality = 90, maxWidth?: number) {
    try {
        if (!fs.existsSync(imagePath)) {
            return { success: false, error: 'Feedback image not found' };
        }
        
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        
        return { 
            success: true, 
            base64Image
        };
    } catch (error) {
        console.error('Error getting feedback image:', error);
        return { success: false, error: 'Failed to retrieve feedback image' };
    }
}

/**
 * Export all feedback as CSV and images as ZIP
 */
export async function exportFeedback() {
    try {
        const userDataPath = app.getPath('userData');
        const exportDir = path.join(userDataPath, 'exports');
        
        // Create export directory if it doesn't exist
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const exportFilename = `feedback_export_${timestamp}`;
        const csvPath = path.join(exportDir, `${exportFilename}.csv`);
        const zipPath = path.join(exportDir, `${exportFilename}.zip`);
        
        // Get all feedback entries
        const result = getAllFeedback(1000, 0);
        if (!result.success) {
            return { success: false, error: 'Failed to retrieve feedback entries' };
        }
        
        const feedbackItems = result.items as FeedbackEntry[];
        
        // Create CSV file
        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: [
                { id: 'id', title: 'ID' },
                { id: 'timestamp', title: 'Date' },
                { id: 'accuracyRating', title: 'Accuracy Rating' },
                { id: 'errorTypes', title: 'Reported Errors' },
                { id: 'extraFeedback', title: 'Additional Comments' },
                { id: 'imageName', title: 'Image Filename' }
            ]
        });
        
        const records = feedbackItems.map(item => ({
            id: item.id,
            timestamp: new Date(item.timestamp).toISOString(),
            accuracyRating: item.accuracyRating,
            errorTypes: item.errorTypes.join(', '),
            extraFeedback: item.extraFeedback || '',
            imageName: path.basename(item.imagePath)
        }));
        
        await csvWriter.writeRecords(records);
        
        // Create ZIP file with CSV and images
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        archive.pipe(output);
        
        // Add CSV file to ZIP
        archive.file(csvPath, { name: path.basename(csvPath) });
        
        // Add images to ZIP
        for (const item of feedbackItems) {
            if (fs.existsSync(item.imagePath)) {
                archive.file(item.imagePath, { name: `images/${path.basename(item.imagePath)}` });
            }
        }
        
        await archive.finalize();
        
        // Wait for ZIP to finish
        await new Promise<void>((resolve, reject) => {
            output.on('close', () => {
                resolve();
            });
            
            archive.on('error', (err) => {
                reject(err);
            });
        });
        
        // Return success
        return { 
            success: true, 
            exportPath: zipPath,
            count: feedbackItems.length
        };
    } catch (error) {
        console.error('Error exporting feedback:', error);
        return { success: false, error: 'Failed to export feedback data' };
    }
}
