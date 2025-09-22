// UploadCompleteCough.tsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  PageWrapper,
  ContentWrapper,
  ControlsWrapper,
  Header,
  BackButton,
  HeaderTitle,
  Title,
  Subtitle,
  FileRow,
  Slider,
  TimeRow,
  PlayButton,
  ButtonsWrapper,
  RetakeButton,
  SubmitButton,
  Footer,
  ErrorLink,
} from "./styles";

import ArrowLeftIcon from "../../../../assets/icons/arrowLeft.svg";
import PlayIcon from "../../../../assets/icons/play.svg";
import PauseIcon from "../../../../assets/icons/pause.svg";
import i18n from "../../../../i18n";
import { generateSignature } from "../../../../utils/signature";

/* ==== lossless upload config (added) ==== */
const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod";
const NAV_DELAY_MS = 2000; // brief pause so user can read success

type RecType = "cough" | "speech" | "breath" | "unknown";

/* Convert a blob: URL to base64 (no data: prefix) */
async function blobUrlToBase64(url: string): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64: btoa(binary), contentType };
}

const UploadCompleteCough: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const { t } = useTranslation();

  const { audioFileUrl, filename = t("uploadComplete.filename"), nextPage, patientId, recordingType, skipped } =
    (location.state as {
      audioFileUrl?: string;
      filename?: string;
      nextPage?: string;
      patientId?: string;
      recordingType?: RecType;
      skipped?: boolean;
    }) || {};

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  /* ==== lossless upload flags (added, non-breaking) ==== */
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ==== derive patientId and recordingType like your backend version ==== */
  // patientId in sessionStorage is now CNM_PatientID (e.g., BHC_12345 or NAH_12345)
  const storedPatientId = patientId || sessionStorage.getItem("patientId") || "";

  // infer type from route/prop/filename
  const path = location.pathname?.toLowerCase() || "";
  const routeType: RecType =
    path.includes("speech") ? "speech" :
    path.includes("breath") ? "breath" :
    path.includes("cough") ? "cough" : "unknown";

  let finalRecordingType: RecType =
    recordingType && recordingType !== "unknown" ? recordingType :
    routeType !== "unknown" ? routeType :
    ((): RecType => {
      const lower = String(filename || "").toLowerCase();
      if (lower.includes("speech")) return "speech";
      if (lower.includes("breath")) return "breath";
      if (lower.includes("cough")) return "cough";
      return "unknown";
    })();

  if (finalRecordingType === "unknown") finalRecordingType = "cough";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        // force duration calculation for some blob URLs
        const fix = () => {
          audio.currentTime = 1e101;
          audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            setDuration(audio.duration || 0);
            audio.currentTime = 0;
          };
        };
        fix();
      }
      setCurrentTime(audio.currentTime || 0);
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handleError = () => {
      setErrMsg(audio.error?.message || "Cannot play audio.");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioFileUrl]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioFileUrl) {
      setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
      return;
    }
    try {
      if (audio.paused) {
        if (audio.readyState < 2) audio.load();
        await audio.play(); // await to catch iOS rejections
      } else {
        audio.pause(); // isPlaying will update via 'pause' event
      }
    } catch (e) {
      console.error("Error playing audio:", e);
      setErrMsg("Playback failed. Try again or re-record.");
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleBack = () => navigate(-1);
  const handleRetake = () => navigate(-1);

  /* ==== lossless upload in handleSubmit (added) ==== */
  const handleSubmit = async () => {
    if (!nextPage) {
      console.error("No nextPage provided in state");
      return;
    }
    if (!audioFileUrl ) {
      setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
      return;
    }
    if (!storedPatientId) {
      setErrMsg("Patient ID missing from earlier step. Please go back and enter the ID.");
      return;
    }

    setUploadErr(null);
    setSuccessMsg(null);
    setIsUploading(true);

    try {
      // Convert current blob URL (lossless WAV from recorder) to base64
      const { base64 } = await blobUrlToBase64(audioFileUrl);

      const timestamp = new Date().toISOString();
      const generatedFilename = `${storedPatientId}/${finalRecordingType}-${timestamp}.flac`; 
      

      // Send to your backend (same shape as your backend code)

      const signature = await generateSignature();
      console.log("Signature before fetch:", signature, typeof signature);

      const res = await fetch(`${API_BASE}/cough-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-unique-signature": signature },
        body: JSON.stringify({
          patientId: storedPatientId,
          filename: generatedFilename,
          timestamp,
          audioType: finalRecordingType,
          audioBase64: base64, // base64 WAV payload; backend can transcode to FLAC
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          (t("uploadComplete.uploadError") || "Upload failed.") +
            (txt ? ` – ${txt}` : ` (${res.status})`)
        );
      }

      setSuccessMsg("Successfully uploaded.");

      // Small pause so the user sees success, then proceed like your original
      setTimeout(() => {
        const nextNextPage = getNextStep(nextPage);
        navigate(nextPage, { state: { nextPage: nextNextPage } });
      }, NAV_DELAY_MS);
    } catch (e: any) {
      console.error("Upload error:", e);
      setUploadErr(
        e?.message === "Failed to fetch"
          ? t("uploadComplete.networkError") || "Network error: Unable to reach the server."
          : e?.message || t("uploadComplete.uploadError") || "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getNextStep = (currentPage: string) => {
    switch (currentPage) {
      case "/record-speech":
        return "/upload-complete";
      case "/record-breath":
        return "/upload-complete";
      default:
        return "/confirmation";
    }
  };

  return (
    <PageWrapper>
      <ContentWrapper>
        <audio ref={audioRef} src={audioFileUrl || ""} preload="auto" />

        <ControlsWrapper>
          <Header>
            <BackButton onClick={handleBack} isArabic={isArabic}>
              <img
                src={ArrowLeftIcon}
                alt={t("uploadComplete.backAlt")}
                width={24}
                height={24}
                style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
              />
            </BackButton>
            <HeaderTitle>{t("uploadComplete.title")}</HeaderTitle>
          </Header>

          <Title>{t("uploadComplete.subtitle")}</Title>
          <Subtitle>{t("uploadComplete.description")}</Subtitle>

          {!audioFileUrl && !skipped && (
            <Subtitle style={{ color: "#b00", fontWeight: 600 }}>
              {t("uploadComplete.noAudio")}
            </Subtitle>
          )}

          <FileRow>
            <span>{filename}</span>
            <span
              style={{ fontSize: "20px", cursor: "pointer", alignSelf: "center" }}
              onClick={handleBack}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleBack()}
              aria-label={t("uploadComplete.closeAria")}
            >
              ✕
            </span>
          </FileRow>

          <Slider
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            step="0.1"
            onChange={handleSeek}
            aria-label={t("uploadComplete.sliderAria")}
            disabled={!audioFileUrl || duration === 0}
          />

          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
          </TimeRow>

          {errMsg && (
            <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
              {errMsg}
            </div>
          )}

          {/* upload status (added, non-breaking) */}
          {isUploading && (
            <div style={{ color: "#555", marginTop: 8 }}>
              {t("uploadComplete.uploading", "Uploading...")}
            </div>
          )}
          {uploadErr && (
            <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
              {uploadErr}
            </div>
          )}
          {successMsg && (
            <div style={{ color: "#0a0", marginTop: 8, fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
        </ControlsWrapper>

        <PlayButton onClick={handlePlayPause} disabled={!audioFileUrl || duration === 0 || isUploading}>
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
            width="45"
            height="45"
            style={isPlaying ? {} : { marginLeft: "0.3rem" }}
          />
        </PlayButton>

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake} disabled={isUploading}>
            {t("uploadComplete.retake")}
          </RetakeButton>
          <SubmitButton onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? t("uploadComplete.submitting", "Submitting...") : t("uploadComplete.submit")}
          </SubmitButton>
        </ButtonsWrapper>

        <Footer>
          <ErrorLink
            href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("uploadComplete.report")}
          </ErrorLink>
        </Footer>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default UploadCompleteCough;
