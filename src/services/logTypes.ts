export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface DeviceInfo {
  deviceName: string;
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    sessionId: string;
    userId?: string;
    patientId?: string;
    patientSessionId?: string;
    deviceInfo: DeviceInfo;
    url: string;
    route?: string;
  };
}

export type LogType = 'error' | 'info';

export interface LogBatch {
  batchId: string;
  logs: LogEntry[];
  createdAt: string;
  uploadedAt?: string;
  folderName?: string;
  patientId?: string;
  logType?: LogType;
}

export interface LoggingConfig {
  batchSize: number;
  flushInterval: number;
  maxBatchSize: number;
  maxLocalLogs: number;
  maxStorageSize: number;
  enableAutoUpload: boolean;
  uploadRetryAttempts: number;
  uploadRetryDelay: number;
  logLevel: LogLevel;
  enableConsoleOutput: boolean;
  s3Bucket?: string;
  s3Prefix?: string;
}

