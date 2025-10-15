import { useCallback, useEffect, useRef, useState } from "react";

// Save recording to IndexedDB for persistence
async function saveRecordingToIDB(blob: Blob, recordingType: string) {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs');
        }
      };
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
  }
}

// Load recording from IndexedDB
async function loadRecordingFromIDB(recordingType: string): Promise<Blob | null> {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs');
        }
      };
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

// Delete recording from IndexedDB
async function deleteRecordingFromIDB(recordingType: string) {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('recordings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['blobs'], 'readwrite');
      const store = transaction.objectStore('blobs');
      const request = store.delete(recordingType);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to delete recording:', e);
  }
}

type RecType = "speech" | "cough" | "breath" | "unknown";
type AudioData = { audioFileUrl: string; filename: string; recordingType: RecType } | null;

// Unified target sample rate constant
const TARGET_SAMPLE_RATE = 44100;

// Simple linear resampler for Float32Array
function resampleLinear(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return input; // No-op if rates match
  const ratio = inputRate / outputRate;
  const outLength = Math.round(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const nextIndex = Math.min(srcIndex + 1, input.length - 1); // Ensure nextIndex is within bounds
    const frac = srcPos - srcIndex;
    output[i] = input[srcIndex] * (1 - frac) + input[nextIndex] * frac;
  }
  return output;
}

// Encode Float32 -> 16-bit PCM WAV for stereo (two channels)
function encodeWav(channel1: Float32Array, channel2: Float32Array, sampleRate = TARGET_SAMPLE_RATE): Blob {
  const numSamples = channel1.length;
  // WAV header (44 bytes) + data (2 channels * 2 bytes/sample * numSamples)
  const buffer = new ArrayBuffer(44 + numSamples * 4); 
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  // RIFF chunk
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 4, true); // File size - 8 bytes
  writeStr(8, "WAVE");

  // fmt chunk
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);      // Format chunk size (16 for PCM)
  view.setUint16(20, 1, true);       // Audio format (1 for PCM)
  view.setUint16(22, 2, true);       // Number of channels (2 for stereo)
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * 4, true); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 4, true);       // Block align (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true);      // Bits per sample (16)

  // data chunk
  writeStr(36, "data");
  view.setUint32(40, numSamples * 4, true); // Data chunk size (NumSamples * NumChannels * BitsPerSample/8)

  // Interleave the two channels and write as 16-bit PCM
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp and convert channel 1
    const s1 = Math.max(-1, Math.min(1, channel1[i]));
    view.setInt16(offset, s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff, true);

    // Clamp and convert channel 2
    const s2 = Math.max(-1, Math.min(1, channel2[i]));
    view.setInt16(offset + 2, s2 < 0 ? s2 * 0x8000 : s2 * 0x7fff, true);

    offset += 4; // Move 4 bytes for next stereo sample (2 bytes for channel 1, 2 for channel 2)
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// Define type for stereo chunks
type StereoChunk = {
  channel1: Float32Array;
  channel2: Float32Array;
};


