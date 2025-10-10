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
        const url = new URL(`${API_BASE}/status/last-patient?hospital=AB`);
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
        setDisplayPatientFull(underscoreToDash(suggested));

        localStorage.setItem(localKey, suggested);
      } catch (err) {
        console.error("⚠️ Failed to fetch latest ID:", err);
        const fallback = `${hospitalCode}_1000`;
        if (!mounted) return;
        setBackendPatientFull(fallback);
        setDisplayPatientFull(underscoreToDash(fallback));
        localStorage.setItem(localKey, fallback);
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
    sessionStorage.setItem('patientId', backendPatientFull);
    navigate('/consent', { state: { patientId: backendPatientFull } });
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
        maxWidth={960}
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

        <label style={fieldLabel}>{t('home.patient_id_label')}</label>
        <input
          type="text"
          style={{ ...fieldInput, backgroundColor: '#f5f5f5' }}
          value={displayPatientFull}
          readOnly
        />

        {error && (
          <div id="patientId-error" style={{ color: 'red', marginTop: 4 }}>
            {error}
          </div>
        )}

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




// // Clinical_Login.tsx (updated)
// // new updated
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
//   'https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod';

// const Clinical_Login: React.FC = () => {
//   const { t, i18n } = useTranslation();
//   // patientFull is the full id like "AB_1"
//   const [patientFull, setPatientFull] = useState<string>('');
//   // hospital code (AB or NA)
//   const [hospitalCode, setHospitalCode] = useState<string>('AB');
//   const [error, setError] = useState('');
//   const [checking, setChecking] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const navigate = useNavigate();

//   const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

//   useEffect(() => {
//     // keep app language in English on this page
//     i18n.changeLanguage('en');
//   }, [i18n]);

//   // Initialize app signature once
//   useEffect(() => {
//     async function initSignature() {
//       try {
//         const sig = await generateSignature();
//         console.log("Initial app signature:", sig);
//         sessionStorage.setItem("app_signature", sig);
//       } catch (err) {
//         console.error("Failed to generate initial signature:", err);
//       }
//     }
//     initSignature();
//   }, []);

//   // Helper: normalize/ensure the full id format like "AB_1"
//   const normalizeFullId = (raw: string | null | undefined, defaultHospital: string) => {
//     if (!raw) return `${defaultHospital}_1`;
//     const trimmed = String(raw).trim();
//     // if string already contains underscore and a numeric part, keep it
//     if (/_\d+$/.test(trimmed)) return trimmed;
//     // otherwise attach underscore + "1"
//     return `${defaultHospital}_${trimmed || '1'}`;
//   };

//   // When hospitalCode changes we should attempt to reuse any locally stored open patient
//   // otherwise ask backend for the last patient id for that hospital and *use it as-is*.
//   useEffect(() => {
//     let mounted = true;

//     async function loadOrFetchPatient() {
//       setError('');
//       const localKey = `openPatient_${hospitalCode}`;

//       // 1) Try localStorage for 'open' patient for this hospital (persisted until submission)
//       try {
//         const local = localStorage.getItem(localKey);
//         if (local) {
//           if (!mounted) return;
//           setPatientFull(local);
//           return;
//         }
//       } catch (e) {
//         // ignore localStorage read errors, proceed to fetch
//         console.warn('localStorage read failed', e);
//       }

//       // 2) Call backend for last patient ID
//       try {
//         const url = new URL(`${API_BASE}/status/last-patient`);
//         url.searchParams.set('hospital', hospitalCode);
//         const res = await fetch(url.toString(), { method: 'GET' });

//         if (!res.ok) {
//           // Backend may be down or return non-200; fallback to a default start ID
//           console.warn('last-patient fetch failed', res.status);
//           const fallback = `${hospitalCode}_1`;
//           if (mounted) {
//             setPatientFull(fallback);
//             try { localStorage.setItem(localKey, fallback); } catch {}
//           }
//           return;
//         }

//         // Try to parse JSON first; if that fails, fall back to text
//         let lastId = '';
//         const contentType = res.headers.get('content-type') || '';
//         if (contentType.includes('application/json')) {
//           const data = await res.json();
//           // the API may return different shapes; prefer lastPatientId, lastPatient or id
//           lastId = (data && (data.lastPatientId || data.lastPatient || data.id)) || '';
//         } else {
//           // maybe plain-text response like "AB_1"
//           const txt = await res.text();
//           lastId = txt && txt.trim() ? txt.trim() : '';
//         }

//         // Normalize + fallback to hospitalCode_1
//         const normalized = normalizeFullId(lastId, hospitalCode);
//         if (mounted) {
//           setPatientFull(normalized);
//           try { localStorage.setItem(localKey, normalized); } catch {}
//         }
//       } catch (err) {
//         console.error('Failed to fetch last patient id:', err);
//         // fallback to local fallback logic
//         const fallback = `${hospitalCode}_1`;
//         if (mounted) {
//           setPatientFull(fallback);
//           try { localStorage.setItem(`openPatient_${hospitalCode}`, fallback); } catch {}
//         }
//       }
//     }

//     loadOrFetchPatient();

//     return () => {
//       mounted = false;
//     };
//   }, [hospitalCode]);

//   // called when user confirms/proceeds
//   const proceedWithId = () => {
//     if (!patientFull) {
//       setError('No patient id available.');
//       return;
//     }
//     // store the chosen patientId in sessionStorage for other screens
//     sessionStorage.setItem('patientId', patientFull);
//     // navigate to consent (or next page)
//     navigate('/consent', { state: { patientId: patientFull } });
//   };

//   // When pressing the submit arrow — we still do your check-patient call to behave as before
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!patientFull) {
//       setError("Unable to generate patient ID. Please try again.");
//       return;
//     }

//     try {
//       setChecking(true);
//       const url = new URL(`${API_BASE}/status/check-patient`);
//       url.searchParams.set('patientId', patientFull);
//       const res = await fetch(url.toString(), { method: 'GET' });
//       if (!res.ok) throw new Error(`Check failed (${res.status})`);

//       // parse JSON response if possible
//       const contentType = res.headers.get('content-type') || '';
//       let data: any = null;
//       if (contentType.includes('application/json')) {
//         data = await res.json();
//       } else {
//         // if text, we'll treat any non-empty text as "exists" truthy
//         const txt = await res.text();
//         data = { exists: !!(txt && txt.trim()) };
//       }

//       if (data?.exists) {
//         // If backend says a patient with this id already exists, show confirm dialog
//         setShowConfirm(true);
//       } else {
//         // If backend says it doesn't exist (fresh) proceed
//         proceedWithId();
//       }
//     } catch (err) {
//       console.error('Check patient failed:', err);
//       setError(t('home.error.patient_check_failed', 'Unable to verify the patient ID. Please try again.'));
//     } finally {
//       setChecking(false);
//     }
//   };

//   const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     i18n.changeLanguage(e.target.value);
//   };

//   // Hospital options: AB for Al Barsha, NA for Nadd Al Hammar
//   const hospitalOptions = [
//     { value: 'AB', label: t('home.hospital_options.barsha') },
//     { value: 'NA', label: t('home.hospital_options.nadd') },
//   ];

//   return (
//     <>
//       <AppHeader
//         maxWidth={530}
//         patientId={patientFull}
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

//         <label style={fieldLabel}>{t('home.patient_id_label')}</label>
//         <input
//           type="text"
//           style={{ ...fieldInput, backgroundColor: '#f5f5f5' }}
//           value={patientFull}
//           readOnly
//         />

//         {error && (
//           <div id="patientId-error" style={{ color: 'red', marginTop: 4 }}>
//             {error}
//           </div>
//         )}

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

//         {/* Confirmation modal */}
//         {showConfirm && (
//           <div
//             role="dialog"
//             aria-modal="true"
//             onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}
//             style={{
//               position: 'fixed',
//               inset: 0,
//               background: 'rgba(0,0,0,0.35)',
//               display: 'grid',
//               placeItems: 'center',
//               padding: 16,
//               zIndex: 1000,
//             }}
//           >
//             <div
//               style={{
//                 background: 'white',
//                 borderRadius: 12,
//                 padding: 20,
//                 maxWidth: 420,
//                 width: '100%',
//                 boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
//                 direction: isArabic ? 'rtl' : 'ltr',
//               }}
//             >
//               <h3 style={{ marginTop: 0 }}>{t('home.patient_exists_title')}</h3>
//               <p style={{ marginTop: 8 }}>{t('home.patient_exists_question')}</p>

//               <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirm(false)}
//                   style={{
//                     flex: 1,
//                     padding: 12,
//                     borderRadius: 8,
//                     border: '1px solid #ddd',
//                     backgroundColor: "#007BFF",
//                     color: 'white',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   {t('home.common_no')}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowConfirm(false);
//                     proceedWithId();
//                   }}
//                   style={{
//                     flex: 1,
//                     padding: 12,
//                     borderRadius: 8,
//                     border: 'none',
//                     backgroundColor: "#dc3545",
//                     color: 'white',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   {t('home.common_yes')}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </form>
//     </>
//   );
// };

// export default Clinical_Login;



