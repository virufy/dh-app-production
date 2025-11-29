import { getPresignedUrl } from "./presignedUrlService";
import { audioDB } from "./audioDbService";

export interface UploadTask {
  patientId: string;
  filename: string;
  timestamp: string;
  audioType: "cough" | "speech" | "breath" | "unknown";
  audioFileUrl: string; // Blob URL (still used for cleanup, but blob loaded from DB)
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

/**
 * Log detailed error information
 */
function logError(step: string, error: unknown, context?: Record<string, any>) {
  const errorDetails: any = {
    timestamp: new Date().toISOString(),
    step,
    context,
  };

  if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
    errorDetails.name = error.name;
  } else {
    errorDetails.error = String(error);
  }
  
  // Also log to console.error with full details
  console.error("Full error details:", JSON.stringify(errorDetails, null, 2));
}

/**
 * Upload file directly to S3 using presigned URL
 */
async function uploadToS3(
  presignedUrl: string,
  audioBlob: Blob,
  filename: string,
  contentType: string = "audio/wav"
): Promise<void> {
  const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
  console.log("[S3Upload] Starting S3 upload:", {
    filename,
    contentType,
    fileSize: `${fileSizeMB} MB (${audioBlob.size} bytes)`,
    blobType: audioBlob.type,
    presignedUrlPreview: presignedUrl.substring(0, 80) + "...",
  });

  try {
    // Upload to S3 using presigned URL
    console.log("[S3Upload] Uploading to S3...");
    let response: Response;
    try {
      response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: audioBlob,
      });
    } catch (fetchError) {
      logError("S3Upload - PUT Request", fetchError, {
        presignedUrl: presignedUrl.substring(0, 200) + "...",
        filename,
        fileSize: audioBlob.size,
        contentType,
      });
      throw new Error(`Failed to upload to S3: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    console.log("[S3Upload] S3 response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (textError) {
        console.warn("[S3Upload] Could not read error response text:", textError);
      }

      const errorMsg = `S3 upload failed: HTTP ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 500)}` : ""}`;
      
      logError("S3Upload - Upload Failed", new Error(errorMsg), {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 1000), // Limit error text
        headers: Object.fromEntries(response.headers.entries()),
        filename,
        fileSize: audioBlob.size,
        contentType,
        presignedUrlPreview: presignedUrl.substring(0, 200) + "...",
      });
      
      throw new Error(errorMsg);
    }

    console.log(`✅ [S3Upload] Upload successful for ${filename}`);
  } catch (error) {
    logError("S3Upload - Overall", error, {
      filename,
      contentType,
    });
    throw error;
  }
}

/**
 * Process a single upload task using presigned URL
 */
