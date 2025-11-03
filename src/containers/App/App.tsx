import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreathRecordScreen from "../SubmitSteps/RecordingsSteps/BreathRecord";
import ConfirmationScreen from "../ConfirmationScreen";
import SpeechRecordScreen from "../SubmitSteps/RecordingsSteps/SpeechRecording";
import CoughRecordScreen from "../SubmitSteps/RecordingsSteps/CoughRecordScreen";
import ConsentScreen from "./ConsentPage";
import ClinicalLogin from "./Clinical_Login";

//import ProtectedRoute from "../../components/ProtectedRoute";

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
        {/* Each route's element is now wrapped with <ProtectedRoute> */}
  <Route path="/" element={<ClinicalLogin />} />
        <Route path="/consent" element={<ConsentScreen />} />
        <Route path="/record-breath" element={<BreathRecordScreen />} />
        <Route path="/confirmation" element={<ConfirmationScreen />} />
        <Route path="/record-speech" element={<SpeechRecordScreen />} />
        <Route path="/record-coughs" element={<CoughRecordScreen />} />
        <Route path="/clinical-login" element={<ClinicalLogin />} />
        {/* Upload-complete page removed; submission happens inline on recording screens */}
        {/* Catch all invalid routes and redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
