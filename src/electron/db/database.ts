import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Database manager for PosiCheck application
 * Handles all database operations and ensures database is properly initialized
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;
  private dbPath: string;

  private constructor() {
    // Create the data directory if it doesn't exist
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'posicheck.db');
    console.log(`Database path: ${this.dbPath}`);
    this.db = new Database(this.dbPath);

    // Enable foreign keys constraint enforcement
    this.db.pragma('foreign_keys = ON');
    
    // Initialize database schema
    this.initializeDatabase();
  }

  /**
   * Get singleton instance of the database manager
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database schema if it doesn't exist
   */  private initializeDatabase(): void {
    // Create history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        prediction_data TEXT,
        notes TEXT
      );
    `);
    
    // Create user profile table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        country TEXT,
        organization TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create feedback table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        accuracy_rating INTEGER,
        error_types TEXT,
        extra_feedback TEXT
      );
    `);
    
    // Create detection_errors table to store individual errors
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detection_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        history_id INTEGER NOT NULL,
        error_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        FOREIGN KEY (history_id) REFERENCES history(id) ON DELETE CASCADE
      );
    `);

    console.log('Database initialized successfully');
  }

  /**
   * Close the database connection
   */
  public close(): void {
    this.db.close();
  }

  /**
   * Get the database instance for direct operations
   */
  public getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Begin a transaction
   */
  public beginTransaction(): void {
    this.db.prepare('BEGIN TRANSACTION').run();
  }

  /**
   * Commit a transaction
   */
  public commitTransaction(): void {
    this.db.prepare('COMMIT').run();
  }

  /**
   * Rollback a transaction
   */
  public rollbackTransaction(): void {
    this.db.prepare('ROLLBACK').run();
  }
}

// Export a default instance
export const db = DatabaseManager.getInstance().getDatabase();
export default DatabaseManager.getInstance();
