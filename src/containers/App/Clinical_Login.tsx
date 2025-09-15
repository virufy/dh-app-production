import React, { useState, useEffect } from 'react';
import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { generateSignature } from "../../utils/signature";

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
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  // robust Arabic check (handles "ar", "ar-AE", etc.)
  const isArabic = (i18n.resolvedLanguage || i18n.language || '').startsWith('ar');

  // Always reset language to English when this page loads
  useEffect(() => {
    i18n.changeLanguage('en');
  }, [i18n]);

  // close modal on Escape
  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConfirm]);

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


  const proceedWithId = () => {
    const id = patientId.trim();
    sessionStorage.setItem('patientId', id);
    navigate('/consent', { state: { patientId: id } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = patientId.trim();

    if (!id) {
      setError(t('home.error.patient_id_required'));
      return;
    }
    if (!/^\d+$/.test(id)) {
      setError(t('home.error.patient_id_numeric'));
      return;
    }
    setError('');

    try {
      setChecking(true);
      const url = new URL(`${API_BASE}/status/check-patient`);
      url.searchParams.set('patientId', id);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Check failed (${res.status})`);
      const data = await res.json(); // { exists, ... }

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

  return (
    <form onSubmit={handleSubmit} style={pageContainer} noValidate>
      <img src={SehaDubaiLogo} alt="Dubai Health Logo" style={logoStyle} />
      <h1 style={title}>{t('home.title')}</h1>

      <label style={fieldLabel}>{t('home.language_label')}</label>
      <select style={dropdown} value={i18n.language} onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>

      <label style={fieldLabel}>
        {t('home.patient_id_label')} <span style={{ color: 'red' }}>*</span>
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        style={fieldInput}
        placeholder={t('home.patient_id_placeholder')}
        value={patientId}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
          setPatientId(value);
        }}
        aria-invalid={!!error}
        aria-describedby="patientId-error"
      />

      {error && (
        <div id="patientId-error" style={{ color: 'red', marginTop: 4 }}>
          {error}
        </div>
      )}

      <label style={fieldLabel}>{t('home.hospital_label')}</label>
      <select style={dropdown} defaultValue="Al Barsha Health Centre">
        <option>{t('home.hospital_options.barsha')}</option>
        <option>{t('home.hospital_options.nadd')}</option>
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

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          key={i18n.resolvedLanguage || i18n.language}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            // close when clicking the shaded backdrop only
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
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
                  background: '#f7f7f7',
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
                  background: '#0d6efd',
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
  );
};

export default Clinical_Login;
