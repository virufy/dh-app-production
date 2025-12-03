// src/services/audioDbService.ts
import { logger } from './loggingService';

class AudioDBService {
  private dbName = 'recordings';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // 1. Private constructor ensures no one can do 'new AudioDBService()' manually
  private constructor() {
    console.log("[IndexedDB] Service instantiated (Singleton)");
  }
  
  // Static instance getter (optional, but standard for Singleton patterns)
  private static instance: AudioDBService;
  public static getInstance(): AudioDBService {
    if (!AudioDBService.instance) {
      AudioDBService.instance = new AudioDBService();
    }
    return AudioDBService.instance;
  }

  public async init(): Promise<void> {
    // 2. SSR Check: Don't run this on the server
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve();
    }

    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      console.log("[IndexedDB] Opening connection...");
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        const error = request.error || new Error('IndexedDB connection failed');
        logger.error('AudioDB - IndexedDB connection failed', {
          databaseName: this.dbName,
          errorCategory: 'IndexedDB',
        }, error instanceof Error ? error : new Error(String(error)));
        this.initPromise = null; 
        reject(error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('blobs')) {
          // Create store with 'recordingType' as the key (or use autoIncrement if you want multiple of same type)
          db.createObjectStore('blobs'); 
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        
        // 3. Resilience: Handle unexpected closures
        this.db.onversionchange = () => {
          logger.warn('AudioDB - Connection closing due to version change', {
            databaseName: this.dbName,
            errorCategory: 'IndexedDB',
          });
          this.closeConnection();
        };

        this.db.onclose = () => {
          logger.warn('AudioDB - Connection closed unexpectedly', {
            databaseName: this.dbName,
            errorCategory: 'IndexedDB',
          });
          this.closeConnection();
        };

        this.db.onerror = (e) => {
          logger.error('AudioDB - Database error', {
            databaseName: this.dbName,
            errorCategory: 'IndexedDB',
          }, new Error('IndexedDB database error'));
        };
        
        resolve();
      };
    });

    return this.initPromise;
  }

  // Helper to reset state if connection dies
  private closeConnection() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null; // IMPORTANT: Allow re-initialization next time
  }

  public async saveRecording(blob: Blob, recordingType: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        const error = new Error("Database not initialized");
        logger.error('AudioDB - Save recording failed - database not initialized', {
          recordingType,
          blobSize: blob.size,
          errorCategory: 'IndexedDB',
        }, error);
        return reject(error);
      }

      const transaction = this.db.transaction(['blobs'], 'readwrite');
      const store = transaction.objectStore('blobs');
      
      const request = store.put(blob, recordingType);

      request.onerror = () => {
        const error = request.error || new Error('Failed to save recording');
        logger.error('AudioDB - Save recording failed', {
          recordingType,
          blobSize: blob.size,
          errorCategory: 'IndexedDB',
        }, error instanceof Error ? error : new Error(String(error)));
        reject(error);
      };
      request.onsuccess = () => resolve();
    });
  }

  public async loadRecording(recordingType: string): Promise<Blob | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        const error = new Error("Database not initialized");
        logger.error('AudioDB - Load recording failed - database not initialized', {
          recordingType,
          errorCategory: 'IndexedDB',
        }, error);
        return reject(error);
      }

      const transaction = this.db.transaction(['blobs'], 'readonly');
      const store = transaction.objectStore('blobs');
      const request = store.get(recordingType);

      request.onerror = () => {
        const error = request.error || new Error('Failed to load recording');
        logger.error('AudioDB - Load recording failed', {
          recordingType,
          errorCategory: 'IndexedDB',
        }, error instanceof Error ? error : new Error(String(error)));
        reject(error);
      };
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  public async deleteRecording(recordingType: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        const error = new Error("Database not initialized");
        logger.error('AudioDB - Delete recording failed - database not initialized', {
          recordingType,
          errorCategory: 'IndexedDB',
        }, error);
        return reject(error);
      }

      const transaction = this.db.transaction(['blobs'], 'readwrite');
      const store = transaction.objectStore('blobs');
      const request = store.delete(recordingType);

      request.onerror = () => {
        const error = request.error || new Error('Failed to delete recording');
        logger.error('AudioDB - Delete recording failed', {
          recordingType,
          errorCategory: 'IndexedDB',
        }, error instanceof Error ? error : new Error(String(error)));
        reject(error);
      };
      request.onsuccess = () => resolve();
    });
  }

  // 4. Feature Implementation: Cleanup Logic
  // Call this in your App.tsx useEffect once on mount
  public async clearAllRecordings(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      
      const transaction = this.db.transaction(['blobs'], 'readwrite');
      const store = transaction.objectStore('blobs');
      const request = store.clear(); // Wipes everything

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log("[IndexedDB] All stale recordings cleared.");
        resolve();
      }
    });
  }
}

// Export the singleton instance
export const audioDB = AudioDBService.getInstance();