import { callApiWithLogging } from './apiWithLogging';

export async function callApi(endpoint: string, body: any) {
  return callApiWithLogging({
    endpoint,
    method: 'POST',
    body,
    logContext: {
      apiCall: 'callApi',
    },
  });
}
