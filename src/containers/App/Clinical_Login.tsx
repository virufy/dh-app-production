import React, { useState, useEffect } from 'react';
import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const Clinical_Login = () => {
  const { t, i18n } = useTranslation();
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    i18n.changeLanguage('en');
  }, [i18n]);

  const proceedWithId = () => {
    const id = patientId.trim();
    sessionStorage.setItem('patientId', id);
    navigate('/consent', { state: { patientId: id } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = patientId.trim();

    // Basic validation (unchanged)
    if (!id) {
      setError(t('home.error.patient_id_required'));
      return;
    }
    if (!/^\d+$/.test(id)) {
      setError(t('home.error.patient_id_numeric'));
      return;
    }
    setError('');

    // Check existence in S3 / DynamoDB
    try {
      setChecking(true);
      const url = new URL(`${API_BASE}/status/check-patient`);
      url.searchParams.set('patientId', id);
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Check failed (${res.status})`);
      }
      const data = await res.json(); // { exists, existsS3, existsDDB, ... }

      if (data.exists) {
        // Show confirmation modal
        setShowConfirm(true);
      } else {
        // Not found → continue normally
        proceedWithId();
      }
    } catch (err: any) {
      setError(
        t('home.error.patient_check_failed') ||
          'Unable to verify the patient ID. Please try again.'
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
      <select
        style={dropdown}
        value={i18n.language}
        onChange={handleLanguageChange}
      >
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

      {/* Simple Yes/No modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
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
            <h3 style={{ marginTop: 0 }}>
              {t('home.patient_exists_title') || 'This patient ID already exists'}
            </h3>
            <p style={{ marginTop: 8 }}>
              {t('home.patient_exists_question') ||
                'Do you want to continue with the same patient ID?'}
            </p>

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
                }}
              >
                {t('home.common_no') || 'No'}
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
                }}
              >
                {t('home.common_yes') || 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

console.log('Clinical Login Loaded');
export default Clinical_Login;
