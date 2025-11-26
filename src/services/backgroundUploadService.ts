
import { generateSignature } from "../utils/signature";
import { blobUrlToBase64 } from "../utils/audioUtils"; 
import { COUGH_API_URL } from '../config';

//test api base
// const API_BASE =
//   process.env.REACT_APP_API_BASE ??
//   "https://tvw8a1lqyd.execute-api.me-central-1.amazonaws.com/test";


//prod api base
// const API_BASE =
//   process.env.REACT_APP_API_BASE ??
//   "https://uq9k4jco32.execute-api.me-central-1.amazonaws.com/test;


interface UploadTask {
  patientId: string;
  filename: string;
  timestamp: string;
  audioType: "cough" | "speech" | "breath" | "unknown";
  audioFileUrl: string; // Blob URL
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

// Function to process a single upload task
async function processUploadTask(task: UploadTask): Promise<void> {
  console.log("Attempting background upload for:", task.filename);
  try {
    const { base64 } = await blobUrlToBase64(task.audioFileUrl);
    const signature = await generateSignature();

    const res = await fetch(`${COUGH_API_URL}/cough-upload`, { 
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
        involuntaryCough: task.involuntaryCough || task.metadata?.involuntaryCough, 
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
  }
}

async function consumeQueue() {
  if (isProcessingQueue) {
    return;
  }
  isProcessingQueue = true;

  while (uploadQueue.length > 0) {
    const task = uploadQueue.shift(); 
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
  
  setTimeout(consumeQueue, 0);
  console.log(`Task ${task.filename} added to background upload queue. Queue size: ${uploadQueue.length}`);
}

export function getQueueStatus() {
  return {
    queueSize: uploadQueue.length,
    isProcessing: isProcessingQueue,
  };
}