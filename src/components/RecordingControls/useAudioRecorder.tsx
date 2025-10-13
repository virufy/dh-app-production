import { useCallback, useEffect, useRef, useState } from "react";

type RecType = "speech" | "cough" | "breath" | "unknown";
type AudioData = { audioFileUrl: string; filename: string; recordingType: RecType } | null;

export function useAudioRecorder(sampleRate = 44100, recordingType: RecType = "unknown") {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const elapsedTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<AudioData>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState(false);

  // encode float32 -> wav (same as existing screens)
  const encodeWav = useCallback((samples: Float32Array, sr = sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (off: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([view], { type: "audio/wav" });
  }, [sampleRate]);

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
      } catch (e) {}
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (!isRecording && chunksRef.current.length === 0) return;

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
      } catch (e) {}
      processorRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }

    const flat = chunksRef.current.length
      ? new Float32Array(chunksRef.current.reduce((acc, cur) => acc + cur.length, 0))
      : null;


    if (flat) {
      let offset = 0;
      for (const chunk of chunksRef.current) {
        flat.set(chunk, offset);
        offset += chunk.length;
      }
      chunksRef.current = [];
      const wavBlob = encodeWav(flat, sampleRate);
      const wavUrl = URL.createObjectURL(wavBlob);
      const storedPatientId = sessionStorage.getItem("patientId") || "unknown";
      const timestamp = new Date().toISOString().replace(/\..*Z$/, "").replace(/:/g, "-");
      const filename = `${storedPatientId}-${capitalize(recordingType)}-${timestamp}.wav`;

      const elapsedSeconds = startTimeRef.current != null ? Math.floor((Date.now() - startTimeRef.current) / 1000) : recordingTime;
      if (elapsedSeconds < 3 || recordingTime < 3) {
        setTooShort(true);
        setAudioData(null);
      } else {
        setAudioData({ audioFileUrl: wavUrl, filename, recordingType });
      }
    }

    setIsRecording(false);
    startTimeRef.current = null;
  }, [encodeWav, isRecording, recordingTime, sampleRate]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext({ sampleRate });
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      chunksRef.current = [];
      processor.onaudioprocess = (e) => {
        try {
          const input = e.inputBuffer.getChannelData(0);
          chunksRef.current.push(new Float32Array(input));
        } catch (err) {}
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsRecording(true);
      setRecordingTime(0);
      setAudioData(null);
      startTimeRef.current = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current != null) setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      maxDurationTimerRef.current = window.setTimeout(() => stopRecording(), 30_000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone access denied.");
      setIsRecording(false);
      cleanup();
    }
  }, [isRecording, sampleRate, stopRecording, cleanup]);

  const triggerFile = useCallback((file: File, nextPage?: string) => {
  const audioUrl = URL.createObjectURL(file);
  setAudioData({ audioFileUrl: audioUrl, filename: file.name, recordingType });
  }, []);

  const resetTooShort = useCallback(() => setTooShort(false), []);
  const resetRecordingTime = useCallback(() => {
    setRecordingTime(0);
    startTimeRef.current = null;
  }, []);

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

  // Helper to capitalize type for filename
  function capitalize(type: string) {
    if (!type) return "Unknown";
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
