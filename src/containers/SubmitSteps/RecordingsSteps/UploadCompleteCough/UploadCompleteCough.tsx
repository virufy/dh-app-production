// UploadCompleteCough.tsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PageWrapper,
  ContentWrapper,
  ControlsWrapper,
  Header,
  BackButton,
  HeaderTitle,
  Title,
  Subtitle,
  FileRow,
  Slider,
  TimeRow,
  PlayButton,
  CheckboxRow,
  Label,
  Checkbox,
  ButtonsWrapper,
  RetakeButton,
  SubmitButton,
  Footer,
  ErrorLink,
} from "./styles";

import ArrowLeftIcon from "../../../../assets/icons/arrowLeft.svg";
import PlayIcon from "../../../../assets/icons/play.svg";
import PauseIcon from "../../../../assets/icons/pause.svg";
import i18n from "../../../../i18n";
import { generateSignature } from "../../../../utils/signature";
import AppHeader from "../../../../components/AppHeader";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod";
const NAV_DELAY_MS = 2000; // brief pause so user can read success

type RecType = "cough" | "speech" | "breath" | "unknown";

async function blobUrlToBase64(url: string): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64: btoa(binary), contentType };
}

/* ==== Debug helper (prints raw UA and client hints) ==== */
async function logDeviceDebugInfo(): Promise<void> {
  try {
    console.log('[DeviceDebug] navigator.userAgent:', navigator.userAgent);
    // @ts-ignore
    const uad = navigator.userAgentData;
    console.log('[DeviceDebug] navigator.userAgentData (raw):', uad);
    // @ts-ignore
    if (uad && typeof uad.getHighEntropyValues === 'function') {
      try {
        // @ts-ignore
        const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
        console.log('[DeviceDebug] navigator.userAgentData.getHighEntropyValues:', high);
      } catch (err) {
        console.warn('[DeviceDebug] getHighEntropyValues failed:', err);
      }
    }
  } catch (err) {
    console.warn('[DeviceDebug] error reading navigator info:', err);
  }
}

/* ==== Async device name extractor (uses Client Hints when available) ==== */
async function getDeviceName(): Promise<string> {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  try {
    // @ts-ignore
    const uad = navigator.userAgentData;
    // @ts-ignore
    if (uad && typeof uad.getHighEntropyValues === 'function') {
      try {
        // @ts-ignore
        const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
        const model = (high?.model || '').toString().trim();
        const plat = (high?.platform || '').toString().trim();
        if (model) {
          const brandMap: Array<[RegExp, string]> = [
            [/^\s*SM-/i, 'Samsung'],
            [/samsung/i, 'Samsung'],
            [/redmi|mi|poco|mix/i, 'Xiaomi'],
            [/oneplus/i, 'OnePlus'],
            [/huawei|honor/i, 'Huawei'],
            [/vivo/i, 'Vivo'],
            [/oppo/i, 'Oppo'],
            [/pixel/i, 'Google'],
          ];
          const brandEntry = brandMap.find(([rx]) => rx.test(model));
          return (brandEntry ? `${brandEntry[1]} ${model}` : model).slice(0, 200);
        }
        if (plat) {
          // @ts-ignore
          const brands = Array.isArray(uad.brands) ? uad.brands.map((b: any) => String(b.brand).replace(/[^A-Za-z0-9 .\-]/g, '').trim()) : [];
          const brandChoice = brands.find((b: string) => /Chrome|Chromium|Firefox|Edge|Safari|Opera/i.test(b)) || brands[brands.length - 1] || '';
          const basic = [plat, brandChoice].filter(Boolean).join(' ').trim();
          if (basic) return basic.slice(0, 200);
        }
      } catch (err) { }
    }
  } catch (e) { }

  const androidMatch = ua.match(/Android[^;]*;\s*([^;()]+?)\s*(?:Build\/|\))/i);
  if (androidMatch && androidMatch[1]) {
    const rawModel = androidMatch[1].trim();
    const model = rawModel.replace(/\b(wv|mobile|tablet)\b/gi, '').trim().slice(0, 120);
    const brandMap: Array<[RegExp, string]> = [
      [/^\s*SM-/i, 'Samsung'],
      [/samsung/i, 'Samsung'],
      [/redmi|mi|poco|mix/i, 'Xiaomi'],
      [/oneplus/i, 'OnePlus'],
      [/huawei|honor/i, 'Huawei'],
      [/vivo/i, 'Vivo'],
      [/oppo/i, 'Oppo'],
      [/pixel/i, 'Google'],
    ];
    const brandEntry = brandMap.find(([rx]) => rx.test(model));
    return (brandEntry ? `${brandEntry[1]} ${model}` : model) || 'Unknown Device';
  }

  if (/iPhone/i.test(ua)) return 'Apple iPhone';
  if (/iPad/i.test(ua)) return 'Apple iPad';
  if (/Macintosh/i.test(ua)) return 'Apple Mac';

  const desktopMap: Array<[RegExp, string]> = [
    [/Win/i, 'Windows PC'],
    [/Mac/i, 'Apple Mac'],
    [/Linux/i, 'Linux PC'],
  ];
  const desktop = desktopMap.find(([rx]) => rx.test(platform));
  if (desktop) return desktop[1];

  return 'Unknown Device';
}

