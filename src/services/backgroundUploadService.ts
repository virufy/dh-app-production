// import { getPresignedUrl } from "./presignedUrlService";
// import { audioDB } from "./audioDbService";
// import { logger } from "./loggingService";

// export interface UploadTask {
//   patientId: string;
//   filename: string;
//   timestamp: string;
//   audioType: "cough" | "speech" | "breath" | "unknown";
//   audioFileUrl: string; // Blob URL (still used for cleanup, but blob loaded from DB)
//   deviceName: string;
//   userAgent: string;
//   involuntaryCough?: boolean;
//   metadata?: {
//     involuntaryCough?: boolean;
//     [key: string]: any;
//   };
// }

// const uploadQueue: UploadTask[] = [];
// let isProcessingQueue = false;


// /**
//  * Upload file directly to S3 using presigned URL
//  */
// async function uploadToS3(
//   presignedUrl: string,
//   audioBlob: Blob,
//   filename: string,
//   contentType: string = "audio/wav"
// ): Promise<void> {
//   const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
//   console.log("[S3Upload] Starting S3 upload:", {
//     filename,
//     contentType,
//     fileSize: `${fileSizeMB} MB (${audioBlob.size} bytes)`,
//     blobType: audioBlob.type,
//     presignedUrlPreview: presignedUrl.substring(0, 80) + "...",
//   });

//   try {
//     // Upload to S3 using presigned URL
//     logger.info("S3Upload - Uploading to S3...", {
//       filename,
//       contentType,
//       fileSize: audioBlob.size,
//       presignedUrlPreview: presignedUrl.substring(0, 200) + "...",
//     });

//     console.log("[S3Upload] Uploading to S3...");
//     let response: Response;
//     try {
//       response = await fetch(presignedUrl, {
//         method: "PUT",
//         headers: {
//           "Content-Type": contentType,
//         },
//         body: audioBlob,
//       });
//     } catch (fetchError) {
//       logger.error("S3Upload - PUT Request", {
//         presignedUrl: presignedUrl.substring(0, 200) + "...",
//         filename,
//         fileSize: audioBlob.size,
//         contentType,
//         errorCategory: 'S3Upload',
//       }, fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
//       throw new Error(`Failed to upload to S3: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
//     }

//     logger.info("S3Upload - S3 response received", {
//       status: response.status,
//       statusText: response.statusText,
//       ok: response.ok,
//     });

//     console.log("[S3Upload] S3 response received:", {
//       status: response.status,
//       statusText: response.statusText,
//       ok: response.ok,
//     });

//     if (!response.ok) {
//       let errorText = "";
//       try {
//         errorText = await response.text();
//       } catch (textError) {
//         console.warn("[S3Upload] Could not read error response text:", textError);
//       }

//       const errorMsg = `S3 upload failed: HTTP ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 500)}` : ""}`;
      
//       logger.error("S3Upload - Upload Failed", {
//         status: response.status,
//         statusText: response.statusText,
//         errorText: errorText.substring(0, 1000),
//         headers: Object.fromEntries(response.headers.entries()),
//         filename,
//         fileSize: audioBlob.size,
//         contentType,
//         presignedUrlPreview: presignedUrl.substring(0, 200) + "...",
//         errorCategory: 'S3Upload',
//       }, new Error(errorMsg));
      
//       throw new Error(errorMsg);
//     }

//     logger.info("S3Upload - Upload successful", {
//       filename,
//       contentType,
//       fileSize: audioBlob.size,
//       presignedUrlPreview: presignedUrl.substring(0, 200) + "...",
//     });

//     console.log(` [S3Upload] Upload successful for ${filename}`);
//   } catch (error) {
//     logger.error("S3Upload - Overall", {
//       filename,
//       contentType,
//       errorCategory: 'S3Upload',
//     }, error instanceof Error ? error : new Error(String(error)));
//     throw error;
//   }
// }

// /**
//  * Process a single upload task using presigned URL
//  */
// async function processUploadTask(task: UploadTask): Promise<void> {
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//   console.log("🚀 [UploadTask] Starting upload task:", {
//     filename: task.filename,
//     patientId: task.patientId,
//     audioType: task.audioType,
//     timestamp: task.timestamp,
//     blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//   });

//   logger.info("UploadTask - Starting upload task", {
//     filename: task.filename,
//     patientId: task.patientId,
//     audioType: task.audioType,
//     timestamp: task.timestamp,
//     blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//   });

//   try {
//     // Validate required fields
//     console.log("[UploadTask] Validating task data...");
//     logger.info("UploadTask - Validating task data...", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//     });
//     if (!task.patientId) {
//       const error = new Error("Patient ID is required");
//       logger.error("UploadTask - Validation", { task, errorCategory: 'Validation' }, error);
//       throw error;
//     }
//     if (!task.filename) {
//       const error = new Error("Filename is required");
//       logger.error("UploadTask - Validation", { task, errorCategory: 'Validation' }, error);
//       throw error;
//     }
//     if (!task.audioFileUrl) {
//       const error = new Error("Audio file URL is required");
//       logger.error("UploadTask - Validation", { task, errorCategory: 'Validation' }, error);
//       throw error;
//     }
//     console.log("[UploadTask]  Task validation passed");
//     logger.info("UploadTask - Task validation passed", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//     });

