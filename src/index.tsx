import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './containers/App/App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './assets/fonts/font.css';
import { logger } from './services/loggingService';
import ErrorBoundary from './components/ErrorBoundary';
import { installFetchInterceptor } from './utils/fetchInterceptor';
import { downloadLogFiles, downloadAllLogsAsSingleFile, diagnoseLogGrouping } from './utils/logExporter';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const base =
  window.location.pathname.startsWith("/dh-app") ? "/dh-app" : "/";

async function initializeApp() {
  try {
    await logger.initialize();

    installFetchInterceptor();

    logger.info('Application starting', {
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    const patientId = sessionStorage.getItem('patientId');
    if (patientId) {
      logger.setPatientId(patientId);
    }

    setupGlobalErrorHandlers();

    if (typeof window !== 'undefined') {
      (window as any).exportLogs = downloadLogFiles;
      (window as any).exportAllLogs = downloadAllLogsAsSingleFile;
      (window as any).diagnoseLogs = diagnoseLogGrouping;
      console.log('Log export functions available:');
      console.log('  - window.exportLogs() - Export logs grouped by patient');
      console.log('  - window.exportAllLogs() - Export all logs as single file');
      console.log('  - window.diagnoseLogs() - Show log grouping diagnostics');
    }
  } catch (error) {
    console.error('Failed to initialize logging service:', error);
  }

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={base}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );

  reportWebVitals();
}

function setupGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    const isCorsError = event.message.includes('CORS') ||
      event.message.includes('Failed to fetch') ||
      (event.error instanceof TypeError && event.error.message.includes('fetch'));

    logger.error('Frontend error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      errorType: isCorsError ? 'CORS' : 'JavaScript',
      stack: event.error?.stack,
    }, event.error || new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    const isApiError = error.message.includes('API') ||
      error.message.includes('fetch') ||
      error.message.includes('HTTP');

    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      errorType: isApiError ? 'API' : 'Promise',
      stack: error.stack,
    }, error);
  });

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      logger.warn('Resource loading error', {
        tagName: target.tagName,
        source: (target as HTMLImageElement).src || (target as HTMLLinkElement).href || '',
        errorType: 'Resource',
      });
    }
  }, true);

  window.addEventListener('beforeunload', () => {
    logger.destroy();
  });
}

initializeApp();
