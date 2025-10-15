// CoughRecordScreen.tsx (refactored & skip button repositioning — RTL fix)
import React, { useRef, useState, useEffect } from "react";
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
import SkipButton from "../../../../components/RecordingControls/SkipButton";
import { useAudioRecorder } from "../../../../components/RecordingControls/useAudioRecorder";
import SharedBackButton from "../../../../components/RecordingControls/BackButton";
import TimerDisplay from "../../../../components/RecordingControls/TimerDisplay";
import FileUploadButton from "../../../../components/RecordingControls/FileUploadButton";
import MinimumDurationModal from "../../../../components/RecordingControls/MinimumDurationModal";
import formatTime from "../../../../utils/formatTime";
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, recordingTime, audioData, error, tooShort, startRecording, stopRecording, setError, resetTooShort } =
    useAudioRecorder(44100, "cough");

  const [involuntary, setInvoluntary] = useState(false);

  // Refs for header
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      // hook handles cleanup
    };
  }, []);

  

  /* ----------------- Continue / Upload ----------------- */
  const handleContinue = () => {
    if (audioData) {
      setError(null);
      try {
        navigate("/upload-complete", {
          state: { ...audioData, nextPage: "/record-speech" },
        });
      } catch (e) {
        setError(t("recordCough.error") || "Navigation failed.");
      }
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(t("recordCough.error") || "Please record or upload an audio file first.");
      return;
    }
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, recordingType: "cough", nextPage: "/record-speech" },
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, recordingType: "cough", nextPage: "/record-speech" },
    });
  };

  /* ----------------- Place Skip Button dynamically (RTL-aware) ----------------- */
  // SkipButton component handles placement and RTL

  return (
    <>
      <AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />

      <Container>
        <Content>
          {/* attach headerRef to the local Header wrapper so we can calculate position */}
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

          {/* Timer display replaced with shared component, color white if time is 0 */}
          <TimerDisplay
            seconds={recordingTime}
            formatTime={formatTime}
            color={recordingTime === 0 ? '#fff' : '#3578de'}
          />

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordCough.recordButton")}
                onClick={startRecording}
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
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, cursor: !isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt={t("recordCough.stopButton")} width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordCough.stopButton")}</ButtonLabel>
            </div>
          </ButtonRow>

          <CheckboxRow>
            <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
            <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
          </CheckboxRow>

          {error && (<p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>)}

          <SkipButton to="/record-speech" label={t("recordCough.skipButton")} ariaLabel={t("recordCough.skipButton")} />

          <ActionButtons>
            <button onClick={handleContinue}>{t("recordCough.continueButton")}</button>
            <FileUploadButton
              label={t("recordCough.uploadFile")}
              iconSrc={UploadIcon}
              onClick={triggerFileInput}
              inputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={handleFileChange}
              accept="audio/*"
            />
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
    </>
  );
};

export default CoughRecordScreen;