async function processUploadTask(task: UploadTask): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 [UploadTask] Starting upload task:", {
    filename: task.filename,
    patientId: task.patientId,
    audioType: task.audioType,
    timestamp: task.timestamp,
    blobUrlPreview: task.audioFileUrl.substring(0, 80) + "...",
  });

  try {
    // Validate required fields
    console.log("[UploadTask] Validating task data...");
    if (!task.patientId) {
      const error = new Error("Patient ID is required");
      logError("UploadTask - Validation", error, { task });
      throw error;
    }
    if (!task.filename) {
      const error = new Error("Filename is required");
      logError("UploadTask - Validation", error, { task });
      throw error;
    }
    if (!task.audioFileUrl) {
      const error = new Error("Audio file URL is required");
      logError("UploadTask - Validation", error, { task });
      throw error;
    }
    console.log("[UploadTask] ✅ Task validation passed");

    // Step 1: Get presigned URL from Lambda
    console.log("[UploadTask] Step 1: Requesting presigned URL from Lambda...");
    let uploadUrl: string;
    let key: string;
    try {
      const result = await getPresignedUrl({
        patientId: task.patientId,
        filename: task.filename,
        audioType: task.audioType,
        deviceName: task.deviceName,
        contentType: "audio/wav",
      });
      uploadUrl = result.uploadUrl;
      key = result.key;
      console.log(`[UploadTask] ✅ Got presigned URL for key: ${key}`);
    } catch (error) {
      logError("UploadTask - Get Presigned URL", error, {
        patientId: task.patientId,
        filename: task.filename,
        audioType: task.audioType,
        deviceName: task.deviceName,
      });
      throw error;
    }

    // Step 2: Load blob from IndexedDB (more reliable than blob URL)
    console.log("[UploadTask] Step 2: Loading audio blob from IndexedDB...");
    let audioBlob: Blob;
    try {
      const blobFromDB = await audioDB.loadRecording(task.audioType);
      if (!blobFromDB) {
        throw new Error(`Audio blob not found in IndexedDB for type: ${task.audioType}`);
      }
      audioBlob = blobFromDB;
      const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`[UploadTask] ✅ Loaded blob from IndexedDB. Size: ${fileSizeMB} MB`);
    } catch (dbError) {
      logError("UploadTask - Load from IndexedDB", dbError, {
        filename: task.filename,
        audioType: task.audioType,
        blobUrl: task.audioFileUrl,
      });
      throw new Error(`Failed to load audio blob from IndexedDB: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    // Step 3: Upload directly to S3
    console.log("[UploadTask] Step 3: Uploading file to S3...");
    try {
      await uploadToS3(uploadUrl, audioBlob, task.filename, "audio/wav");
      console.log(`[UploadTask] ✅ Successfully uploaded ${task.filename} to S3`);
    } catch (error) {
      logError("UploadTask - S3 Upload", error, {
        filename: task.filename,
        key,
        fileSize: audioBlob.size,
        uploadUrlPreview: uploadUrl.substring(0, 200) + "...",
      });
      throw error;
    }

    // Step 4: Cleanup
    try {
      URL.revokeObjectURL(task.audioFileUrl);
      console.log(`[UploadTask] ✅ Cleaned up blob URL for ${task.filename}`);
    } catch (cleanupError) {
      console.warn("[UploadTask] Warning: Failed to cleanup blob URL:", cleanupError);
    }

    console.log(`✅ [UploadTask] Upload completed successfully: ${task.filename}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    logError("UploadTask - Overall Failure", error, {
      filename: task.filename,
      patientId: task.patientId,
      audioType: task.audioType,
      timestamp: task.timestamp,
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw error;
  }
}

/**
 * Consume upload queue
 */
async function consumeQueue() {
  if (isProcessingQueue) {
    console.log("[Queue] Already processing, skipping...");
    return;
  }
  
  isProcessingQueue = true;
  console.log(`[Queue] Starting queue processing. Queue size: ${uploadQueue.length}`);

  while (uploadQueue.length > 0) {
    const task = uploadQueue.shift();
    if (task) {
      try {
        await processUploadTask(task);
      } catch (error) {
        logError("Queue - Task Processing Failed", error, {
          filename: task.filename,
          remainingInQueue: uploadQueue.length,
        });
        console.error(`[Queue] Failed to upload ${task.filename}, continuing with next task...`);
      }
    }
  }

  isProcessingQueue = false;
  console.log("[Queue] ✅ Queue processing complete. Queue is now empty.");
}

/**
 * Add a task to the upload queue
 */
export function addUploadTask(task: UploadTask): void {
  console.log("📝 [addUploadTask] Adding task to queue:", {
    filename: task.filename,
    patientId: task.patientId,
    audioType: task.audioType,
  });

  // Validate task before adding to queue
  if (!task) {
    logError("addUploadTask - Invalid Task", new Error("Task is null or undefined"), {});
    return;
  }

  if (!task.patientId || !task.filename || !task.audioFileUrl) {
    logError("addUploadTask - Missing Required Fields", new Error("Task missing required fields"), {
      hasPatientId: !!task.patientId,
      hasFilename: !!task.filename,
      hasAudioFileUrl: !!task.audioFileUrl,
    });
    return;
  }

  uploadQueue.push(task);
  setTimeout(consumeQueue, 0);
  console.log(
    `[addUploadTask] ✅ Task ${task.filename} added to queue. Queue size: ${uploadQueue.length}`
  );
}

/**
 * Get current queue status
 */
export function getQueueStatus() {
  return {
    queueSize: uploadQueue.length,
    isProcessing: isProcessingQueue,
  };
}
