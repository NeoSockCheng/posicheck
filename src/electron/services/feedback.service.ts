import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { db } from '../db/database.js';

// Define types for feedback data
export interface FeedbackData {
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
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
        
        return rows.map(row => ({
            id: row.id,
            imagePath: row.image_path,
            timestamp: row.timestamp,
            accuracyRating: row.accuracy_rating,
            errorTypes: JSON.parse(row.error_types || '[]'),
            extraFeedback: row.extra_feedback
        }));
    } catch (error) {
        console.error('Error getting feedback entries:', error);
        return [];
    }
}
