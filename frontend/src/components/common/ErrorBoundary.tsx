// DMGT Assessment Form - Error Boundary Component
// Professional error handling with user-friendly fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send to an error monitoring service like Sentry
    try {
      console.log('Logging error to monitoring service:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Create a simple error report that can be copied or emailed
    const reportText = `DMGT Assessment Error Report
    
Timestamp: ${errorReport.timestamp}
URL: ${errorReport.url}
User Agent: ${errorReport.userAgent}

Error Message: ${errorReport.message}

Stack Trace:
${errorReport.stack}

Component Stack:
${errorReport.componentStack}`;

    // Copy to clipboard
    navigator.clipboard.writeText(reportText).then(() => {
      alert('Error report copied to clipboard. Please paste this in an email to support.');
    }).catch(() => {
      // Fallback: show in a modal or new window
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`<pre>${reportText}</pre>`);
      }
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className=\"error-boundary\">
          <div className=\"error-boundary-container\">
            <div className=\"error-boundary-content\">
              <div className=\"error-icon\">
                <svg width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
                  <circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"#ef4444\" strokeWidth=\"2\" fill=\"none\"/>
                  <path d=\"m15 9-6 6\" stroke=\"#ef4444\" strokeWidth=\"2\"/>
                  <path d=\"m9 9 6 6\" stroke=\"#ef4444\" strokeWidth=\"2\"/>
                </svg>
              </div>
              
              <h1 className=\"error-title\">Something went wrong</h1>
              
              <p className=\"error-description\">
                We're sorry, but something unexpected happened. This error has been logged 
                and our team will investigate the issue.
              </p>

              <div className=\"error-actions\">
                {this.retryCount < this.maxRetries && (
                  <button 
                    className=\"btn btn-primary\" 
                    onClick={this.handleRetry}
                  >
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                )}
                
                <button 
                  className=\"btn btn-outline\" 
                  onClick={this.handleReload}
                >
                  Reload Page
                </button>
                
                <button 
                  className=\"btn btn-outline\" 
                  onClick={this.handleReportError}
                >
                  Report Error
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className=\"error-details\">
                  <summary>Error Details (Development)</summary>
                  <div className=\"error-stack\">
                    <h3>Error Message:</h3>
                    <pre>{this.state.error.message}</pre>
                    
                    <h3>Stack Trace:</h3>
                    <pre>{this.state.error.stack}</pre>
                    
                    {this.state.errorInfo && (
                      <>
                        <h3>Component Stack:</h3>
                        <pre>{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className=\"error-help\">
                <h3>What you can do:</h3>
                <ul>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try again in a few minutes</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;