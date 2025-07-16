import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthBreathDistance from "../../../../assets/images/mouthBreathDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import i18n from "../../../../i18n";

const BreathRecordScreen: React.FC = () => {
    const isArabic = i18n.language === 'ar';
    const navigate = useNavigate();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRecording) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else if (!isRecording && timer !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleBack = () => navigate(-1);
    const handleUploadClick = () => fileInputRef.current?.click();

    /** ✅ Updated: Upload → Navigate to Upload Page */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const audioUrl = URL.createObjectURL(file);

        navigate("/upload-complete", {
            state: {
                audioFileUrl: audioUrl,
                filename: file.name,
                nextPage: "/confirmation" // last step after upload
            },
        });
    };

    const startRecording = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError(t("recordBreath.noMicSupport", "Microphone not supported"));
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setRecordedChunks([]);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setRecordedChunks(prev => [...prev, e.data]);
                }
            };

            recorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setTimer(0);
        } catch {
            setError(t("recordBreath.micPermissionDenied", "Microphone permission denied"));
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    /** ✅ Updated: Continue → Upload page, pass nextPage: confirmation */
    const handleContinue = () => {
        if (recordedChunks.length === 0) {
            setError(t("recordBreath.error", "Please record or upload an audio file first."));
            return;
        }

        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(blob);
        const filename = `breath_recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;

        navigate("/upload-complete", {
            state: {
                audioFileUrl: audioUrl,
                filename,
                nextPage: "/confirmation" // final step after upload
            },
        });
    };

    return (
        <div style={{ minHeight: "100vh", padding: "1.5rem 1rem", fontFamily: "Arial, sans-serif", display: "flex", fontSize: "14px", justifyContent: "center", backgroundColor: "transparent" }}>
            <div style={{ maxWidth: "1000px", width: "100%", position: "relative" }}>
                {/* Header */}
                <div style={{ position: "relative", marginTop: "1.25rem", marginBottom: "1.75rem" }}>
                    <button
                        onClick={handleBack}
                        style={{
                            position: "absolute",
                            [isArabic ? 'right' : 'left']: '-10px',
                            top: 0,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                        aria-label={t("recordBreath.goBackAria", "Go back")}
                    >
                        <img src={BackIcon} alt={t("recordBreath.goBackAlt", "Back")} width={24} height={24} style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <div style={{ textAlign: "center", fontWeight: 600, fontSize: "18px", color: "#3578de" }}>
                        {t("recordBreath.title", "Record your breath")}
                    </div>
                </div>

                <h3 style={{ fontSize: "32px", textAlign: "center", fontWeight: "bold", marginBottom: "2rem", marginTop: "3rem" }}>
                    {t("recordBreath.instructionsTitle", "Instructions")}
                </h3>

                {[1, 2, 3].map((step) => (
                    <div key={step}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                            <div style={{ minWidth: "28px", height: "28px", backgroundColor: "#DDE9FF", borderRadius: "50%", textAlign: "center", lineHeight: "28px", fontWeight: "bold", color: "#3578de", fontSize: "14px" }}>{step}</div>
                            <div style={{ flex: 1, fontSize: "14px" }}>
                                {t(`recordBreath.instruction${step}_part1`)}
                                {step === 1 && <strong>{t("recordBreath.instruction1_bold1")}</strong>}
                                {t(`recordBreath.instruction${step}_part2`)}
                                {step === 1 && <strong>{t("recordBreath.instruction1_bold2")}</strong>}
                                {t(`recordBreath.instruction${step}_part3`, "")}
                            </div>
                        </div>
                        {step === 1 && <img src={keepDistance} alt={t("recordBreath.keepDistanceAlt")} style={{ width: "50%", margin: "auto", display: "block", marginBottom: "1.5rem" }} />}
                        {step === 2 && <img src={mouthBreathDistance} alt={t("recordBreath.mouthDistanceAlt")} style={{ width: "50%", margin: "auto", display: "block", marginBottom: "2rem" }} />}
                    </div>
                ))}

                {/* Timer */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem", marginTop: "3.5rem" }}>
                    <div style={{ border: "1px solid #3578de", color: "#3578de", padding: "0.6rem 1.5rem", borderRadius: "12px", fontWeight: "bold", fontSize: "20px" }}>
                        {formatTime(timer)}
                    </div>
                </div>

                {/* Record / Stop Buttons */}
                <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2.5rem" }}>
                    <div style={{ textAlign: "center" }}>
                        <button onClick={startRecording} disabled={isRecording} style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#3578de", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: isRecording ? "not-allowed" : "pointer", opacity: isRecording ? 0.6 : 1 }}>
                            <img src={StartIcon} alt={t("recordBreath.recordButton")} width={28} height={28} />
                        </button>
                        <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>
                            {t("recordBreath.recordButton", "Record")}
                        </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <button onClick={stopRecording} disabled={!isRecording} style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#DDE9FF", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: !isRecording ? "not-allowed" : "pointer", opacity: !isRecording ? 0.6 : 1 }}>
                            <img src={StopIcon} alt={t("recordBreath.stopButton")} width={20} height={20} />
                        </button>
                        <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>
                            {t("recordBreath.stopButton", "Stop")}
                        </div>
                    </div>
                </div>

                {/* Continue and Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
                    {error && <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>{error}</p>}
                    <button onClick={handleContinue} style={{ backgroundColor: "#3578de", color: "white", border: "none", padding: "1.5rem", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>
                        {t("recordBreath.continueButton", "Continue")}
                    </button>
                    <button onClick={handleUploadClick} style={{ background: "none", border: "none", padding: 0, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <img src={UploadIcon} alt={t("recordBreath.uploadFile")} width={22} height={22} style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{t("recordBreath.uploadFile", "Upload your own file")}</span>
                    </button>
                    <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center" }}>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#3578de", textDecoration: "underline" }}>
                        {t("recordBreath.reportIssue", "Something wrong? Report an error")}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BreathRecordScreen;
