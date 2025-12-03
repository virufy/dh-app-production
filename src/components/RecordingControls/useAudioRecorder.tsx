// src/hooks/useAudioRecorder.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { RecorderEngine } from "../../services/RecorderEngine";
import { audioDB } from "../../services/audioDbService";
import { capitalize } from "../../utils/recorderHelpers";

type RecType = "speech" | "cough" | "breath" | "unknown";
type AudioData = { audioFileUrl: string; filename: string; recordingType: RecType } | null;

export function useAudioRecorder(recordingType: RecType = "unknown") {
  
  const engineRef = useRef<RecorderEngine | null>(null);
  

  const activeUrlRef = useRef<string | null>(null);

 
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState(false);

 
  const uiTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  
  const [audioData, setAudioData] = useState<AudioData>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(`audioData_${recordingType}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  

  const getMaxDuration = useCallback(() => {
    if (recordingType === 'breath') return 25; 
    return 15; 
  }, [recordingType]);

  const setSafeAudioUrl = useCallback((blob: Blob | null) => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    if (!blob) {
      
      return null;
    }
    const newUrl = URL.createObjectURL(blob);
    activeUrlRef.current = newUrl;
    return newUrl;
  }, []);

  const resetRecordingTime = useCallback(async () => {
    setRecordingTime(0);
    setAudioData(null);
    startTimeRef.current = null;
    
  
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }

    sessionStorage.removeItem(`audioData_${recordingType}`);
    sessionStorage.removeItem(`recordingTime_${recordingType}`);
    await audioDB.deleteRecording(recordingType);
  }, [recordingType]);

 
  useEffect(() => {
    let mounted = true;
    
    const hydrate = async () => {
      
      if (!audioData) return;

      
      if (activeUrlRef.current === audioData.audioFileUrl) return;

      
      if (audioData.recordingType === recordingType) {
        try {
          const blob = await audioDB.loadRecording(recordingType);
          
          if (blob && mounted) {
             const newUrl = setSafeAudioUrl(blob);
             
             if (newUrl) {
                setAudioData(prev => prev ? { ...prev, audioFileUrl: newUrl } : null);
             }
          }
        } catch (e) {
          console.error("Hydration failed", e);
        }
      }
    };

    hydrate();

    return () => { mounted = false; };
    
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingType, setSafeAudioUrl]); 



  const processFinishedRecording = useCallback(async (blob: Blob, forcedStop: boolean) => {
    const elapsedSeconds = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;

    if (elapsedSeconds < 3 && !forcedStop) {
      setTooShort(true);
      await resetRecordingTime(); 
    } else {
      const storedPatientId = sessionStorage.getItem("patientId") || "unknown";
      const ts = new Date().toISOString().replace(/\..*Z$/, "").replace(/:/g, "-");
      const filename = `${storedPatientId}-${capitalize(recordingType)}-${ts}.wav`;
      
      const url = setSafeAudioUrl(blob);
      if (url) {
        const data = { audioFileUrl: url, filename, recordingType };
        setAudioData(data);
        sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
        sessionStorage.setItem(`recordingTime_${recordingType}`, elapsedSeconds.toString());
        await audioDB.saveRecording(blob, recordingType);
      }
    }
    startTimeRef.current = null;
  }, [recordingType, resetRecordingTime, setSafeAudioUrl]);

  const stopRecording = useCallback(async () => {
    if (!engineRef.current) return;
    
    if (uiTimerRef.current) clearInterval(uiTimerRef.current);
    
    const blob = await engineRef.current.stop(false);
    
    setIsRecording(false);
    
    if (blob) {
      await processFinishedRecording(blob, false);
    }
  }, [processFinishedRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording || !engineRef.current) return;
    
    setError(null);
    setTooShort(false);

    setAudioData(null);
    
    const maxSeconds = getMaxDuration();
    const maxDurationMs = maxSeconds * 1000;

    try {
      engineRef.current.setOnStop((blob) => {
        setIsRecording(false);
        setRecordingTime(maxSeconds);
        if (uiTimerRef.current) clearInterval(uiTimerRef.current);
        processFinishedRecording(blob, true); 
      });

      await engineRef.current.start(maxDurationMs); 
      
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now();

      uiTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (sec <= maxSeconds) setRecordingTime(sec);
        }
      }, 1000);

    } catch (err) {
      console.error("Recording start failed", err);
      setError("Microphone access denied.");
      if (engineRef.current) engineRef.current.cleanup();
      setIsRecording(false);
    }
  }, [isRecording, processFinishedRecording, getMaxDuration]);

  const triggerFile = useCallback((file: File) => {
    const url = setSafeAudioUrl(file);
    if (url) {
      const data = { audioFileUrl: url, filename: file.name, recordingType };
      setAudioData(data);
      sessionStorage.setItem(`audioData_${recordingType}`, JSON.stringify(data));
    }
     
  }, [recordingType, setSafeAudioUrl]);

  
  useEffect(() => {
    engineRef.current = new RecorderEngine();
    return () => {
      if (engineRef.current) engineRef.current.cleanup();
      if (uiTimerRef.current) clearInterval(uiTimerRef.current);
     
      if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
    };
  }, []);

  return {
    isRecording,
    recordingTime,
    audioData,
    error,
    tooShort,
    startRecording,
    stopRecording,
    cleanup: () => engineRef.current?.cleanup(),
    triggerFile,
    resetTooShort: () => setTooShort(false),
    resetRecordingTime,
    setError
  } as const;
}