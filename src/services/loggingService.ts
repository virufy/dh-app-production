import { v4 as uuidv4 } from 'uuid';
import { LogLevel, LogEntry, LoggingConfig, DeviceInfo } from './logTypes';
import { logDB } from './logDbService';
import { getDeviceName } from '../utils/deviceUtils';

class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private sessionId: string;
  private userId: string | undefined;
  private patientId: string | undefined;
  private patientSessionId: string;
  private logQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private deviceInfo: DeviceInfo | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.patientSessionId = this.generateOrLoadPatientSessionId();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private getDefaultConfig(): LoggingConfig {
    return {
      batchSize: 50,
      flushInterval: 30000,
      maxBatchSize: 500 * 1024,
      maxLocalLogs: 1000,
      maxStorageSize: 10 * 1024 * 1024,
      enableAutoUpload: false,
      uploadRetryAttempts: 3,
      uploadRetryDelay: 5000,
      logLevel: LogLevel.DEBUG,
      enableConsoleOutput: process.env.NODE_ENV === 'development',
      s3Prefix: 'logs/',
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  private generateOrLoadPatientSessionId(): string {
    try {
      const stored = sessionStorage.getItem('patientSessionId');
      if (stored) {
        return stored;
      }
    } catch (error) {
      // Session storage might not be available
    }
    
    const newId = uuidv4();
    try {
      sessionStorage.setItem('patientSessionId', newId);
    } catch (error) {
      // Session storage might not be available
    }
    return newId;
  }

  public startNewPatientSession(): void {
    const newSessionId = uuidv4();
    this.patientSessionId = newSessionId;
    try {
      sessionStorage.setItem('patientSessionId', newSessionId);
    } catch (error) {
      // Session storage might not be available
    }
    this.log(LogLevel.INFO, 'New patient session started', {
      patientSessionId: newSessionId,
    });
  }

  public getPatientSessionId(): string {
    return this.patientSessionId;
  }

  public getEffectivePatientIdentifier(): string {
    if (this.patientId && this.patientId.trim() !== '' && 
        this.patientId !== 'unknown' && 
        this.patientId !== 'null' && 
        this.patientId !== 'undefined') {
      return this.patientId;
    }
    return this.patientSessionId;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await logDB.init();
      await this.loadDeviceInfo();
      this.updatePatientIdFromStorage();
      this.updateUserIdFromStorage();
      this.updatePatientSessionIdFromStorage();
      this.setupFlushTimer();
      this.setupPageUnloadHandler();
      this.isInitialized = true;

      this.log(LogLevel.INFO, 'Logging service initialized', {
        sessionId: this.sessionId,
        patientId: this.patientId,
        patientSessionId: this.patientSessionId,
      });
    } catch (error) {
      console.error('Failed to initialize logging service:', error);
    }
  }

  private async loadDeviceInfo(): Promise<void> {
    try {
      const deviceName = await getDeviceName();
      this.deviceInfo = {
        deviceName,
        userAgent: navigator.userAgent || 'Unknown',
        platform: navigator.platform || 'Unknown',
        language: navigator.language || 'Unknown',
        screenWidth: window.screen.width || 0,
        screenHeight: window.screen.height || 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      };
    } catch (error) {
      this.deviceInfo = {
        deviceName: 'Unknown',
        userAgent: navigator.userAgent || 'Unknown',
        platform: navigator.platform || 'Unknown',
        language: navigator.language || 'Unknown',
        screenWidth: 0,
        screenHeight: 0,
        timezone: 'Unknown',
      };
    }
  }

  private updatePatientIdFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('patientId');
      if (stored) {
        this.patientId = stored;
      }
    } catch (error) {
      // Session storage might not be available
    }
  }

  private updateUserIdFromStorage(): void {
    try {
      const stored = localStorage.getItem('app_user_uuid');
      if (stored) {
        this.userId = stored;
      }
    } catch (error) {
      // Local storage might not be available
    }
  }

  private updatePatientSessionIdFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('patientSessionId');
      if (stored) {
        this.patientSessionId = stored;
      }
    } catch (error) {
      // Session storage might not be available
    }
  }

  public setPatientId(patientId: string | undefined): void {
    this.patientId = patientId;
    if (patientId) {
      try {
        sessionStorage.setItem('patientId', patientId);
      } catch (error) {
        // Session storage might not be available
      }
    }
  }

  public setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getPatientId(): string | undefined {
    return this.patientId;
  }

  public configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupPageUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushSync();
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.storageArea === sessionStorage && event.key === 'patientId') {
        this.setPatientId(event.newValue || undefined);
      }
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined;

    let currentPatientId = this.patientId;
    try {
      const storedPatientId = sessionStorage.getItem('patientId');
      if (storedPatientId) {
        currentPatientId = storedPatientId;
        if (this.patientId !== storedPatientId) {
          this.patientId = storedPatientId;
        }
      }
    } catch (error) {
      // Session storage might not be available
    }

    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: {
        sessionId: this.sessionId,
        userId: this.userId,
        patientId: currentPatientId,
        patientSessionId: this.patientSessionId,
        deviceInfo: this.deviceInfo || {
          deviceName: 'Unknown',
          userAgent: 'Unknown',
          platform: 'Unknown',
          language: 'Unknown',
          screenWidth: 0,
          screenHeight: 0,
          timezone: 'Unknown',
        },
        url: typeof window !== 'undefined' ? window.location.href : '',
        route,
      },
    };

    if (error) {
      entry.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
      };
    }

    return entry;
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (!this.isInitialized) {
      this.initialize().catch((initError) => {
        console.error('Logger initialization failed:', initError);
      });
    }

    this.updatePatientIdFromStorage();

    const entry = this.createLogEntry(level, message, context, error);

    if (this.config.enableConsoleOutput) {
      this.logToConsole(level, message, context, error);
    }

    this.logQueue.push(entry);

    const shouldFlushImmediately = level === LogLevel.ERROR || level === LogLevel.FATAL;
    
    if (shouldFlushImmediately) {
      this.ensureInitializedAndFlush().catch((error) => {
        console.error('Failed to flush error log immediately:', error);
      });
    } else if (this.logQueue.length >= this.config.batchSize) {
      this.flush().catch((flushError) => {
        console.error('Failed to flush logs:', flushError);
      });
    }
  }

  private async ensureInitializedAndFlush(): Promise<void> {
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (initError) {
        console.error('Logger initialization failed during error flush:', initError);
      }
    }

    if (this.logQueue.length > 0) {
      try {
        await this.flush();
      } catch (flushError) {
        console.error('Failed to flush error log:', flushError);
      }
    }
  }

  private logToConsole(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const prefix = `[${level}]`;
    const sessionInfo = this.sessionId ? `Session: ${this.sessionId}` : '';
    const patientInfo = this.patientId ? `Patient: ${this.patientId}` : '';

    const consoleMessage = [prefix, sessionInfo, patientInfo].filter(Boolean).join(' | ');

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, message, context || '');
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, message, context || '');
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, message, context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(consoleMessage, message, context || '', error || '');
        break;
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  public async flush(): Promise<void> {
    if (this.logQueue.length === 0) {
      return;
    }

    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (initError) {
        console.error('Logger initialization failed during flush:', initError);
        return;
      }
    }

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      await logDB.saveLogs(logsToFlush);

      if (this.config.enableAutoUpload) {
        this.triggerUpload();
      }
    } catch (error) {
      console.error('Failed to flush logs:', error, {
        logCount: logsToFlush.length,
        firstLog: logsToFlush[0]?.message,
        dbInitialized: !!logDB,
      });
      this.logQueue.unshift(...logsToFlush);
    }
  }

  private flushSync(): void {
    if (this.logQueue.length === 0) {
      return;
    }

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    logDB.saveLogs(logsToFlush).catch((error) => {
      console.error('Failed to flush logs synchronously:', error);
    });
  }

  private triggerUpload(): void {
    import('./logUploadService').then(({ uploadPendingLogs }) => {
      uploadPendingLogs(this.config.batchSize).catch(() => {
        // Upload failures are already logged by the upload service
      });
    });
  }

  public async getUnuploadedLogs(limit?: number): Promise<LogEntry[]> {
    return logDB.getUnuploadedLogs(limit);
  }

  public async getLogCount(): Promise<number> {
    return logDB.getLogCount();
  }

  public async cleanup(): Promise<void> {
    await logDB.deleteOldLogs(7);
  }

  public async forceFlush(): Promise<void> {
    await this.flush();
  }

  public getPendingLogCount(): number {
    return this.logQueue.length;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushSync();
  }
}

export const logger = LoggingService.getInstance();

