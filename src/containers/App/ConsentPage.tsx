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
        t('consent.checkbox4'),
      state: healthInfoConsent,
      setState: setHealthInfoConsent,
    },
  ];

  const Spacer = ({ height }: { height: string }) => <div style={{ height }} />;

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
          borderRadius: '12px',
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
            <a href="https://docs.google.com/document/d/1c093C-aOUaxqWAUBodDc2QUtIHA8sfpA/preview" style={{ color: '#007bff' }}>{t('consent.readFull')}</a>
            <Spacer height="1rem" />
            <div style={{ height: '500px', border: '1px solid #ccc', borderRadius: '6px' }}>
              <iframe
                src="https://docs.google.com/document/d/1c093C-aOUaxqWAUBodDc2QUtIHA8sfpA/preview"
                width="100%"
                height="100%"
                allow="autoplay"
                style={{ border: 'none' }}
                title="Consent Form Preview"
              ></iframe>
            </div>  
          </li>
        

          <li>
            <strong>{t('consent.virufyTitle')}</strong><br />
            {t('consent.virufyDesc')} <br />
            <Spacer height="1rem" />
            <a
              href="https://drive.google.com/file/d/1hnxvDJ5qHBnUi7cnkNdyD4PuWMz8Ntss/view"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff' }}
            >
              {t('consent.readFull')}
            </a>
            <Spacer height="1rem" />
            <div style={{ height: '500px', border: '1px solid #ccc', borderRadius: '6px' }}>
              <iframe
                src="https://drive.google.com/file/d/1hnxvDJ5qHBnUi7cnkNdyD4PuWMz8Ntss/preview"
                width="100%"
                height="100%"
                allow="autoplay"
                style={{ border: 'none' }}
                title="Privacy Policy Preview"
              ></iframe>
            </div>
          </li>
        </ul>

        {/* Checkboxes */}
        <h4>{t('consent.confirmationTitle')}</h4>
        <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
         {t('consent.confirmationDesc')}
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          {checkboxes.map(({ id, label, state, setState }) => (
            <label key={id} htmlFor={id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                id={id}
                checked={state}
                onChange={() => setState(!state)}
                style={{ marginTop: '0.3rem' }}
              />{' '}
              <span>{label}</span>
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', width: '100%' }}>
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