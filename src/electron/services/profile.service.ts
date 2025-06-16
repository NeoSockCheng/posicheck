import { db } from '../db/database.js';

/**
 * User profile data structure
 */
export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  organization: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Get the current user profile
 * Returns null if no profile exists
 */
export function getUserProfile(): UserProfile | null {
  try {
    const stmt = db.prepare(`
      SELECT id, name, email, phone, country, organization, created_at as createdAt, updated_at as updatedAt
      FROM profile
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get() as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      country: row.country || '',
      organization: row.organization || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Save or update the user profile
 */
export function saveUserProfile(profile: UserProfile): boolean {
  try {
    const now = Date.now();
    
    if (profile.id) {
      // Update existing profile
      const stmt = db.prepare(`
        UPDATE profile
        SET name = ?, email = ?, phone = ?, country = ?, organization = ?, updated_at = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        profile.name || '',
        profile.email || '',
        profile.phone || '',
        profile.country || '',
        profile.organization || '',
        now,
        profile.id
      );
      
      return result.changes > 0;
    } else {
      // Create new profile
      const stmt = db.prepare(`
        INSERT INTO profile (name, email, phone, country, organization, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        profile.name || '',
        profile.email || '',
        profile.phone || '', 
        profile.country || '',
        profile.organization || '',
        now,
        now
      );
      
      return result.lastInsertRowid !== undefined;
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Initialize a default profile if one doesn't exist
 */
export function initializeDefaultProfile(): void {
  try {
    // Check if any profile exists
    const count = db.prepare('SELECT COUNT(*) as count FROM profile').get() as any;
    
    if (count && count.count === 0) {
      // Create a default empty profile
      const defaultProfile: UserProfile = {
        name: '',
        email: '',
        phone: '',
        country: '',
        organization: '',
      };
      
      saveUserProfile(defaultProfile);
      console.log('Created default profile');
    }
  } catch (error) {
    console.error('Error initializing default profile:', error);
  }
}
