// import React, { useState, useEffect } from 'react';
// import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { generateSignature } from "../../utils/signature";
// import AppHeader from '../../components/AppHeader';
// import {
//   pageContainer,
//   title,
//   fieldLabel,
//   fieldInput,
//   dropdown,
//   buttonCircle,
//   buttonContainer,
//   arrowIcon,
//   logoStyle,
// } from './style';

// const API_BASE =
//   process.env.REACT_APP_API_BASE ??
//   'https://x0ia47e70k.execute-api.me-central-1.amazonaws.com/prod';

// const Clinical_Login: React.FC = () => {
//   const { t, i18n } = useTranslation();
//   const [backendPatientFull, setBackendPatientFull] = useState<string>('');
//   const [displayPatientFull, setDisplayPatientFull] = useState<string>('');
//   const [hospitalCode, setHospitalCode] = useState<string>('AB');
//   const [error, setError] = useState('');
//   const [checking, setChecking] = useState(false);
//   const navigate = useNavigate();
//   const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

//   // Force English on login
//   useEffect(() => {
//     i18n.changeLanguage('en');
//   }, [i18n]);

//   // Initialize app signature once
//   useEffect(() => {
//     (async () => {
//       try {
//         const sig = await generateSignature();
//         sessionStorage.setItem("app_signature", sig);
//       } catch (err) {
//         console.error("Signature init failed:", err);
//       }
//     })();
//   }, []);

//   const underscoreToDash = (s: string) => (s ? s.replace(/_/g, '-') : '');

//   const normalizeBackendId = (raw: string | null | undefined, defaultHospital: string) => {
//     if (!raw) return `${defaultHospital}_1000`;
//     const trimmed = String(raw).trim();
//     if (/_\d+$/.test(trimmed)) return trimmed;
//     if (/-\d+$/.test(trimmed)) return trimmed.replace('-', '_');
//     return `${defaultHospital}_${trimmed || '1000'}`;
//   };

//   // 🚀 Fetch latest sequential ID directly from backend
//   useEffect(() => {
//     let mounted = true;
//     const localKey = `openPatient_${hospitalCode}`;

//     async function load() {
//       try {
//         // 🔥 FULL RESET: clear browser cache layers
//         sessionStorage.clear();
//         localStorage.removeItem(localKey);
//         if ('caches' in window) {
//           const keys = await caches.keys();
//           await Promise.all(keys.map(k => caches.delete(k)));
//         }

//         // 🧠 Add timestamp to avoid CloudFront/API Gateway caching
//         const url = new URL(`${API_BASE}/status/last-patient?hospital=AB`);
//         url.searchParams.set('hospital', hospitalCode);
//         url.searchParams.set('nocache', Date.now().toString());

//         const res = await fetch(url.toString(), {
//           method: 'GET',
//           headers: {
//             'Cache-Control': 'no-cache, no-store, must-revalidate',
//             Pragma: 'no-cache',
//             Expires: '0',
//           },
//         });

//         if (!res.ok) throw new Error(`HTTP ${res.status}`);

//         const body = await res.json();
//         console.log("✅ API JSON:", body);

//         const suggested = normalizeBackendId(body?.suggested, hospitalCode);

//         if (!mounted) return;

//         console.log("✅ Latest patient ID from backend:", suggested);
//         setBackendPatientFull(suggested);
//         setDisplayPatientFull(underscoreToDash(suggested));

//         localStorage.setItem(localKey, suggested);
//       } catch (err) {
//         console.error("⚠️ Failed to fetch latest ID:", err);
//         const fallback = `${hospitalCode}_1000`;
//         if (!mounted) return;
//         setBackendPatientFull(fallback);
//         setDisplayPatientFull(underscoreToDash(fallback));
//         localStorage.setItem(localKey, fallback);
//       }
//     }

//     load();
//     return () => { mounted = false; };
//   }, [hospitalCode]);

//   const proceedWithId = () => {
//     if (!backendPatientFull) {
//       setError('No patient ID available.');
//       return;
//     }
//     sessionStorage.setItem('patientId', backendPatientFull);
//     navigate('/consent', { state: { patientId: backendPatientFull } });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     if (!backendPatientFull) {
//       setError('Unable to generate patient ID. Please try again.');
//       return;
//     }
//     setChecking(true);
//     proceedWithId();
//     setChecking(false);
//   };

//   const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     i18n.changeLanguage(e.target.value);
//   };

//   const hospitalOptions = [
//     { value: 'AB', label: t('home.hospital_options.barsha') },
//     { value: 'NA', label: t('home.hospital_options.nadd') },
//   ];

//   return (
//     <>
//       <AppHeader
//         maxWidth={530}
//         patientId={displayPatientFull || undefined}
//         locale={isArabic ? "ar" : "en"}
//       />

//       <form onSubmit={handleSubmit} style={pageContainer} noValidate>
//         <img src={SehaDubaiLogo} alt="Dubai Health Logo" style={logoStyle} />
//         <h1 style={title}>{t('home.title')}</h1>

//         <label style={fieldLabel}>{t('home.language_label')}</label>
//         <select style={dropdown} value={i18n.language} onChange={handleLanguageChange}>
//           <option value="en">English</option>
//           <option value="ar">العربية</option>
//         </select>

//         <label style={fieldLabel}>{t('home.hospital_label')}</label>
//         <select
//           style={dropdown}
//           value={hospitalCode}
//           onChange={(e) => setHospitalCode(e.target.value)}
//         >
//           {hospitalOptions.map((h) => (
//             <option key={h.value} value={h.value}>
//               {h.label}
//             </option>
//           ))}
//         </select>

