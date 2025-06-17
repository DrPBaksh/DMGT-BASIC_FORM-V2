import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { checkBrowserCompatibility, getEnvironmentConfig } from './utils/config';

// Check browser compatibility on startup
if (!checkBrowserCompatibility()) {
  alert('Your browser may not be fully compatible with this application. Please use a modern browser for the best experience.');
}

// Get environment configuration
const envConfig = getEnvironmentConfig();

// Enable React strict mode in development
const StrictModeWrapper = envConfig.isDevelopment ? React.StrictMode : React.Fragment;

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Please check your HTML template.');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Performance monitoring
if (envConfig.enablePerformanceTracking) {
  if ('performance' in window && 'mark' in window.performance) {
    window.performance.mark('react-render-start');
  }
}

// Render the application
root.render(
  <StrictModeWrapper>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictModeWrapper>
);

// Performance monitoring completion
if (envConfig.enablePerformanceTracking) {
  setTimeout(() => {
    if ('performance' in window && 'mark' in window.performance) {
      window.performance.mark('react-render-complete');
      
      // Measure rendering time
      try {
        window.performance.measure('react-render-time', 'react-render-start', 'react-render-complete');
        const renderMeasure = window.performance.getEntriesByName('react-render-time')[0];
        if (renderMeasure && envConfig.enableDebugLogging) {
          console.log(`React render time: ${renderMeasure.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }, 0);
}

// Enable hot module replacement in development
if (envConfig.isDevelopment && (module as any).hot) {
  (module as any).hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <StrictModeWrapper>
        <BrowserRouter>
          <NextApp />
        </BrowserRouter>
      </StrictModeWrapper>
    );
  });
}

// Global error boundary for unhandled React errors
if (envConfig.enableErrorTracking) {
  window.addEventListener('error', (event) => {
    console.error('React Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });
}

// Report web vitals in production
if (envConfig.isProduction) {
  import('./utils/reportWebVitals').then(({ default: reportWebVitals }) => {
    reportWebVitals(console.log);
  }).catch(() => {
    // Silently fail if web vitals reporting is not available
  });
}

// Accessibility announcements for screen readers
if ('speechSynthesis' in window) {
  // Announce when the app is ready
  setTimeout(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'DMGT Assessment Platform loaded successfully';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  }, 2000);
}
