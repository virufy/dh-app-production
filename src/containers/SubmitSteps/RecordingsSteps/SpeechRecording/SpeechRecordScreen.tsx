import React, {useRef, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthSpeechDistance from "../../../../assets/images/mouthSpeechDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import i18n from "../../../../i18n";
import {
    ActionButtons,
    BackButton, ButtonLabel, ButtonRow, CircleButton,
    Container,
    Content, FooterLink,
    Header,
    HeaderText, HiddenFileInput, Image,
    InstructionText,
    StepCircle,
    StepWrapper, Timer, TimerBox, UploadButton, UploadText,
    ModalOverlay,
    ModalContainer,
    ModalTitle,
    ModalText,
    ModalButton
} from "./styles";
import { t } from "i18next";

const MinimumDurationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <ModalOverlay>
        <ModalContainer>
            <ModalTitle>{t("recordSpeech.minimum_duration_title")}</ModalTitle>
            <ModalText>{t("recordSpeech.minimum_duration_text")}</ModalText>
            <ModalButton onClick={onClose}>{t("recordSpeech.minimum_duration_retry")}</ModalButton>
        </ModalContainer>
    </ModalOverlay>
);
const SpeechRecordScreen: React.FC = () => {


    const { t } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null
    );
    const [showTooShortModal, setShowTooShortModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioData, setAudioData] = useState<{
        audioFileUrl: string;
        filename: string;
    } | null>(null);

    useEffect(() => {
        const storedAudio = sessionStorage.getItem("speechAudio");
        const storedFilename = sessionStorage.getItem("speechFilename");
        const storedDuration = sessionStorage.getItem("speechDuration");

        if (storedAudio && storedFilename && storedDuration) {
            setAudioData({ audioFileUrl: storedAudio, filename: storedFilename });
            setRecordingTime(parseInt(storedDuration, 10));
        }
    }, []);

    const handleBack = () => navigate(-1);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: "audio/wav" });
                const audioUrl = URL.createObjectURL(audioBlob);
                const filename = `speech_recording-${new Date().toISOString().replace(/[:.]/g, "-")}.wav`;
                setAudioData({ audioFileUrl: audioUrl, filename });
                sessionStorage.setItem("speechAudio", audioUrl);
                sessionStorage.setItem("speechFilename", filename);
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            setTimeout(() => {
                if (recorder.state === "recording") {
                stopRecording();
                }
            }, 30000); // Auto stop after 30 sec
                        
            setError(null);
            setAudioData(null);
        } catch (err) {
            console.error("Microphone access error:", err);
            setError(
                t("recordSpeech.microphoneAccessError") || "Microphone access denied."
            );
        }
    };

    const stopRecording = () => {

        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (recordingTime < 3) {
            setShowTooShortModal(true);
            setAudioData(null); // prevent submission
        }
        setIsRecording(false);
        sessionStorage.setItem("speechDuration", recordingTime.toString());
    };

  /** Updated to always navigate to Upload page with next step */
  const handleContinue = () => {
      if (audioData) {
          setError(null);
          navigate("/upload-complete", {
              state: {
                  ...audioData,
                  nextPage: "/record-breath", // Go to Speech after upload
              },
          });
      }
      else {
          const file = fileInputRef.current?.files?.[0];
          if (!file) {
              setError(
                  t("recordSpeech.error") ||
                  "Please record or upload an audio file first."
              );
          } else {
              const audioUrl = URL.createObjectURL(file);
              navigate("/upload-complete", {
                  state: {
                      audioFileUrl: audioUrl,
                      filename: file.name,
                      nextPage: "/record-breath",
                  },
              });
          }
      }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  /** Updated handleFileChange */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);

    navigate("/upload-complete", {
      state: {
        audioFileUrl: audioUrl,
        filename: file.name,
        nextPage: "/record-breath",
      },
    });
  };
    return (
        <Container>
            <Content>
                <Header>
                    <BackButton
                        onClick={handleBack}
                        aria-label={t("recordSpeech.goBackAria")}
                        isArabic={isArabic}
                    >
                        <img
                            src={BackIcon}
                            alt={t("recordSpeech.goBackAlt")}
                            width={24}
                            height={24}
                            style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
                        />
                    </BackButton>
                    <HeaderText>{t("recordSpeech.title")}</HeaderText>
                </Header>

                <h3
                    style={{
                        fontFamily: "Source Open Sans, sans-serif",
                        fontSize: "24px",
                        textAlign: "center",
                        fontWeight: "600",
                        marginBottom: "1.5rem",
                        color: "#000000",
                        marginTop: "1.5rem",

                    }}
                >
                    {t("recordSpeech.instructionsTitle")}
                </h3>

                <StepWrapper>
                    <StepCircle>{isArabic ? "١" : "1"}</StepCircle>
                    <InstructionText>
                        {t("recordSpeech.instruction1_part1")}{" "}
                        <strong>{t("recordSpeech.instruction1_bold1")}</strong>
                        {t("recordSpeech.instruction1_part2")}{" "}
                        <strong>{t("recordSpeech.instruction1_bold2")}</strong>
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
                        {t("recordSpeech.instruction3_part1")}{" "}
                        <strong>{t("recordSpeech.instruction3_bold1")}</strong>
                        {t("recordSpeech.instruction3_part2")}
                        <strong>{t("recordSpeech.instruction3_bold2")}</strong>
                        {t("recordSpeech.instruction3_part3")}
                    </InstructionText>
                </StepWrapper>

                <Timer>
                    <TimerBox>{formatTime(recordingTime)}</TimerBox>
                </Timer>

                <ButtonRow>
                    <div style={{ textAlign: "center" }}>
                        <CircleButton
                            bg={isRecording ? "#dde9ff" : "#3578de"}
                            aria-label={t("recordSpeech.recordButton")}
                            onClick={startRecording}
                            disabled={isRecording}
                            style={{
                                opacity: isRecording ? 0.6 : 1,
                                cursor: isRecording ? "not-allowed" : "pointer",
                                width:'56px',
                                height:'56px'
                            }}
                        >
                            <img
                                src={StartIcon}
                                alt={t("recordSpeech.recordButton")}
                                width={28}
                                height={28}
                            />
                        </CircleButton>
                        <ButtonLabel>{t("recordSpeech.recordButton")}</ButtonLabel>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <CircleButton
                            bg={isRecording ? "#3578de" : "#DDE9FF"}
                            aria-label={t("recordSpeech.stopButton")}
                            onClick={stopRecording}
                            disabled={!isRecording}
                            style={{
                                opacity: !isRecording ? 0.6 : 1,
                                cursor: !isRecording ? "not-allowed" : "pointer",
                                width:'56px',
                                height:'56px'
                            }}
                        >
                            <img
                                src={StopIcon}
                                alt={t("recordSpeech.stopButton")}
                                width={20}
                                height={20}
                            />
                        </CircleButton>
                        <ButtonLabel>{t("recordSpeech.stopButton")}</ButtonLabel>
                    </div>
                </ButtonRow>

                {error && (
                <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
                    {error}
                </p>
                )}
                <button
                    type="button"
                    onClick={() => navigate('/upload-complete', { state: { nextPage: '/record-breath' } })}
                    style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                    }}
                >
                    Skip
                </button>                
                <ActionButtons>
                    <button onClick={handleContinue}>
                        {t("recordSpeech.continueButton")}
                    </button>
                    <UploadButton
                        onClick={triggerFileInput}
                        aria-label={t("recordSpeech.uploadFile")}
                    >
                        <img
                            src={UploadIcon}
                            alt={t("recordSpeech.uploadFile")}
                            width={22}
                            height={22}
                            style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }}
                        />
                        <UploadText>{t("recordSpeech.uploadFile")}</UploadText>
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
                            startRecording();
                        }}
                    />
                )}

                <FooterLink
                    href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t("recordSpeech.reportIssue")}
                </FooterLink>
            </Content>
        </Container>
    );
};

export default SpeechRecordScreen;
