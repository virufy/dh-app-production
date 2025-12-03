import { logger } from '../services/loggingService';

let isInterceptorInstalled = false;

function detectErrorType(error: Error, url: string): 'CORS' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN' {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'CORS';
  }
  if (error.message.includes('timeout') || error.message.includes('aborted')) {
    return 'TIMEOUT';
  }
  if (error.message.includes('Network') || error.message.includes('network')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

export function installFetchInterceptor(): void {
  if (isInterceptorInstalled || typeof window === 'undefined') {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async function (...args): Promise<Response> {
    const [input, init = {}] = args;
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }
    const method = init.method || 'GET';
    const startTime = Date.now();

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        let errorBody = '';
        try {
          const clonedResponse = response.clone();
          errorBody = await clonedResponse.text();
        } catch (e) {
          // Failed to read error body
        }

        logger.error('Fetch request failed', {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          errorBody: errorBody.substring(0, 500),
          isCORS: false,
        }, new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error) {
        const errorType = detectErrorType(error, url);
        const isCORS = errorType === 'CORS';
        const origin = window.location.origin;
        const isLocalhost = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';

        if (isCORS) {
          logger.error('Fetch CORS error', {
            url,
            method,
            duration,
            origin,
            isLocalhost,
            targetUrl: url,
            errorType: 'CORS',
          }, error);
        } else {
          logger.error('Fetch network error', {
            url,
            method,
            duration,
            errorType,
            errorMessage: error.message,
          }, error);
        }
      } else {
        logger.error('Fetch unknown error', {
          url,
          method,
          duration,
          error: String(error),
        }, new Error(String(error)));
      }

      throw error;
    }
  };

  isInterceptorInstalled = true;
}

