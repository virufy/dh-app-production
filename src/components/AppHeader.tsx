import React, { useEffect, useState } from "react";

export type AppHeaderProps = {
  patientId?: string | null; // optional override
  showPatientLabel?: boolean;
  isArabic?: boolean;
};

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1200,
  background: "#1e60d8", // blue bar like screenshot
  color: "white",
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
  padding: "0 12px",
};

const innerStyle: React.CSSProperties = {
  maxWidth: 960,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};

const badgeStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  padding: "6px 10px",
  borderRadius: 6,
  color: "white",
  fontWeight: 700,
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: 13,
  fontWeight: 600,
};

export default function AppHeader({ patientId: propPid, showPatientLabel = true, isArabic = false }: AppHeaderProps) {
  const [pid, setPid] = useState<string | null>(() => {
    // Prefer prop if provided, otherwise read from sessionStorage
    if (propPid) return propPid;
    try {
      return sessionStorage.getItem("patientId") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // If parent passes updated prop, reflect it
    if (propPid) setPid(propPid);
  }, [propPid]);

  useEffect(() => {
    // Keep in sync with other tabs / code that sets sessionStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "patientId") {
        setPid(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const content = pid ? (
    <>
      {showPatientLabel && <span style={labelStyle}>Patient ID :</span>}
      <span style={badgeStyle}>{pid}</span>
    </>
  ) : (
    <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>No Patient ID</span>
  );

  return (
    <header style={{ ...headerStyle, direction: isArabic ? "rtl" : "ltr" }} aria-hidden={false}>
      <div style={innerStyle}>{content}</div>
    </header>
  );
}
