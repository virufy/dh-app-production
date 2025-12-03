import { LogEntry, LogBatch } from '../services/logTypes';

export function formatLogsAsPlainText(batch: LogBatch): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('LOG FILE');
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push('METADATA:');
  lines.push(`  Batch ID:        ${batch.batchId}`);
  lines.push(`  Created:         ${batch.createdAt}`);
  lines.push(`  Log Type:        ${batch.logType || 'mixed'}`);
  lines.push(`  Total Logs:      ${batch.logs.length}`);
  if (batch.patientId) {
    lines.push(`  Patient ID:      ${batch.patientId}`);
  }
  lines.push('');
  
  if (batch.logs.length > 0) {
    const firstLog = batch.logs[0];
    const deviceInfo = firstLog.metadata.deviceInfo;
    
    lines.push('DEVICE INFORMATION:');
    lines.push(`  Device Name:     ${deviceInfo.deviceName}`);
    lines.push(`  Platform:        ${deviceInfo.platform}`);
    lines.push(`  Language:        ${deviceInfo.language}`);
    lines.push(`  Timezone:        ${deviceInfo.timezone}`);
    lines.push(`  Screen:          ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`);
    lines.push(`  Session ID:      ${firstLog.metadata.sessionId}`);
    if (firstLog.metadata.userId) {
      lines.push(`  User ID:         ${firstLog.metadata.userId}`);
    }
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('LOG ENTRIES');
    lines.push('='.repeat(80));
    lines.push('');
  }
  
  batch.logs.forEach((log, index) => {
    const timestamp = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 23);
    const level = log.level.padEnd(5);
    const route = log.metadata.route ? log.metadata.route.substring(0, 30) : '/';
    
    lines.push(`[${(index + 1).toString().padStart(3, '0')}] ${timestamp} | ${level} | ${route}`);
    lines.push(`     Message: ${log.message}`);
    
    if (log.context && Object.keys(log.context).length > 0) {
      const contextLines = JSON.stringify(log.context, null, 2)
        .split('\n')
        .map(line => '     ' + line)
        .join('\n');
      lines.push(`     Context:`);
      lines.push(contextLines);
    }
    
    if (log.error) {
      lines.push(`     Error: ${log.error.name}: ${log.error.message}`);
      if (log.error.stack) {
        const stackLines = log.error.stack.split('\n').slice(0, 5);
        lines.push(`     Stack Trace:`);
        stackLines.forEach(stackLine => {
          lines.push(`       ${stackLine.trim()}`);
        });
      }
    }
    
    lines.push('');
  });
  
  lines.push('='.repeat(80));
  lines.push(`END OF LOG FILE - ${batch.logs.length} entries`);
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

export function formatLogsAsCompactJSON(batch: LogBatch): string {
  const optimizedBatch = {
    b: batch.batchId,
    t: batch.createdAt,
    p: batch.patientId || null,
    lt: batch.logType || null,
    d: batch.logs.length > 0 ? {
      dn: batch.logs[0].metadata.deviceInfo.deviceName,
      pl: batch.logs[0].metadata.deviceInfo.platform,
      lg: batch.logs[0].metadata.deviceInfo.language,
      tz: batch.logs[0].metadata.deviceInfo.timezone,
      sw: batch.logs[0].metadata.deviceInfo.screenWidth,
      sh: batch.logs[0].metadata.deviceInfo.screenHeight,
    } : null,
    s: batch.logs.length > 0 ? batch.logs[0].metadata.sessionId : null,
    u: batch.logs.length > 0 ? batch.logs[0].metadata.userId || null : null,
    logs: batch.logs.map(log => ({
      ts: log.timestamp,
      l: log.level,
      m: log.message,
      r: log.metadata.route || null,
      c: log.context || null,
      e: log.error ? {
        n: log.error.name,
        msg: log.error.message,
        s: log.error.stack || null,
      } : null,
    })),
  };
  
  return JSON.stringify(optimizedBatch);
}