/* ==== New User-Agent generator ==== */
async function generateUserAgent(): Promise<string> {
  const deviceName = await getDeviceName();
  const ua = navigator.userAgent || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua) || (deviceName.includes('Tab') && /Android/i.test(deviceName));
  const isDesktop = !isMobile && !isTablet;

  // Browser versions (modern, realistic)
  const chromeVersions = ['114.0.5735.196', '120.0.6099.144', '122.0.6261.94'];
  const safariVersions = ['604.1', '605.1.15'];
  const iosVersions = ['17_5', '18_0'];
  const androidVersions = ['11', '12', '13', '14'];

  // Randomize versions for variety
  const randomChrome = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  const randomSafari = safariVersions[Math.floor(Math.random() * safariVersions.length)];
  const randomAndroid = androidVersions[Math.floor(Math.random() * androidVersions.length)];
  const randomIos = iosVersions[Math.floor(Math.random() * iosVersions.length)];

  // Android devices
  if (deviceName.includes('Android') || /Android/i.test(ua)) {
    const modelMatch = deviceName.match(/(Samsung|Google|Xiaomi|OnePlus|Huawei|Vivo|Oppo)\s+(.+)/i);
    const model = modelMatch ? modelMatch[2] : deviceName.replace('Android', '').trim();
    return `Mozilla/5.0 (Linux; Android ${randomAndroid}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Mobile Safari/537.36`;
  }

  // iOS devices (iPhone/iPad)
  if (deviceName.includes('iPhone')) {
    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${randomIos} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${randomIos.replace('_', '.')} Mobile/15E148 Safari/${randomSafari}`;
  }
  if (deviceName.includes('iPad')) {
    return `Mozilla/5.0 (iPad; CPU OS ${randomIos} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${randomIos.replace('_', '.')} Mobile/15E148 Safari/${randomSafari}`;
  }

  // Desktop devices
  if (deviceName.includes('Windows PC')) {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
  }
  if (deviceName.includes('Apple Mac')) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/${randomSafari}`;
  }
  if (deviceName.includes('Linux PC')) {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
  }

  // Fallback for unknown devices
  return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
}

