// SpeechRecordScreen.tsx (refactored & RTL-aware skip button)
import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MinimumDurationModal from "../../../../components/RecordingControls/MinimumDurationModal";

// Assets
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthSpeechDistance from "../../../../assets/images/mouthSpeechDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import i18n from "../../../../i18n";
import SkipButton from "../../../../components/RecordingControls/SkipButton";
import { useAudioRecorder } from "../../../../components/RecordingControls/useAudioRecorder";
import SharedBackButton from "../../../../components/RecordingControls/BackButton";
import AppHeader from "../../../../components/AppHeader";
import TimerDisplay from "../../../../components/RecordingControls/TimerDisplay";
import formatTime from "../../../../utils/formatTime";
import FileUploadButton from "../../../../components/RecordingControls/FileUploadButton";

// Styled comps
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
  InstructionText,
  StepCircle,
  StepWrapper,
    // ...existing code...
} from "./styles";


const SpeechRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, recordingTime, audioData, error, tooShort, startRecording, stopRecording, setError, resetTooShort } =
    useAudioRecorder(44100, "speech");

  // refs for any local header measurements (kept for layout consistency)
  const headerRef = useRef<HTMLDivElement | null>(null);

  /* ----------------- Cleanup resources ----------------- */
  useEffect(() => {
    return () => {
      // hook handles cleanup
    };
  }, []);

  // use navigate directly for back when needed

  /* ----------------- Stop Recording ----------------- */
  // stopRecording is provided by hook

  /* ----------------- Start Recording ----------------- */
  // startRecording is provided by hook

  /* ----------------- Continue / Upload / Skip ----------------- */
  const handleContinue = () => {
    if (audioData) {
      setError(null);
      navigate("/upload-complete", {
        state: { ...audioData, nextPage: "/record-breath" },
      });
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(t("recordSpeech.error") || "Please record or upload an audio file first.");
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, recordingType: "speech", nextPage: "/record-breath" },
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioUrl = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: { audioFileUrl: audioUrl, filename: file.name, recordingType: "speech", nextPage: "/record-breath" },
    });
  };

  // Skip button is handled by shared component

  return (
    <>
      <AppHeader maxWidth={450} locale={isArabic ? "ar" : "en"} />
      <Container>
        <Content>
          <Header ref={headerRef}>
            <SharedBackButton component={BackButton} ariaLabel={t("recordSpeech.goBackAria")} isArabic={isArabic}>
              <img
                src={BackIcon}
                alt={t("recordSpeech.goBackAlt")}
                width={24}
                height={24}
                style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
              />
            </SharedBackButton>
            <HeaderText>{t("recordSpeech.title")}</HeaderText>
          </Header>

          <h3 style={{ fontFamily: "Source Open Sans, sans-serif", fontSize: "24px", textAlign: "center", fontWeight: 600, marginBottom: "1.5rem", color: "#000000", marginTop: "1.5rem" }}>
            {t("recordSpeech.instructionsTitle")}
          </h3>

          <StepWrapper>
            <StepCircle>{isArabic ? "١" : "1"}</StepCircle>
            <InstructionText>
              {t("recordSpeech.instruction1_part1")} <strong>{t("recordSpeech.instruction1_bold1")}</strong>
              {t("recordSpeech.instruction1_part2")} <strong>{t("recordSpeech.instruction1_bold2")}</strong>
              {t("recordSpeech.instruction1_part3")}
            </InstructionText>
          </StepWrapper>
          <Image src={keepDistance} alt={t("recordSpeech.keepDistanceAlt")} />

          <StepWrapper>
            <StepCircle>{isArabic ? "٢" : "2"}</StepCircle>
            <InstructionText>
              {t("recordSpeech.instruction2_part1")}
              <strong>{t("recordSpeech.instruction2_bold")}</strong>
              {t("recordSpeech.instruction2_part2")}
            </InstructionText>
          </StepWrapper>
          <Image src={mouthSpeechDistance} alt={t("recordSpeech.mouthSpeechDistanceAlt")} />

          <StepWrapper>
            <StepCircle>{isArabic ? "٣" : "3"}</StepCircle>
            <InstructionText>
              {t("recordSpeech.instruction3_part1")} <strong>{t("recordSpeech.instruction3_bold1")}</strong>
              {t("recordSpeech.instruction3_part2")}
              <strong>{t("recordSpeech.instruction3_bold2")}</strong>
              {t("recordSpeech.instruction3_part3")}
            </InstructionText>
          </StepWrapper>

          {/* Timer display replaced with shared component, color white if time is 0 */}
          <TimerDisplay seconds={recordingTime} formatTime={formatTime} color={recordingTime === 0 ? '#fff' : '#3578de'} />

          <ButtonRow>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#dde9ff" : "#3578de"}
                aria-label={t("recordSpeech.recordButton")}
                onClick={startRecording}
                disabled={isRecording}
                style={{ opacity: isRecording ? 0.6 : 1, cursor: isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StartIcon} alt={t("recordSpeech.recordButton")} width={28} height={28} />
              </CircleButton>
              <ButtonLabel>{t("recordSpeech.recordButton")}</ButtonLabel>
            </div>
            <div style={{ textAlign: "center" }}>
              <CircleButton
                bg={isRecording ? "#3578de" : "#DDE9FF"}
                aria-label={t("recordSpeech.stopButton")}
                onClick={stopRecording}
                disabled={!isRecording}
                style={{ opacity: !isRecording ? 0.6 : 1, cursor: !isRecording ? "not-allowed" : "pointer", width: "56px", height: "56px" }}
              >
                <img src={StopIcon} alt={t("recordSpeech.stopButton")} width={20} height={20} />
              </CircleButton>
              <ButtonLabel>{t("recordSpeech.stopButton")}</ButtonLabel>
            </div>
          </ButtonRow>

          {error && <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>}

          <SkipButton to="/record-breath" label={t("recordSpeech.skipButton")} ariaLabel={t("recordSpeech.skipButton")} />

          <ActionButtons>
            <button onClick={handleContinue}>{t("recordSpeech.continueButton")}</button>
            <FileUploadButton
              label={t("recordSpeech.uploadFile")}
              iconSrc={UploadIcon}
              onClick={triggerFileInput}
              inputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={handleFileChange}
              accept="audio/*"
            />
          </ActionButtons>

          {tooShort && (
            <MinimumDurationModal
              title={t("recordSpeech.minimum_duration_title")}
              text={t("recordSpeech.minimum_duration_text")}
              retryLabel={t("recordSpeech.minimum_duration_retry")}
              onClose={() => {
                resetTooShort();
              }}
            />
          )}

          <FooterLink href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform" target="_blank" rel="noopener noreferrer">
            {t("recordSpeech.reportIssue")}
          </FooterLink>
        </Content>
      </Container>
    </>
  );
};

export default SpeechRecordScreen;
