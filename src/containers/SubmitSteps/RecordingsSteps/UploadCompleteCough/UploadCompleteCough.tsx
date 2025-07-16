import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  PageWrapper,
  ContentWrapper,
  Header,
  BackButton,
  HeaderTitle,
  Title,
  Subtitle,
  FileRow,
  Slider,
  TimeRow,
  PlayButton,
  RetakeButton,
  SubmitButton,
  Footer,
  ErrorLink,
  ButtonsWrapper,
  ControlsWrapper,
} from "./styles";

import ArrowLeftIcon from "../../../../assets/icons/arrowLeft.svg";
import PlayIcon from "../../../../assets/icons/play.svg";
import PauseIcon from "../../../../assets/icons/pause.svg";
import i18n from "../../../../i18n";

const UploadCompleteCough: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const { t } = useTranslation();

  const { audioFileUrl, filename = t("uploadComplete.filename"), nextPage } =
    location.state || {};

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        const fixDuration = () => {
          audio.currentTime = 1e101;
          audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            setDuration(audio.duration);
            audio.currentTime = 0;
          };
        };
        fixDuration();
      }
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

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioFileUrl]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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

  /** ✅ FIX: Navigate to next step in the flow */
  const handleSubmit = () => {
    if (!nextPage) {
      console.error("No nextPage provided in state");
      return;
    }

    const nextNextPage = getNextStep(nextPage);

    navigate(nextPage, {
      state: {
        nextPage: nextNextPage,
      },
    });
  };

  /** ✅ FIX: Define sequence logic here */
  const getNextStep = (currentPage: string) => {
    switch (currentPage) {
      case "/record-speech":
        return "/upload-complete"; // after speech recording → upload → then go to breath
      case "/record-breath":
        return "/upload-complete"; // after breath recording → upload → then confirmation
      default:
        return "/confirmation";
    }
  };

  return (
    <PageWrapper>
      <ContentWrapper>
        <audio ref={audioRef} src={audioFileUrl || ""} preload="auto" />
        <Header>
          <BackButton
            onClick={handleBack}
            aria-label={t("uploadComplete.backAria")}
            isArabic={isArabic}
          >
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
        <ControlsWrapper style={{ padding: 0 }}>
          <Subtitle style={{ marginBottom: "2rem" }}>
            {t("uploadComplete.description")}
          </Subtitle>
          <FileRow>
            <span>{filename}</span>
            <span
              style={{
                fontSize: "20px",
                cursor: "pointer",
                alignSelf: "center",
              }}
              onClick={handleBack}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleBack()
              }
              aria-label={t("uploadComplete.closeAria")}
            >
              ✕
            </span>
          </FileRow>

          <Slider
            type="range"
            min="0"
            max={duration || 1}
            value={currentTime}
            step="0.1"
            onChange={handleSeek}
            aria-label={t("uploadComplete.sliderAria")}
            style={{ marginTop: "2rem" }}
          />
          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
          </TimeRow>
        </ControlsWrapper>

        <PlayButton
          onClick={handlePlayPause}
          aria-label={
            isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")
          }
        >
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
            width="45"
            height="45"
            style={isPlaying ? {} : { marginLeft: "0.3rem" }}
          />
        </PlayButton>

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake}>
            {t("uploadComplete.retake")}
          </RetakeButton>
          <SubmitButton onClick={handleSubmit}>
            {t("uploadComplete.submit")}
          </SubmitButton>
        </ButtonsWrapper>

        <Footer>
          <ErrorLink
            href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
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
