import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackIcon from '../../assets/images/back-icon.png';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { ConsentContainer, ConsentContent } from './consentscreen';
import EnglishConsent from "../../components/Forms/EnglishConsent";
import ArabicConsent from '../../components/Forms/ArabicConsent';
import AppHeader from "../../components/AppHeader";

const ConsentScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
  const baseFontSize = isTablet ? '1rem' : '0.8rem';

  const handleBack = () => {
    navigate(-1);
  };

  const handleAlreadyConsented = () => {
    navigate('/record-coughs');
    window.scrollTo(0, 0);
  };

  const Spacer = ({ height }: { height: string }) => <div style={{ height }} />;
const sessionPatientId = typeof window !== 'undefined' ? sessionStorage.getItem('patientId') || undefined : undefined;

  return (
    <>
            <AppHeader  maxWidth={530} patientId={sessionPatientId} locale={isArabic ? "ar" : "en"} />
    <ConsentContainer style={{ paddingTop: 0 }}>
      <ConsentContent>
        <div className="consent-container">
          <div className="consent-content">
            <div
              style={{
                minHeight: '100vh',
                paddingBottom: '60px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                fontSize: baseFontSize,
                fontWeight: 400,
                letterSpacing: '0.02em',
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  width: '100%',
                  maxWidth: '900px', // limit width for desktop view
                  margin: '0 auto',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    textAlign: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={handleBack}
                    style={{
                      position: 'absolute',
                      [isArabic ? 'right' : 'left']: '-10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={t('consent.back_aria')}
                  >
                    <img
                      src={BackIcon}
                      alt={t('consent.back_alt')}
                      style={{
                        width: '25px',
                        height: '35px',
                        transform: isArabic ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </button>
                  <h2
                    style={{
                      color: '#3578de',
                      margin: 0,
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    {t('consent.title')}
                  </h2>
                </div>

                {/* Main Text */}
                <p
                  style={{
                    marginTop: '3rem',
                    marginBottom: '2rem',
                    whiteSpace: 'pre-line',
                    fontSize: baseFontSize,
                  }}
                >
                  {t('consent.description')}
                </p>

                {/* Dubai Health Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <strong>{t('consent.dubaiHealthTitle')}</strong>
                  <br />
                  <span style={{ fontWeight: 'normal' }}>
                    {t('consent.dubaiHealthDesc')}
                  </span>
                  <Spacer height="0.5rem" />
                  <a
                    href={
                      i18n.language === 'ar'
                        ? 'https://drive.google.com/file/d/1YdHC4Wu0zs8dWwBWdYpEyfYTjsJpYOTi/view'
                        : 'https://drive.google.com/file/d/1rXh2N6-EFfsVo_0xeSKXqGRzMTxtw5cE/view'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#007bff' }}
                  >
                    {t('consent.readFull')}
                  </a>
                  <Spacer height="1rem" />
                  {i18n.language === 'ar' ? <ArabicConsent /> : <EnglishConsent />}
                </div>

                {/* Virufy Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <strong>{t('consent.virufyTitle')}</strong>
                  <br />
                  <span style={{ fontWeight: 'normal' }}>
                    {t('consent.virufyDesc')}
                  </span>
                  <Spacer height="0.5rem" />
                  <a
                    href="https://virufy.org/en/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#007bff' }}
                  >
                    {t('consent.readFull')}
                  </a>
                </div>

                {/* Report Issue Link */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform?usp=dialog"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: baseFontSize,
                      fontWeight: 'bold',
                      color: '#3578de',
                      textDecoration: 'underline',
                    }}
                  >
                    {t(
                      'recordBreath.reportIssue',
                      'Something wrong? Report an error'
                    )}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ConsentContent>

      {/* Sticky Footer (now limited to page width) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          background: 'transparent',
          zIndex: 100,
          marginBottom: 0,
          boxShadow: '0 -4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '530px',
            margin: '0 auto',
            backgroundColor: '#3578de',
            padding: '0.75rem',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={handleAlreadyConsented}
            style={{
              backgroundColor: 'white',
              color: '#3578de',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: baseFontSize,
            }}
          >
            {t(
              'consent.alreadyConsented',
              isArabic ? 'تمت الموافقة مسبقًا' : 'Already Consented'
            )}
          </button>
        </div>
      </div>
    </ConsentContainer>
    </>
  );
};

export default ConsentScreen;
