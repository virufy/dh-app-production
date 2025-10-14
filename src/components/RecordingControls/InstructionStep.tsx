import React from "react";

interface Props {
  step: string;
  children: React.ReactNode;
}

const InstructionStep: React.FC<Props> = ({ step, children }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3578de", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, marginRight: 12 }}>{step}</div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export default InstructionStep;
