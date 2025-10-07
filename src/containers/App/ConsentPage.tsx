
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import BackIcon from '../../assets/images/back-icon.png';
// import { useTranslation } from 'react-i18next';
// import i18n from '../../i18n';
// import { ConsentContainer, ConsentContent } from './consentscreen';
// import EnglishConsent from "../../components/Forms/EnglishConsent";
// import ArabicConsent from '../../components/Forms/ArabicConsent';
// // import AppHeader from '../../components/AppHeader'; // <-- added

// type CheckboxItem = {
//     id: string;
//     label: string;
//     state: boolean;
//     setState: React.Dispatch<React.SetStateAction<boolean>>;
// };

// const ConsentScreen: React.FC = () => {
//     const { t } = useTranslation();
//     const navigate = useNavigate();
//     const isArabic = i18n.language === 'ar';
//     const [ageConfirmed, setAgeConfirmed] = useState(false);
//     const [consentGiven, setConsentGiven] = useState(false);
//     const [privacyAck, setPrivacyAck] = useState(false);
//     const [healthInfoConsent, setHealthInfoConsent] = useState(false);

//     const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
//     const baseFontSize = isTablet ? '1rem' : '0.8rem'; // 16px for tablets, 12.8px otherwise

//     const checkboxes: CheckboxItem[] = [
//         {
//             id: 'ageConfirmed',
//             label: t('consent.checkbox1'),
//             state: ageConfirmed,
//             setState: setAgeConfirmed,
//         },
//         {
//             id: 'consentGiven',
//             label: t('consent.checkbox2'),
//             state: consentGiven,
//             setState: setConsentGiven,
//         },
//         {
//             id: 'privacyAck',
//             label: t('consent.checkbox3'),
//             state: privacyAck,
//             setState: setPrivacyAck,
//         },
//         {
//             id: 'healthInfoConsent',
//             label: t('consent.checkbox4'),
//             state: healthInfoConsent,
//             setState: setHealthInfoConsent,
//         },
//     ];

//     const Spacer = ({ height }: { height: string }) => <div style={{ height }} />;

//     const iframeStyle: React.CSSProperties = {
//         height: '250px',
//         border: '1px solid #ccc',
//         borderRadius: '6px',
//         overflow: 'hidden',
//     };

//     if (window.innerWidth < 768) {
//         iframeStyle.height = '250px';
//     }

//     const handleNext = () => {
//         const allChecked =
//             ageConfirmed && consentGiven && privacyAck && healthInfoConsent;

//         if (allChecked) {
//             navigate('/record-coughs');
//             window.scrollTo(0, 0);
//         } else {
//             alert(t('consent.check_all_alert'));
//         }
//     };

//     const handleSignedPaperNext = () => {
//         navigate('/record-coughs');
//         window.scrollTo(0, 0);
//     };

//     const handleBack = () => {
//         navigate(-1);
//     };

//     // read patientId from sessionStorage so header can show it
//     const sessionPatientId = typeof window !== 'undefined' ? sessionStorage.getItem('patientId') || undefined : undefined;

//     return (


//             <ConsentContainer style={{ paddingTop: 48 }}>
//                 <ConsentContent>
//                     <div className="consent-container">
//                         <div className="consent-content">
//                             <div
//                                 style={{
//                                     minHeight: '100vh',
//                                     padding: 0,
//                                     display: 'flex',
//                                     justifyContent: 'center',
//                                     alignItems: 'center',
//                                     width: '100%',
//                                     fontSize: baseFontSize,
//                                     fontWeight: 400,
//                                     letterSpacing: '0.02em',
//                                     lineHeight: 1.5,
//                                 }}
//                             >
//                                 <div
//                                     style={{
//                                         padding: '1.7rem',
//                                         borderRadius: '0px',
//                                         width: '100%',
//                                     }}
//                                 >
//                                     {/* Header */}
//                                     <div
//                                         style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             justifyContent: 'center',
//                                             position: 'relative',
//                                             padding: '0px 20px',
//                                             textAlign: 'center',
//                                             flexWrap: 'wrap',
//                                             fontWeight: 400,
//                                             letterSpacing: '0.02em',
//                                             lineHeight: 1.5,
//                                         }}
//                                     >
//                                         <button
//                                             onClick={handleBack}
//                                             style={{
//                                                 position: 'absolute',
//                                                 [isArabic ? 'right' : 'left']: '-10px',
//                                                 background: 'none',
//                                                 border: 'none',
//                                                 cursor: 'pointer',
//                                                 marginLeft: '0 px',
//                                             }}
//                                             aria-label={t('consent.back_aria')}
//                                         >
//                                             <img
//                                                 src={BackIcon}
//                                                 alt={t('consent.back_alt')}
//                                                 style={{ width: '25px', height: '35px', transform: isArabic ? 'rotate(180deg)' : 'none', }}
//                                             />
//                                         </button>
//                                         <h2
//                                             style={{
//                                                 color: '#007bff',
//                                                 margin: 0,
//                                                 width: '100%',
//                                                 textAlign: 'center',
//                                                 fontSize: '1rem',
//                                             }}
//                                         >
//                                             {t('consent.title')}
//                                         </h2>
//                                     </div>

//                                     <p style={{
//                                         marginTop: '3rem',
//                                         marginBottom: '2rem',
//                                         whiteSpace: 'pre-line',
//                                         fontSize: baseFontSize,
//                                         width: '100%',
//                                     }}>
//                                         {t('consent.description')}
//                                     </p>

