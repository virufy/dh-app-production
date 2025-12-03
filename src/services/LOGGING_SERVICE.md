# Global Logging Service

This service handles all logging across the app. It stores logs locally in your browser and automatically uploads them to S3 when needed. Everything is automatic - you just log things and the service takes care of the rest.

## Quick Start

```typescript
import { logger } from './services/loggingService';

// Log something
logger.info('User clicked the submit button', { buttonId: 'submit' });

// Log an error
try {
  // your code here
} catch (error) {
  logger.error('Something went wrong', { action: 'submitForm' }, error);
}
```

That's it. The logger automatically includes session ID, patient ID, device info, and other useful context with every log.

## What Gets Logged Automatically

The service automatically captures:
- All API requests and responses (including failures)
- Network errors and CORS issues
- Unhandled JavaScript errors
- Unhandled promise rejections
- React component errors (via Error Boundary)
- Resource loading failures

You don't need to do anything special - these are logged automatically.

## Log Levels

There are five log levels. Use them like this:

```typescript
// DEBUG - Detailed info for debugging (usually only in development)
logger.debug('Component rendered', { props: {...} });

// INFO - Normal app activity
logger.info('User logged in', { userId: '123' });

// WARN - Something might be wrong but app still works
logger.warn('API response was slow', { duration: 5000 });

// ERROR - Something actually failed
logger.error('Failed to save data', { formId: 'patient-info' }, error);

// FATAL - Critical failure that breaks the app
logger.fatal('Database connection lost', {}, error);
```

## Patient ID Tracking

The logger automatically reads the patient ID from sessionStorage. If you need to set it manually:

```typescript
logger.setPatientId('AB-1234');
```

When you set a patient ID, all subsequent logs will include it automatically. The logger also tracks patient session IDs - if a patient ID isn't available yet, it uses a UUID to group logs together. This way, even incomplete user journeys have their logs grouped properly.

## How Logs Are Organized

Logs are organized by patient and separated by type:

1. **By Patient**: Each patient gets their own log files
2. **By Type**: Error logs and info logs are in separate files

File naming format: `patientID_logtype_timestampwithtimezone.txt`

Examples:
- `AB-1234_error_2025-12-03T14-22-53-798Z-Asia_Karachi.txt`
- `AB-1234_info_2025-12-03T14-22-53-798Z-Asia_Karachi.txt`

If there's no patient ID (like when an error happens before login), logs use a session UUID instead:
- `550e8400-e29b-41d4-a716-446655440000_error_2025-12-03T14-22-53-798Z-Asia_Karachi.txt`

## When Logs Are Uploaded

Logs are uploaded automatically in these situations:

1. **When a patient completes their journey**: On the confirmation screen, all logs for that patient are uploaded immediately
2. **When error/fatal logs occur**: Critical errors trigger an immediate upload
3. **After a batch accumulates**: When you hit the batch size limit (default 50 logs)
4. **Every 30 seconds**: Regular automatic flush of pending logs
5. **Before page unload**: When the user closes the tab or navigates away

You can also trigger uploads manually (more on that below).

## Manual Upload Triggers

### Upload All Logs (Error Reporting)

When users click "Something wrong? Report an error", the service uploads ALL available logs before opening the error report form. This ensures we have complete logs even for incomplete journeys.

```typescript
import { uploadAllLogs } from './services/logUploadService';

// Upload everything
await uploadAllLogs();
```

### Upload Current Patient Logs

To upload just the current patient's logs:

```typescript
import { uploadAllLogsForCurrentPatient } from './services/logUploadService';

await uploadAllLogsForCurrentPatient();
```

### Upload Pending Logs (with limit)

To upload a specific number of pending logs:

```typescript
import { uploadPendingLogs } from './services/logUploadService';

await uploadPendingLogs(50); // Upload up to 50 logs
```

## Debugging in the Browser

If you need to check logs locally, you can use these console functions:

```javascript
// Export logs grouped by patient (creates separate files for each patient)
window.exportLogs();

// Export all logs as a single file
window.exportAllLogs();

// Show diagnostic info about log grouping
window.diagnoseLogs();
```

These are available in the browser console (F12) during development. They'll download log files directly to your computer.

## Log Format

Log files are plain text (not JSON) to keep file sizes small. They're still human-readable and include:

