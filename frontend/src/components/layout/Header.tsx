// DMGT Assessment Form - Header Component
// Professional header with navigation and branding

import React from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { formatTimeAgo } from '../../utils';
import './Header.css';

const Header: React.FC = () => {
  const { state, navigation } = useAssessment();

  const getPageTitle = () => {
    switch (navigation.currentPage) {
      case 'welcome':
        return 'Welcome';
      case 'company-form':
        return 'Company Assessment';
      case 'employee-form':
        return 'Employee Assessment';
      case 'completed':
        return 'Assessment Complete';
      default:
        return 'DMGT Assessment';
    }
  };

  const showProgress = navigation.currentPage === 'company-form' || navigation.currentPage === 'employee-form';

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand */}
        <div className="header-brand">
          <div className="brand-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#gradient)" />
              <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#007AFF" />
                  <stop offset="1" stopColor="#005cbf" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">DMGT Assessment</h1>
            <p className="brand-subtitle">Data & AI Readiness Platform</p>
          </div>
        </div>

        {/* Navigation Info */}
        <div className="header-nav">
          <div className="page-info">
            <h2 className="page-title">{getPageTitle()}</h2>
            {navigation.companyInfo && (
              <div className="company-info">
                <span className="company-name">{navigation.companyInfo.name}</span>
                {navigation.employeeInfo && (
                  <span className="employee-name">• {navigation.employeeInfo.name}</span>
                )}
              </div>
            )}
          </div>

          {/* Progress Section */}
          {showProgress && (
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-text">
                  {state.progress.completedQuestions.length} of {state.progress.totalQuestions} completed
                </span>
                <span className="progress-percentage">
                  {state.progress.percentComplete}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${state.progress.percentComplete}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="header-status">
          {/* Auto-save status */}
          {showProgress && (
            <div className="save-status">
              {state.isSaving ? (
                <div className="status-indicator saving">
                  <div className="status-icon spinning">⟳</div>
                  <span>Saving...</span>
                </div>
              ) : state.hasUnsavedChanges ? (
                <div className="status-indicator unsaved">
                  <div className="status-icon">●</div>
                  <span>Unsaved changes</span>
                </div>
              ) : state.lastSaved ? (
                <div className="status-indicator saved">
                  <div className="status-icon">✓</div>
                  <span>Saved {formatTimeAgo(state.lastSaved)}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Assessment type badge */}
          {navigation.assessmentType && (
            <div className={`assessment-badge ${navigation.assessmentType.toLowerCase()}`}>
              {navigation.assessmentType === 'Company' ? '🏢' : '👤'} {navigation.assessmentType}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;