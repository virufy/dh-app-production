class LogDBService {
  private dbName = 'app_logs';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Singleton pattern - private constructor
  }

  private static instance: LogDBService;
  public static getInstance(): LogDBService {
    if (!LogDBService.instance) {
      LogDBService.instance = new LogDBService();
    }
    return LogDBService.instance;
  }

  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve();
    }

    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('logs')) {
          const store = db.createObjectStore('logs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('level', 'level', { unique: false });
          store.createIndex('uploaded', 'uploaded', { unique: false });
        }

        if (!db.objectStoreNames.contains('batches')) {
          const store = db.createObjectStore('batches', { keyPath: 'batchId' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('uploaded', 'uploaded', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;

        this.db.onversionchange = () => {
          this.closeConnection();
        };

        this.db.onclose = () => {
          this.closeConnection();
        };

        this.db.onerror = () => {
          // Database errors are handled at transaction level
        };

        resolve();
      };
    });

    return this.initPromise;
  }

  private closeConnection() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }

  public async saveLog(log: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');
      const request = store.put({ ...log, uploaded: false });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  public async saveLogs(logs: any[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');

      let completed = 0;
      let hasError = false;

      logs.forEach((log) => {
        const request = store.put({ ...log, uploaded: false });
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
        request.onsuccess = () => {
          completed++;
          if (completed === logs.length && !hasError) {
            resolve();
          }
        };
      });
    });
  }

  public async getUnuploadedLogs(limit: number = 100): Promise<any[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.openCursor();

      const logs: any[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const log = cursor.value;
          if (log.uploaded === false || log.uploaded === undefined) {
            logs.push(log);
          }
          
          if (limit > 0 && logs.length >= limit) {
            const sortedLogs = logs
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .slice(0, limit);
            resolve(sortedLogs);
            return;
          }
          
          cursor.continue();
        } else {
          const sortedLogs = logs
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          resolve(sortedLogs);
        }
      };
    });
  }

  public async markLogsAsUploaded(logIds: string[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');

      let completed = 0;
      let hasError = false;

      logIds.forEach((id) => {
        const getRequest = store.get(id);
        getRequest.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(getRequest.error);
          }
        };
        getRequest.onsuccess = () => {
          const log = getRequest.result;
          if (log) {
            log.uploaded = true;
            const putRequest = store.put(log);
            putRequest.onerror = () => {
              if (!hasError) {
                hasError = true;
                reject(putRequest.error);
              }
            };
            putRequest.onsuccess = () => {
              completed++;
              if (completed === logIds.length && !hasError) {
                resolve();
              }
            };
          } else {
            completed++;
            if (completed === logIds.length && !hasError) {
              resolve();
            }
          }
        };
      });
    });
  }

  public async deleteLogs(logIds: string[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');

      let completed = 0;
      let hasError = false;

      if (logIds.length === 0) {
        resolve();
        return;
      }

      logIds.forEach((id) => {
        const deleteRequest = store.delete(id);
        deleteRequest.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(deleteRequest.error);
          }
        };
        deleteRequest.onsuccess = () => {
          completed++;
          if (completed === logIds.length && !hasError) {
            resolve();
          }
        };
      });
    });
  }

  public async getLogCount(): Promise<number> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  public async deleteOldLogs(olderThanDays: number = 7): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');
      const index = store.index('timestamp');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffTimestamp = cutoffDate.toISOString();

      const request = index.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoffTimestamp) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  public async clearAllLogs(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  public async getAllLogs(limit?: number): Promise<any[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allLogs = request.result || [];
        const logs = allLogs.map((log: any) => {
          const { uploaded, ...logEntry } = log;
          return logEntry;
        });

        const sortedLogs = logs.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

        if (limit) {
          resolve(sortedLogs.slice(0, limit));
        } else {
          resolve(sortedLogs);
        }
      };
    });
  }

  public async getStorageSize(): Promise<number> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['logs'], 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const logs = request.result || [];
        const size = JSON.stringify(logs).length;
        resolve(size);
      };
    });
  }
}

export const logDB = LogDBService.getInstance();

