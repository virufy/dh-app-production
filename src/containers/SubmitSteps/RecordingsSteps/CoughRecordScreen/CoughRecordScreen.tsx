// CoughRecordScreen.tsx
// import React, { useRef, useState } from "react";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthDistance from "../../../../assets/images/mouthDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import i18n from "../../../../i18n";
import AppHeader from "../../../../components/AppHeader";

import { useMicRecorder } from "../../../../components/MicRecorder/useMicRecorder";
import { formatTime } from "../../../../components/MicRecorder/wavEncoder";

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
  Timer,
  TimerBox,
  ButtonRow,
  CircleButton,
  ButtonLabel,
  // CheckboxRow,
  // Label,
  // Checkbox,
  ActionButtons,
  UploadButton,
  UploadText,
  HiddenFileInput,
  FooterLink,
  ModalOverlay,
  ModalContainer,
  ModalTitle,
  ModalText,
  ModalButton
} from "./styles";
import { t } from "i18next";

/* ----------------- Minimum Duration Modal ----------------- */
const MinimumDurationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalOverlay>
    <ModalContainer>
      <ModalTitle>{t("recordCough.minimum_duration_title")}</ModalTitle>
      <ModalText>{t("recordCough.minimum_duration_text")}</ModalText>
      <ModalButton onClick={onClose}>{t("recordCough.minimum_duration_retry")}</ModalButton>
    </ModalContainer>
  </ModalOverlay>
);



const CoughRecordScreen: React.FC = () => {
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


  const [showTooShortModal, setShowTooShortModal] = useState(false);
  // const [involuntary, setInvoluntary] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleBack = () => navigate(-1);




  /* ----------------- Stop Recording ----------------- */
  const handleStopRecording = () => {
    stopRecording("cough");
    // small delay so recordingTime is final
    setTimeout(() => {
      if (recordingTime < 3) {
        setShowTooShortModal(true);
        resetRecording();
      }
    }, 200);
  };

  /* ----------------- Continue / Upload ----------------- */
  const handleContinue = () => {
    const { audioUrl, filename } = recordingResult;
    if (audioUrl && filename) {
      setError(null);
      navigate("/upload-complete", {
        state: { audioFileUrl: audioUrl, filename, nextPage: "/record-speech" },
      });
    } else {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError(t("recordCough.error") || "Please record or upload an audio file first.");
      } else {
        const audioUrlObj = URL.createObjectURL(file);
        navigate("/upload-complete", {
          state: { audioFileUrl: audioUrlObj, filename: file.name, nextPage: "/record-speech" },
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
      state: { audioFileUrl: audioUrl, filename: file.name, nextPage: "/record-speech" },
    });
  };

  return (
 <>
      < AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"}/>

      <Container>
        <Content>
          <Header>
            <BackButton onClick={handleBack} aria-label={t("recordCough.goBackAria")} isArabic={isArabic}>
              <img src={BackIcon} alt={t("recordCough.goBackAlt")} width={24} height={24} style={{ transform: isArabic ? "rotate(180deg)" : "none" }} />
            </BackButton>
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

          <Timer>
            <TimerBox>{formatTime(recordingTime)}</TimerBox>
          </Timer>

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordCough.recordButton")}
                onClick={() => startRecording("cough")}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, cursor: isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt={t("recordCough.recordButton")} width={28} height={28} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.recordButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#DDE9FF"}
                aria-label={t("recordCough.stopButton")}
                onClick={handleStopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, cursor: !isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt={t("recordCough.stopButton")} width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.stopButton")}</ButtonLabel>
            </div>
          </ButtonRow>

          {/* <CheckboxRow>
          <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
          <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
        </CheckboxRow> */}

          {error && (<p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>)}

          <button
            type="button"
            onClick={() => navigate("/record-speech", { state: { skipped: true } })}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {t("recordCough.skipButton")}
          </button>

          <ActionButtons>
            <button onClick={handleContinue}>{t("recordCough.continueButton")}</button>
            <UploadButton onClick={triggerFileInput} aria-label={t("recordCough.uploadFile")}>
              <img src={UploadIcon} alt={t("recordCough.uploadFile")} width={22} height={22} style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }} />
              <UploadText>{t("recordCough.uploadFile")}</UploadText>
            </UploadButton>
            <HiddenFileInput type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} />
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
            {t("recordCough.reportIssue")}
          </FooterLink>
        </Content>
      </Container>
</>
      );
};

      export default CoughRecordScreen;
