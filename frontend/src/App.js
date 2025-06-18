import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
import { AssessmentProvider } from './context/AssessmentContext';

// Components
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Lazy load main components for better performance
const WelcomePage = React.lazy(() => import('./components/WelcomePage'));
const CompanyAssessment = React.lazy(() => import('./components/CompanyAssessment'));
const EmployeeAssessment = React.lazy(() => import('./components/EmployeeAssessment'));
const CompletionPage = React.lazy(() => import('./components/CompletionPage'));

// Environment configuration
const getEnvironmentConfig = () => {
  return {
    apiUrl: process.env.REACT_APP_ApiGatewayUrl || '',
    environment: process.env.REACT_APP_ENVIRONMENT || 'dev',
    region: process.env.REACT_APP_AwsRegion || 'eu-west-2',
    cloudfrontUrl: process.env.REACT_APP_CloudFrontUrl || '',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  };
};

const App = () => {
  const [appState, setAppState] = useState({
    isInitialized: false,
    initError: null,
    config: getEnvironmentConfig()
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing DMGT Assessment Application...');
        
        const config = getEnvironmentConfig();
        
        // Validate critical configuration
        if (!config.apiUrl) {
          throw new Error('API Gateway URL is not configured. Please check your deployment.');
        }
        
        // Set document title and metadata
        document.title = `DMGT Assessment Platform - ${config.environment.toUpperCase()}`;
        
        // Add meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', 
            'Professional enterprise-grade assessment tool for evaluating organizational data and AI readiness capabilities.'
          );
        }
        
        // Add environment class to body for styling
        document.body.className = `env-${config.environment}`;
        
        console.log('✅ Application initialized successfully');
        console.log(`🌍 Environment: ${config.environment}`);
        console.log(`🔗 API URL: ${config.apiUrl}`);
        console.log(`☁️ CloudFront URL: ${config.cloudfrontUrl}`);
        console.log(`🏠 Region: ${config.region}`);
        
        setAppState({
          isInitialized: true,
          initError: null,
          config
        });
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown initialization error occurred';
        
        setAppState(prev => ({
          ...prev,
          isInitialized: false,
          initError: errorMessage
        }));
      }
    };

    initializeApp();
  }, []);

  // Handle application errors
  const handleError = (error, errorInfo) => {
    console.error('🔥 Application Error:', error, errorInfo);
    
    // In production, send to monitoring service
    if (appState.config.isProduction) {
      console.error('Error reported to monitoring service');
    }
  };

  // Loading component
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

  // Error component for initialization failures
  const InitializationError = ({ error }) => (
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
          
          {appState.config.isDevelopment && (
            <button 
              className="debug-button"
              onClick={() => {
                console.log('🐛 Debug Information:');
                console.log('App State:', appState);
                console.log('Environment Variables:', {
                  apiUrl: process.env.REACT_APP_ApiGatewayUrl,
                  environment: process.env.REACT_APP_ENVIRONMENT,
                  region: process.env.REACT_APP_AwsRegion
                });
              }}
            >
              🐛 Debug Info
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Show initialization error
  if (appState.initError) {
    return <InitializationError error={appState.initError} />;
  }

  // Show loading while initializing
  if (!appState.isInitialized) {
    return <LoadingComponent />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <AssessmentProvider config={appState.config}>
        <Router>
          <div className="app">
            <Header />
            
            <main className="app-main">
              <Suspense fallback={
                <div className="page-loading">
                  <LoadingSpinner 
                    size="medium" 
                    message="Loading page..." 
                  />
                </div>
              }>
                <Routes>
                  {/* Welcome/Home Route */}
                  <Route path="/" element={<WelcomePage />} />
                  
                  {/* Company Assessment Routes */}
                  <Route path="/company" element={<CompanyAssessment />} />
                  <Route path="/company/:companyId" element={<CompanyAssessment />} />
                  
                  {/* Employee Assessment Routes */}
                  <Route path="/employee" element={<EmployeeAssessment />} />
                  <Route path="/employee/:companyId" element={<EmployeeAssessment />} />
                  <Route path="/employee/:companyId/:employeeId" element={<EmployeeAssessment />} />
                  
                  {/* Completion Routes */}
                  <Route path="/complete/:assessmentType/:companyId" element={<CompletionPage />} />
                  <Route path="/complete/:assessmentType/:companyId/:employeeId" element={<CompletionPage />} />
                  
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            
            <Footer />
            
            {/* Development tools */}
            {appState.config.isDevelopment && (
              <div className="dev-tools">
                <button 
                  className="dev-debug-btn"
                  onClick={() => {
                    console.log('🔧 Configuration:', appState.config);
                    console.log('🌐 Environment Variables:', {
                      NODE_ENV: process.env.NODE_ENV,
                      REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
                      REACT_APP_ApiGatewayUrl: process.env.REACT_APP_ApiGatewayUrl,
                      REACT_APP_CloudFrontUrl: process.env.REACT_APP_CloudFrontUrl
                    });
                  }}
                  title="Show configuration and debug info"
                >
                  🔧 Debug
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
