import React, { useState, useRef } from "react";
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
const BreathRecordScreen: React.FC = () => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFileName(`breath-${Date.now()}.wav`);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );
      setError(null);
    } catch {
      setError(
        t("recordBreath.microphoneAccessError") || "Microphone access denied"
      );
    }
  };
  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };
  const handleContinue = () => {
    if (!audioUrl || !fileName) {
      setError(
        t("recordBreath.error") ||
          "Please record or upload an audio file first."
      );
      return;
    }
    navigate("/upload-complete", {
      state: {
        audioFileUrl: audioUrl,
        filename: fileName,
        nextPage: "/confirmation",
      },
    });
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    navigate("/upload-complete", {
      state: {
        audioFileUrl: url,
        filename: file.name,
        nextPage: "/confirmation",
      },
    });
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem 1rem",
        fontFamily: "Source Sans Pro, sans-serif",
        fontSize: "14px",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <div style={{ maxWidth: "1000px", width: "100%", position: "relative" }}>
        {/* Header */}
        <div
          style={{
            position: "relative",
            marginTop: "1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              position: "absolute",
              [isArabic ? "right" : "left"]: "-10px",
              top: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            aria-label={t("recordBreath.goBackAria")}
          >
            <img
              src={BackIcon}
              alt={t("recordBreath.goBackAlt")}
              width={24}
              height={24}
              style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
            />
          </button>
          <div
            style={{
              textAlign: "center",
              fontWeight: 600,
              fontSize: "18px",
              color: "#3578de",
            }}
          >
            {t("recordBreath.title")}
          </div>
        </div>
        {/* Instructions */}
        <h3
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "32px",
            marginBottom: "2rem",
            marginTop: "3rem",
          }}
        >
          {t("recordBreath.instructionsTitle")}
        </h3>
        {/* Step 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              minWidth: "28px",
              height: "28px",
              backgroundColor: "#DDE9FF",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              fontWeight: "bold",
              color: "#3578de",
              fontSize: "14px",
            }}
          >
            1
          </div>
          <div style={{ flex: 1 }}>
            {t("recordBreath.instruction1_part1")}
            <strong>{t("recordBreath.instruction1_bold1")}</strong>
            {t("recordBreath.instruction1_part2")}
            <strong>{t("recordBreath.instruction1_bold2")}</strong>
            {t("recordBreath.instruction1_part3")}
          </div>
        </div>
        <img
          src={keepDistance}
          alt={t("recordBreath.keepDistanceAlt")}
          style={{
            width: "100%",
            maxWidth: "30%", 
            height: "auto",
            margin: "0 auto 2rem",
            display: "block", 
     
          }}
        />
        {/* Step 2 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              minWidth: "28px",
              height: "28px",
              backgroundColor: "#DDE9FF",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              fontWeight: "bold",
              color: "#3578de",
              fontSize: "14px",
            }}
          >
            2
          </div>
          <div style={{ flex: 1 }}>
            {t("recordBreath.instruction2_part1")}
            <strong>{t("recordBreath.instruction2_bold")}</strong>
            {t("recordBreath.instruction2_part2")}
          </div>
        </div>
        <img
          src={mouthBreathDistance}
          alt={t("recordBreath.mouthDistanceAlt")}
          style={{
            width: "100%",
            maxWidth: "30%", 
            height: "auto",
            margin: "0 auto 2rem",
            display: "block", 
          }}
        />
        {/* Step 3 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              minWidth: "28px",
              height: "28px",
              backgroundColor: "#DDE9FF",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "28px",
              fontWeight: "bold",
              color: "#3578de",
              fontSize: "14px",
            }}
          >
            3
          </div>
          <div style={{ flex: 1 }}>
            {t("recordBreath.instruction3_part1")}
            <strong>{t("recordBreath.instruction3_bold1")}</strong>
            {t("recordBreath.instruction3_part2")}
            <strong>{t("recordBreath.instruction3_bold2")}</strong>
            {t("recordBreath.instruction3_part3")}
          </div>
        </div>
        {/* Timer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.75rem",
            marginTop: "3.5rem",
          }}
        >
          <div
            style={{
              border: "1px solid #3578de",
              color: "#3578de",
              padding: "0.6rem 1.5rem",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "20px",
            }}
          >
            {formatTime(recordingTime)}
          </div>
        </div>
        {/* Record & Stop */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <button
              onClick={startRecording}
              disabled={isRecording}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: isRecording ? "#dde9ff" : "#3578de",
                border: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: isRecording ? "not-allowed" : "pointer",
              }}
            >
              <img
                src={StartIcon}
                alt={t("recordBreath.recordButton")}
                width={28}
                height={28}
              />
            </button>
            <div
              style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}
            >
              {t("recordBreath.recordButton")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <button
              onClick={stopRecording}
              disabled={!isRecording}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#DDE9FF",
                border: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: !isRecording ? "not-allowed" : "pointer",
              }}
            >
              <img
                src={StopIcon}
                alt={t("recordBreath.stopButton")}
                width={20}
                height={20}
              />
            </button>
            <div
              style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}
            >
              {t("recordBreath.stopButton")}
            </div>
          </div>
        </div>
        {/* Continue & Upload */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {error && (
            <p
              style={{ color: "red", textAlign: "center", fontWeight: "bold" }}
            >
              {error}
            </p>
          )}
          <button
            onClick={handleContinue}
            style={{
              backgroundColor: "#3578de",
              color: "#fff",
              border: "none",
              padding: "1.5rem",
              borderRadius: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("recordBreath.continueButton")}
          </button>
          <button
            onClick={handleUploadClick}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={UploadIcon}
              alt={t("recordBreath.uploadFile")}
              width={22}
              height={22}
              style={{ marginRight: "0.5rem" }}
            />
            <span style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("recordBreath.uploadFile")}
            </span>
          </button>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
};
export default BreathRecordScreen;