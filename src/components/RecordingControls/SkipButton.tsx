import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import i18n from "../../i18n";

type Props = {
  to: string;
  label: string;
  ariaLabel?: string;
  // optional custom state to pass to navigate; default is { skipped: true }
  state?: any;
};

const SkipButton: React.FC<Props> = ({ to, label, ariaLabel, state }) => {
  const isArabic = i18n.language === "ar";
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // search for nearest header in DOM; not perfect but works in current layout
    headerRef.current = document.querySelector("header") || document.querySelector("div[role=banner]");

    const place = () => {
      const skipEl = btnRef.current;
      if (!skipEl) return;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const defaultHeaderHeight = isMobile ? 56 : 64;
      const gap = isMobile ? 6 : 12;
      let headerBottom = defaultHeaderHeight;
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        if (rect && typeof rect.bottom === "number" && rect.bottom > 0) headerBottom = rect.bottom;
        else headerBottom = headerRef.current.offsetHeight || defaultHeaderHeight;
      }
      const top = Math.max(8, Math.round(headerBottom + gap));
      skipEl.style.position = "fixed";
      skipEl.style.top = `${top}px`;
      skipEl.style.zIndex = "2000";
      if (isArabic) {
        skipEl.style.left = "20px";
        skipEl.style.removeProperty("right");
      } else {
        skipEl.style.right = "20px";
        skipEl.style.removeProperty("left");
      }
      skipEl.style.direction = isArabic ? "rtl" : "ltr";
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("orientationchange", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("orientationchange", place);
    };
  }, [isArabic]);

  const handleClick = () => {
    // Use SPA navigation to preserve in-memory i18n state (avoid full page reload)
    navigate(to, { state: state ?? { skipped: true } });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      style={{
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        padding: "8px 16px",
        borderRadius: 4,
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      {label}
    </button>
  );
};

export default SkipButton;