export function useAudioRecorder(targetSampleRate = TARGET_SAMPLE_RATE, recordingType: RecType = "unknown") {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<StereoChunk[]>([]); // Store stereo chunks

  // This will store the actual sample rate provided by the AudioContext
  const actualSampleRateRef = useRef<number>(TARGET_SAMPLE_RATE);

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

  // Restore recording time from sessionStorage
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

  // Moved encodeWav and resampleLinear outside the hook to be pure functions,
  // making `encodeWav` independent of `useCallback`'s dependency array.
  // The hook can still use them directly.

  const cleanup = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (e) { /* ignore */ }
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) { /* ignore */ }
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) { /* ignore */ }
      mediaStreamRef.current = null;
    }
  }, []); // Dependencies: none, as it only interacts with refs

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const stopRecording = useCallback(async () => {
    if (!isRecording && chunksRef.current.length === 0) return;

    // --- Cleanup timers and audio graph resources immediately ---
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (e) { /* ignore */ }
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) { /* ignore */ }
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) { /* ignore */ }
      mediaStreamRef.current = null;
    }
    // --- End cleanup ---


    // Flatten stereo chunks
    const totalSamples = chunksRef.current.reduce((acc, cur) => acc + cur.channel1.length, 0);

    if (totalSamples > 0) {
      let flatChannel1 = new Float32Array(totalSamples);
      let flatChannel2 = new Float32Array(totalSamples);
      let offset = 0;

      for (const chunk of chunksRef.current) {
        flatChannel1.set(chunk.channel1, offset);
        flatChannel2.set(chunk.channel2, offset);
        offset += chunk.channel1.length;
      }
      chunksRef.current = []; // Clear chunks after processing

      // Resample if actual sample rate differs from target
      let finalChannel1: Float32Array = flatChannel1;
      let finalChannel2: Float32Array = flatChannel2;
      let finalSampleRate = actualSampleRateRef.current; // Use the actual recorded rate initially

      if (actualSampleRateRef.current !== targetSampleRate) {
        finalChannel1 = resampleLinear(flatChannel1, actualSampleRateRef.current, targetSampleRate);
        finalChannel2 = resampleLinear(flatChannel2, actualSampleRateRef.current, targetSampleRate);
        finalSampleRate = targetSampleRate; // The new sample rate after resampling
      }

      const wavBlob = encodeWav(finalChannel1, finalChannel2, finalSampleRate);
      const wavUrl = URL.createObjectURL(wavBlob);
      const storedPatientId = sessionStorage.getItem("patientId") || "unknown"; // Assuming "patientId" key
      const timestamp = new Date().toISOString().replace(/\..*Z$/, "").replace(/:/g, "-");
      const filename = `${storedPatientId}-${capitalize(recordingType)}-${timestamp}.wav`;

      const elapsedSeconds = startTimeRef.current != null ? Math.floor((Date.now() - startTimeRef.current) / 1000) : recordingTime;
      if (elapsedSeconds < 3 || recordingTime < 3) { // Check both for robustness
        setTooShort(true);
        setAudioData(null);
        sessionStorage.removeItem(`audioData_${recordingType}`);
        sessionStorage.removeItem(`recordingTime_${recordingType}`);
        await deleteRecordingFromIDB(recordingType);
        setRecordingTime(0); // Only reset timer if recording is too short
      } else {
        const data = { audioFileUrl: wavUrl, filename, recordingType };
        setAudioData(data);
        sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
        sessionStorage.setItem(`recordingTime_${recordingType}`, recordingTime.toString());
        await saveRecordingToIDB(wavBlob, recordingType);
      }
    } else {
      // If no chunks were collected (e.g., recording stopped immediately)
  setAudioData(null);
  sessionStorage.removeItem(`audioData_${recordingType}`);
  setRecordingTime(0); // Only reset timer if no audio was recorded
    }

    setIsRecording(false);
    startTimeRef.current = null;
  }, [isRecording, recordingType, targetSampleRate, recordingTime]); // Add recordingTime to dependencies

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      setError(null);
      setTooShort(false); // Reset tooShort status

      // IMPORTANT: Disable all audio processing for raw data collection
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2, // Request stereo channels
          sampleRate: targetSampleRate // Request target sample rate
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC({ sampleRate: targetSampleRate });
      audioCtxRef.current = ctx;

      // Capture the actual sample rate provided by the browser/system
      // iOS, in particular, might ignore the requested sampleRate in constraints
      actualSampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      // ScriptProcessorNode needs 2 input channels, 2 output channels for stereo
      const processor = ctx.createScriptProcessor(4096, 2, 2); 
      processorRef.current = processor;

      chunksRef.current = []; // Reset chunks for new recording
      processor.onaudioprocess = (e) => {
        try {
          const channel1 = e.inputBuffer.getChannelData(0);
          const channel2 = e.inputBuffer.getChannelData(1);
          
          // Copy to avoid reusing internal buffers, essential for chunks
          chunksRef.current.push({
            channel1: new Float32Array(channel1),
            channel2: new Float32Array(channel2)
          });
        } catch (err) {
          console.warn("Error in onaudioprocess:", err);
        }
      };

      source.connect(processor);
      // Connect processor to destination to ensure onaudioprocess fires (critical for iOS)
      processor.connect(ctx.destination); 

      setIsRecording(true);
      setRecordingTime(0);
      setAudioData(null); // Clear any previous audio data

      startTimeRef.current = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current != null) setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      maxDurationTimerRef.current = window.setTimeout(() => stopRecording(), 30_000); // Auto-stop after 30 seconds
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone access denied.");
      setIsRecording(false);
      cleanup(); // Ensure resources are cleaned up on error
    }
  }, [isRecording, targetSampleRate, stopRecording, cleanup]);

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

  // Helper to capitalize type for filename
  function capitalize(type: string) {
    if (!type) return "Unknown";
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

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