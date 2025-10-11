import { useRef, useState, useCallback } from "react";
import { encodeWav } from "./wavEncoder";

export interface RecordingResult {
  audioUrl: string | null;
  filename: string | null;
}

export function useMicRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingResult, setRecordingResult] = useState<RecordingResult>({
    audioUrl: null,
    filename: null,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /** Start recording audio */
  const startRecording = async (prefix: string, onError?: (err: any) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // ✅ let browser pick the native sample rate (Safari uses 48kHz)
      const ctx = new AudioContext();

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);

      chunksRef.current = [];
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      audioCtxRef.current = ctx;
      processorRef.current = processor;
      setIsRecording(true);
      setRecordingTime(0);

      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current != null) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 1000);

      // auto-stop after 30s
      setTimeout(() => stopRecording(prefix), 30000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setIsRecording(false);
      if (onError) onError(err);
    }
  };

  /** Stop recording and encode as WAV */
  const stopRecording = useCallback(
    (prefix: string) => {
      if (!isRecording) return;
      if (timerRef.current) clearInterval(timerRef.current);

      const ctx = audioCtxRef.current;
      const processor = processorRef.current;
      if (processor) processor.disconnect();
      if (ctx) ctx.close().catch(() => {});

      const flat = chunksRef.current.length
        ? new Float32Array(chunksRef.current.reduce((acc, cur) => acc + cur.length, 0))
        : null;

      if (flat) {
        let offset = 0;
        for (const chunk of chunksRef.current) {
          flat.set(chunk, offset);
          offset += chunk.length;
        }

        // ✅ dynamically match the actual recording sample rate
        const sampleRate = ctx?.sampleRate || 44100;
        const blob = encodeWav(flat, sampleRate);

        const audioUrl = URL.createObjectURL(blob);
        const patientId = sessionStorage.getItem("patientId") || "unknown";
        const filename = `${patientId}_${prefix}-${new Date()
          .toISOString()
          .replace(/\.\d+Z$/, "")
          .replace(/:/g, "-")}.wav`;

        setRecordingResult({ audioUrl, filename });
      }

      setIsRecording(false);
    },
    [isRecording]
  );

  /** Reset current recording */
  const resetRecording = () => {
    setRecordingResult({ audioUrl: null, filename: null });
    setRecordingTime(0);
  };

  return {
    isRecording,
    recordingTime,
    recordingResult,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
