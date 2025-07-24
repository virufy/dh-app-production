import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreathRecordScreen from "../SubmitSteps/RecordingsSteps/BreathRecord";
import ConfirmationScreen from "../ConfirmationScreen";
import SpeechRecordScreen from "../SubmitSteps/RecordingsSteps/SpeechRecording";
import CoughRecordScreen from "../SubmitSteps/RecordingsSteps/CoughRecordScreen";
import UploadCompleteCough from "../SubmitSteps/RecordingsSteps/UploadCompleteCough";
import ConsentScreen from "./ConsentPage";
import Clinical_Login from "./Clinical_Login";

// Main App with routes and language support
const App: React.FC = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language === "ar") {
      document.documentElement.style.fontFamily = "'Cairo', 'Amiri', sans-serif";
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.style.direction = "rtl";
      document.documentElement.style.textAlign = "right";
      document.documentElement.style.unicodeBidi = "isolate";
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.style.direction = "ltr";
      document.documentElement.style.textAlign = "left";
      document.documentElement.style.unicodeBidi = "normal";
    }
  }, [i18n.language]);

  return (
    <>
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

export default App;