//         <div style={buttonContainer}>
//           <button style={buttonCircle} type="submit" disabled={checking}>
//             <span
//               style={{
//                 ...arrowIcon,
//                 transform: isArabic ? 'rotate(180deg)' : 'none',
//                 opacity: checking ? 0.5 : 1,
//               }}
//             >
//               {checking ? '…' : '➜'}
//             </span>
//           </button>
//         </div>
//       </form>
//     </>
//   );
// };

// export default Clinical_Login;


// Clinical_Login.tsx
import React, { useState, useEffect } from 'react';
import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { generateSignature } from "../../utils/signature";
import AppHeader from '../../components/AppHeader';
import {
  pageContainer,
  title,
  fieldLabel,
  fieldInput,
  dropdown,
  buttonCircle,
  buttonContainer,
  arrowIcon,
  logoStyle,
} from './style';

const API_BASE =
  process.env.REACT_APP_API_BASE ??
  'https://x0ia47e70k.execute-api.me-central-1.amazonaws.com/prod';

const Clinical_Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [backendPatientFull, setBackendPatientFull] = useState<string>('');
  const [displayPatientFull, setDisplayPatientFull] = useState<string>('');
  const [hospitalCode, setHospitalCode] = useState<string>('AB');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

  // Force English on login
  useEffect(() => {
    i18n.changeLanguage('en');
  }, [i18n]);

  // Initialize app signature once
  useEffect(() => {
    (async () => {
      try {
        const sig = await generateSignature();
        sessionStorage.setItem("app_signature", sig);
      } catch (err) {
        console.error("Signature init failed:", err);
      }
    })();
  }, []);

  const underscoreToDash = (s: string) => (s ? s.replace(/_/g, '-') : '');

  const normalizeBackendId = (raw: string | null | undefined, defaultHospital: string) => {
    if (!raw) return `${defaultHospital}_1000`;
    const trimmed = String(raw).trim();
    if (/_\d+$/.test(trimmed)) return trimmed;
    if (/-\d+$/.test(trimmed)) return trimmed.replace('-', '_');
    return `${defaultHospital}_${trimmed || '1000'}`;
  };

  // 🚀 Fetch latest sequential ID directly from backend
  useEffect(() => {
    let mounted = true;
    const localKey = `openPatient_${hospitalCode}`;

    async function load() {
      try {
        // 🔥 FULL RESET: clear browser cache layers
        sessionStorage.clear();
        localStorage.removeItem(localKey);
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }

        // 🧠 Add timestamp to avoid CloudFront/API Gateway caching
        const url = new URL(`${API_BASE}/status/last-patient`);
        url.searchParams.set('hospital', hospitalCode);
        url.searchParams.set('nocache', Date.now().toString());

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const body = await res.json();
        console.log("✅ API JSON:", body);

        const suggested = normalizeBackendId(body?.suggested, hospitalCode);

        if (!mounted) return;

        console.log("✅ Latest patient ID from backend:", suggested);
        setBackendPatientFull(suggested);

        // display uses dashed form
        const dashed = underscoreToDash(suggested);
        setDisplayPatientFull(dashed);

        // store dashed id in localStorage (so other code reading localKey gets dashed)
        localStorage.setItem(localKey, dashed);
      } catch (err) {
        console.error("⚠️ Failed to fetch latest ID:", err);
        const fallback = `${hospitalCode}_1000`;
        if (!mounted) return;
        setBackendPatientFull(fallback);
        const dashedFallback = underscoreToDash(fallback);
        setDisplayPatientFull(dashedFallback);
        localStorage.setItem(localKey, dashedFallback);
      }
    }

    load();
    return () => { mounted = false; };
  }, [hospitalCode]);

  const proceedWithId = () => {
    if (!backendPatientFull) {
      setError('No patient ID available.');
      return;
    }

    // convert underscore -> dash before storing / navigating
    const dashedId = underscoreToDash(backendPatientFull);
    sessionStorage.setItem('patientId', dashedId);
    navigate('/consent', { state: { patientId: dashedId } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!backendPatientFull) {
      setError('Unable to generate patient ID. Please try again.');
      return;
    }
    setChecking(true);
    proceedWithId();
    setChecking(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const hospitalOptions = [
    { value: 'AB', label: t('home.hospital_options.barsha') },
    { value: 'NA', label: t('home.hospital_options.nadd') },
  ];

  return (
    <>
      <AppHeader
        maxWidth={530}
        patientId={displayPatientFull || undefined}
        locale={isArabic ? "ar" : "en"}
      />

      <form onSubmit={handleSubmit} style={pageContainer} noValidate>
        <img src={SehaDubaiLogo} alt="Dubai Health Logo" style={logoStyle} />
        <h1 style={title}>{t('home.title')}</h1>

        <label style={fieldLabel}>{t('home.language_label')}</label>
        <select style={dropdown} value={i18n.language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>

        <label style={fieldLabel}>{t('home.hospital_label')}</label>
        <select
          style={dropdown}
          value={hospitalCode}
          onChange={(e) => setHospitalCode(e.target.value)}
        >
          {hospitalOptions.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>

        <div style={buttonContainer}>
          <button style={buttonCircle} type="submit" disabled={checking}>
            <span
              style={{
                ...arrowIcon,
                transform: isArabic ? 'rotate(180deg)' : 'none',
                opacity: checking ? 0.5 : 1,
              }}
            >
              {checking ? '…' : '➜'}
            </span>
          </button>
        </div>
      </form>
    </>
  );
};

export default Clinical_Login;
