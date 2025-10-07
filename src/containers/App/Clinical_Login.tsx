// import React, { useState, useEffect } from 'react';
// import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { generateSignature } from "../../utils/signature";

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
//   const [patientId, setPatientId] = useState(''); // numeric portion only
//   const [hospitalCode, setHospitalCode] = useState('BHC'); // CNM code e.g. BHC or NAH
//   const [error, setError] = useState('');
//   const [checking, setChecking] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const navigate = useNavigate();

//   // robust Arabic check (handles "ar", "ar-AE", etc.)
//   const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

//   // Always reset language to English when this page loads
//   useEffect(() => {
//     i18n.changeLanguage('en');
//   }, [i18n]);

//   // close modal on Escape
//   useEffect(() => {
//     if (!showConfirm) return;
//     const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowConfirm(false);
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [showConfirm]);

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

//   // helper: build full patient id (CNM_numeric)
//   const buildFullPatientId = (numericId: string, code: string) => {
//     return `${code}_${numericId}`;
//   };

//   const proceedWithId = () => {
//     const numeric = patientId.trim();
//     const fullId = buildFullPatientId(numeric, hospitalCode);
//     sessionStorage.setItem('patientId', fullId);
//     navigate('/consent', { state: { patientId: fullId } });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const numeric = patientId.trim();

//     if (!numeric) {
//       setError(t('home.error.patient_id_required'));
//       return;
//     }
//     if (!/^\d+$/.test(numeric)) {
//       setError(t('home.error.patient_id_numeric'));
//       return;
//     }
//     setError('');

//     const fullId = buildFullPatientId(numeric, hospitalCode);

//     try {
//       setChecking(true);
//       const url = new URL(`${API_BASE}/status/check-patient`);
//       // send full CNM patient id to backend e.g. "NAH_1607"
//       url.searchParams.set('patientId', fullId);
//       const res = await fetch(url.toString());
//       if (!res.ok) throw new Error(`Check failed (${res.status})`);
//       const data = await res.json(); // { exists, ... }

//       if (data?.exists) {
//         setShowConfirm(true);
//       } else {
//         // saved & navigate with prefixed id
//         proceedWithId();
//       }
//     } catch (err) {
//       setError(
//         t('home.error.patient_check_failed', 'Unable to verify the patient ID. Please try again.')
//       );
//     } finally {
//       setChecking(false);
//     }
//   };

//   const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     i18n.changeLanguage(e.target.value);
//   };

//   // Hospital options: value is the CNM code, label is localized text
//   const hospitalOptions = [
//     { value: 'BHC', label: t('home.hospital_options.barsha') }, // Al Barsha Health Centre => BHC
//     { value: 'NAH', label: t('home.hospital_options.nadd') },   // Nadd Al Hammar Health Centre => NAH
//   ];

//   return (
//     <form onSubmit={handleSubmit} style={pageContainer} noValidate>
//       <img src={SehaDubaiLogo} alt="Dubai Health Logo" style={logoStyle} />
//       <h1 style={title}>{t('home.title')}</h1>

//       <label style={fieldLabel}>{t('home.language_label')}</label>
//       <select style={dropdown} value={i18n.language} onChange={handleLanguageChange}>
//         <option value="en">English</option>
//         <option value="ar">العربية</option>
//       </select>

//       <label style={fieldLabel}>
//         {t('home.patient_id_label')} <span style={{ color: 'red' }}>*</span>
//       </label>
//       <input
//         type="text"
//         inputMode="numeric"
//         pattern="[0-9]*"
//         style={fieldInput}
//         placeholder={t('home.patient_id_placeholder')}
//         value={patientId}
//         onChange={(e) => {
//           // only numeric, max length 10
//           const value = e.target.value.replace(/\D/g, '').slice(0, 10);
//           setPatientId(value);
//         }}
//         aria-invalid={!!error}
//         aria-describedby="patientId-error"
//       />

//       {error && (
//         <div id="patientId-error" style={{ color: 'red', marginTop: 4 }}>
//           {error}
//         </div>
//       )}

//       <label style={fieldLabel}>{t('home.hospital_label')}</label>
//       <select
//         style={dropdown}
//         value={hospitalCode}
//         onChange={(e) => setHospitalCode(e.target.value)}
//       >
//         {hospitalOptions.map((h) => (
//           <option key={h.value} value={h.value}>
//             {h.label}
//           </option>
//         ))}
//       </select>


//       <div style={buttonContainer}>
//         <button style={buttonCircle} type="submit" disabled={checking}>
//           <span
//             style={{
//               ...arrowIcon,
//               transform: isArabic ? 'rotate(180deg)' : 'none',
//               opacity: checking ? 0.5 : 1,
//             }}
//           >
//             {checking ? '…' : '➜'}
//           </span>
//         </button>
//       </div>

