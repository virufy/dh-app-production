import { logger } from '../services/loggingService';
import { generateSignature } from '../utils/signature';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  endpoint: string;
  baseUrl?: string;
  logContext?: Record<string, any>;
}

export async function callApiWithLogging(options: ApiRequestOptions): Promise<Response> {
  const {
    method = 'POST',
    headers = {},
    body,
    endpoint,
    baseUrl = process.env.REACT_APP_API_BASE,
    logContext = {},
  } = options;

  const url = `${baseUrl}/${endpoint}`;
  const startTime = Date.now();

  try {
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const signature = await generateSignature();
      requestHeaders['x-unique-signature'] = signature;
    }

    logger.debug('API request initiated', {
      ...logContext,
      url,
      method,
      endpoint,
      hasBody: !!body,
    });

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      mode: 'cors',
      credentials: 'omit',
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      let errorBody = '';
      try {
        const clonedResponse = response.clone();
        errorBody = await clonedResponse.text();
      } catch (e) {
        // Failed to read error body
      }

      logger.error('API request failed', {
        ...logContext,
        url,
        method,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        duration,
        errorBody: errorBody.substring(0, 500),
        responseHeaders: Object.fromEntries(response.headers.entries()),
      }, new Error(`API Error: ${response.status} ${response.statusText}`));

      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    logger.debug('API request succeeded', {
      ...logContext,
      url,
      method,
      endpoint,
      status: response.status,
      duration,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const isCORS = error.name === 'TypeError';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      logger.error('API request CORS/Network error', {
        ...logContext,
        url,
        method,
        endpoint,
        duration,
        errorType: isCORS ? 'CORS' : 'Network',
        origin,
        isLocalhost,
        errorMessage: error.message,
      }, error);

    } else if (error instanceof Error) {
      logger.error('API request error', {
        ...logContext,
        url,
        method,
        endpoint,
        duration,
        errorMessage: error.message,
      }, error);
    } else {
      logger.error('API request unknown error', {
        ...logContext,
        url,
        method,
        endpoint,
        duration,
        error: String(error),
      }, new Error(String(error)));
    }

    throw error;
  }
}

