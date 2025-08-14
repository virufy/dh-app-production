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

  const { audioFileUrl, filename, nextPage, recordingType = "unknown" } =
    (location.state as LocationState) || {};

  const storedPatientId =
    (location.state as LocationState)?.patientId ||
    localStorage.getItem("patientId") ||
    "unknown";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Persist audio in sessionStorage
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

  // Audio event listeners
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

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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

  const handleSubmit = async () => {
    if (!nextPage) {
      setErrorMessage(t("uploadComplete.noNextPage"));
      return;
    }

    const timestamp = new Date().toISOString();
    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const controller = new AbortController();
    const generatedFilename = `${storedPatientId}/cough-${timestamp}.flac`;
    const { signal } = controller;

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

      const uploadResponse = await fetch("https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod/cough-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: storedPatientId,
          filename: generatedFilename,
          timestamp,
          audioType: recordingType,
          audioBase64: base64Audio,
        }),
        signal,
      });

      if (!uploadResponse.ok)
        throw new Error(
          `${t("uploadComplete.uploadError")} (${uploadResponse.status})`
        );

      sessionStorage.removeItem("coughAudio");
      sessionStorage.removeItem("coughFilename");

      setSuccessMessage(t("uploadComplete.success"));

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
      </ContentWrapper>
    </PageWrapper>
  );
};

export default UploadCompleteCough;
