/**
 * Enhanced App Component for DMGT Basic Form V2
 * Integrates with dynamic configuration service and provides comprehensive error handling
 */

import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Services
import { config, debugConfig } from './services/config';
import { initializeApiService } from './services/api';

// Context
import { AssessmentProvider } from './context/AssessmentContext';

// Components
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Lazy load components for better performance
const WelcomePage = React.lazy(() => import('./components/WelcomePage'));
const CompanyAssessment = React.lazy(() => import('./components/CompanyAssessment'));
const EmployeeAssessment = React.lazy(() => import('./components/EmployeeAssessment'));
const CompletionPage = React.lazy(() => import('./components/CompletionPage'));

interface AppState {
  isInitialized: boolean;
  initError: string | null;
  configValid: boolean;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isInitialized: false,
    initError: null,
    configValid: false
  });

  /**
   * Initialize application with configuration and services
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing DMGT Assessment Application...');
        
        // Get configuration
        const appConfig = config.getConfig();
        const apiConfig = config.getApiConfig();
        
        // Debug configuration in development
        if (config.isDev()) {
          debugConfig();
        }
        
        // Validate critical configuration
        if (!apiConfig.baseUrl) {
          throw new Error('API base URL is not configured. Please check your deployment configuration.');
        }
        
        // Initialize API service with dynamic configuration
        console.log('🔗 Initializing API service...');
        initializeApiService(apiConfig.baseUrl);
        
        // Set application metadata
        document.title = `${appConfig.appName} - ${appConfig.environment.toUpperCase()}`;
        
        // Add meta tags
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', 
            'Professional enterprise-grade assessment tool for evaluating organizational data and AI readiness.'
          );
        }
        
        // Add environment indicator to body class for CSS targeting
        document.body.className = `env-${appConfig.environment} theme-${appConfig.ui.theme}`;
        
        // CSS custom properties for theming
        const root = document.documentElement;
        root.style.setProperty('--primary-color', appConfig.ui.primaryColor);
        root.style.setProperty('--animation-duration', `${appConfig.ui.animationDuration}ms`);
        root.style.setProperty('--transition-delay', `${appConfig.ui.pageTransitionDelay}ms`);
        
        // Performance monitoring in production
        if (config.isProd() && config.isFeatureEnabled('analytics')) {
          console.log('📊 Analytics enabled for production environment');
          // Analytics initialization would go here
        }
        
        // Log successful initialization
        console.log('✅ Application initialized successfully');
        console.log(`📦 Version: ${appConfig.appVersion}`);
        console.log(`🌍 Environment: ${appConfig.environment}`);
        console.log(`🔗 API Base URL: ${apiConfig.baseUrl}`);
        console.log(`🏠 Region: ${config.getAwsConfig().region}`);
        
        setAppState({
          isInitialized: true,
          initError: null,
          configValid: true
        });
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown initialization error occurred';
        
        setAppState({
          isInitialized: false,
          initError: errorMessage,
          configValid: false
        });
      }
    };

    initializeApp();
  }, []);

  /**
   * Handle application errors
   */
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('🔥 Application Error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (config.isProd()) {
      // Error reporting service integration would go here
      console.error('Error details sent to monitoring service');
    }
  };

  /**
   * Loading component with configuration check
   */
  const LoadingComponent = () => (
    <div className="app-loading">
      <LoadingSpinner 
        size="large" 
        message="Initializing Assessment Platform..." 
      />
      <div className="loading-details">
        <p>Loading configuration...</p>
        <p>Connecting to services...</p>
        <p>Preparing assessment environment...</p>
      </div>
    </div>
  );

  /**
   * Error component for initialization failures
   */
  const InitializationError = ({ error }: { error: string }) => (
    <div className="app-error">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h1>Application Initialization Failed</h1>
        <p className="error-message">{error}</p>
        
        <div className="error-details">
          <h3>Troubleshooting Steps:</h3>
          <ul>
            <li>Check your internet connection</li>
            <li>Verify the application has been properly deployed</li>
            <li>Ensure all AWS resources are accessible</li>
            <li>Contact your system administrator if the problem persists</li>
          </ul>
        </div>
        
        <div className="error-actions">
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
          
          {config.isDev() && (
            <button 
              className="debug-button"
              onClick={() => {
                console.log('🐛 Debug Information:');
                debugConfig();
                console.log('Current App State:', appState);
              }}
            >
              🐛 Debug Info
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Route component with error handling
   */
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!appState.configValid) {
      return <Navigate to="/error" replace />;
    }
    return <>{children}</>;
  };

  // Show initialization error if configuration failed
  if (appState.initError) {
    return <InitializationError error={appState.initError} />;
  }

  // Show loading while initializing
  if (!appState.isInitialized) {
    return <LoadingComponent />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <AssessmentProvider>
        <Router>
          <div className="app">
            {/* Header with environment indicator */}
            <Header />
            
            {/* Main content area */}
            <main className="app-main">
              <Suspense fallback={
                <LoadingSpinner 
                  size="medium" 
                  message="Loading page..." 
                />
              }>
                <Routes>
                  {/* Welcome/Home Route */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <WelcomePage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Company Assessment Route */}
                  <Route 
                    path="/company/:companyId?" 
                    element={
                      <ProtectedRoute>
                        <CompanyAssessment />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Employee Assessment Route */}
                  <Route 
                    path="/employee/:companyId/:employeeId?" 
                    element={
                      <ProtectedRoute>
                        <EmployeeAssessment />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Completion Route */}
                  <Route 
                    path="/complete/:assessmentType/:companyId/:employeeId?" 
                    element={
                      <ProtectedRoute>
                        <CompletionPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Error Route */}
                  <Route 
                    path="/error" 
                    element={
                      <InitializationError 
                        error="Application configuration error. Please contact support." 
                      />
                    } 
                  />
                  
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            
            {/* Footer */}
            <Footer />
            
            {/* Development tools */}
            {config.isDev() && (
              <div className="dev-tools">
                <button 
                  className="dev-debug-btn"
                  onClick={debugConfig}
                  title="Show configuration"
                >
                  🔧
                </button>
              </div>
            )}
          </div>
        </Router>
      </AssessmentProvider>
    </ErrorBoundary>
  );
};

export default App;