import React, {useEffect} from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import BreathRecordScreen from '../SubmitSteps/RecordingsSteps/BreathRecord';
import ConfirmationScreen from '../ConfirmationScreen';
import SpeechRecordScreen from '../SubmitSteps/RecordingsSteps/SpeechRecording';
import CoughRecordScreen from '../SubmitSteps/RecordingsSteps/CoughRecordScreen';
import UploadCompleteCough from '../SubmitSteps/RecordingsSteps/UploadCompleteCough';


import ConsentScreen from './ConsentPage';
import Clinical_Login from './Clinical_Login';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('ar')} style={{ marginLeft: '1rem' }}>العربية</button>
    </div>
  );
};

// Homepage with navigate
const HomePage: React.FC = () => {
    const navigate = useNavigate();


    const goToConfirmation = () => {
        navigate('/confirmation');
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <h1>Hello Virufy Team 👋</h1>
            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                This is the structure of the team — let’s fit in, collaborate, and build something great on top of it! 🚀
            </p>
            <div style={{ margin: '1rem' }}>

      </div>
            <button
                onClick={goToConfirmation}
                style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '2rem',
                }}
            >
                Next
            </button>
            </div>

    );
};

// Main App with routes 
const App: React.FC = () => {
      const { i18n } = useTranslation();
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
    return (
      <>
      <LanguageSwitcher />
        <Routes>
            <Route path="/" element={<Clinical_Login />} />
            <Route path="/consent" element={<ConsentScreen />} />
            <Route path="/record-breath" element={<BreathRecordScreen />} />
            <Route path="/confirmation" element={<ConfirmationScreen />} />
            <Route path="/record-speech" element={<SpeechRecordScreen />} />
            <Route path="/record-coughs" element={<CoughRecordScreen />} />
            <Route path="/clinical-login" element={<Clinical_Login />} />
            <Route path="/upload-complete" element={<UploadCompleteCough />} />

        </Routes>
      </>
    );
};

//export default App;
/*
const App: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]
  */

export default App;