- Batch metadata (batch ID, creation time, log type, patient ID)
- Device information (device name, platform, timezone, screen size, etc.)
- Individual log entries with:
  - Timestamp
  - Log level
  - Route/page where it occurred
  - Message
  - Context (any additional data you provided)
  - Error details (if it's an error log)

## Storage and Cleanup

Logs are stored in IndexedDB (your browser's local database). This means:
- Logs survive page refreshes
- Logs work offline
- Logs are cleared after successful upload to save space

After a log file is successfully uploaded to S3, it's automatically deleted from local storage. If an upload fails, the logs stay in storage and will be retried later.

Old logs (older than 7 days) are automatically cleaned up.

## Patient Session Management

The logger manages patient sessions carefully:

- **No automatic session creation on login**: This preserves logs even if a user journey isn't completed
- **New session only after completion**: A new patient session is created only when returning to the main menu after successfully completing the journey
- **Session UUID fallback**: If a patient ID isn't available, a UUID is used to group logs together

This means you can always trace what happened, even for incomplete journeys.

## Configuration

The logger works with sensible defaults, but you can customize it:

```typescript
logger.configure({
  batchSize: 50,              // How many logs before auto-flush
  flushInterval: 30000,       // Auto-flush every 30 seconds
  logLevel: LogLevel.INFO,    // Minimum level to store (DEBUG, INFO, WARN, ERROR, FATAL)
  enableConsoleOutput: true,  // Also print to browser console
  enableAutoUpload: true,     // Automatically upload to S3
});
```

## Common Patterns

### Logging API Calls

API calls are automatically logged via the fetch interceptor. But if you need to add extra context:

```typescript
logger.info('Starting API call', { endpoint: '/api/patients', method: 'POST' });

try {
  const response = await fetch('/api/patients', { method: 'POST' });
  logger.info('API call succeeded', { endpoint: '/api/patients', status: response.status });
} catch (error) {
  logger.error('API call failed', { endpoint: '/api/patients' }, error);
}
```

### Logging User Actions

```typescript
const handleSubmit = () => {
  logger.info('Form submitted', {
    formType: 'patient-info',
    fieldCount: Object.keys(formData).length,
  });
  
  // your submit logic
};
```

### Logging Errors with Context

```typescript
try {
  await processPatientData(patientId);
} catch (error) {
  logger.error('Failed to process patient data', {
    patientId,
    step: 'data-processing',
    retryCount: 3,
  }, error);
}
```

## What's Included in Each Log

Every log entry automatically includes:

- **Session ID**: Unique ID for the browser session
- **Patient ID**: Current patient identifier (if available)
- **Patient Session ID**: UUID to group logs when patient ID isn't available
- **User ID**: If set manually
- **Device Info**: Device name, platform, browser, screen size, timezone
- **URL**: Current page URL
- **Route**: React route path
- **Timestamp**: When the log was created (ISO format)

Plus whatever context you provide in your log calls.

## Troubleshooting

### Logs aren't uploading?

1. Check the browser console for error messages
2. Verify `PRESIGNED_URL_API_URL` is configured in `config.ts`
3. Check IndexedDB: Open DevTools > Application > IndexedDB > `app_logs` > `logs`
4. Check network connectivity
5. Verify the Lambda function is running and has access to S3

### Logs missing patient ID?

- Make sure `logger.setPatientId()` is called when patient ID is set
- Check that `sessionStorage.getItem('patientId')` returns the correct value
- The logger will use a session UUID if patient ID isn't available

### Need to see logs locally?

Use the console functions:
- `window.exportLogs()` - Download all logs grouped by patient
- `window.exportAllLogs()` - Download all logs as one file
- `window.diagnoseLogs()` - Show diagnostic info about log grouping

## Backend Requirements

The logging service needs a Lambda function that generates S3 presigned URLs. The function should:

**Accept:**
- `patientId`: Patient identifier (or undefined for generic logs)
- `sessionId`: Session identifier
- `filename`: Log filename (e.g., `AB-1234_error_2025-12-03T14-22-53-798Z-Asia_Karachi.txt`)
- `deviceName`: Device identifier
- `contentType`: Should be `"text/plain"` for log files
- `audioType`: Should be `"logs"` for log files
- `logCount`: Number of logs in the batch

**Return:**
- `uploadUrl`: S3 presigned URL for PUT request
- `key`: S3 object key
- `filename`: Confirmed filename

The Lambda should:
- Use `LOGGER_BUCKET` environment variable for log file uploads
- Store log files at: `logs/{patientId}/{filename}` or `logs/generic/{filename}`
- Set ContentType to `text/plain`
- Skip DynamoDB entries for log files (unlike audio files)

## Best Practices

1. **Use the right log level**: Don't use ERROR for warnings. Use WARN instead.

2. **Include helpful context**: Always provide context objects, not just messages.
   ```typescript
   // Good
   logger.info('User action', { action: 'click', buttonId: 'submit', userId: '123' });
   
   // Not so good
   logger.info('User clicked submit button');
   ```

3. **Don't log sensitive data**: Never log passwords, tokens, full credit card numbers, or other PII.

4. **Always pass Error objects**: When logging errors, pass the Error object as the third parameter.
   ```typescript
   logger.error('Operation failed', { operation: 'save' }, error); // Good
   logger.error('Operation failed', { operation: 'save', error: error.message }); // Not as good
   ```

5. **Log at important points**: Log when:
   - User actions occur (button clicks, form submissions)
   - API calls are made
   - Errors happen
   - Important state changes occur

6. **Keep messages concise**: Log messages should be short and clear. Use context for details.

That's pretty much everything you need to know. The service is designed to work automatically, so in most cases you just need to add logging calls where you want them. The rest happens behind the scenes.
