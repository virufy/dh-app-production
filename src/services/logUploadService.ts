import { PRESIGNED_URL_API_URL } from '../config';
import { generateSignature } from '../utils/signature';
import { LogEntry, LogBatch, LogType } from './logTypes';
import { logDB } from './logDbService';
import { logger } from './loggingService';
import { getDeviceName } from '../utils/deviceUtils';
import { v4 as uuidv4 } from 'uuid';
import { generateLogFilename, separateLogsByType } from '../utils/logUtils';
import { formatLogsAsPlainText } from '../utils/logTextFormatter';

interface LogPresignedUrlRequest {
  patientId?: string;
  sessionId: string;
  filename: string;
  deviceName: string;
  contentType?: string;
  logCount: number;
}

interface LogPresignedUrlResponse {
  uploadUrl: string;
  key: string;
  filename: string;
}

const uploadQueue: LogBatch[] = [];
let isProcessingQueue = false;

async function getLogPresignedUrl(
  request: LogPresignedUrlRequest
): Promise<LogPresignedUrlResponse> {
  const apiUrl = `${PRESIGNED_URL_API_URL}/getS3presignedURL`;

  if (!PRESIGNED_URL_API_URL || PRESIGNED_URL_API_URL === '') {
    throw new Error('PRESIGNED_URL_API_URL is not configured');
  }

  try {
    const signature = await generateSignature();

    const requestBody = {
      patientId: request.patientId || 'unknown',
      filename: request.filename,
      audioType: 'logs',
      deviceName: request.deviceName,
      contentType: request.contentType || 'text/plain',
      logCount: request.logCount,
      sessionId: request.sessionId,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-unique-signature': signature,
      },
      body: JSON.stringify(requestBody),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Failed to get presigned URL: HTTP ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 500)}` : ''}`
      );
    }

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (!data.uploadUrl || !data.key) {
      throw new Error(
        `Invalid presigned URL response format. Expected 'uploadUrl' and 'key', but got: ${JSON.stringify(Object.keys(data))}`
      );
    }

    return {
      uploadUrl: data.uploadUrl,
      key: data.key,
      filename: data.filename || request.filename,
    };
  } catch (error) {
    logger.error('Failed to get log presigned URL', { request }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function uploadLogBatchToS3(
  presignedUrl: string,
  batch: LogBatch,
  filename: string
): Promise<void> {
  const textContent = formatLogsAsPlainText(batch);
  const blob = new Blob([textContent], { type: 'text/plain' });
  const fileSizeKB = (blob.size / 1024).toFixed(2);

  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: blob,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `S3 upload failed: HTTP ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 500)}` : ''}`
      );
    }
  } catch (error) {
    logger.error('Failed to upload log batch to S3', {
      filename,
      fileSize: `${fileSizeKB} KB`,
      batchId: batch.batchId,
      logCount: batch.logs.length,
    }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function processLogUploadTask(batch: LogBatch): Promise<void> {
  try {
    const deviceName = await getDeviceName();
    const sessionId = batch.logs[0]?.metadata?.sessionId || logger.getSessionId();
    const logType = batch.logType || 'info';
    
    let patientId = batch.patientId || batch.logs[0]?.metadata?.patientId || null;
    if (!patientId || patientId.trim() === '' || patientId === 'unknown' || patientId === 'null' || patientId === 'undefined') {
      patientId = batch.logs[0]?.metadata?.patientSessionId || logger.getPatientSessionId() || null;
    }

    const filename = generateLogFilename(patientId || null, logType as LogType, new Date(), 'txt');

    const presignedUrlRequest: LogPresignedUrlRequest = {
      patientId: patientId || undefined,
      sessionId,
      filename,
      deviceName,
      contentType: 'text/plain',
      logCount: batch.logs.length,
    };

    const presignedResult = await getLogPresignedUrl(presignedUrlRequest);

    await uploadLogBatchToS3(presignedResult.uploadUrl, batch, filename);

    const logIds = batch.logs.map((log) => log.id);
    
    logger.info('Log batch uploaded successfully, deleting from local storage', {
      batchId: batch.batchId,
      logCount: batch.logs.length,
      filename,
      patientId: patientId || 'unknown',
    });

    await logDB.deleteLogs(logIds);

    batch.uploadedAt = new Date().toISOString();
  } catch (error) {
    logger.error('Log upload task failed', {
      batchId: batch.batchId,
      logCount: batch.logs.length,
      patientId: batch.patientId,
      logType: batch.logType,
    }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function consumeUploadQueue(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  while (uploadQueue.length > 0) {
    const batch = uploadQueue.shift();
    if (batch) {
      try {
        await processLogUploadTask(batch);
      } catch (error) {
        logger.error('Failed to process log upload batch', {
          batchId: batch.batchId,
          remainingInQueue: uploadQueue.length,
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  isProcessingQueue = false;
}

export async function uploadLogBatch(logs: LogEntry[]): Promise<void> {
  if (logs.length === 0) {
    return;
  }

  const logsByPatient = new Map<string, LogEntry[]>();
  const genericLogs: LogEntry[] = [];

  logs.forEach((log) => {
    const patientId = log.metadata?.patientId;
    const patientSessionId = log.metadata?.patientSessionId;
    
    const normalizedPatientId = patientId &&
                                patientId.trim() !== '' &&
                                patientId !== 'unknown' &&
                                patientId !== 'null' &&
                                patientId !== 'undefined'
      ? patientId.trim()
      : null;
    
    const effectiveIdentifier = normalizedPatientId || patientSessionId || null;

    if (effectiveIdentifier) {
      if (!logsByPatient.has(effectiveIdentifier)) {
        logsByPatient.set(effectiveIdentifier, []);
      }
      logsByPatient.get(effectiveIdentifier)!.push(log);
    } else {
      genericLogs.push(log);
    }
  });

  const batches: LogBatch[] = [];
  const now = new Date();

  Array.from(logsByPatient.entries()).forEach(([patientId, patientLogs]) => {
    const { errorLogs, infoLogs } = separateLogsByType(patientLogs);

    if (errorLogs.length > 0) {
      batches.push({
        batchId: uuidv4(),
        logs: errorLogs,
        createdAt: now.toISOString(),
        patientId,
        logType: 'error',
        folderName: generateLogFilename(patientId, 'error', now, 'txt').replace('.txt', ''),
      });
    }

    if (infoLogs.length > 0) {
      batches.push({
        batchId: uuidv4(),
        logs: infoLogs,
        createdAt: now.toISOString(),
        patientId,
        logType: 'info',
        folderName: generateLogFilename(patientId, 'info', now, 'txt').replace('.txt', ''),
      });
    }
  });

  if (genericLogs.length > 0) {
    const { errorLogs, infoLogs } = separateLogsByType(genericLogs);

    if (errorLogs.length > 0) {
      batches.push({
        batchId: uuidv4(),
        logs: errorLogs,
        createdAt: now.toISOString(),
        patientId: undefined,
        logType: 'error',
        folderName: generateLogFilename(null, 'error', now, 'txt').replace('.txt', ''),
      });
    }

    if (infoLogs.length > 0) {
      batches.push({
        batchId: uuidv4(),
        logs: infoLogs,
        createdAt: now.toISOString(),
        patientId: undefined,
        logType: 'info',
        folderName: generateLogFilename(null, 'info', now, 'txt').replace('.txt', ''),
      });
    }
  }

  batches.forEach((batch) => {
    uploadQueue.push(batch);
  });

  if (batches.length > 0) {
    setTimeout(consumeUploadQueue, 0);
  }
}

export async function uploadPendingLogs(batchSize: number = 50): Promise<void> {
  try {
    const unuploadedLogs = await logDB.getUnuploadedLogs(batchSize);

    if (unuploadedLogs.length === 0) {
      return;
    }

    const logEntries = unuploadedLogs.map((log) => {
      const { uploaded, ...logEntry } = log;
      return logEntry as LogEntry;
    });

    await uploadLogBatch(logEntries);
  } catch (error) {
    logger.error('Failed to upload pending logs', {}, error instanceof Error ? error : new Error(String(error)));
  }
}

export async function uploadAllLogsForCurrentPatient(): Promise<void> {
  try {
    const patientId = logger.getPatientId();
    const patientSessionId = logger.getPatientSessionId();
    
    const allUnuploadedLogs = await logDB.getUnuploadedLogs(0);
    
    if (allUnuploadedLogs.length === 0) {
      logger.info('No pending logs to upload for current patient');
      return;
    }

    const currentPatientLogs = allUnuploadedLogs.filter((log: any) => {
      const logPatientId = log.metadata?.patientId;
      const logPatientSessionId = log.metadata?.patientSessionId;
      
      const normalizedPatientId = logPatientId &&
                                  logPatientId.trim() !== '' &&
                                  logPatientId !== 'unknown' &&
                                  logPatientId !== 'null' &&
                                  logPatientId !== 'undefined'
        ? logPatientId.trim()
        : null;
      
      if (normalizedPatientId && patientId && normalizedPatientId === patientId.trim()) {
        return true;
      }
      
      if (logPatientSessionId && patientSessionId && logPatientSessionId === patientSessionId) {
        return true;
      }
      
      return false;
    });

    if (currentPatientLogs.length === 0) {
      logger.info('No logs found for current patient', {
        patientId: patientId || 'none',
        patientSessionId: patientSessionId || 'none',
        totalUnuploadedLogs: allUnuploadedLogs.length,
      });
      return;
    }

    logger.info('Uploading all logs for current patient', {
      patientId: patientId || 'none',
      patientSessionId: patientSessionId || 'none',
      logCount: currentPatientLogs.length,
    });

    const logEntries = currentPatientLogs.map((log) => {
      const { uploaded, ...logEntry } = log;
      return logEntry as LogEntry;
    });

    await uploadLogBatch(logEntries);
    
    logger.info('Successfully queued all logs for current patient upload', {
      patientId: patientId || 'none',
      patientSessionId: patientSessionId || 'none',
      logCount: currentPatientLogs.length,
    });
  } catch (error) {
    logger.error('Failed to upload all logs for current patient', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function uploadAllLogs(): Promise<void> {
  try {
    await logger.forceFlush();
    
    const allUnuploadedLogs = await logDB.getUnuploadedLogs(0);
    
    if (allUnuploadedLogs.length === 0) {
      logger.info('No pending logs to upload');
      return;
    }

    logger.info('Uploading all available logs for error reporting', {
      totalLogs: allUnuploadedLogs.length,
    });

    const logEntries = allUnuploadedLogs.map((log) => {
      const { uploaded, ...logEntry } = log;
      return logEntry as LogEntry;
    });

    await uploadLogBatch(logEntries);
    
    logger.info('Successfully queued all logs for upload', {
      logCount: allUnuploadedLogs.length,
    });
  } catch (error) {
    logger.error('Failed to upload all logs', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export function getUploadQueueStatus() {
  return {
    queueSize: uploadQueue.length,
    isProcessing: isProcessingQueue,
  };
}

