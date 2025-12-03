import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthBreathDistance from "../../../../assets/images/mouthBreathDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import i18n from "../../../../i18n";
import PlayIcon from "../../../../assets/icons/play.svg";
import PauseIcon from "../../../../assets/icons/pause.svg";
import AppHeader from "../../../../components/AppHeader";
import SkipButton from "../../../../components/RecordingControls/SkipButton";
import { useAudioRecorder } from "../../../../components/RecordingControls/useAudioRecorder";
import MinimumDurationModal from "../../../../components/RecordingControls/MinimumDurationModal";
import InstructionStep from "../../../../components/RecordingControls/InstructionStep";
import SharedBackButton from "../../../../components/RecordingControls/BackButton";
import TimerDisplay from "../../../../components/RecordingControls/TimerDisplay";
import formatTime from "../../../../utils/formatTime";
import { Slider, TimeRow, FileRow } from "../UploadCompleteCough/styles";
import { addUploadTask } from "../../../../services/backgroundUploadService";
import { getDeviceName, generateUserAgent } from "../../../../utils/deviceUtils";
import { logger } from "../../../../services/loggingService";

import {
  ActionButtons,
  BackButton,
  ButtonLabel,
  ButtonRow,
  CircleButton,
  Container,
  Content,
  FooterLink,
  Header,
  HeaderText,
  Image,
} from "./styles";

/* ----------------- Minimum Duration Modal ----------------- */

const BreathRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isRecording, recordingTime, audioData, error, tooShort, startRecording, stopRecording, setError, resetTooShort} =
    useAudioRecorder("breath");
  const headerRef = useRef<HTMLDivElement | null>(null);
// Scroll to top when the page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    return () => {
      // hook handles cleanup
    };
  }, []);


  /* ----------------- Submit (background upload) ----------------- */
  const handleSubmit = async () => {
    if (!audioData) {
      setError(t("recordBreath.error") || "Please record first.");
      return;
    }
    const patientId = sessionStorage.getItem("patientId") || "";
    const timestamp = new Date().toISOString();
    addUploadTask({
      patientId,
      filename: audioData.filename,
      timestamp,
      audioType: "breath",
      audioFileUrl: audioData.audioFileUrl,
      deviceName: await getDeviceName(),
      userAgent: await generateUserAgent(),
    });
    navigate("/confirmation");
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioData?.audioFileUrl) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          logger.error('Audio playback failed', {
            recordingType: 'breath',
            audioFileUrl: audioData?.audioFileUrl?.substring(0, 50),
            errorCategory: 'AudioPlayback',
          }, error instanceof Error ? error : new Error(String(error)));
          setIsPlaying(false);
        });
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const t = parseFloat(e.target.value);
    el.currentTime = isNaN(t) ? 0 : t;
    setCurrentTime(el.currentTime);
  };

 

  return (
    <>
      <AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />

      <Container>
        <Content>
          <Header ref={headerRef}>
            <SharedBackButton component={BackButton} ariaLabel={t("recordBreath.goBackAria")} isArabic={isArabic}>
              <img
                src={BackIcon}
                alt={t("recordBreath.goBackAlt")}
                width={24}
                height={24}
                style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
              />
            </SharedBackButton>
            <HeaderText dir="auto" style={{ textAlign: "center" }}>
              {t("recordBreath.title")}
            </HeaderText>
          </Header>

          <h3 dir="auto" style={{ fontFamily: "Source Open Sans, sans-serif", fontSize: "24px", textAlign: "center", fontWeight: 600, marginBottom: "1.5rem", color: "#000000", marginTop: "1.5rem" }}>
            {t("recordBreath.instructionsTitle")}
          </h3>

          <InstructionStep step={isArabic ? "١" : "1"}>
            {t("recordBreath.instruction1_part1")} <strong>{t("recordBreath.instruction1_bold1")}</strong>
            {t("recordBreath.instruction1_part2")} <strong>{t("recordBreath.instruction1_bold2")}</strong>
            {t("recordBreath.instruction1_part3")}
          </InstructionStep>
          <Image src={keepDistance} alt={t("recordBreath.keepDistanceAlt")}/>

          <InstructionStep step={isArabic ? "٢" : "2"}>
            {t("recordBreath.instruction2_part1")}
            <strong>{t("recordBreath.instruction2_bold")}</strong>
            {t("recordBreath.instruction2_part2")}
          </InstructionStep>
          <Image src={mouthBreathDistance} alt={t("recordBreath.mouthBreathDistanceAlt")}/>

          <InstructionStep step={isArabic ? "٣" : "3"}>
            {t("recordBreath.instruction3_part1")} <strong>{t("recordBreath.instruction3_bold1")}</strong>
            {t("recordBreath.instruction3_part2")}
            <strong>{t("recordBreath.instruction3_bold2")}</strong>
            {t("recordBreath.instruction3_part3")}
          </InstructionStep>

          {/* Use local strict formatTime */}
          <TimerDisplay seconds={recordingTime} formatTime={formatTime} color={recordingTime === 0 ? '#fff' : '#3578de'} />

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordBreath.recordButton")}
                onClick={startRecording}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt="record" width={24} height={24} />
              </CircleButton>
              <ButtonLabel>{t("recordBreath.recordButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#BFD3F9"}
                aria-label={t("recordBreath.stopButton")}
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt="stop" width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordBreath.stopButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={audioData ? "#3578de" : "#DDE9FF"}
                aria-label={t("uploadComplete.play")}
                onClick={togglePlay}
                disabled={!audioData}
                style={{ opacity: !audioData ? 0.6 : 1, width: "56px", height: "56px" }}
              >
                <img 
                  src={isPlaying ? PauseIcon : PlayIcon} 
                  alt="play" 
                  width={24} 
                  height={24} 
                  style={{
                    filter: audioData ? "brightness(0) invert(1)" : "none",
                    marginLeft: isPlaying ? 0 : "3px"
                  }}
                />
              </CircleButton>
              <ButtonLabel>{t("uploadComplete.play")}</ButtonLabel>
            </div>
          </ButtonRow>

          <FileRow>
            <span>{audioData?.filename || t("recordBreath.defaultFilename")}</span>
          </FileRow>
          <Slider
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            step="0.1"
            onChange={handleSeek}
            aria-label={t("uploadComplete.sliderAria")}
            disabled={!audioData}
          />
          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
          </TimeRow>

          {error && (
            <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
              {error}
            </p>
          )}

          <SkipButton to="/confirmation" label={t("recordBreath.skipButton")} ariaLabel={t("recordBreath.skipButton")} />

          <ActionButtons>
            <button onClick={handleSubmit}>
              {t("uploadComplete.submit")}
            </button>
          </ActionButtons>

          {tooShort && (
            <MinimumDurationModal
              title={t("recordBreath.minimum_duration_title")}
              text={t("recordBreath.minimum_duration_text")}
              retryLabel={t("recordBreath.minimum_duration_retry")}
              onClose={() => {
                resetTooShort();
              }}
            />
          )}

          <FooterLink
            href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("recordBreath.reportIssue")}
          </FooterLink>
        </Content>
      </Container>
      <audio ref={audioRef} src={audioData?.audioFileUrl || undefined} preload="auto" />
    </>
  );
};

export default BreathRecordScreen;