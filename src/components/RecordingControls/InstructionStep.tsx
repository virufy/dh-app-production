import React from "react";

interface Props {
  step: string;
  children: React.ReactNode;
}

const InstructionStep: React.FC<Props> = ({ step, children }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#DDE9FF",
        color: "#3578de",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        marginInlineEnd: 12,
        flexShrink: 0,
      }}
    >
      {step}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export default InstructionStep;
