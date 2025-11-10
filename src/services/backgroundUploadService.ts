// src/services/backgroundUploadService.ts

import { generateSignature } from "../utils/signature";
import { blobUrlToBase64 } from "../utils/audioUtils"; // You'll create this or move existing
import { getDeviceName, generateUserAgent } from "../utils/deviceUtils"; // You'll create this or move existing

const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod";

interface UploadTask {
  patientId: string;
  filename: string;
  timestamp: string;
  audioType: "cough" | "speech" | "breath" | "unknown";
  audioFileUrl: string; // Blob URL
  deviceName: string;
  userAgent: string;
  involuntaryCough?: boolean; // Optional field for cough recordings
  metadata?: {
    involuntaryCough?: boolean;
    [key: string]: any;
  };
}

const uploadQueue: UploadTask[] = [];
let isProcessingQueue = false;

// Function to process a single upload task
async function processUploadTask(task: UploadTask): Promise<void> {
  console.log("Attempting background upload for:", task.filename);
  try {
    const { base64 } = await blobUrlToBase64(task.audioFileUrl);
    const signature = await generateSignature();

    const res = await fetch(`${API_BASE}/cough-upload`, { // Consider a more generic endpoint if it applies to all types
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-unique-signature": signature,
        "User-Agent": task.userAgent,
      },
      body: JSON.stringify({
        patientId: task.patientId,
        filename: task.filename,
        timestamp: task.timestamp,
        audioType: task.audioType,
        audioBase64: base64,
        deviceName: task.deviceName,
        involuntaryCough: task.involuntaryCough || task.metadata?.involuntaryCough, // Include involuntary cough state in upload
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(
        `Background upload failed for ${task.filename}: ${txt || res.statusText} (${res.status})`
      );
    }

    console.log(`Successfully uploaded ${task.filename} in the background.`);
    // Clean up blob URL if it was created locally
    URL.revokeObjectURL(task.audioFileUrl);

  } catch (error) {
    console.error("Background upload error:", error);
    // TODO: Implement more robust error handling, e.g., retry mechanism,
    // storing failed uploads in local storage, or notifying the user if critical.
  }
}

// Function to start processing the queue
async function consumeQueue() {
  if (isProcessingQueue) {
    return;
  }
  isProcessingQueue = true;

  while (uploadQueue.length > 0) {
    const task = uploadQueue.shift(); // Get the first task
    if (task) {
      await processUploadTask(task);
    }
  }

  isProcessingQueue = false;
  console.log("Background upload queue empty.");
}

// Function to add a task to the queue
export function addUploadTask(task: UploadTask): void {
  uploadQueue.push(task);
  // Debounce or immediately try to consume the queue
  // Using setTimeout 0 to ensure it runs asynchronously and doesn't block the current call stack
  setTimeout(consumeQueue, 0);
  console.log(`Task ${task.filename} added to background upload queue. Queue size: ${uploadQueue.length}`);
}

// Optional: Function to check queue status (e.g., for a debug/status page)
export function getQueueStatus() {
  return {
    queueSize: uploadQueue.length,
    isProcessing: isProcessingQueue,
  };
}