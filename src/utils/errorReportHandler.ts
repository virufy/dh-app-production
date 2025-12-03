import { logger } from '../services/loggingService';
import { uploadAllLogs } from '../services/logUploadService';

const ERROR_REPORT_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform';

export async function handleErrorReport(
  e: React.MouseEvent<HTMLAnchorElement>,
  customUrl?: string
): Promise<void> {
  e.preventDefault();
  
  const reportUrl = customUrl || ERROR_REPORT_URL;
  
  try {
    logger.info('Error report link clicked, uploading all logs before redirect');
    await uploadAllLogs();
    
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
    
    logger.info('Error report form opened after log upload');
  } catch (error) {
    logger.error('Failed to upload logs before error report', {}, 
      error instanceof Error ? error : new Error(String(error)));
    
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
  }
}

export function getErrorReportUrl(): string {
  return ERROR_REPORT_URL;
}

