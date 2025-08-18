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

 /* 
  // Save correct audio type based on filename
  useEffect(() => {
    if (audioFileUrl && filename) {
      if (filename.includes("cough")) {
        sessionStorage.setItem("coughAudio", audioFileUrl);
        sessionStorage.setItem("coughFilename", filename);
      } else if (filename.includes("speech")) {
        sessionStorage.setItem("speechAudio", audioFileUrl);
        sessionStorage.setItem("speechFilename", filename);
      } else if (filename.includes("breath")) {
        sessionStorage.setItem("breathAudio", audioFileUrl);s
        sessionStorage.setItem("breathFilename", filename);
      }
    }
  }, [audioFileUrl, filename]);
*/
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

/*  
  const handleSubmit = async () => {
    if (nextPage === "/confirmation") {
      setIsSubmitting(true);
      setSubmitError(null);

      const patientId = sessionStorage.getItem("patientId");
      const coughAudioUrl = sessionStorage.getItem("coughAudio");
      const coughFilename = sessionStorage.getItem("coughFilename");
      const speechAudioUrl = sessionStorage.getItem("speechAudio");
      const speechFilename = sessionStorage.getItem("speechFilename");
      const breathAudioUrl = audioFileUrl; // current audio from this screen
      const breathFilename = filename;

      if (!patientId || !coughAudioUrl || !speechAudioUrl || !breathAudioUrl) {
        setSubmitError(
          "Critical error: Missing data from a previous step. Please start over."
        );
        setIsSubmitting(false);
        return;
      }

      // Convert URL audio file to base64 string
      const processAudioFile = async (
        url: string,
        file_name: string
      ): Promise<{ fileName: string; audioData: string }> => {
        const response = await fetch(url);
        const audioBlob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () =>
            resolve({
              fileName: file_name,
              audioData: (reader.result as string).split(",")[1],
            });
          reader.onerror = (error) => reject(error);
        });
      };

      try {
        const preparedFiles = await Promise.all([
          processAudioFile(coughAudioUrl, coughFilename || "cough.wav"),
          processAudioFile(speechAudioUrl, speechFilename || "speech.wav"),
          processAudioFile(breathAudioUrl, breathFilename || "breath.wav"),
        ]);
        const API_ENDPOINT =
          "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod/cough-upload";

        for (const file of preparedFiles) {
          let audioType = "unknown";
          if (file.fileName.includes("cough")) audioType = "cough";
          else if (file.fileName.includes("speech")) audioType = "speech";
          else if (file.fileName.includes("breath")) audioType = "breath";

          const body = {
            patientId,
            audioType,
            audioBase64: file.audioData,
            filename: file.fileName,
            timestamp: new Date().toISOString(),
          };

          const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Upload failed");
          }
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

  */
const handleSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError(null);

  // 1. Get the patientId. This is needed for every upload.
  const patientId = sessionStorage.getItem("patientId");
  if (!patientId) {
    setSubmitError("Critical error: Patient ID not found. Please start over.");
    setIsSubmitting(false);
    return;
  }

  // 2. Get the current audio file's data from location.state
  const { audioFileUrl, filename, nextPage } = location.state || {};
  if (!audioFileUrl || !filename) {
    setSubmitError("Error: No audio file found for this step.");
    setIsSubmitting(false);
    return;
  }

  // Helper function to convert audio URL to a Base64 string
  const processAudioFile = async (
    url: string,
    file_name: string
  ): Promise<{ fileName: string; audioData: string }> => {
    const response = await fetch(url);
    const audioBlob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () =>
        resolve({
          fileName: file_name,
          audioData: (reader.result as string).split(",")[1],
        });
      reader.onerror = (error) => reject(error);
    });
  };

  try {
    // 3. Process ONLY the current audio file
    const preparedFile = await processAudioFile(audioFileUrl, filename);

    const API_ENDPOINT =
      "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod/cough-upload";

    // 4. Determine the audioType from the current filename
    let audioType = "unknown";
    if (preparedFile.fileName.includes("cough")) audioType = "cough";
    else if (preparedFile.fileName.includes("speech")) audioType = "speech";
    else if (preparedFile.fileName.includes("breath")) audioType = "breath";

    // 5. Prepare the request body for the single file
    const body = {
      patientId,
      audioType,
      audioBase64: preparedFile.audioData,
      filename: preparedFile.fileName,
      timestamp: new Date().toISOString(),
    };

    // 6. Send the request to the API
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed for ${filename}`);
    }

    // 7. On success, navigate to the next page.
    setIsSubmitting(false);

    // If this was the last audio file, clear patientId from storage.
    if (nextPage === "/confirmation") {
      sessionStorage.removeItem("patientId");
    }

    if (nextPage) {
      navigate(nextPage);
    } else {
      console.error("No nextPage provided in state");
    }

  } catch (error: any) {
    console.error(`Submission failed for ${filename}:`, error);
    setSubmitError(`Submission failed: ${error.message}. Please try again.`);
    setIsSubmitting(false);
  }
};

// You can also remove the getNextStep function as it is not used anymore.
/*


  const getNextStep = (currentPage: string) => {
    switch (currentPage) {
      case "/record-speech":
      case "/record-breath":
        return "/upload-complete";
      default:
        return "/confirmation";
    }
  };
*/
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

        {submitError && (
          <p style={{ color: "red", textAlign: "center" }}>{submitError}</p>
        )}

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake}>
            {t("uploadComplete.retake")}
          </RetakeButton>

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
