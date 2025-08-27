import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './containers/App/App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './assets/fonts/font.css';



const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const base =
  window.location.pathname.startsWith("/dh-app") ? "/dh-app" : "/";

root.render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
