import { useCallback, useEffect, useRef, useState } from "react";

// --- AudioWorklet Processor Code (Runs on a separate audio thread) ---
// We embed this as a string to avoid needing a separate file/URL configuration.
const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.sampleCount = 0;
    // Pre-allocate buffers to avoid garbage collection during recording
    this.buffers = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channel1Input = input[0];
    // If mono, duplicate channel 1 to channel 2. If stereo, use channel 2.
    const channel2Input = input.length > 1 ? input[1] : input[0]; 

    // Loop through the processing block (usually 128 samples)
    for (let i = 0; i < channel1Input.length; i++) {
      this.buffers[0][this.sampleCount] = channel1Input[i];
      this.buffers[1][this.sampleCount] = channel2Input[i];
      this.sampleCount++;

      // When buffer is full, send to main thread
      if (this.sampleCount >= this.bufferSize) {
        // Create copies to send (transferable)
        const c1 = this.buffers[0].slice(); 
        const c2 = this.buffers[1].slice();
        
        // Post message with transfer list (zero-copy overhead)
        this.port.postMessage({ channel1: c1, channel2: c2 }, [c1.buffer, c2.buffer]);
        
        this.sampleCount = 0;
      }
    }
    
    return true; // Keep processor alive
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

// --- IndexedDB Helpers ---

async function saveRecordingToIDB(blob: Blob, recordingType: string) {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      };
      request.onsuccess = () => resolve(request.result);
    });

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['blobs'], 'readwrite');
      const store = transaction.objectStore('blobs');
      const request = store.put(blob, recordingType);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to save recording:', e);
    return Promise.resolve();
  }
}

async function loadRecordingFromIDB(recordingType: string): Promise<Blob | null> {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    return new Promise<Blob | null>((resolve, reject) => {
      const transaction = db.transaction(['blobs'], 'readonly');
      const store = transaction.objectStore('blobs');
      const request = store.get(recordingType);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error('Failed to load recording:', e);
    return null;
  }
}

async function deleteRecordingFromIDB(recordingType: string) {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction(['blobs'], 'readwrite');
    const store = transaction.objectStore('blobs');
    store.delete(recordingType);
  } catch (e) {
    console.error('Failed to delete recording:', e);
  }
}

// --- WAV Encoder (32-bit Float) ---

type StereoChunk = {
  channel1: Float32Array;
  channel2: Float32Array;
};