//     // Step 1: Get presigned URL from Lambda
//     console.log("[UploadTask] Step 1: Requesting presigned URL from Lambda...");
//     logger.info("UploadTask - Requesting presigned URL from Lambda...", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//     });
//     let uploadUrl: string;
//     let key: string;
//     try {
//       const result = await getPresignedUrl({
//         patientId: task.patientId,
//         filename: task.filename,
//         audioType: task.audioType,
//         deviceName: task.deviceName,
//         contentType: "audio/wav",
//       });
//       uploadUrl = result.uploadUrl;
//       key = result.key;
//       console.log(`[UploadTask]  Got presigned URL for key: ${key}`);
//       logger.info("UploadTask - Got presigned URL", {
//         filename: task.filename,
//         patientId: task.patientId,
//         audioType: task.audioType,
//         timestamp: task.timestamp,
//         blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//         key: key,
//         uploadUrl: uploadUrl,
//       });
//     } catch (error) {
//       logger.error("UploadTask - Get Presigned URL", {
//         patientId: task.patientId,
//         filename: task.filename,
//         audioType: task.audioType,
//         deviceName: task.deviceName,
//         errorCategory: 'PresignedURL',
//       }, error instanceof Error ? error : new Error(String(error)));
//       throw error;
//     }

//     // Step 2: Load blob from IndexedDB (more reliable than blob URL)
//     console.log("[UploadTask] Step 2: Loading audio blob from IndexedDB...");
//     logger.info("UploadTask - Loading audio blob from IndexedDB...", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//     });
//     let audioBlob: Blob;
//     try {
//       const blobFromDB = await audioDB.loadRecording(task.audioType);
//       if (!blobFromDB) {
//         throw new Error(`Audio blob not found in IndexedDB for type: ${task.audioType}`);
//       }
//       audioBlob = blobFromDB;
//       const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
//       console.log(`[UploadTask]  Loaded blob from IndexedDB. Size: ${fileSizeMB} MB`);
//       logger.info("UploadTask - Loaded blob from IndexedDB", {
//         filename: task.filename,
//         patientId: task.patientId,
//         audioType: task.audioType,
//         timestamp: task.timestamp,
//         blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//         fileSize: fileSizeMB
//       });
//     } catch (dbError) {
//       logger.error("UploadTask - Load from IndexedDB", {
//         filename: task.filename,
//         audioType: task.audioType,
//         blobUrl: task.audioFileUrl,
//         errorCategory: 'IndexedDB',
//       }, dbError instanceof Error ? dbError : new Error(String(dbError)));
//       throw new Error(`Failed to load audio blob from IndexedDB: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
//     }

//     // Step 3: Upload directly to S3
//     console.log("[UploadTask] Step 3: Uploading file to S3...");
//     logger.info("UploadTask - Uploading file to S3...", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//       key: key,
//       uploadUrl: uploadUrl,
//     });
//     try {
//       await uploadToS3(uploadUrl, audioBlob, task.filename, "audio/wav");
//       console.log(`[UploadTask]  Successfully uploaded ${task.filename} to S3`);
//     } catch (error) {
//       logger.error("UploadTask - S3 Upload", {
//         filename: task.filename,
//         key,
//         fileSize: audioBlob.size,
//         uploadUrlPreview: uploadUrl.substring(0, 200) + "...",
//         errorCategory: 'S3Upload',
//       }, error instanceof Error ? error : new Error(String(error)));
//       throw error;
//     }

//     // Step 4: Cleanup
//     try {
//       URL.revokeObjectURL(task.audioFileUrl);
//       console.log(`[UploadTask]  Cleaned up blob URL for ${task.filename}`);
//     } catch (cleanupError) {
//       console.warn("[UploadTask] Warning: Failed to cleanup blob URL:", cleanupError);
//     }

//     console.log(`[UploadTask] Upload completed successfully: ${task.filename}`);
//     console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//     logger.info("UploadTask - Upload completed successfully", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
//     });
//   } catch (error) {
//     logger.error("UploadTask - Overall Failure", {
//       filename: task.filename,
//       patientId: task.patientId,
//       audioType: task.audioType,
//       timestamp: task.timestamp,
//       errorCategory: 'UploadTask',
//     }, error instanceof Error ? error : new Error(String(error)));
//     console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//     throw error;
//   }
// }

// /**
//  * Consume upload queue
//  */
// async function consumeQueue() {
//   if (isProcessingQueue) {
//     console.log("[Queue] Already processing, skipping...");
//     return;
//   }
  
//   isProcessingQueue = true;
//   console.log(`[Queue] Starting queue processing. Queue size: ${uploadQueue.length}`);

