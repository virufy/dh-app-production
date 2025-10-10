// CoughRecordScreen.tsx (refactored & skip button repositioning — RTL fix)
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthDistance from "../../../../assets/images/mouthDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import i18n from "../../../../i18n";
import AppHeader from "../../../../components/AppHeader";

import {
  Container,
  Content,
  Header,
  BackButton,
  HeaderText,
  StepCircle,
  StepWrapper,
  InstructionText,
  Image,
  Timer,
  TimerBox,
  ButtonRow,
  CircleButton,
  ButtonLabel,
  CheckboxRow,
  Label,
  Checkbox,
  ActionButtons,
  UploadButton,
  UploadText,
  HiddenFileInput,
  FooterLink,
  ModalOverlay,
  ModalContainer,
  ModalTitle,
  ModalText,
  ModalButton
} from "./styles";

/* ----------------- Minimum Duration Modal ----------------- */
const MinimumDurationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalOverlay>
    <ModalContainer>
      <ModalTitle>{tStatic("recordCough.minimum_duration_title")}</ModalTitle>
      <ModalText>{tStatic("recordCough.minimum_duration_text")}</ModalText>
      <ModalButton onClick={onClose}>{tStatic("recordCough.minimum_duration_retry")}</ModalButton>
    </ModalContainer>
  </ModalOverlay>
);

/* ----------------- helper: t without importing i18next directly ----------------- */
function tStatic(key: string) {
  // use i18n directly for static contexts outside components
  return i18n.t ? (i18n.t(key) as string) : key;
}

/* ----------------- Encode Float32 → PCM WAV ----------------- */
function encodeWav(samples: Float32Array, sampleRate = 44100): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  // WAV header
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

const CoughRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio context + buffers
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const [showTooShortModal, setShowTooShortModal] = useState(false);
  const [involuntary, setInvoluntary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<{ audioFileUrl: string; filename: string } | null>(null);

  const elapsedTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // patientId in sessionStorage is now CNM_PatientID (e.g., BHC_12345 or NAH_12345)
  const storedPatientId = sessionStorage.getItem("patientId") || "unknown";

  // Refs for header and skip button for dynamic placement
  const headerRef = useRef<HTMLDivElement | null>(null);
  const skipBtnRef = useRef<HTMLButtonElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecordingResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupRecordingResources = useCallback(() => {
    // clear timers
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    // stop processor
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      processorRef.current = null;
    }

    // stop audio context
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      audioCtxRef.current = null;
    }

    // stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    // leave chunks in memory until processed
  }, []);

  const handleBack = () => navigate(-1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString();
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  /* ----------------- Start Recording (lossless) ----------------- */
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 44100 });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode is deprecated but still widely supported. If desired, replace with AudioWorklet in future.
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      chunksRef.current = [];

      processor.onaudioprocess = (e) => {
        try {
          const input = e.inputBuffer.getChannelData(0);
          // copy the buffer so it survives post-processing
          chunksRef.current.push(new Float32Array(input));
        } catch (err) {
          // ignore audio process errors
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsRecording(true);
      setRecordingTime(0);
      setAudioData(null);

      // timer
      startTimeRef.current = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current != null) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 1000);

      // auto stop at max duration
      maxDurationTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, 30_000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError(t("recordCough.microphoneAccessError") || "Microphone access denied.");
      setIsRecording(false);
      cleanupRecordingResources();
    }
  }, [isRecording, t, cleanupRecordingResources]);

  /* ----------------- Stop Recording ----------------- */
  const stopRecording = useCallback(() => {
    if (!isRecording && chunksRef.current.length === 0) return;

    // stop timers & resources
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    // disconnect processor safely
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      processorRef.current = null;
    }

    // close audio context
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      audioCtxRef.current = null;
    }

    // stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
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

      // clear raw chunks to release memory
      chunksRef.current = [];

      const wavBlob = encodeWav(flat, 44100);
      const wavUrl = URL.createObjectURL(wavBlob);
      const filename = `${storedPatientId}_cough-${new Date().toISOString().replace(/\.\d+Z$/, "").replace(/:/g, "-")}.wav`;

      if ((startTimeRef.current && Math.floor((Date.now() - startTimeRef.current) / 1000) < 3) || recordingTime < 3) {
        setShowTooShortModal(true);
        setAudioData(null);
      } else {
        setAudioData({ audioFileUrl: wavUrl, filename });
      }
    }

    setIsRecording(false);
    startTimeRef.current = null;
  }, [isRecording, recordingTime, storedPatientId]);

  /* ----------------- Continue / Upload ----------------- */
  const handleContinue = () => {
    if (audioData) {
      setError(null);
      try {
        navigate("/upload-complete", {
          state: { ...audioData, nextPage: "/record-speech" },
        });
      } catch (e) {
        setError(t("recordCough.error") || "Navigation failed.");
      }
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(t("recordCough.error") || "Please record or upload an audio file first.");
      return;
    }
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, nextPage: "/record-speech" },
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, nextPage: "/record-speech" },
    });
  };

  /* ----------------- Place Skip Button dynamically (RTL-aware) ----------------- */
  useEffect(() => {
    const placeSkipButton = () => {
      const headerEl = headerRef.current;
      const skipEl = skipBtnRef.current;
      if (!skipEl) return;

      // default fallback header heights (in px)
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const defaultHeaderHeight = isMobile ? 56 : 64;
      const gap = isMobile ? 6 : 12;

      let headerBottom = defaultHeaderHeight;

      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        // rect.bottom is relative to viewport; if header is visible, use it
        if (rect && typeof rect.bottom === "number" && rect.bottom > 0) {
          headerBottom = rect.bottom;
        } else {
          // fallback: use offsetHeight if header is positioned normally
          headerBottom = headerEl.offsetHeight || defaultHeaderHeight;
        }
      } else {
        // as a last resort check if there's a global header element
        const globalHeader = document.querySelector("header");
        if (globalHeader) {
          const rect = globalHeader.getBoundingClientRect();
          if (rect && typeof rect.bottom === "number" && rect.bottom > 0) {
            headerBottom = rect.bottom;
          }
        }
      }

      const top = Math.max(8, Math.round(headerBottom + gap));
      skipEl.style.position = "fixed";
      skipEl.style.top = `${top}px`;
      skipEl.style.zIndex = "2000";

      // RTL-aware horizontal placement: left for Arabic, right otherwise.
      if (isArabic) {
        // set left and remove right to avoid CSS conflicts
        skipEl.style.left = "20px";
        skipEl.style.removeProperty("right");
      } else {
        // set right and remove left
        skipEl.style.right = "20px";
        skipEl.style.removeProperty("left");
      }

      // Optional subtle visual tweak for RTL: align text direction inside the button
      skipEl.style.direction = isArabic ? "rtl" : "ltr";
    };

    // place initially, and on resize/orientation; also re-run if language (isArabic) changes
    placeSkipButton();
    window.addEventListener("resize", placeSkipButton);
    window.addEventListener("orientationchange", placeSkipButton);

    return () => {
      window.removeEventListener("resize", placeSkipButton);
      window.removeEventListener("orientationchange", placeSkipButton);
    };
  }, [isArabic]); // re-run when isArabic changes

  return (
    <>
      <AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />

      <Container>
        <Content>
          {/* attach headerRef to the local Header wrapper so we can calculate position */}
          <Header ref={headerRef}>
            <BackButton onClick={handleBack} aria-label={t("recordCough.goBackAria")} isArabic={isArabic}>
              <img src={BackIcon} alt={t("recordCough.goBackAlt")} width={24} height={24} style={{ transform: isArabic ? "rotate(180deg)" : "none" }} />
            </BackButton>
            <HeaderText>{t("recordCough.title")}</HeaderText>
          </Header>

          <h3 style={{ fontFamily: "Source Open Sans, sans-serif", fontSize: "24px", textAlign: "center", fontWeight: 600, marginBottom: "1.5rem", color: "#000000", marginTop: "1.5rem" }}>
            {t("recordCough.instructionsTitle")}
          </h3>

          <StepWrapper>
            <StepCircle>{isArabic ? "١" : "1"}</StepCircle>
            <InstructionText>
              {t("recordCough.instruction1_part1")} <strong>{t("recordCough.instruction1_bold1")}</strong>
              {t("recordCough.instruction1_part2")} <strong>{t("recordCough.instruction1_bold2")}</strong>
              {t("recordCough.instruction1_part3")}
            </InstructionText>
          </StepWrapper>
          <Image src={keepDistance} alt={t("recordCough.keepDistanceAlt")} />

          <StepWrapper>
            <StepCircle>{isArabic ? "٢" : "2"}</StepCircle>
            <InstructionText>
              {t("recordCough.instruction2_part1")}
              <strong>{t("recordCough.instruction2_bold")}</strong>
              {t("recordCough.instruction2_part2")}
            </InstructionText>
          </StepWrapper>
          <Image src={mouthDistance} alt={t("recordCough.mouthDistanceAlt")} />

          <StepWrapper>
            <StepCircle>{isArabic ? "٣" : "3"}</StepCircle>
            <InstructionText>
              {t("recordCough.instruction3_part1")} <strong>{t("recordCough.instruction3_bold1")}</strong>
              {t("recordCough.instruction3_part2")}
              <strong>{t("recordCough.instruction3_bold2")}</strong>
              {t("recordCough.instruction3_part3")}
            </InstructionText>
          </StepWrapper>

          <Timer>
            <TimerBox>{formatTime(recordingTime)}</TimerBox>
          </Timer>

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordCough.recordButton")}
                onClick={startRecording}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, cursor: isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt={t("recordCough.recordButton")} width={28} height={28} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.recordButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#DDE9FF"}
                aria-label={t("recordCough.stopButton")}
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, cursor: !isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt={t("recordCough.stopButton")} width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.stopButton")}</ButtonLabel>
            </div>
          </ButtonRow>

          <CheckboxRow>
            <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
            <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
          </CheckboxRow>

          {error && (<p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>)}

          {/* Skip button moved to fixed, computed top (below local Header) */}
          <button
            ref={skipBtnRef}
            type="button"
            onClick={() => navigate("/record-speech", { state: { skipped: true } })}
            aria-label={t("recordCough.skipButton")}
            style={{
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
              pointerEvents: "auto",
              // horizontal & top positioning are handled dynamically in useEffect
            }}
          >
            {t("recordCough.skipButton")}
          </button>

          <ActionButtons>
            <button onClick={handleContinue}>{t("recordCough.continueButton")}</button>
            <UploadButton onClick={triggerFileInput} aria-label={t("recordCough.uploadFile")}>
              <img src={UploadIcon} alt={t("recordCough.uploadFile")} width={22} height={22} style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }} />
              <UploadText>{t("recordCough.uploadFile")}</UploadText>
            </UploadButton>
            <HiddenFileInput type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} />
          </ActionButtons>

          {showTooShortModal && (
            <MinimumDurationModal
              onClose={() => {
                setShowTooShortModal(false);
                setRecordingTime(0);
              }}
            />
          )}

          <FooterLink
            href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("recordCough.reportIssue")}
          </FooterLink>
        </Content>
      </Container>
    </>
  );
};

export default CoughRecordScreen;
