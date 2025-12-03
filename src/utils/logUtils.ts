import { LogEntry, LogLevel, LogType } from '../services/logTypes';

export function isErrorLog(level: LogLevel): boolean {
  return level === LogLevel.ERROR || level === LogLevel.FATAL;
}

export function isInfoLog(level: LogLevel): boolean {
  return level === LogLevel.DEBUG || level === LogLevel.INFO || level === LogLevel.WARN;
}

export function formatTimestampWithTimezone(date: Date): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const iso = date.toISOString();
  const timezoneSafe = timezone.replace(/\//g, '_').replace(/\+/g, '_plus_').replace(/-/g, '_');
  return iso.replace(/[:.]/g, '-').replace('Z', `Z-${timezoneSafe}`);
}

export function generateLogFilename(patientId: string | null, logType: LogType, date?: Date, format: 'txt' | 'json' = 'txt'): string {
  const timestamp = formatTimestampWithTimezone(date || new Date());
  const prefix = patientId ? patientId : 'generic_logs';
  return `${prefix}_${logType}_${timestamp}.${format}`;
}

export function separateLogsByType(logs: LogEntry[]): { errorLogs: LogEntry[], infoLogs: LogEntry[] } {
  const errorLogs: LogEntry[] = [];
  const infoLogs: LogEntry[] = [];

  logs.forEach((log) => {
    if (isErrorLog(log.level)) {
      errorLogs.push(log);
    } else if (isInfoLog(log.level)) {
      infoLogs.push(log);
    }
  });

  return { errorLogs, infoLogs };
}

