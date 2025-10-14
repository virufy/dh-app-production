// BreathRecordScreen.tsx (refactored & RTL-aware skip button)
import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Assets
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthBreathDistance from "../../../../assets/images/mouthBreathDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import i18n from "../../../../i18n";
import AppHeader from "../../../../components/AppHeader";
import SkipButton from "../../../../components/RecordingControls/SkipButton";
import { useAudioRecorder } from "../../../../components/RecordingControls/useAudioRecorder";
import MinimumDurationModal from "../../../../components/RecordingControls/MinimumDurationModal";
import InstructionStep from "../../../../components/RecordingControls/InstructionStep";
import SharedBackButton from "../../../../components/RecordingControls/BackButton";
import TimerDisplay from "../../../../components/RecordingControls/TimerDisplay";
import FileUploadButton from "../../../../components/RecordingControls/FileUploadButton";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, recordingTime, audioData, error, tooShort, startRecording, stopRecording, setError, resetTooShort } =
    useAudioRecorder(44100, "breath");

  // refs for dynamic header
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      // hook handles cleanup
    };
  }, []);


  /* ----------------- Continue / Upload / File handling ----------------- */
  const handleContinue = () => {
    if (audioData) {
      setError(null);
      navigate("/upload-complete", {
        state: {
          ...audioData,
          nextPage: "/confirmation",
        },
      });
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(t("recordBreath.error") || "Please record or upload an audio file first.");
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: {
        audioFileUrl: audioUrl,
        filename: file.name,
        recordingType: "breath",
        nextPage: "/confirmation",
      },
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: {
        audioFileUrl: audioUrl,
        filename: file.name,
        recordingType: "breath",
        nextPage: "/confirmation",
      },
    });
  };

  /* ----------------- Place Skip Button dynamically (RTL-aware) ----------------- */
  // SkipButton component handles placement and RTL

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

          {/* Timer display replaced with shared component */}
          <TimerDisplay
            seconds={recordingTime}
            formatTime={(s) => {
              const mins = Math.floor(s / 60).toString();
              const secs = (s % 60).toString().padStart(2, "0");
              return `${mins}:${secs}`;
            }}
            color={recordingTime === 0 ? '#fff' : '#3578de'}
          />

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordBreath.recordButton")}
                onClick={startRecording}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, cursor: isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt={t("recordBreath.recordButton")} width={28} height={28} />
              </CircleButton>
              <ButtonLabel>{t("recordBreath.recordButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#DDE9FF"}
                aria-label={t("recordBreath.stopButton")}
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, cursor: !isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt={t("recordBreath.stopButton")} width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordBreath.stopButton")}</ButtonLabel>
            </div>
          </ButtonRow>

          {error && (
            <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
              {error}
            </p>
          )}

          <SkipButton to="/confirmation" label={t("recordBreath.skipButton")} ariaLabel={t("recordBreath.skipButton")} />

          <ActionButtons>
            <button onClick={handleContinue}>
              {t("recordBreath.continueButton")}
            </button>
            <FileUploadButton
              label={t("recordBreath.uploadFile")}
              iconSrc={UploadIcon}
              onClick={triggerFileInput}
              inputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={handleFileChange}
              accept="audio/*"
            />
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
    </>
  );
};

export default BreathRecordScreen;