//       {/* Confirmation modal */}
//       {showConfirm && (
//         <div
//           key={i18n.resolvedLanguage || i18n.language}
//           role="dialog"
//           aria-modal="true"
//           onClick={(e) => {
//             // close when clicking the shaded backdrop only
//             if (e.target === e.currentTarget) setShowConfirm(false);
//           }}
//           style={{
//             position: 'fixed',
//             inset: 0,
//             background: 'rgba(0,0,0,0.35)',
//             display: 'grid',
//             placeItems: 'center',
//             padding: 16,
//             zIndex: 1000,
//           }}
//         >
//           <div
//             style={{
//               background: 'white',
//               borderRadius: 12,
//               padding: 20,
//               maxWidth: 420,
//               width: '100%',
//               boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
//               direction: isArabic ? 'rtl' : 'ltr',
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>{t('home.patient_exists_title')}</h3>
//             <p style={{ marginTop: 8 }}>{t('home.patient_exists_question')}</p>

//             <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
//               <button
//                 type="button"
//                 onClick={() => setShowConfirm(false)}
//                 style={{
//                   flex: 1,
//                   padding: 12,
//                   borderRadius: 8,
//                   border: '1px solid #ddd',
//                   backgroundColor: "#007BFF", // blue
//                   cursor: 'pointer',
//                 }}
//               >
//                 {t('home.common_no')}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowConfirm(false);
//                   proceedWithId();
//                 }}
//                 style={{
//                   flex: 1,
//                   padding: 12,
//                   borderRadius: 8,
//                   border: 'none',
//                   backgroundColor: "#dc3545", // red for destructive
//                   color: 'white',
//                   cursor: 'pointer',
//                 }}
//               >
//                 {t('home.common_yes')}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </form>
//   );
// };

// export default Clinical_Login;














//new updated
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
  'https://tg3he2qa23.execute-api.me-central-1.amazonaws.com/prod';

const Clinical_Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [patientId, setPatientId] = useState(''); // auto-generated numeric portion
  const [hospitalCode, setHospitalCode] = useState('AB'); // default hospital
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

  useEffect(() => {
    i18n.changeLanguage('en');
  }, [i18n]);

  // Close modal on Escape key
  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConfirm]);

  // Initialize app signature once
  useEffect(() => {
    async function initSignature() {
      try {
        const sig = await generateSignature();
        console.log("Initial app signature:", sig);
        sessionStorage.setItem("app_signature", sig);
      } catch (err) {
        console.error("Failed to generate initial signature:", err);
      }
    }
    initSignature();
  }, []);

  // Helper: build full patient ID
  const buildFullPatientId = (numericId: string, code: string) => {
    return `${code}_${numericId}`;
  };

  // ✅ Fetch and generate next sequential patient ID automatically
  useEffect(() => {
    async function generateNextPatientId() {
      try {
        // Try fetching the latest patient number from backend
        const url = new URL(`${API_BASE}/status/last-patient`);
        url.searchParams.set('hospital', hospitalCode);
        const res = await fetch(url.toString());
        let nextIdNum: number;

        if (res.ok) {
          const data = await res.json(); // e.g. { lastPatientId: "BHC_105" }
          const lastNumeric = parseInt(data?.lastPatientId?.split('_')[1] ?? '1000', 10);
          nextIdNum = lastNumeric + 1;
        } else {
          // Fallback: use localStorage if API unavailable
          const localLast = parseInt(localStorage.getItem(`lastPatient_${hospitalCode}`) || '1000', 10);
          nextIdNum = localLast + 1;
        }

        const nextIdStr = nextIdNum.toString();
        setPatientId(nextIdStr);
        localStorage.setItem(`lastPatient_${hospitalCode}`, nextIdStr);
        console.log(`Generated next patient ID: ${hospitalCode}_${nextIdStr}`);
      } catch (err) {
        console.error("Failed to generate patient ID automatically:", err);
        setError("Unable to generate new patient ID. Please refresh the page.");
      }
    }

    generateNextPatientId();
  }, [hospitalCode]);

  const proceedWithId = () => {
    const fullId = buildFullPatientId(patientId, hospitalCode);
    sessionStorage.setItem('patientId', fullId);
    navigate('/consent', { state: { patientId: fullId } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError("Unable to generate patient ID. Please try again.");
      return;
    }

    const fullId = buildFullPatientId(patientId, hospitalCode);

    try {
      setChecking(true);
      const url = new URL(`${API_BASE}/status/check-patient`);
      url.searchParams.set('patientId', fullId);
      const res = await fetch(url.toString());

      if (!res.ok) throw new Error(`Check failed (${res.status})`);
      const data = await res.json(); // { exists: boolean }

      if (data?.exists) {
        setShowConfirm(true);
      } else {
        proceedWithId();
      }
    } catch (err) {
      setError(
        t('home.error.patient_check_failed', 'Unable to verify the patient ID. Please try again.')
      );
    } finally {
      setChecking(false);
    }
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
    <AppHeader patientId={buildFullPatientId(patientId, hospitalCode)}
      isArabic={isArabic}
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

      {/* <label style={fieldLabel}>{t('home.patient_id_label')}</label>
      <input
        type="text"
        style={{ ...fieldInput, backgroundColor: '#f5f5f5' }}
        value={buildFullPatientId(patientId, hospitalCode)}
        readOnly
      /> */}

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

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
              direction: isArabic ? 'rtl' : 'ltr',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{t('home.patient_exists_title')}</h3>
            <p style={{ marginTop: 8 }}>{t('home.patient_exists_question')}</p>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  backgroundColor: "#007BFF",
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {t('home.common_no')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  proceedWithId();
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: "#dc3545",
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {t('home.common_yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
    </>
  );
};

export default Clinical_Login;
