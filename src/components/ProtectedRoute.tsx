// src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

// This component will wrap your pages
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const auth = useAuth();

  useEffect(() => {
    // This effect checks if the user needs to be redirected to login
    if (!auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading) {
      // The signinRedirect function sends the user to the Cognito login page
      auth.signinRedirect();
    }
  }, [auth]);

  // While the library is checking the user's session, show a loading message
  if (auth.isLoading) {
    return <div>Loading authentication...</div>;
  }

  // If an error occurred, display it
  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  // If the user is authenticated, show the page they were trying to access
  if (auth.isAuthenticated) {
    return children;
  }

  // If none of the above, it means the redirect to Cognito is in progress
  return <div>Redirecting to login...</div>;
};

export default ProtectedRoute;