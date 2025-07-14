import React, { useState } from 'react';
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
  logoStyle, // :white_check_mark: imported new logo style
} from './style';
const Clinical_Login = () => {
  const { t, i18n } = useTranslation();
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) {
      setError(t('home.error.patient_id_required'));
      return;
    }
    setError('');
    navigate('/consent');
  };
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };
  return (
    <form onSubmit={handleSubmit} style={pageContainer} noValidate>
      <img
        src={SehaDubaiLogo}
        alt="Dubai Health Logo"
        style={logoStyle} // :white_check_mark: using shared style
      />
      <h1 style={title}>{t('home.title')}</h1>
      <label style={fieldLabel}>{t('home.language_label')}</label>
      <select style={dropdown} defaultValue="English" onChange={handleLanguageChange}>
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
        onChange={e => {
            const numericValue = e.target.value.replace(/\D/g, '');
            setPatientId(numericValue);
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
        <option>{t('home.hospital_options.rashid')}</option>
        <option>{t('home.hospital_options.latifa')}</option>
      </select>
      <div style={buttonContainer}>
        <button style={buttonCircle} type="submit">
          <span
            style={{
              ...arrowIcon,
              transform: isArabic ? 'rotate(180deg)' : 'none',
            }}
          >
            ➜
          </span>
        </button>
      </div>
    </form>
  );
};
console.log("Clinical Login Loaded");
export default Clinical_Login;