import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Components
import WelcomePage from './components/WelcomePage';
import CompanyAssessment from './components/CompanyAssessment';
import EmployeeAssessment from './components/EmployeeAssessment';
import CompletionPage from './components/CompletionPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Context
import { AssessmentProvider } from './context/AssessmentContext';

// Types
import { NavigationState, AppConfig } from './types';

// Utilities
import { getAppConfig } from './utils/config';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: 'welcome'
  });

  const navigate = useNavigate();

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load application configuration
        const appConfig = await getAppConfig();
        setConfig(appConfig);

        // Check for existing session
        const savedState = localStorage.getItem('dmgt_navigation_state');
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            setNavigationState(parsedState);
            
            // Navigate to saved page
            if (parsedState.currentPage !== 'welcome') {
              navigate(`/${parsedState.currentPage}`);
            }
          } catch (error) {
            console.warn('Failed to parse saved navigation state:', error);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize application:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [navigate]);

  // Save navigation state to localStorage
  useEffect(() => {
    localStorage.setItem('dmgt_navigation_state', JSON.stringify(navigationState));
  }, [navigationState]);

  const updateNavigationState = (updates: Partial<NavigationState>) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  };

  if (isLoading || !config) {
    return (
      <div className=\"app-loading\">
        <LoadingSpinner size=\"large\" />
        <p className=\"loading-text\">Initializing DMGT Assessment Platform...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AssessmentProvider config={config} navigationState={navigationState} updateNavigationState={updateNavigationState}>
        <div className=\"app\">
          <Header />
          
          <main className=\"main-content\">
            <Routes>
              <Route 
                path=\"/\" 
                element={<WelcomePage />} 
              />
              
              <Route 
                path=\"/welcome\" 
                element={<WelcomePage />} 
              />
              
              <Route 
                path=\"/company-assessment\" 
                element={
                  navigationState.assessmentType === 'Company' ? 
                    <CompanyAssessment /> : 
                    <Navigate to=\"/\" replace />
                } 
              />
              
              <Route 
                path=\"/employee-assessment\" 
                element={
                  navigationState.assessmentType === 'Employee' ? 
                    <EmployeeAssessment /> : 
                    <Navigate to=\"/\" replace />
                } 
              />
              
              <Route 
                path=\"/completed\" 
                element={<CompletionPage />} 
              />
              
              {/* Catch all route */}
              <Route 
                path=\"*\" 
                element={<Navigate to=\"/\" replace />} 
              />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </AssessmentProvider>
    </ErrorBoundary>
  );
};

export default App;