import React from "react";
import { useNavigate } from "react-router-dom";

// Assets
import keepDistance from "../../../../assets/images/keepDistance.png";
import mouthBreathDistance from "../../../../assets/images/mouthBreathDistance.png";
import BackIcon from "../../../../assets/icons/arrowLeft.svg";
import StartIcon from "../../../../assets/icons/start.svg";
import StopIcon from "../../../../assets/icons/stop.svg";
import UploadIcon from "../../../../assets/icons/upload.svg";

const BreathRecordScreen: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBack = (): void | Promise<void> => navigate(-1);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleContinue = () => {
    navigate("/upload-complete", {
      state: {
        audioFileUrl: "",
        filename: "Breath Recording",
        nextPage: "/confirmation",
      },
    });
  };

  return (
      <div
          style={{
            minHeight: "100vh",
            padding: "1.5rem 1rem",
            fontFamily: "Arial, sans-serif",
            display: "flex",
              fontSize: '14px',
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
                  top: 0,
                  left: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Go back"
            >
              <img src={BackIcon} alt="Back" width={24} height={24} />
            </button>
            <div
                style={{
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#3578de",
                }}
            >
              Record your breath
            </div>
          </div>

          <h3 style={{ fontSize: '32px',textAlign: "center", fontWeight: "bold", marginBottom: "2rem" }}>Instructions</h3>

          {/* Step 1 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
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
              Find a <strong>quiet place</strong> at least <strong>20 ft (6m)</strong> away from others. If you are
              feeling ill, please sit down.
            </div>
          </div>
          <img src={keepDistance} alt="Keep distance" style={{ width: "100%", marginBottom: "1.5rem" }} />

          {/* Step 2 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
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
              2
            </div>
            <div style={{ flex: 1, fontSize: "20px" }}>
              Hold the bottom of your device <strong>1–2 ft (30–60 cm)</strong> away from your mouth.
            </div>
          </div>
          <img
              src={mouthBreathDistance}
              alt="Device distance"
              style={{ width: "100%", marginBottom: "1.5rem" }}
          />

          {/* Step 3 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem" }}>
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
              3
            </div>
            <div style={{ flex: 1, fontSize: "20px" }}>
              Tap record. <strong>Breathe deeply and loudly</strong> into the phone <strong>3</strong> times. Then tap
              stop.
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
                <img src={StartIcon} alt="Start Recording" width={28} height={28} />
              </button>
              <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>Record</div>
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
                <img src={StopIcon} alt="Stop Recording" width={20} height={20} />
              </button>
              <div style={{ fontSize: "18px", marginTop: "0.5rem", color: "#666" }}>Stop</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
            <button
                onClick={handleContinue}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "1.5rem",
                  borderRadius: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
            >
              Continue
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
              <img
                  src={UploadIcon}
                  alt="Upload Icon"
                  width={22}
                  height={22}
                  style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }}
              />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>Upload your own file</span>
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
          <div style={{ textAlign: "center" }}>
            <a
                href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: "#3578de",
                  textDecoration: "underline",
                }}
            >
              Something wrong? Report an error
            </a>
          </div>
        </div>
      </div>
  );
};

export default BreathRecordScreen;
