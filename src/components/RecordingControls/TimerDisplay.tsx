import React from "react";

interface TimerDisplayProps {
  seconds: number;
  formatTime?: (seconds: number) => string;
  style?: React.CSSProperties;
  color?: string;
}

const defaultFormatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds, formatTime = defaultFormatTime, style, color }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "16px 0" }}>
    <span style={{ fontSize: 24, fontWeight: 600, background: "#dde9ff", borderRadius: 8, padding: "8px 24px", color: color || undefined, ...(style || {}) }}>
      {formatTime(seconds)}
    </span>
  </div>
);

export default TimerDisplay;
