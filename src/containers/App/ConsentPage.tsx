import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackIcon from '../../assets/images/back-icon.png';
import { useTranslation } from 'react-i18next';

type CheckboxItem = {
  id: string;
  label: string;
  state: boolean;
  setState: React.Dispatch<React.SetStateAction<boolean>>;
};

const ConsentScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [privacyAck, setPrivacyAck] = useState<boolean>(false);
  const [healthInfoConsent, setHealthInfoConsent] = useState<boolean>(false);

  const checkboxes: CheckboxItem[] = [
    {
      id: 'ageConfirmed',
      label: t('consent.checkbox1'),
      state: ageConfirmed,
      setState: setAgeConfirmed,
    },
    {
      id: 'consentGiven',
      label:
        t('consent.checkbox2'),
      state: consentGiven,
      setState: setConsentGiven,
    },
    {
      id: 'privacyAck',
      label:
        t('consent.checkbox3'),
      state: privacyAck,
      setState: setPrivacyAck,
    },
    {
      id: 'healthInfoConsent',
      label:
        t('consent.checkbox2'),
      state: healthInfoConsent,
      setState: setHealthInfoConsent,
    },
  ];

  const handleNext = () => {
    const allChecked =
      ageConfirmed && consentGiven && privacyAck && healthInfoConsent;

    if (allChecked) {
      navigate('/record-coughs');
    } else {
      alert('Please check all boxes to continue.');
    }
  };

  const handleSignedPaperNext = () => {
    alert('Please make sure you have signed the paper consent form manually.');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          padding: '2rem',
          maxWidth: '700px',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '20px' }}>
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Go back"
          >
            <img src={BackIcon} alt="Back" style={{ width: '25px', height: '35px' }} />
          </button>
          <h2 style={{ color: '#007bff', margin: 0 }}>
              {t('consent.title')}
          </h2>
        </div>

        {/* Intro Text */}
        <p style={{ marginBottom: '1.5rem' }}>
          {t('consent.description')}
        </p>

        {/* Documents Section */}
        <h4>{t('consent.documentsTitle')}</h4>
        <ul style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>{t('consent.dubaiHealthTitle')}</strong><br />
            	{t('consent.dubaiHealthDesc')}<br />
            <a href="#" style={{ color: '#007bff' }}>{t('consent.readFull')}</a>
          </li>
          <li>
            <strong>{t('consent.virufyTitle')}</strong><br />
            {t('consent.virufyDesc')} <br />
            <a href="#" style={{ color: '#007bff' }}>{t('consent.readFull')}</a>
          </li>
        </ul>

        {/* Checkboxes */}
        <h4>{t('consent.confirmationTitle')}</h4>
        <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
         {t('consent.confirmationDesc')}
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          {checkboxes.map(({ id, label, state, setState }) => (
            <label key={id} htmlFor={id} style={{ display: 'block', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                id={id}
                checked={state}
                onChange={() => setState(!state)}
              />{' '}
              {label}
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={handleNext}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {t('consent.next')}
          </button>

          <button
            onClick={handleSignedPaperNext}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {t('consent.nextPaper')}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#999' }}>
          {t('consent.footerIssue')}{' '}
          <a href="#" style={{ color: '#007bff' }}>
            {t('consent.report')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConsentScreen;
