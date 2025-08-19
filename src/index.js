// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./containers/App/App";
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom"; // <-- 1. Import BrowserRouter

const cognitoAuthConfig = {
  authority: "https://cognito-idp.me-central-1.amazonaws.com/me-central-1_dMbAdlO1O",
  client_id: "7i0gu5on19ioo3acpj5h2hia6v",
  redirect_uri: "https://d1a13hxt7cozg2.cloudfront.net/", // <-- This is your app's base URL
  response_type: "code",
  scope: "email openid phone",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* 2. Wrap AuthProvider with BrowserRouter */}
    <BrowserRouter>
      <AuthProvider {...cognitoAuthConfig}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);