//   while (uploadQueue.length > 0) {
//     const task = uploadQueue.shift();
//     if (task) {
//       try {
//         await processUploadTask(task);
//       } catch (error) {
//         logger.error("Queue - Task Processing Failed", {
//           filename: task.filename,
//           remainingInQueue: uploadQueue.length,
//           errorCategory: 'Queue',
//         }, error instanceof Error ? error : new Error(String(error)));
//         console.error(`[Queue] Failed to upload ${task.filename}, continuing with next task...`);
//       }
//     }
//   }

//   isProcessingQueue = false;
//   console.log("[Queue]  Queue processing complete. Queue is now empty.");
//   logger.info("Queue - Queue processing complete", {
//     queueSize: 0,
//     isProcessing: false,
//   });
// }

// /**
//  * Add a task to the upload queue
//  */
// export function addUploadTask(task: UploadTask): void {
//   console.log(" [addUploadTask] Adding task to queue:", {
//     filename: task.filename,
//     patientId: task.patientId,
//     audioType: task.audioType,
//   });

//   // Validate task before adding to queue
//   if (!task) {
//     logger.error("addUploadTask - Invalid Task", { errorCategory: 'Validation' }, new Error("Task is null or undefined"));
//     return;
//   }

//   if (!task.patientId || !task.filename || !task.audioFileUrl) {
//     logger.error("addUploadTask - Missing Required Fields", {
//       hasPatientId: !!task.patientId,
//       hasFilename: !!task.filename,
//       hasAudioFileUrl: !!task.audioFileUrl,
//       errorCategory: 'Validation',
//     }, new Error("Task missing required fields"));
//     return;
//   }

//   uploadQueue.push(task);
//   setTimeout(consumeQueue, 0);
//   console.log(
//     `[addUploadTask]  Task ${task.filename} added to queue. Queue size: ${uploadQueue.length}`
//   );
// }

// /**
//  * Get current queue status
//  */
// export function getQueueStatus() {
//   return {
//     queueSize: uploadQueue.length,
//     isProcessing: isProcessingQueue,
//   };
// }

import { getPresignedUrl, confirmUpload } from "./presignedUrlService"; 
import { audioDB } from "./audioDbService";
import { logger } from "./loggingService";

export interface UploadTask {
  patientId: string;
  filename: string;
  timestamp: string;
  audioType: "cough" | "speech" | "breath" | "unknown";
  audioFileUrl: string; 
  deviceName: string;
  userAgent: string;
  involuntaryCough?: boolean;
  metadata?: {
    involuntaryCough?: boolean;
    [key: string]: any;
  };
}

const uploadQueue: UploadTask[] = [];
let isProcessingQueue = false;

async function uploadToS3(presignedUrl: string, audioBlob: Blob, filename: string): Promise<void> {
  console.log(`[S3Upload] Uploading ${filename}...`);
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": "audio/wav" },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`S3 error: ${response.status}`);
    }
    console.log(`[S3Upload] Success: ${filename}`);
  } catch (error) {
    logger.error("S3Upload - Failed", { filename }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function processUploadTask(task: UploadTask): Promise<void> {
  console.log("🚀 [UploadTask] Processing:", task.filename);

  try {
    if (!task.patientId || !task.filename) throw new Error("Missing required fields");

    // 1. Prepare Data
    const involuntaryValue = task.involuntaryCough ?? task.metadata?.involuntaryCough ?? false;

    // 2. Get URL (Sending InvoluntaryCough here saves it to DB as 'pending')
    const result = await getPresignedUrl({
      patientId: task.patientId,
      filename: task.filename,
      audioType: task.audioType,
      deviceName: task.deviceName,
      contentType: "audio/wav",
      InvoluntaryCough: involuntaryValue, 
    });

    // 3. Load Blob
    const audioBlob = await audioDB.loadRecording(task.audioType);
    if (!audioBlob) throw new Error("Blob not found in IndexedDB");

    // 4. Upload to S3
    await uploadToS3(result.uploadUrl, audioBlob, task.filename);

    // 5. Confirm Status (Updates DB to 'UPLOAD_COMPLETE')
    console.log("[UploadTask] Confirming status...");
    await confirmUpload({
      patientId: task.patientId,
      filename: task.filename,
      UploadStatus: "UPLOAD_COMPLETE"
    });

    // 6. Cleanup
    try { URL.revokeObjectURL(task.audioFileUrl); } catch (e) {}
    console.log(`✅ [UploadTask] Completed: ${task.filename}`);

  } catch (error) {
    logger.error("UploadTask - Failure", { filename: task.filename }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function consumeQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (uploadQueue.length > 0) {
    const task = uploadQueue.shift();
    if (task) await processUploadTask(task).catch(console.error);
  }
  isProcessingQueue = false;
}

export function addUploadTask(task: UploadTask): void {
  uploadQueue.push(task);
  setTimeout(consumeQueue, 0);
}

export function getQueueStatus() {
  return { queueSize: uploadQueue.length, isProcessing: isProcessingQueue };
}