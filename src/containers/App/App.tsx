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

// --- Import your new ProtectedRoute component ---
import ProtectedRoute from "../../components/ProtectedRoute";

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
        <Route path="/" element={<ProtectedRoute><Clinical_Login /></ProtectedRoute>} />
        <Route path="/consent" element={<ProtectedRoute><ConsentScreen /></ProtectedRoute>} />
        <Route path="/record-breath" element={<ProtectedRoute><BreathRecordScreen /></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><ConfirmationScreen /></ProtectedRoute>} />
        <Route path="/record-speech" element={<ProtectedRoute><SpeechRecordScreen /></ProtectedRoute>} />
        <Route path="/record-coughs" element={<ProtectedRoute><CoughRecordScreen /></ProtectedRoute>} />
        <Route path="/clinical-login" element={<ProtectedRoute><Clinical_Login /></ProtectedRoute>} />
        <Route path="/upload-complete" element={<ProtectedRoute><UploadCompleteCough /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

export default App;
