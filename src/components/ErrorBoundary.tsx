import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../services/loggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Error Boundary caught an error', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    }, error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          {this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

