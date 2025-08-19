import React, { useRef, useState, useEffect, useCallback } from "react";
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

const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod";

interface LocationState {
  audioFileUrl?: string;
  filename?: string;
  nextPage?: string;
  patientId?: string;
  recordingType?: "cough" | "speech" | "breath";
}

const UploadCompleteCough: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { audioFileUrl, filename, nextPage, recordingType: initialRecordingType = "unknown", } =
    (location.state as LocationState) || {};

  let finalRecordingType = initialRecordingType;
  if (finalRecordingType === "unknown" && filename) {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes("cough")) {
      finalRecordingType = "cough";
    } else if (lowerFilename.includes("speech")) {
      finalRecordingType = "speech";
    } else if (lowerFilename.includes("breath")) {
      finalRecordingType = "breath";
    }
  }

  const storedPatientId =
    (location.state as LocationState)?.patientId ||
    sessionStorage.getItem("patientId");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // New: detailed backend feedback + verification status
  const [uploadSteps, setUploadSteps] = useState<any>(null);
  const [verifyStatus, setVerifyStatus] = useState<string>("");
  const [friendly, setFriendly] = useState<string>("");

  useEffect(() => {
    try {
      if (audioFileUrl) {
        sessionStorage.setItem("coughAudio", audioFileUrl);
        sessionStorage.setItem(
          "coughFilename",
          filename || t("uploadComplete.filename")
        );
      } else {
        sessionStorage.removeItem("coughAudio");
        sessionStorage.removeItem("coughFilename");
      }
    } catch (err) {
      console.error("🐛 Session storage error:", err);
    }
  }, [audioFileUrl, filename, t]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration - audio.currentTime <= 0.05) {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioFileUrl]);

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  };

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("🐛 Play failed:", err);
        setErrorMessage(t("uploadComplete.playError"));
      }
    }
  }, [isPlaying, t]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const handleRetake = handleBack;

  // Status check helper
  const checkStatus = useCallback(async (key: string) => {
    try {
      const url = new URL(`${API_BASE}/status/check-upload-status`);
      url.searchParams.set("key", key); // encodes '#'
      const res = await fetch(url.toString());
      const status = await res.json();

      if (status.existsS3 && status.existsDDB) {
        setVerifyStatus("Verified in S3 & DB ✅");
      } else if (status.existsS3 && !status.existsDDB) {
        setVerifyStatus("In S3, DB syncing…");
      } else {
        setVerifyStatus("Upload not found yet");
      }
      if (status.friendly) setFriendly(status.friendly);
    } catch (e) {
      setVerifyStatus("Status check failed");
      console.error("🐛 Status error:", e);
    }
  }, []);

  const handleSubmit = async () => {
    if (!nextPage) {
      setErrorMessage(t("uploadComplete.noNextPage"));
      return;
    }

    const timestamp = new Date().toISOString();
    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setVerifyStatus("");
    setUploadSteps(null);
    setFriendly("");

    const controller = new AbortController();
    const generatedFilename = `${storedPatientId}/${finalRecordingType}-${timestamp}.flac`;
    const signal = controller.signal;
    try {
      const audioUrl = sessionStorage.getItem("coughAudio");
      if (!audioUrl) throw new Error(t("uploadComplete.noAudio"));

      const response = await fetch(audioUrl, { signal });
      if (!response.ok) throw new Error(t("uploadComplete.audioFetchError"));

      const blob = await response.blob();

      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) resolve((reader.result as string).split(",")[1]);
          else reject(new Error(t("uploadComplete.encodingError")));
        };
        reader.onerror = () => reject(new Error(t("uploadComplete.readError")));
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await fetch(`${API_BASE}/cough-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: storedPatientId,
          filename: generatedFilename,
          timestamp,
          audioType: finalRecordingType,
          audioBase64: base64Audio,
        }),
        signal,
      });

      const data = await uploadResponse.json().catch(() => ({} as any));

      // Detailed backend steps + friendly text
      if (data.steps) setUploadSteps(data.steps);
      if (data.friendly) setFriendly(data.friendly);

      // Accept all 2xx (207 = partial success)
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        throw new Error(
          `${t("uploadComplete.uploadError")} (${uploadResponse.status})`
        );
      }

      setSuccessMessage(t("uploadComplete.success"));

      if (data.key) {
        // optional verification call
        await checkStatus(data.key);
      }

      sessionStorage.removeItem("coughAudio");
      sessionStorage.removeItem("coughFilename");

      const timer = setTimeout(() => {
        const nextNextPage = getNextStep(nextPage);
        navigate(nextPage, { state: { nextPage: nextNextPage } });
      }, 1500);
      return () => clearTimeout(timer);
    } catch (error) {
      let message = "";
      if (error instanceof Error) {
        message =
          error.message === "Failed to fetch"
            ? t("uploadComplete.networkError") ||
              "Network error: Unable to reach the server."
            : error.message;
      } else {
        message = t("uploadComplete.uploadError");
      }
      console.error("🐛 Upload error:", message);
      setErrorMessage(message);
    } finally {
      setUploading(false);
    }
  };

  const getNextStep = (currentPage: string) => {
    switch (currentPage) {
      case "/record-speech":
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

          <FileRow>
            <span>{filename || t("uploadComplete.filename")}</span>
            <button
              onClick={handleBack}
              style={{
                fontSize: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                alignSelf: "center",
              }}
              aria-label={t("uploadComplete.closeAria")}
            >
              ✕
            </button>
          </FileRow>

          <Slider
            type="range"
            min="0"
            max={duration || 1}
            value={Number(currentTime.toFixed(1))}
            step="0.1"
            onChange={handleSeek}
            aria-label={t("uploadComplete.sliderAria")}
          />

          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
          </TimeRow>
        </ControlsWrapper>

        <PlayButton onClick={handlePlayPause} disabled={uploading}>
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
            width="45"
            height="45"
            style={isPlaying ? {} : { marginLeft: "0.3rem" }}
          />
        </PlayButton>

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake} disabled={uploading}>
            {t("uploadComplete.retake")}
          </RetakeButton>
          <SubmitButton onClick={handleSubmit} disabled={uploading}>
            {uploading
              ? t("uploadComplete.uploading")
              : t("uploadComplete.submit")}
          </SubmitButton>
        </ButtonsWrapper>

        {/* Error & success */}
        {errorMessage && (
          <ErrorLink role="alert" aria-live="assertive">
            {errorMessage}
          </ErrorLink>
        )}
        {successMessage && (
          <Footer role="alert" aria-live="polite">
            {successMessage}
          </Footer>
        )}

        {/* Friendly, human-readable message */}
        {friendly && (
          <Footer role="status" aria-live="polite" style={{ marginTop: 8 }}>
            {friendly}
          </Footer>
        )}

        {/* Step-by-step details */}
        {uploadSteps && (
          <Footer role="status" aria-live="polite" style={{ marginTop: 12 }}>
            <div><strong>Upload steps</strong></div>
            <div>Parsed request: {String(uploadSteps.requestParsed)}</div>
            <div>Base64 decoded: {String(uploadSteps.base64Decoded)}</div>
            <div>
              S3 put: {uploadSteps.s3Put?.ok
                ? `OK (key: ${uploadSteps.s3Put?.key ?? "n/a"})`
                : `❌ ${uploadSteps.s3Put?.error || ""}`}
            </div>
            <div>
              DDB put: {uploadSteps.ddbPut?.ok
                ? "OK"
                : `❌ ${uploadSteps.ddbPut?.error || ""}`}
            </div>
          </Footer>
        )}

        {/* Verification status */}
        {verifyStatus && (
          <Footer role="status" aria-live="polite" style={{ marginTop: 8 }}>
            {verifyStatus}
          </Footer>
        )}
      </ContentWrapper>
    </PageWrapper>
  );
};

export default UploadCompleteCough;