//                                     <div style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
//                                         <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
//                                             {t('consent.dubaiHealthTitle')}<br />
//                                             <span style={{
//                                                 fontWeight: 'normal',
//                                                 marginBottom: '2rem'
//                                             }}>{t('consent.dubaiHealthDesc')}</span>
//                                             <Spacer height="1rem" />
//                                             <a
//                                                 href={
//                                                     i18n.language === 'ar'
//                                                         ? 'https://drive.google.com/file/d/1YdHC4Wu0zs8dWwBWdYpEyfYTjsJpYOTi/view'
//                                                         : 'https://drive.google.com/file/d/1rXh2N6-EFfsVo_0xeSKXqGRzMTxtw5cE/view'

//                                                 }
//                                                 target="_blank"
//                                                 rel="noopener noreferrer"
//                                                 style={{ color: '#000000', fontWeight: 'normal' }}
//                                             >
//                                                 {t('consent.readFull')}
//                                             </a>
//                                             <Spacer height="1rem" />

//                                         </div>
//                                         {i18n.language === "ar" ? <ArabicConsent /> : <EnglishConsent />}
//                                         <Spacer height="1rem" />

//                                         {t('consent.virufyTitle')}<br />
//                                         <span style={{ fontWeight: 'normal' }}>{t('consent.virufyDesc')}</span> <br />
//                                         <Spacer height="1rem" />
//                                         <a
//                                             href={
//                                                 i18n.language === 'ar'
//                                                     ? 'https://virufy.org/en/privacy-policy'
//                                                     : 'https://virufy.org/en/privacy-policy'
//                                             }
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                             style={{ color: '#000000', fontWeight: 'normal' }}
//                                         >
//                                             {t('consent.readFull')}
//                                         </a>
//                                     </div>

//                                     <h4 style={{ marginBottom: '0rem' }}>{t('consent.confirmationTitle')}</h4>
//                                     <p style={{
//                                         fontSize: baseFontSize,
//                                         marginTop: '0rem',
//                                         marginBottom: '1rem',
//                                         fontWeight: 400,
//                                         letterSpacing: '0.02em',
//                                         lineHeight: 1.5,
//                                     }}>{t('consent.confirmationDesc')}</p>

//                                     <div style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
//                                         {checkboxes.map(({ id, label, state, setState }) => (
//                                             <label
//                                                 key={id}
//                                                 htmlFor={id}
//                                                 style={{
//                                                     display: 'flex',
//                                                     alignItems: 'flex-start',
//                                                     gap: '12px',
//                                                     marginBottom: '0.75rem',
//                                                     paddingLeft: 0
//                                                 }}
//                                             >
//                                                 <input
//                                                     type="checkbox"
//                                                     id={id}
//                                                     checked={state}
//                                                     onChange={() => setState(!state)}
//                                                     style={{ marginTop: '0.3rem', borderColor: '#222' }}
//                                                 />{' '}
//                                                 <span>{label}</span>
//                                             </label>
//                                         ))}
//                                     </div>

//                                     <div style={{
//                                         display: 'flex',
//                                         flexDirection: 'column',
//                                         gap: '1rem',
//                                         marginBottom: '1.5rem',
//                                         width: '100%'
//                                     }}>
//                                         <Spacer height="1rem" />

//                                         <button
//                                             onClick={handleNext}
//                                             style={{
//                                                 backgroundColor: "#3578de",
//                                                 fontSize: baseFontSize,
//                                                 color: "white",
//                                                 border: "none",
//                                                 padding: "1.5rem",
//                                                 borderRadius: "15px",
//                                                 fontWeight: "bold",
//                                                 cursor: "pointer",
//                                             }}
//                                         >
//                                             {t('consent.next')}
//                                         </button>

//                                         <button
//                                             onClick={handleSignedPaperNext}
//                                             style={{
//                                                 backgroundColor: "#3578de",
//                                                 fontSize: baseFontSize,
//                                                 color: "white",
//                                                 border: "none",
//                                                 padding: "1.5rem",
//                                                 borderRadius: "15px",
//                                                 fontWeight: "bold",
//                                                 cursor: "pointer",
//                                             }}
//                                         >
//                                             {t('consent.nextPaper')}
//                                         </button>
//                                     </div>
//                                     <div style={{ textAlign: "center" }}>
//                                         <a
//                                             href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform?usp=dialog"
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                             style={{
//                                                 fontSize: baseFontSize,
//                                                 fontWeight: "bold",
//                                                 color: "#3578de",
//                                                 textDecoration: "underline",
//                                             }}
//                                         >
//                                             {t("recordBreath.reportIssue", "Something wrong? Report an error")}
//                                         </a>
//                                     </div>

//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                 </ConsentContent>
//             </ConsentContainer>

//     );
// };

// export default ConsentScreen;


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
        
            <AppHeader patientId={sessionPatientId} isArabic={isArabic} />
    <ConsentContainer style={{ paddingTop: 48 }}>
      <ConsentContent>
        <div className="consent-container">
          <div className="consent-content">
            <div
              style={{
                minHeight: '100vh',
                paddingBottom: '100px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                fontSize: baseFontSize,
                fontWeight: 400,
                letterSpacing: '0.02em',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  padding: '1.7rem',
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
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '530px', // match page width
            margin: '0 auto',
            backgroundColor: '#3578de',  //#3578de
            padding: '1rem',
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
