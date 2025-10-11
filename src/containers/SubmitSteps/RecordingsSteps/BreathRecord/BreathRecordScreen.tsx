// BreathRecordScreen.tsx
import React, { useState, useRef, useEffect } from "react";
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

import { useMicRecorder } from "../../../../components/MicRecorder/useMicRecorder";
import { formatTime } from "../../../../components/MicRecorder/wavEncoder";

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
  HiddenFileInput,
  Image,
  InstructionText,
  StepCircle,
  StepWrapper,
  Timer,
  TimerBox,
  UploadButton,
  UploadText,
  ModalOverlay,
  ModalContainer,
  ModalTitle,
  ModalText,
  ModalButton,
} from "./styles";
import { t } from "i18next";

/* ----------------- Minimum Duration Modal ----------------- */
const MinimumDurationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalOverlay>
    <ModalContainer>
      <ModalTitle>{t("recordBreath.minimum_duration_title")}</ModalTitle>
      <ModalText>{t("recordBreath.minimum_duration_text")}</ModalText>
      <ModalButton onClick={onClose}>{t("recordBreath.minimum_duration_retry")}</ModalButton>
    </ModalContainer>
  </ModalOverlay>
);


const BreathRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();

  const {
    isRecording,
    recordingTime,
    recordingResult,
    startRecording,
    stopRecording,
    resetRecording,
  } = useMicRecorder();  


  const fileInputRef = useRef<HTMLInputElement>(null);


  const [error, setError] = useState<string | null>(null);
  const [showTooShortModal, setShowTooShortModal] = useState(false);



  const handleBack = () => navigate(-1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString();
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };


  /* ----------------- Stop Recording (same flow as cough) ----------------- */
  const handleStopRecording = () => {
    stopRecording("breath");
    setTimeout(() => {
      if (recordingTime < 3) {
        setShowTooShortModal(true);
        resetRecording();
      }
    }, 200);
  };


  /* ----------------- Continue / Upload / Skip ----------------- */
  const handleContinue = () => {
    const { audioUrl, filename } = recordingResult;
    if (audioUrl && filename) {
      setError(null);
      navigate("/upload-complete", {
        state: { audioFileUrl: audioUrl, filename, nextPage: "/confirmation" },
      });
    } else {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError(t("recordBreath.error") || "Please record or upload an audio file first.");
      } else {
        const audioUrlObj = URL.createObjectURL(file);
        navigate("/upload-complete", {
          state: { audioFileUrl: audioUrlObj, filename: file.name, nextPage: "/confirmation" },
        });
      }
    }
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
        nextPage: "/confirmation",
      },
    });
  };

  return (
   <>
         < AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />

    <Container>
      <Content>
        <Header>
          <BackButton
            onClick={handleBack}
            aria-label={t("recordBreath.goBackAria")}
            isArabic={isArabic}
          >
            <img
              src={BackIcon}
              alt={t("recordBreath.goBackAlt")}
              width={24}
              height={24}
              style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
            />
          </BackButton>
          <HeaderText dir="auto" style={{ textAlign: "center" }}>{t("recordBreath.title")}</HeaderText>
        </Header>

        <h3
          dir="auto"
          style={{
            fontFamily: "Source Open Sans, sans-serif",
            fontSize: "24px",
            textAlign: "center",
            fontWeight: 600,
            marginBottom: "1.5rem",
            color: "#000000",
            marginTop: "1.5rem",
          }}
        >
          {t("recordBreath.instructionsTitle")}
        </h3>

        <StepWrapper>
          <StepCircle>{isArabic ? "١" : "1"}</StepCircle>
          <InstructionText>
            {t("recordBreath.instruction1_part1")}{" "}
            <strong>{t("recordBreath.instruction1_bold1")}</strong>
            {t("recordBreath.instruction1_part2")}{" "}
            <strong>{t("recordBreath.instruction1_bold2")}</strong>
            {t("recordBreath.instruction1_part3")}
          </InstructionText>
        </StepWrapper>
        <Image src={keepDistance} alt={t("recordBreath.keepDistanceAlt")} />

        <StepWrapper>
          <StepCircle>{isArabic ? "٢" : "2"}</StepCircle>
          <InstructionText>
            {t("recordBreath.instruction2_part1")}
            <strong>{t("recordBreath.instruction2_bold")}</strong>
            {t("recordBreath.instruction2_part2")}
          </InstructionText>
        </StepWrapper>
        <Image src={mouthBreathDistance} alt={t("recordBreath.mouthBreathDistanceAlt")} />

        <StepWrapper>
          <StepCircle>{isArabic ? "٣" : "3"}</StepCircle>
          <InstructionText>
            {t("recordBreath.instruction3_part1")}{" "}
            <strong>{t("recordBreath.instruction3_bold1")}</strong>
            {t("recordBreath.instruction3_part2")}
            <strong>{t("recordBreath.instruction3_bold2")}</strong>
            {t("recordBreath.instruction3_part3")}
          </InstructionText>
        </StepWrapper>

        <Timer>
          <TimerBox>{formatTime(recordingTime)}</TimerBox>
        </Timer>

        <ButtonRow>
          <div style={{ textAlign: "center" }}>
            <CircleButton
              bg={isRecording ? "#dde9ff" : "#3578de"}
              aria-label={t("recordBreath.recordButton")}
              onClick={() => startRecording("breath")}
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
              onClick={handleStopRecording}
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

        {/* Quick Skip for testing */}
        <button
          type="button"
          onClick={() => navigate("/confirmation")}
          style={{ position: "absolute", top: "20px", right: "20px", backgroundColor: "#f0f0f0", border: "1px solid #ccc", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}
        >
          {t("recordBreath.skipButton")}
        </button>

        <ActionButtons>
          <button onClick={handleContinue}>
            {t("recordBreath.continueButton")}
          </button>
          <UploadButton
            onClick={triggerFileInput}
            aria-label={t("recordBreath.uploadFile")}
          >
            <img
              src={UploadIcon}
              alt={t("recordBreath.uploadFile")}
              width={22}
              height={22}
              style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }}
            />
            <UploadText>{t("recordBreath.uploadFile")}</UploadText>
          </UploadButton>
          <HiddenFileInput
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </ActionButtons>

        {showTooShortModal && (
          <MinimumDurationModal
            onClose={() => {
              setShowTooShortModal(false);
              resetRecording();
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
