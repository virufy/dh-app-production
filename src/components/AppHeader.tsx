import React, { useEffect, useMemo, useState, useCallback } from "react";

export type Locale = "en" | "ar";

export type AppHeaderProps = {
  /** Optional override for the patient id (takes precedence over sessionStorage) */
  patientId?: string | null;
  /** Show the "Patient ID" label next to the badge */
  showPatientLabel?: boolean;
  /** Locale for translations and direction. Defaults to 'en'. */
  locale?: Locale;
  /** Optional max width for the inner container */
  maxWidth?: number | string;
};

// --- Simple i18n dictionary (keeps component self-contained) ---
const DICT: Record<Locale, { patientLabel: string; noPatient: string; appHeaderAria: string }> = {
  en: { patientLabel: "Patient ID:", noPatient: "No Patient ID", appHeaderAria: "Application header" },
  ar: { patientLabel: "معرّف المريض:", noPatient: "لا يوجد معرف مريض", appHeaderAria: "رأس التطبيق" },
};

// --- Styles (kept as JS objects for portability) ---
const outerHeaderStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1200,
  // keep the outer header transparent so the colored bar can be constrained
  background: "transparent",
  display: "flex",
  justifyContent: "center",
};

// This is the constrained bar that will appear as the "header" and be centered on large screens
const constrainedBarBase: React.CSSProperties = {
  background: "#3578DE",
  color: "white",
  height: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
  padding: "0 12px",
  width: "100%", // will be constrained by container's maxWidth
  maxWidth: 600,
};

const innerBase: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

const badgeBase: React.CSSProperties = {
  background: "transparent",
  padding: "6px 10px",
  borderRadius: 6,
  color: "white",
  fontWeight: 700,
  fontSize: 13,
  border: "none",
};

const labelBase: React.CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: 13,
  fontWeight: 600,
};

/**
 * AppHeader
 * - bilingual (English / Arabic) with proper direction handling
 * - listens to sessionStorage changes and prop updates
 * - accessible (aria-label, aria-live for patient id updates)
 * - constrained bar: the colored header bar is centered and limited to `maxWidth` (desktop)
 */
export default function AppHeader({
  patientId: propPid = null,
  showPatientLabel = true,
  locale = "en",
  maxWidth = 960,
}: AppHeaderProps) {
  // Prefer propPid if provided, otherwise read from sessionStorage
  const [pid, setPid] = useState<string | null>(() => {
    if (propPid) return propPid;
    try {
      return sessionStorage.getItem("patientId") || null;
    } catch {
      return null;
    }
  });

  // Memoized translations
  const t = useMemo(() => DICT[locale] ?? DICT.en, [locale]);

  // Keep in sync if parent passes updated prop
  useEffect(() => {
    if (propPid !== undefined && propPid !== null) {
      setPid(propPid);
    }
  }, [propPid]);

  // Sync with sessionStorage changes from other tabs or code
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== sessionStorage) return; // guard
      if (e.key === "patientId") {
        setPid(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Clicking the badge copies the patient id to clipboard (nice UX addition)
  const onBadgeClick = useCallback(() => {
    if (!pid) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pid).catch(() => {});
    }
  }, [pid]);

  const direction: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  // Compose styles with direction and maxWidth
  const headerStyle: React.CSSProperties = useMemo(
    () => ({ ...outerHeaderStyle }),
    []
  );
  const constrainedBarStyle: React.CSSProperties = useMemo(
    () => ({ ...constrainedBarBase, direction, maxWidth, margin: "0 auto" }),
    [direction, maxWidth]
  );
  const innerStyle: React.CSSProperties = useMemo(
    () => ({ ...innerBase, padding: "0 8px" }),
    []
  );

  const content = pid ? (
    <>
      {showPatientLabel && (
        <span style={{ ...labelBase }} aria-hidden={false}>
          {t.patientLabel}
        </span>
      )}
      <button
        type="button"
        onClick={onBadgeClick}
        title={locale === "ar" ? "انسخ معرف المريض" : "Copy patient ID"}
        style={{
          ...badgeBase,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
        aria-label={locale === "ar" ? `معرّف المريض ${pid}` : `Patient ID ${pid}`}
      >
        <span>{pid}</span>
      </button>
    </>
  ) : (
    <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{t.noPatient}</span>
  );

  return (
    <header role="banner" aria-label={t.appHeaderAria} style={headerStyle}>
      <div style={constrainedBarStyle}>
        <div style={innerStyle} aria-live="polite">
          {content}
        </div>
      </div>
    </header>
  );
}
