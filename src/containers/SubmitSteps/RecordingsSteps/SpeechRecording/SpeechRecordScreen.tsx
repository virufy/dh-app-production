import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Assets
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthSpeechDistance from "../../../../assets/images/mouthSpeechDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";
import i18n from "../../../../i18n";

const SpeechRecordScreen: React.FC = () => {
    const isArabic = i18n.language === 'ar';
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBack = (): void | Promise<void> => navigate(-1);

    const [error, setError] = React.useState<string | null>(null);    

    const handleContinue = () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
        setError(t("recordBreath.error")); // Show error from translation if no file
        } else {
        setError(null); // Clear error if valid
        const audioUrl = URL.createObjectURL(file);
        navigate("/upload-complete", {
            state: {
            audioFileUrl: audioUrl,
            filename: file.name,
            nextPage: "/confirmation",
            },
        });
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);
            navigate("/upload-complete", {
                state: {
                    audioFileUrl: audioUrl,
                    filename: file.name,
                    nextPage: "/record-breath",
                },
            });
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "1.5rem 1rem",
                fontFamily: 'Source Sans Pro, sans-serif',
                fontSize: '13px',
                display: "flex",
                justifyContent: "center",
                backgroundColor: "transparent",
            }}
        >
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
                        aria-label={t('recordSpeech.goBackAria')}
                    >
                        <img src={BackIcon} alt={t('recordSpeech.goBackAlt')} width={24} height={24} style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <div
                        style={{
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: "18px",
                            color: "#3578de",
                            fontFamily: 'Source Sans Pro, sans-serif',
                        }}
                    >
                        {t('recordSpeech.title')}
                    </div>
                </div>

                <h3 style={{ textAlign: "center", fontWeight: "bold", marginBottom: "2rem", fontFamily: "Source Sans Pro, sans-serif", fontSize: '32px' }}>
                    {t('recordSpeech.instructionsTitle')}
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
                    fontSize: "20px",
                    }}
                >
                    1
                </div>
                <div style={{ flex: 1, fontSize: "20px" }}>
                    {t('recordSpeech.instruction1_part1')}
                    <strong>{t('recordSpeech.instruction1_bold1')}</strong>
                    {t('recordSpeech.instruction1_part2')}
                    <strong>{t('recordSpeech.instruction1_bold2')}</strong>
                    {t('recordSpeech.instruction1_part3')}
                </div>
                </div>

                <img
                src={keepDistance}
                alt={t('recordSpeech.keepDistanceAlt')}
                style={{ width: "100%", marginBottom: "1.5rem" }}
                />


                {/* Step 2 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{
                        minWidth: "28px",
                        height: "28px",
                        backgroundColor: "#DDE9FF",
                        borderRadius: "50%",
                        textAlign: "center",
                        lineHeight: "28px",
                        fontWeight: 700,
                        color: "#3578de",
                        fontSize: "14px"
                    }}>
                    2
                    </div>
                    <div style={{ flex: 1, fontSize: "20px" }}>
                        {t('recordSpeech.instruction2_part1')}
                        <strong>{t('recordSpeech.instruction2_bold')}</strong>
                        {t('recordSpeech.instruction2_part2')}
                    </div>
                </div>
                <img src={mouthSpeechDistance} alt={t('recordSpeech.mouthDistanceAlt')} style={{ width: "100%", marginBottom: "1.5rem" }} />

                {/* Step 3 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem" }}>
                    <div style={{
                        minWidth: "28px",
                        height: "28px",
                        backgroundColor: "#DDE9FF",
                        borderRadius: "50%",
                        textAlign: "center",
                        lineHeight: "28px",
                        fontWeight: "bold",
                        color: "#3578de",
                        fontSize: "20px"
                    }}>3
                    </div>
                    <div style={{ flex: 1, fontSize: "20px" }}>
                        {t('recordSpeech.instruction3_part1')}
                        <strong>{t('recordSpeech.instruction3_bold1')}</strong>
                        {t('recordSpeech.instruction3_part2')}
                        <strong>{t('recordSpeech.instruction3_bold2')}</strong>
                        {t('recordSpeech.instruction3_part3')}
                    </div>
                </div>

                {/* Timer */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem", marginTop: "3.5rem" }}>
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
                        0:00
                    </div>
                </div>

                {/* Start & Stop buttons */}
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
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                backgroundColor: "#3578de",
                                border: "none",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                        >
                            <img src={StartIcon} alt={t('recordSpeech.recordButton')} width={28} height={28} />
                        </button>
                        <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>{t('recordSpeech.recordButton')}</div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <button
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                backgroundColor: "#DDE9FF",
                                border: "none",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                        >
                            <img src={StopIcon} alt={t('recordSpeech.stopButton')} width={20} height={20} />
                        </button>
                        <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>{t('recordSpeech.stopButton')}</div>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
                    {error && (
                        <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
                            {error}
                        </p>
                    )}
                    <button
                        onClick={handleContinue}
                        style={{
                            backgroundColor: "#3578de",
                            color: "white",
                            border: "none",
                            padding: "1.5rem",
                            borderRadius: "15px",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        {t('recordSpeech.continueButton')}
                    </button>
                    <button
                        onClick={handleUploadClick}
                        style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                
                        }}
                    >
                        <img src={UploadIcon} alt={t('recordSpeech.uploadFile')} width={22} height={22}
                             style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>
                            {t('recordSpeech.uploadFile')}
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

                {/* Footer */}
                <div style={{ textAlign: 'center' }}>
                    <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#3578de',
                            textDecoration: 'underline'
                        }}
                    >
                        {t('recordSpeech.reportIssue')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SpeechRecordScreen;
