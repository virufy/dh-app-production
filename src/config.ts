// src/config.ts

// 1. COUGH API (Uploads & Status)
// We prefer the Environment Variable. If not found (Localhost), we fall back to TEST.
export const COUGH_API_URL = 
  process.env.REACT_APP_COUGH_API_URL ??
  "https://tvw8a1lqyd.execute-api.me-central-1.amazonaws.com/test";

// 2. PATIENT API (ID Generation)
// We prefer the Environment Variable. If not found (Localhost), we fall back to TEST.
export const PATIENT_API_URL = 
  process.env.REACT_APP_PATIENT_API_URL ?? 
  "https://fc8eht392h.execute-api.me-central-1.amazonaws.com/test";

// 3. PRESIGNED URL API (S3 Upload URLs)
// We prefer the Environment Variable. If not found (Localhost), we fall back to TEST.
export const PRESIGNED_URL_API_URL = 
  process.env.REACT_APP_PRESIGNED_URL_API_URL ?? 
  "https://zxnylz4atd.execute-api.me-central-1.amazonaws.com/Testing";

console.log("Environment Config:", {
  CoughAPI: COUGH_API_URL,
  PatientAPI: PATIENT_API_URL,
  PresignedURLAPI: PRESIGNED_URL_API_URL
});