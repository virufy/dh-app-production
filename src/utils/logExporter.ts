import { logDB } from '../services/logDbService';
import { logger } from '../services/loggingService';
import { LogEntry, LogBatch, LogType } from '../services/logTypes';
import { isErrorLog, isInfoLog, generateLogFilename, formatTimestampWithTimezone } from './logUtils';
import { formatLogsAsPlainText } from './logTextFormatter';

interface LogFileExport {
  folderName: string;
  filename: string;
  logs: LogEntry[];
  batch: LogBatch;
}

export async function exportLogsToFiles(): Promise<LogFileExport[]> {
  try {
    const allLogs = await logDB.getAllLogs();
    
    if (allLogs.length === 0) {
      logger.info('No logs to export', {});
      return [];
    }

    const logsByPatient = new Map<string, { errorLogs: LogEntry[], infoLogs: LogEntry[] }>();
    const genericLogs: { errorLogs: LogEntry[], infoLogs: LogEntry[] } = { errorLogs: [], infoLogs: [] };

    allLogs.forEach((log: LogEntry) => {
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
          logsByPatient.set(effectiveIdentifier, { errorLogs: [], infoLogs: [] });
        }
        
        const patientLogs = logsByPatient.get(effectiveIdentifier)!;
        if (isErrorLog(log.level)) {
          patientLogs.errorLogs.push(log);
        } else if (isInfoLog(log.level)) {
          patientLogs.infoLogs.push(log);
        }
      } else {
        if (isErrorLog(log.level)) {
          genericLogs.errorLogs.push(log);
        } else if (isInfoLog(log.level)) {
          genericLogs.infoLogs.push(log);
        }
      }
    });

    const exports: LogFileExport[] = [];
    const now = new Date();

    Array.from(logsByPatient.entries()).forEach(([patientId, patientLogs]) => {

      if (patientLogs.errorLogs.length > 0) {
        const filename = generateLogFilename(patientId, 'error', now, 'txt');
        const batch: LogBatch = {
          batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          logs: patientLogs.errorLogs,
          createdAt: now.toISOString(),
          folderName: filename.replace('.txt', ''),
          patientId,
          logType: 'error',
        };

        exports.push({
          folderName: filename.replace('.txt', ''),
          filename,
          logs: patientLogs.errorLogs,
          batch,
        });
      }

      if (patientLogs.infoLogs.length > 0) {
        const filename = generateLogFilename(patientId, 'info', now, 'txt');
        const batch: LogBatch = {
          batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          logs: patientLogs.infoLogs,
          createdAt: now.toISOString(),
          folderName: filename.replace('.txt', ''),
          patientId,
          logType: 'info',
        };

        exports.push({
          folderName: filename.replace('.txt', ''),
          filename,
          logs: patientLogs.infoLogs,
          batch,
        });
      }
    });

    if (genericLogs.errorLogs.length > 0) {
      const filename = generateLogFilename(null, 'error', now, 'txt');
      const batch: LogBatch = {
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        logs: genericLogs.errorLogs,
        createdAt: now.toISOString(),
        folderName: filename.replace('.txt', ''),
        patientId: undefined,
        logType: 'error',
      };

      exports.push({
        folderName: filename.replace('.txt', ''),
        filename,
        logs: genericLogs.errorLogs,
        batch,
      });
    }

    if (genericLogs.infoLogs.length > 0) {
      const filename = generateLogFilename(null, 'info', now, 'txt');
      const batch: LogBatch = {
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        logs: genericLogs.infoLogs,
        createdAt: now.toISOString(),
        folderName: filename.replace('.txt', ''),
        patientId: undefined,
        logType: 'info',
      };

      exports.push({
        folderName: filename.replace('.txt', ''),
        filename,
        logs: genericLogs.infoLogs,
        batch,
      });
    }

    const patientIds = Array.from(logsByPatient.keys());
    console.log(`[Log Exporter] Found ${allLogs.length} total logs`);
    console.log(`[Log Exporter] Creating files for ${patientIds.length} patient(s) plus generic logs`);
    
    patientIds.forEach((pid) => {
      const patientLogs = logsByPatient.get(pid)!;
      console.log(`[Log Exporter] Patient ${pid}: ${patientLogs.errorLogs.length} error logs, ${patientLogs.infoLogs.length} info logs`);
    });
    
    const totalGenericLogs = genericLogs.errorLogs.length + genericLogs.infoLogs.length;
    if (totalGenericLogs > 0) {
      console.log(`[Log Exporter] Generic logs: ${genericLogs.errorLogs.length} error logs, ${genericLogs.infoLogs.length} info logs`);
    }
    
    console.log(`[Log Exporter] Total files to export: ${exports.length}`);

    return exports;
  } catch (error) {
    logger.error('Failed to export logs to files', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function downloadLogFiles(): Promise<void> {
  try {
    console.log('[Log Exporter] Starting log file export...');
    const exports = await exportLogsToFiles();

    if (exports.length === 0) {
      alert('No logs to download');
      console.log('[Log Exporter] No logs found to export');
      return;
    }

    console.log(`[Log Exporter] Preparing to download ${exports.length} file(s)...`);

    for (const exportItem of exports) {
      console.log(`[Log Exporter] Downloading: ${exportItem.filename} (${exportItem.logs.length} logs)`);
      
      const textContent = formatLogsAsPlainText(exportItem.batch);
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportItem.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const totalLogs = exports.reduce((sum, exp) => sum + exp.logs.length, 0);
    console.log(`[Log Exporter] Successfully downloaded ${exports.length} file(s) with ${totalLogs} total logs`);

    logger.info('Log files downloaded successfully', {
      fileCount: exports.length,
      totalLogs,
      files: exports.map(e => ({ filename: e.filename, logCount: e.logs.length, patientId: e.batch.patientId })),
    });
  } catch (error) {
    console.error('[Log Exporter] Failed to download log files:', error);
    logger.error('Failed to download log files', {}, error instanceof Error ? error : new Error(String(error)));
    alert('Failed to download log files. Check console for details.');
  }
}

export async function diagnoseLogGrouping(): Promise<void> {
  try {
    const allLogs = await logDB.getAllLogs();
    console.log(`[Diagnostic] Total logs in database: ${allLogs.length}`);
    
    const patientIdMap = new Map<string, { errorLogs: number, infoLogs: number }>();
    let genericErrorLogs = 0;
    let genericInfoLogs = 0;
    
    allLogs.forEach((log: LogEntry) => {
      const patientId = log.metadata?.patientId;
      const normalizedPatientId = patientId &&
                                  patientId !== 'unknown' &&
                                  patientId !== '' &&
                                  patientId !== 'null' &&
                                  patientId !== 'undefined'
        ? patientId.trim()
        : null;

      if (normalizedPatientId) {
        if (!patientIdMap.has(normalizedPatientId)) {
          patientIdMap.set(normalizedPatientId, { errorLogs: 0, infoLogs: 0 });
        }
        const counts = patientIdMap.get(normalizedPatientId)!;
        if (isErrorLog(log.level)) {
          counts.errorLogs++;
        } else if (isInfoLog(log.level)) {
          counts.infoLogs++;
        }
      } else {
        if (isErrorLog(log.level)) {
          genericErrorLogs++;
        } else if (isInfoLog(log.level)) {
          genericInfoLogs++;
        }
      }
    });
    
    console.log(`[Diagnostic] Patient ID distribution (error logs | info logs):`);
    Array.from(patientIdMap.entries()).forEach(([pid, counts]) => {
      console.log(`  - ${pid}: ${counts.errorLogs} error logs, ${counts.infoLogs} info logs (total: ${counts.errorLogs + counts.infoLogs})`);
    });
    console.log(`  - No patient ID: ${genericErrorLogs} error logs, ${genericInfoLogs} info logs (total: ${genericErrorLogs + genericInfoLogs})`);
    
    const totalGeneric = genericErrorLogs + genericInfoLogs;
    if (totalGeneric > 0) {
      const sampleLog = allLogs.find((log: LogEntry) => !log.metadata?.patientId || 
                                     log.metadata?.patientId === 'unknown' ||
                                     log.metadata?.patientId === '' ||
                                     log.metadata?.patientId === 'null' ||
                                     log.metadata?.patientId === 'undefined');
      if (sampleLog) {
        console.log(`[Diagnostic] Sample generic log:`, {
          message: sampleLog.message,
          level: sampleLog.level,
          timestamp: sampleLog.timestamp,
          patientId: sampleLog.metadata?.patientId,
          sessionId: sampleLog.metadata?.sessionId,
          route: sampleLog.metadata?.route,
        });
      }
    }

    const expectedFiles = Array.from(patientIdMap.entries()).reduce((sum, [_, counts]) => {
      let files = 0;
      if (counts.errorLogs > 0) files++;
      if (counts.infoLogs > 0) files++;
      return sum + files;
    }, 0) + (genericErrorLogs > 0 ? 1 : 0) + (genericInfoLogs > 0 ? 1 : 0);

    console.log(`[Diagnostic] Expected export files: ${expectedFiles} (2 files per patient with both log types + generic files)`);
    
    return;
  } catch (error) {
    console.error('[Diagnostic] Failed to diagnose log grouping:', error);
    throw error;
  }
}

export async function downloadAllLogsAsSingleFile(): Promise<void> {
  try {
    const allLogs = await logDB.getAllLogs();
    
    if (allLogs.length === 0) {
      alert('No logs to download');
      return;
    }

    const now = new Date();
    const timestamp = formatTimestampWithTimezone(now);
    const filename = `all_logs_${timestamp}.json`;

    const jsonContent = JSON.stringify({
      exportedAt: now.toISOString(),
      totalLogs: allLogs.length,
      logs: allLogs,
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);

    logger.info('All logs downloaded as single file', {
      filename,
      logCount: allLogs.length,
    });
  } catch (error) {
    logger.error('Failed to download all logs', {}, error instanceof Error ? error : new Error(String(error)));
    alert('Failed to download logs. Check console for details.');
  }
}