const UploadCompleteCough: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const { t } = useTranslation();

  const [involuntary, setInvoluntary] = useState(false);
  const {
    audioFileUrl,
    filename = t("uploadComplete.filename"),
    nextPage,
    patientId,
    recordingType,
    skipped
  } = (location.state as {
    audioFileUrl?: string;
    filename?: string;
    nextPage?: string;
    patientId?: string;
    recordingType?: RecType;
    skipped?: boolean;
  }) || {};

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const storedPatientId = patientId || sessionStorage.getItem("patientId") || "";
  
  // Use recordingType from state if available, fallback to filename inference, then route
  let finalRecordingType: RecType =
    recordingType && recordingType !== "unknown"
      ? recordingType
      : (() => {
          const lower = String(filename || "").toLowerCase();
          if (lower.includes("speech")) return "speech";
          if (lower.includes("breath")) return "breath";
          if (lower.includes("cough")) return "cough";
          return "unknown";
        })();

  if (finalRecordingType === "unknown") {
    const path = location.pathname?.toLowerCase() || "";
    if (path.includes("speech")) finalRecordingType = "speech";
    else if (path.includes("breath")) finalRecordingType = "breath";
    else if (path.includes("cough")) finalRecordingType = "cough";
    else finalRecordingType = "cough";
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        const fix = () => {
          audio.currentTime = 1e101;
          audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            setDuration(audio.duration || 0);
            audio.currentTime = 0;
          };
        };
        fix();
      }
      setCurrentTime(audio.currentTime || 0);
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handleError = () => {
      setErrMsg(audio.error?.message || "Cannot play audio.");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioFileUrl]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioFileUrl) {
      setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
      return;
    }
    try {
      if (audio.paused) {
        if (audio.readyState < 2) audio.load();
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (e) {
      console.error("Error playing audio:", e);
      setErrMsg("Playback failed. Try again or re-record.");
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleBack = () => navigate(-1);
  const handleRetake = () => navigate(-1);

  const handleSubmit = async () => {
    if (process.env.NODE_ENV !== 'production') {
      logDeviceDebugInfo().catch(() => { });
    }
    const deviceName = await getDeviceName();
    // Generate User-Agent for the request
    const userAgent = await generateUserAgent();

    if (!nextPage) {
      console.error("No nextPage provided in state");
      return;
    }
    if (!audioFileUrl) {
      setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
      return;
    }
    if (!storedPatientId) {
      setErrMsg("Patient ID missing from earlier step. Please go back and enter the ID.");
      return;
    }

    setUploadErr(null);
    setSuccessMsg(null);
    setIsUploading(true);

    try {
      const { base64 } = await blobUrlToBase64(audioFileUrl);
      const timestamp = new Date().toISOString();
      // Use filename from state if it matches expected format, else generate new
      const generatedFilename = filename && filename.includes(finalRecordingType)
        ? filename
        : `${storedPatientId}-${capitalize(finalRecordingType)}-${timestamp.replace(/\..*Z$/, "").replace(/:/g, "-")}.wav`;

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DeviceDebug] resolved deviceName:', deviceName);
        console.log('[DeviceDebug] generated userAgent:', userAgent);
        console.log('[DeviceDebug] audioType:', finalRecordingType);
        console.log('[DeviceDebug] filename:', generatedFilename);
      }

      const signature = await generateSignature();
      console.log("Signature before fetch:", signature, typeof signature);

      const res = await fetch(`${API_BASE}/cough-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-unique-signature": signature,
          "User-Agent": userAgent, // Add generated User-Agent to headers
        },
        body: JSON.stringify({
          patientId: storedPatientId,
          filename: generatedFilename,
          timestamp,
          audioType: finalRecordingType,
          audioBase64: base64,
          deviceName,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          (t("uploadComplete.uploadError") || "Upload failed.") +
          (txt ? ` – ${txt}` : ` (${res.status})`)
        );
      }

      setSuccessMsg("Successfully uploaded.");

      setTimeout(() => {
        const nextNextPage = getNextStep(nextPage);
        navigate(nextPage, { state: { nextPage: nextNextPage } });
      }, NAV_DELAY_MS);
    } catch (e: any) {
      console.error("Upload error:", e);
      setUploadErr(
        e?.message === "Failed to fetch"
          ? t("uploadComplete.networkError") || "Network error: Unable to reach the server."
          : e?.message || t("uploadComplete.uploadError") || "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getNextStep = (currentPage: string) => {
    switch (currentPage) {
      case "/record-speech":
        return "/upload-complete";
      case "/record-breath":
        return "/upload-complete";
      default:
        return "/confirmation";
    }
  };

  return (
   <>
         < AppHeader maxWidth={490} locale={isArabic ? "ar" : "en"}/> 
    <PageWrapper>
      <ContentWrapper>
        <audio ref={audioRef} src={audioFileUrl || ""} preload="auto" />
        <ControlsWrapper>
          <Header>
            <BackButton onClick={handleBack} isArabic={isArabic}>
              <img
                src={ArrowLeftIcon}
                alt={t("uploadComplete.backAlt")}
                width={24}
                height={24}
                style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
              />
            </BackButton>
            <HeaderTitle>{t("uploadComplete.title")}</HeaderTitle>
          </Header>

          <Title>{t("uploadComplete.subtitle")}</Title>
          <Subtitle>{t("uploadComplete.description")}</Subtitle>

          {!audioFileUrl && !skipped && (
            <Subtitle style={{ color: "#b00", fontWeight: 600 }}>
              {t("uploadComplete.noAudio")}
            </Subtitle>
          )}

          <FileRow>
            <span>{filename}</span>
            <span
              style={{ fontSize: "20px", cursor: "pointer", alignSelf: "center" }}
              onClick={handleBack}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleBack()}
              aria-label={t("uploadComplete.closeAria")}
            >
              ✕
            </span>
          </FileRow>

          <Slider
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            step="0.1"
            onChange={handleSeek}
            aria-label={t("uploadComplete.sliderAria")}
            disabled={!audioFileUrl || duration === 0}
          />

          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
          </TimeRow>

          {errMsg && (
            <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
              {errMsg}
            </div>
          )}

          {isUploading && (
            <div style={{ color: "#555", marginTop: 8 }}>
              {t("uploadComplete.uploading", "Uploading...")}
            </div>
          )}
          {uploadErr && (
            <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
              {uploadErr}
            </div>
          )}
          {successMsg && (
            <div style={{ color: "#0a0", marginTop: 8, fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
        </ControlsWrapper>

        <PlayButton onClick={handlePlayPause} disabled={!audioFileUrl || duration === 0 || isUploading}>
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
            width="45"
            height="45"
            style={isPlaying ? {} : { marginLeft: "0.3rem" }}
          />
        </PlayButton>

        <ButtonsWrapper>
          <RetakeButton onClick={handleRetake} disabled={isUploading}>
            {t("uploadComplete.retake")}
          </RetakeButton>
          {/* {finalRecordingType === "cough" && (
            <CheckboxRow>
              <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
              <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
            </CheckboxRow>
          )} */}
          <SubmitButton onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? t("uploadComplete.submitting", "Submitting...") : t("uploadComplete.submit")}
          </SubmitButton>
        </ButtonsWrapper>

        <Footer>
          <ErrorLink
            href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("uploadComplete.report")}
          </ErrorLink>
        </Footer>
      </ContentWrapper>
    </PageWrapper>
</>
  );
};

export default UploadCompleteCough;
















// // UploadCompleteCough.tsx
// import React, { useRef, useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// import {
//   PageWrapper,
//   ContentWrapper,
//   ControlsWrapper,
//   Header,
//   BackButton,
//   HeaderTitle,
//   Title,
//   Subtitle,
//   FileRow,
//   Slider,
//   TimeRow,
//   PlayButton,
//   CheckboxRow,
//   Label,
//   Checkbox,
//   ButtonsWrapper,
//   RetakeButton,
//   SubmitButton,
//   Footer,
//   ErrorLink,
// } from "./styles";

// import ArrowLeftIcon from "../../../../assets/icons/arrowLeft.svg";
// import PlayIcon from "../../../../assets/icons/play.svg";
// import PauseIcon from "../../../../assets/icons/pause.svg";
// import i18n from "../../../../i18n";
// import { generateSignature } from "../../../../utils/signature";

// /* ==== lossless upload config (added) ==== */
// /* ==== lossless upload config (added) ==== */
// const API_BASE =
//   process.env.REACT_APP_API_BASE ??
//   "https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod";
// const NAV_DELAY_MS = 2000; // brief pause so user can read success

// type RecType = "cough" | "speech" | "breath" | "unknown";

// /* Convert a blob: URL to base64 (no data: prefix) */
// async function blobUrlToBase64(url: string): Promise<{ base64: string; contentType: string }> {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
//   const contentType = res.headers.get("Content-Type") || "audio/wav";
//   const buf = await res.arrayBuffer();
//   const bytes = new Uint8Array(buf);
//   let binary = "";
//   for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
//   return { base64: btoa(binary), contentType };
// }

// /* ==== debug helper (prints raw UA and client hints) ==== */
// async function logDeviceDebugInfo(): Promise<void> {
//   try {
//     // always log raw UA (useful)
//     console.log('[DeviceDebug] navigator.userAgent:', navigator.userAgent);

//     // client hints object (may be undefined)
//     // @ts-ignore
//     const uad = navigator.userAgentData;
//     console.log('[DeviceDebug] navigator.userAgentData (raw):', uad);

//     // If client hints support high-entropy values, log them too
//     // NOTE: this may prompt the browser to allow returning more fields in some contexts
//     // @ts-ignore
//     if (uad && typeof uad.getHighEntropyValues === 'function') {
//       try {
//         // request model/platform/platformVersion to inspect exact strings
//         // @ts-ignore
//         const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
//         console.log('[DeviceDebug] navigator.userAgentData.getHighEntropyValues:', high);
//       } catch (err) {
//         console.warn('[DeviceDebug] getHighEntropyValues failed:', err);
//       }
//     }
//   } catch (err) {
//     console.warn('[DeviceDebug] error reading navigator info:', err);
//   }
// }

// /* ==== async device name extractor (uses Client Hints when available) ==== */
// async function getDeviceName(): Promise<string> {
//   if (typeof navigator === 'undefined') return 'Unknown Device';
//   const ua = navigator.userAgent || '';
//   const platform = navigator.platform || '';

//   // 1) Try Client Hints high-entropy model on supported Chromium
//   try {
//     // @ts-ignore
//     const uad = navigator.userAgentData;
//     // Ensure getHighEntropyValues exists
//     // @ts-ignore
//     if (uad && typeof uad.getHighEntropyValues === 'function') {
//       try {
//         // request model and platform info
//         // @ts-ignore
//         const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
//         // high.model is often a marketed string (e.g., "SM-A115F" or "Pixel 6")
//         const model = (high?.model || '').toString().trim();
//         const plat = (high?.platform || '').toString().trim();
//         if (model) {
//           // brand heuristics: try to prefix with common brand names if model contains recognizable token
//           const brandMap: Array<[RegExp, string]> = [
//             [/^\s*SM-/i, 'Samsung'],
//             [/samsung/i, 'Samsung'],
//             [/redmi|mi|poco|mix/i, 'Xiaomi'],
//             [/oneplus/i, 'OnePlus'],
//             [/huawei|honor/i, 'Huawei'],
//             [/vivo/i, 'Vivo'],
//             [/oppo/i, 'Oppo'],
//             [/pixel/i, 'Google'],
//           ];
//           const brandEntry = brandMap.find(([rx]) => rx.test(model));
//           return (brandEntry ? `${brandEntry[1]} ${model}` : model).slice(0, 200);
//         }
//         // If model empty but platform present, use platform + brand fallback
//         if (plat) {
//           // e.g. "Android" + brand from brands array (cleaned)
//           // @ts-ignore
//           const brands = Array.isArray(uad.brands) ? uad.brands.map((b: any) => String(b.brand).replace(/[^A-Za-z0-9 .\-]/g, '').trim()) : [];
//           const brandChoice = brands.find((b: string) => /Chrome|Chromium|Firefox|Edge|Safari|Opera/i.test(b)) || brands[brands.length - 1] || '';
//           const basic = [plat, brandChoice].filter(Boolean).join(' ').trim();
//           if (basic) return basic.slice(0, 200);
//         }
//       } catch (err) {
//         // getHighEntropyValues may throw (permissions or unsupported); ignore and fall back
//         // console.warn('[DeviceDebug] getHighEntropyValues error', err);
//       }
//     }
//   } catch (e) {
//     // ignore client-hints errors
//   }

//   // 2) Android UA fallback: extract model fragment before Build/
//   const androidMatch = ua.match(/Android[^;]*;\s*([^;()]+?)\s*(?:Build\/|\))/i);
//   if (androidMatch && androidMatch[1]) {
//     const rawModel = androidMatch[1].trim();
//     const model = rawModel.replace(/\b(wv|mobile|tablet)\b/gi, '').trim().slice(0, 120);

//     // brand heuristics
//     const brandMap: Array<[RegExp, string]> = [
//       [/^\s*SM-/i, 'Samsung'],
//       [/samsung/i, 'Samsung'],
//       [/redmi|mi|poco|mix/i, 'Xiaomi'],
//       [/oneplus/i, 'OnePlus'],
//       [/huawei|honor/i, 'Huawei'],
//       [/vivo/i, 'Vivo'],
//       [/oppo/i, 'Oppo'],
//       [/pixel/i, 'Google'],
//     ];
//     const brandEntry = brandMap.find(([rx]) => rx.test(model));
//     return (brandEntry ? `${brandEntry[1]} ${model}` : model) || 'Unknown Device';
//   }

//   // 3) iOS / Apple detection
//   if (/iPhone/i.test(ua)) return 'Apple iPhone';
//   if (/iPad/i.test(ua)) return 'Apple iPad';
//   if (/Macintosh/i.test(ua)) return 'Apple Mac';

//   // 4) Desktop simple mapping based on platform
//   const desktopMap: Array<[RegExp, string]> = [
//     [/Win/i, 'Windows PC'],
//     [/Mac/i, 'Apple Mac'],
//     [/Linux/i, 'Linux PC'],
//   ];
//   const desktop = desktopMap.find(([rx]) => rx.test(platform));
//   if (desktop) return desktop[1];

//   // final fallback
//   return 'Unknown Device';
// }



// const UploadCompleteCough: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const isArabic = i18n.language === "ar";
//   const { t } = useTranslation();

//   // Add involuntary state for cough checkbox
//   const [involuntary, setInvoluntary] = useState(false);

//   const { audioFileUrl, filename = t("uploadComplete.filename"), nextPage, patientId, recordingType, skipped } =
//     (location.state as {
//       audioFileUrl?: string;
//       filename?: string;
//       nextPage?: string;
//       patientId?: string;
//       recordingType?: RecType;
//       skipped?: boolean;
//     }) || {};

//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [errMsg, setErrMsg] = useState<string | null>(null);

//   /* ==== lossless upload flags (added, non-breaking) ==== */
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadErr, setUploadErr] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   /* ==== derive patientId and recordingType like your backend version ==== */
//   // patientId in sessionStorage is now CNM_PatientID (e.g., BHC_12345 or NAH_12345)
//   const storedPatientId = patientId || sessionStorage.getItem("patientId") || "";

//   // infer type from route/prop/filename
//   const path = location.pathname?.toLowerCase() || "";
//   const routeType: RecType =
//     path.includes("speech") ? "speech" :
//       path.includes("breath") ? "breath" :
//         path.includes("cough") ? "cough" : "unknown";

//   let finalRecordingType: RecType =
//     recordingType && recordingType !== "unknown" ? recordingType :
//       routeType !== "unknown" ? routeType :
//         ((): RecType => {
//           const lower = String(filename || "").toLowerCase();
//           if (lower.includes("speech")) return "speech";
//           if (lower.includes("breath")) return "breath";
//           if (lower.includes("cough")) return "cough";
//           return "unknown";
//         })();

//   if (finalRecordingType === "unknown") finalRecordingType = "cough";

//   useEffect(() => {
//     const audio = audioRef.current;
//     if (!audio) return;

//     const handleLoadedMetadata = () => {
//       if (isFinite(audio.duration)) {
//         setDuration(audio.duration);
//       } else {
//         // force duration calculation for some blob URLs
//         const fix = () => {
//           audio.currentTime = 1e101;
//           audio.ontimeupdate = () => {
//             audio.ontimeupdate = null;
//             setDuration(audio.duration || 0);
//             audio.currentTime = 0;
//           };
//         };
//         fix();
//       }
//       setCurrentTime(audio.currentTime || 0);
//     };

//     const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
//     const handlePlay = () => setIsPlaying(true);
//     const handlePause = () => setIsPlaying(false);
//     const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
//     const handleError = () => {
//       setErrMsg(audio.error?.message || "Cannot play audio.");
//       setIsPlaying(false);
//     };

//     audio.addEventListener("loadedmetadata", handleLoadedMetadata);
//     audio.addEventListener("timeupdate", handleTimeUpdate);
//     audio.addEventListener("play", handlePlay);
//     audio.addEventListener("pause", handlePause);
//     audio.addEventListener("ended", handleEnded);
//     audio.addEventListener("error", handleError);

//     if (audio.readyState >= 1) handleLoadedMetadata();

//     return () => {
//       audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
//       audio.removeEventListener("timeupdate", handleTimeUpdate);
//       audio.removeEventListener("play", handlePlay);
//       audio.removeEventListener("pause", handlePause);
//       audio.removeEventListener("ended", handleEnded);
//       audio.removeEventListener("error", handleError);
//     };
//   }, [audioFileUrl]);

//   const formatTime = (seconds: number) => {
//     if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
//   };

//   const handlePlayPause = async () => {
//     const audio = audioRef.current;
//     if (!audio || !audioFileUrl) {
//       setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
//       return;
//     }
//     try {
//       if (audio.paused) {
//         if (audio.readyState < 2) audio.load();
//         await audio.play(); // await to catch iOS rejections
//       } else {
//         audio.pause(); // isPlaying will update via 'pause' event
//       }
//     } catch (e) {
//       console.error("Error playing audio:", e);
//       setErrMsg("Playback failed. Try again or re-record.");
//       setIsPlaying(false);
//     }
//   };

//   const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newTime = parseFloat(e.target.value);
//     if (audioRef.current) {
//       audioRef.current.currentTime = newTime;
//       setCurrentTime(newTime);
//     }
//   };

//   const handleBack = () => navigate(-1);
//   const handleRetake = () => navigate(-1);

//   /* ==== lossless upload in handleSubmit (added) ==== */
//   /* ==== lossless upload in handleSubmit (fixed) ==== */
//   const handleSubmit = async () => {
//     // Optional dev-only debug logging (prints raw UA to console for inspection)
//     if (process.env.NODE_ENV !== 'production') {
//       logDeviceDebugInfo().catch(() => { });
//     }

//     // Use async extractor to get a clean device name (e.g. "Samsung SM-A115F")
//     const deviceName = await getDeviceName();

//     if (!nextPage) {
//       console.error("No nextPage provided in state");
//       return;
//     }
//     if (!audioFileUrl) {
//       setErrMsg(t("uploadComplete.noAudio", "No audio attached. Go back and record/upload a file."));
//       return;
//     }
//     if (!storedPatientId) {
//       setErrMsg("Patient ID missing from earlier step. Please go back and enter the ID.");
//       return;
//     }

//     setUploadErr(null);
//     setSuccessMsg(null);
//     setIsUploading(true);

//     try {
//       // Convert current blob URL (lossless WAV from recorder) to base64
//       const { base64 } = await blobUrlToBase64(audioFileUrl);

//       const timestamp = new Date().toISOString();
//       const generatedFilename = `${storedPatientId}/${finalRecordingType}-${timestamp}.flac`;

//       // Debug: print resolved deviceName (dev only)
//       if (process.env.NODE_ENV !== 'production') {
//         console.log('[DeviceDebug] resolved deviceName (used in payload):', deviceName);
//       }

//       const signature = await generateSignature();
//       console.log("Signature before fetch:", signature, typeof signature);

//       const res = await fetch(`${API_BASE}/cough-upload`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", "x-unique-signature": signature },
//         body: JSON.stringify({
//           patientId: storedPatientId,
//           filename: generatedFilename,
//           timestamp,
//           audioType: finalRecordingType,
//           audioBase64: base64, // base64 WAV payload; backend can transcode to FLAC
//           deviceName,
//         }),
//       });

//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         throw new Error(
//           (t("uploadComplete.uploadError") || "Upload failed.") +
//           (txt ? ` – ${txt}` : ` (${res.status})`)
//         );
//       }

//       setSuccessMsg("Successfully uploaded.");

//       // Small pause so the user sees success, then proceed like your original
//       setTimeout(() => {
//         const nextNextPage = getNextStep(nextPage);
//         navigate(nextPage, { state: { nextPage: nextNextPage } });
//       }, NAV_DELAY_MS);
//     } catch (e: any) {
//       console.error("Upload error:", e);
//       setUploadErr(
//         e?.message === "Failed to fetch"
//           ? t("uploadComplete.networkError") || "Network error: Unable to reach the server."
//           : e?.message || t("uploadComplete.uploadError") || "Upload failed."
//       );
//     } finally {
//       setIsUploading(false);
//     }
//   };


//   const getNextStep = (currentPage: string) => {
//     switch (currentPage) {
//       case "/record-speech":
//         return "/upload-complete";
//       case "/record-breath":
//         return "/upload-complete";
//       default:
//         return "/confirmation";
//     }
//   };

//   return (
//     <PageWrapper>
//       <ContentWrapper>
//         <audio ref={audioRef} src={audioFileUrl || ""} preload="auto" />

//         <ControlsWrapper>
//           <Header>
//             <BackButton onClick={handleBack} isArabic={isArabic}>
//               <img
//                 src={ArrowLeftIcon}
//                 alt={t("uploadComplete.backAlt")}
//                 width={24}
//                 height={24}
//                 style={{ transform: isArabic ? "rotate(180deg)" : "none" }}
//               />
//             </BackButton>
//             <HeaderTitle>{t("uploadComplete.title")}</HeaderTitle>
//           </Header>

//           <Title>{t("uploadComplete.subtitle")}</Title>
//           <Subtitle>{t("uploadComplete.description")}</Subtitle>

//           {!audioFileUrl && !skipped && (
//             <Subtitle style={{ color: "#b00", fontWeight: 600 }}>
//               {t("uploadComplete.noAudio")}
//             </Subtitle>
//           )}

//           <FileRow>
//             <span>{filename}</span>
//             <span
//               style={{ fontSize: "20px", cursor: "pointer", alignSelf: "center" }}
//               onClick={handleBack}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleBack()}
//               aria-label={t("uploadComplete.closeAria")}
//             >
//               ✕
//             </span>
//           </FileRow>

//           <Slider
//             type="range"
//             min="0"
//             max={duration || 0}
//             value={currentTime}
//             step="0.1"
//             onChange={handleSeek}
//             aria-label={t("uploadComplete.sliderAria")}
//             disabled={!audioFileUrl || duration === 0}
//           />

//           <TimeRow>
//             <span>{formatTime(currentTime)}</span>
//             <span>- {formatTime(Math.max(duration - currentTime, 0))}</span>
//           </TimeRow>

//           {errMsg && (
//             <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
//               {errMsg}
//             </div>
//           )}

//           {/* upload status (added, non-breaking) */}
//           {isUploading && (
//             <div style={{ color: "#555", marginTop: 8 }}>
//               {t("uploadComplete.uploading", "Uploading...")}
//             </div>
//           )}
//           {uploadErr && (
//             <div style={{ color: "#b00", marginTop: 8, fontWeight: 600 }}>
//               {uploadErr}
//             </div>
//           )}
//           {successMsg && (
//             <div style={{ color: "#0a0", marginTop: 8, fontWeight: 600 }}>
//               {successMsg}
//             </div>
//           )}
//         </ControlsWrapper>

//         <PlayButton onClick={handlePlayPause} disabled={!audioFileUrl || duration === 0 || isUploading}>
//           <img
//             src={isPlaying ? PauseIcon : PlayIcon}
//             alt={isPlaying ? t("uploadComplete.pause") : t("uploadComplete.play")}
//             width="45"
//             height="45"
//             style={isPlaying ? {} : { marginLeft: "0.3rem" }}
//           />
//         </PlayButton>




//         <ButtonsWrapper>
//           <RetakeButton onClick={handleRetake} disabled={isUploading}>
//             {t("uploadComplete.retake")}
//           </RetakeButton>
//           {/* Show involuntary checkbox only for cough recording */}
//           {finalRecordingType === "cough" && (
//             <CheckboxRow>
//               <Label htmlFor="involuntary" style={{ userSelect: "none" }}>{t("recordCough.checkboxLabel")}</Label>
//               <Checkbox id="involuntary" type="checkbox" checked={involuntary} onChange={() => setInvoluntary(!involuntary)} style={{ cursor: "pointer" }} />
//             </CheckboxRow>
//           )}
//           <SubmitButton onClick={handleSubmit} disabled={isUploading}>
//             {isUploading ? t("uploadComplete.submitting", "Submitting...") : t("uploadComplete.submit")}
//           </SubmitButton>
//         </ButtonsWrapper>

//         <Footer>
//           <ErrorLink
//             href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             {t("uploadComplete.report")}
//           </ErrorLink>
//         </Footer>
//       </ContentWrapper>
//     </PageWrapper>
//   );
// };
// export default UploadCompleteCough;