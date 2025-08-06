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

const UploadCompleteCough: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { audioFileUrl, filename = t("uploadComplete.filename"), nextPage } =
    location.state || {};

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  //saves the correct audio type based on the filename
  useEffect(() => {
  if (audioFileUrl && filename) {
    if (filename.includes('cough')) {
        sessionStorage.setItem("coughAudio", audioFileUrl);
        sessionStorage.setItem("coughFilename", filename);
    } else if (filename.includes('speech')) {
        sessionStorage.setItem("speechAudio", audioFileUrl);
        sessionStorage.setItem("speechFilename", filename);
    } else if (filename.includes('breath')) {
        sessionStorage.setItem("breathAudio", audioFileUrl);
        sessionStorage.setItem("breathFilename", filename);
    }
  }
}, [audioFileUrl, filename]);


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

  const handleSubmit = async () => {
    
    if (nextPage === "/confirmation") {
      
      
      setIsSubmitting(true);
      setSubmitError(null);
  
      //collecting data from seession storage
      const patientId = sessionStorage.getItem("patientId");
      const coughAudioUrl = sessionStorage.getItem("coughAudio");
      const coughFilename = sessionStorage.getItem("coughFilename");
      const speechAudioUrl = sessionStorage.getItem("speechAudio");
      const speechFilename = sessionStorage.getItem("speechFilename");
      const breathAudioUrl = audioFileUrl; // The current screen's audio
      const breathFilename = filename;
  
      //confirming all required data present
      if (!patientId || !coughAudioUrl || !speechAudioUrl || !breathAudioUrl) {
        setSubmitError("Critical error: Missing data from a previous step. Please start over.");
        setIsSubmitting(false);
        return;
      }
  
      //converting url to base64
      const processAudioFile = async (url: string, file_name: string) => {
        const response = await fetch(url);
        const audioBlob = await response.blob();
        return new Promise<{ fileName: string; audioData: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => resolve({
            fileName: file_name,
            audioData: (reader.result as string).split(',')[1],
          });
          reader.onerror = (error) => reject(error);
        });
      };
  
      try {
        const preparedFiles = await Promise.all([
          processAudioFile(coughAudioUrl, coughFilename || 'cough.wav'),
          processAudioFile(speechAudioUrl, speechFilename || 'speech.wav'),
          processAudioFile(breathAudioUrl, breathFilename || 'breath.wav'),
        ]);
  
        
        const requestBody = {
          patientId: patientId,
          audioFiles: preparedFiles,
        };
  
        const API_ENDPOINT = "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod/cough-upload"; // <-- PASTE YOUR URL HERE
  
        const apiResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
  
        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.message || 'Server responded with an error.');
        }
  
        setIsSubmitting(false);
        sessionStorage.clear();
        navigate(nextPage); 
  
      } catch (error: any) {
        console.error("Submission failed:", error);
        setSubmitError(`Submission failed: ${error.message}. Please try again.`);
        setIsSubmitting(false);
      }
  
    } else {
      if (!nextPage) {
        console.error("No nextPage provided in state");
        return;
      }
      navigate(nextPage);
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
          />

          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
          </TimeRow>
        </ControlsWrapper>

        <PlayButton onClick={handlePlayPause}>
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
            width="45"
            height="45"
            style={isPlaying ? {} : { marginLeft: "0.3rem" }}
          />
        </PlayButton>
        
        {submitError && <p style={{ color: 'red', textAlign: 'center' }}>{submitError}</p>}

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake}>{t("uploadComplete.retake")}</RetakeButton>
          
          <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : t("uploadComplete.submit")}
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