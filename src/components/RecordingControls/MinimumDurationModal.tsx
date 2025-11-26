import React from "react";

interface Props {
  title: string;
  text: string;
  retryLabel: string;
  onClose: () => void;
}

const MinimumDurationModal: React.FC<Props> = ({ title, text, retryLabel, onClose }) => (
  <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 340, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", textAlign: "center" }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
      <p style={{ marginBottom: 24 }}>{text}</p>
      <button onClick={onClose} style={{ padding: "8px 24px", borderRadius: 6, background: "#3578de", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>{retryLabel}</button>
    </div>
  </div>
);

export default MinimumDurationModal;
