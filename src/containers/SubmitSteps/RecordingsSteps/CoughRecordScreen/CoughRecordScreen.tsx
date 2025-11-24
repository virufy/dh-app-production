// CoughRecordScreen.tsx (refactored & skip button repositioning — RTL fix)
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthDistance from "../../../../assets/images/mouthDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import PlayIcon from "../../../../assets/icons/play.svg";
import PauseIcon from "../../../../assets/icons/pause.svg";
import i18n from "../../../../i18n";
import AppHeader from "../../../../components/AppHeader";
import SkipButton from "../../../../components/RecordingControls/SkipButton";
import { useAudioRecorder } from "../../../../components/RecordingControls/useAudioRecorder";
import SharedBackButton from "../../../../components/RecordingControls/BackButton";
import TimerDisplay from "../../../../components/RecordingControls/TimerDisplay";
import { Slider, TimeRow, FileRow } from "../UploadCompleteCough/styles";
import MinimumDurationModal from "../../../../components/RecordingControls/MinimumDurationModal";
import formatTime from "../../../../utils/formatTime";
import { addUploadTask } from "../../../../services/backgroundUploadService";
import { getDeviceName, generateUserAgent } from "../../../../utils/deviceUtils";
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
  ButtonRow,
  CircleButton,
  ButtonLabel,
  CheckboxRow,
  Label,
  Checkbox,
  ActionButtons,
  FooterLink,
} from "./styles";

/* ----------------- Minimum Duration Modal ----------------- */

/* ----------------- helper: t without importing i18next directly ----------------- */
// ...existing code...

const CoughRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isRecording, recordingTime, audioData, error, tooShort, startRecording, stopRecording, setError, resetTooShort} =
    useAudioRecorder(44100, "cough");

  const [involuntary, setInvoluntary] = useState(false);

  // Refs for header
  const headerRef = useRef<HTMLDivElement | null>(null);
// --- CHANGE 1: Scroll to top on component mount ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    return () => {
      // hook handles cleanup
    };
  }, []);

  

  const handleSubmit = async () => {
    if (!audioData) {
      setError(t("recordCough.error") || "Please record first.");
      return;
    }
    const patientId = sessionStorage.getItem("patientId") || "";
    const timestamp = new Date().toISOString();
    addUploadTask({
      patientId,
      filename: audioData.filename,
      timestamp,
      audioType: "cough",
      audioFileUrl: audioData.audioFileUrl,
      deviceName: await getDeviceName(),
      userAgent: await generateUserAgent(),
      involuntaryCough: involuntary, 
      metadata: {
        involuntaryCough: involuntary, 
      }
    });
    navigate("/record-speech");
  };

  /* ----------------- Audio Events ----------------- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => setDuration(el.duration || 0);
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
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

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioData?.audioFileUrl) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };



  return (
    <>
      <AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />

      <Container>
        <Content>
          <Header ref={headerRef}>
            <SharedBackButton component={BackButton} ariaLabel={t("recordCough.goBackAria")} isArabic={isArabic}>
              <img src={BackIcon} alt={t("recordCough.goBackAlt")} width={24} height={24} style={{ transform: isArabic ? "rotate(180deg)" : "none" }} />
            </SharedBackButton>
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

          <TimerDisplay seconds={recordingTime} formatTime={formatTime} color={recordingTime === 0 ? '#fff' : '#3578de'} />

          <ButtonRow>
            {/* RECORD BUTTON */}
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordCough.recordButton")}
                onClick={startRecording}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt="record" width={24} height={24} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.recordButton")}</ButtonLabel>
            </div>

            {/* STOP BUTTON */}
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#BFD3F9"}
                aria-label={t("recordCough.stopButton")}
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt="stop" width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.stopButton")}</ButtonLabel>
            </div>

            {/* PLAY BUTTON (FIXED ICON COLOR) */}
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
                    // IF BUTTON IS BLUE (audioData exists), TURN ICON WHITE.
                    filter: audioData ? "brightness(0) invert(1)" : "none",
                    // Center the play triangle slightly
                    marginLeft: isPlaying ? 0 : "3px"
                  }}
                />
              </CircleButton>
              <ButtonLabel>{t("uploadComplete.play")}</ButtonLabel>
            </div>
          </ButtonRow>

          <FileRow>
            <span>{audioData?.filename || t("recordCough.defaultFilename")}</span>
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
          
          {/* Time Row using local formatTime */}
          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
          </TimeRow>

          <CheckboxRow>
            <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
            <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
          </CheckboxRow>

          {error && (<p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>)}

          <SkipButton to="/record-speech" label={t("recordCough.skipButton")} ariaLabel={t("recordCough.skipButton")} />

          <ActionButtons>
            <button onClick={handleSubmit}>{t("uploadComplete.submit")}</button>
          </ActionButtons>

          {tooShort && (
            <MinimumDurationModal
              title={t("recordCough.minimum_duration_title")}
              text={t("recordCough.minimum_duration_text")}
              retryLabel={t("recordCough.minimum_duration_retry")}
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
            {t("recordCough.reportIssue")}
          </FooterLink>
        </Content>
      </Container>
      <audio ref={audioRef} src={audioData?.audioFileUrl || ""} preload="auto" />
    </>
  );
};

export default CoughRecordScreen;