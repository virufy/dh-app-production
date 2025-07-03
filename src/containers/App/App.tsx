import React from 'react';
import './App.css';
import CoughRecordScreen from "../SubmitSteps/RecordingsSteps/CoughRecordScreen"
import UploadCompleteCough from "../SubmitSteps/RecordingsSteps/UploadCompleteCough"

const App: React.FC = () => {
  return (
    // <div>
    //     <CoughRecordScreen/>
    //     <UploadCompleteCough
    //         audioFileUrl="example-url.mp3"
    //         filename="Filename.wav"
    //         onRetake={() => {
    //             console.log("Retake clicked");
    //         }}
    //     />
    // </div>
      <h1>Hello, React is working!</h1>
  );
};

export default App;