function encodeFloat32Wav(channel1: Float32Array, channel2: Float32Array, sampleRate: number): Blob {
  const numSamples = channel1.length;
  const buffer = new ArrayBuffer(44 + numSamples * 8); 
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true); // IEEE Float
  view.setUint16(22, 2, true); // Stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 8, true);
  view.setUint16(32, 8, true);
  view.setUint16(34, 32, true); // 32-bit
  writeStr(36, "data");
  view.setUint32(40, numSamples * 8, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    view.setFloat32(offset, channel1[i], true);
    view.setFloat32(offset + 4, channel2[i], true);
    offset += 8;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// --- Main Hook ---

type RecType = "speech" | "cough" | "breath" | "unknown";
type AudioData = { audioFileUrl: string; filename: string; recordingType: RecType } | null;

export function useAudioRecorder(targetSampleRate = 44100, recordingType: RecType = "unknown") {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null); // Replaces ScriptProcessor
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const chunksRef = useRef<StereoChunk[]>([]); 
  const actualSampleRateRef = useRef<number>(targetSampleRate);
  
  const elapsedTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(() => {
    try {
      const key = `audioData_${recordingType}`;
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        loadRecordingFromIDB(recordingType).then(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setAudioData({ ...parsed, audioFileUrl: url });
          }
        });
        return parsed;
      }
    } catch (e) {}
    return null;
  });
  
  const audioDataRef = useRef<AudioData>(audioData);
  useEffect(() => { audioDataRef.current = audioData; }, [audioData]);

  const [recordingTime, setRecordingTime] = useState(() => {
    try {
      const key = `recordingTime_${recordingType}`;
      const saved = sessionStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState(false);

  // Helper to capitalize type for filename
  function capitalize(type: string) {
    if (!type) return "Unknown";
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  const cleanup = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    
    // Cleanup Worklet Node
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage("close"); // Good practice, though not strictly required
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const stopRecording = useCallback(async () => {
    if (!isRecording && chunksRef.current.length === 0) return;

    // --- Cleanup timers and audio graph ---
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    const totalSamples = chunksRef.current.reduce((acc, cur) => acc + cur.channel1.length, 0);

    if (totalSamples > 0) {
      // Flatten chunks
      let flatChannel1 = new Float32Array(totalSamples);
      let flatChannel2 = new Float32Array(totalSamples);
      let offset = 0;

      for (const chunk of chunksRef.current) {
        flatChannel1.set(chunk.channel1, offset);
        flatChannel2.set(chunk.channel2, offset);
        offset += chunk.channel1.length;
      }
      chunksRef.current = []; 

      const wavBlob = encodeFloat32Wav(flatChannel1, flatChannel2, actualSampleRateRef.current);
      const wavUrl = URL.createObjectURL(wavBlob);
      const storedPatientId = sessionStorage.getItem("patientId") || "unknown";
      const timestamp = new Date().toISOString().replace(/\..*Z$/, "").replace(/:/g, "-");
      const filename = `${storedPatientId}-${capitalize(recordingType)}-${timestamp}.wav`;

      const elapsedSeconds = startTimeRef.current != null ? Math.floor((Date.now() - startTimeRef.current) / 1000) : recordingTime;
      const isMaxDuration = elapsedSeconds === 40;
      
      if (elapsedSeconds < 3 && !isMaxDuration) {
        setTooShort(true);
        setAudioData(null);
        sessionStorage.removeItem(`audioData_${recordingType}`);
        sessionStorage.removeItem(`recordingTime_${recordingType}`);
        await deleteRecordingFromIDB(recordingType);
        setRecordingTime(0);
      } else {
        const data = { audioFileUrl: wavUrl, filename, recordingType };
        setAudioData(data);
        sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
        sessionStorage.setItem(`recordingTime_${recordingType}`, recordingTime.toString());
        await saveRecordingToIDB(wavBlob, recordingType);
      }
    } else {
      setAudioData(null);
      sessionStorage.removeItem(`audioData_${recordingType}`);
      setRecordingTime(0);
    }

    setIsRecording(false);
    startTimeRef.current = null;
  }, [isRecording, recordingType, recordingTime]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      setError(null);
      setTooShort(false);
      
      // 1. Constraints: Raw Audio
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // 2. Audio Context
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      actualSampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);

      // 3. Setup AudioWorklet
      // Create a Blob from the worklet code string to load it
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      
      await ctx.audioWorklet.addModule(workletUrl);
      
      // Create the node (Must match the name 'recorder-processor' registered in workletCode)
      const workletNode = new AudioWorkletNode(ctx, 'recorder-processor');
      workletNodeRef.current = workletNode;

      // Handle data from the worklet
      chunksRef.current = [];
      workletNode.port.onmessage = (event) => {
        // Event data contains { channel1, channel2 }
        chunksRef.current.push(event.data);
      };

      // 4. Connect Graph
      source.connect(workletNode);
      workletNode.connect(ctx.destination); // Required to keep the graph alive/clocked in some browsers

      setIsRecording(true);
      setRecordingTime(0);
      setAudioData(null);

      startTimeRef.current = Date.now();
      
      elapsedTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current != null) {
          const currentTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (currentTime <= 15) {
            setRecordingTime(currentTime);
          }
        }
      }, 1000);

      // Auto-stop at 15s
      maxDurationTimerRef.current = window.setTimeout(() => {
        // Use a self-contained cleanup to avoid stale closure issues in the timeout
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (workletNodeRef.current) workletNodeRef.current.disconnect();
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        
        // Process collected chunks
        const totalSamples = chunksRef.current.reduce((acc, cur) => acc + cur.channel1.length, 0);
        if (totalSamples > 0) {
            const flat1 = new Float32Array(totalSamples);
            const flat2 = new Float32Array(totalSamples);
            let off = 0;
            for(const c of chunksRef.current) {
              flat1.set(c.channel1, off);
              flat2.set(c.channel2, off);
              off += c.channel1.length;
            }
            
            const blob = encodeFloat32Wav(flat1, flat2, actualSampleRateRef.current);
            const url = URL.createObjectURL(blob);
            const ts = new Date().toISOString().replace(/\..*Z$/, "").replace(/:/g, "-");
            const storedPatientId = sessionStorage.getItem("patientId") || "unknown";
            const fname = `${storedPatientId}-${capitalize(recordingType)}-${ts}.wav`;
            
            const data = { audioFileUrl: url, filename: fname, recordingType };
            setAudioData(data);
            sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
            sessionStorage.setItem(`recordingTime_${recordingType}`, "15");
            saveRecordingToIDB(blob, recordingType);
        }
        
        setIsRecording(false);
        setRecordingTime(40);
        chunksRef.current = []; // Clear ref
      }, 40_000);

    } catch (err) {
      console.error("Recording error:", err);
      setError("Microphone access denied or AudioWorklet error.");
      setIsRecording(false);
      cleanup();
    }
  }, [isRecording, recordingType, cleanup]);

  const triggerFile = useCallback((file: File) => {
    const audioUrl = URL.createObjectURL(file);
    const data = { audioFileUrl: audioUrl, filename: file.name, recordingType };
    setAudioData(data);
    sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
  }, [recordingType]);

  const resetTooShort = useCallback(() => setTooShort(false), []);
  const resetRecordingTime = useCallback(async () => {
    setRecordingTime(0);
    startTimeRef.current = null;
    sessionStorage.removeItem(`audioData_${recordingType}`);
    sessionStorage.removeItem(`recordingTime_${recordingType}`);
    await deleteRecordingFromIDB(recordingType).catch(console.error);
  }, [recordingType]);

  return {
    isRecording,
    recordingTime,
    audioData,
    error,
    tooShort,
    startRecording,
    stopRecording,
    cleanup,
    triggerFile,
    setError,
    resetTooShort,
    resetRecordingTime,
  } as const;
}