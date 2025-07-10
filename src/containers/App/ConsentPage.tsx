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

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [privacyAck, setPrivacyAck] = useState(false);
  const [healthInfoConsent, setHealthInfoConsent] = useState(false);

  const checkboxes: CheckboxItem[] = [
    {
      id: 'ageConfirmed',
      label: t('consent.checkbox1'),
      state: ageConfirmed,
      setState: setAgeConfirmed,
    },
    {
      id: 'consentGiven',
      label: t('consent.checkbox2'),
      state: consentGiven,
      setState: setConsentGiven,
    },
    {
      id: 'privacyAck',
      label: t('consent.checkbox3'),
      state: privacyAck,
      setState: setPrivacyAck,
    },
    {
      id: 'healthInfoConsent',
      label: t('consent.checkbox4'),
      state: healthInfoConsent,
      setState: setHealthInfoConsent,
    },
  ];

  const Spacer = ({ height }: { height: string }) => <div style={{ height }} />;

  const iframeStyle: React.CSSProperties = {
    height: '500px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    overflow: 'hidden',
  };

  if (window.innerWidth < 768) {
    iframeStyle.height = '250px';
  }

  const handleNext = () => {
    const allChecked =
      ageConfirmed && consentGiven && privacyAck && healthInfoConsent;

    if (allChecked) {
      navigate('/record-coughs');
    } else {
      alert(t('consent.check_all_alert'));
    }
  };

  const handleSignedPaperNext = () => {
    alert(t('consent.signed_paper_alert'));
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '20px',
            textAlign: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              left: '0px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={t('consent.back_aria')}
          >
            <img src={BackIcon} alt={t('consent.back_alt')} style={{ width: '25px', height: '35px' }} />
          </button>
          <h2 style={{ color: '#007bff', margin: 0, width: '100%', textAlign: 'center' }}>{t('consent.title')}</h2>
        </div>

        <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          <u>{t('consent.description')}</u>
        </p>

        <ol style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem' , fontWeight: 'bold'}}>
          <li style={{ marginBottom: '1.5rem' }}>
            {t('consent.dubaiHealthTitle')}<br />
            <span style={{ fontWeight: 'normal' }}>{t('consent.dubaiHealthDesc')}</span>
            <Spacer height="1rem" />
            <a
              href="https://docs.google.com/document/d/1c093C-aOUaxqWAUBodDc2QUtIHA8sfpA/view"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff' }}
            >
              {t('consent.readFull')}
            </a>
            <Spacer height="1rem" />
            <div style={iframeStyle}>
              <iframe
                src="https://docs.google.com/document/d/1c093C-aOUaxqWAUBodDc2QUtIHA8sfpA/preview"
                width="100%"
                height="100%"
                allow="autoplay"
                style={{ border: 'none' }}
                title={t('consent.document_preview_title')}
              ></iframe>
            </div>
          </li>

          <li>
            {t('consent.virufyTitle')}<br />
            <span style={{ fontWeight: 'normal' }}>{t('consent.virufyDesc')}</span> <br />
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
            <div style={iframeStyle}>
              <iframe
                src="https://drive.google.com/file/d/1hnxvDJ5qHBnUi7cnkNdyD4PuWMz8Ntss/preview"
                width="100%"
                height="100%"
                allow="autoplay"
                style={{ border: 'none' }}
                title={t('consent.privacy_policy_preview_title')}
              ></iframe>
            </div>
          </li>
        </ol>

        <h4>{t('consent.confirmationTitle')}</h4>
        <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('consent.confirmationDesc')}</p>

        <div style={{ marginBottom: '1.5rem' }}>
          {checkboxes.map(({ id, label, state, setState }) => (
            <label
              key={id}
              htmlFor={id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '0.75rem' }}
            >
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', width: '100%' }}>
          <button
            onClick={handleNext}
            style={{
              backgroundColor: '#3578de',
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
