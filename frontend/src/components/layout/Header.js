// DMGT Assessment Form - Header Component
// Professional header with navigation and branding

import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { formatTimeAgo } from '../../utils';
import './Header.css';

const Header = () => {
  const { state } = useAssessment();
  const location = useLocation();
  const { companyId, employeeId } = useParams();

  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') {
      return 'Welcome';
    } else if (path.includes('/company')) {
      return 'Company Assessment';
    } else if (path.includes('/employee')) {
      return 'Employee Assessment';
    } else if (path.includes('/complete')) {
      return 'Assessment Complete';
    } else {
      return 'DMGT Assessment';
    }
  };

  const getAssessmentType = () => {
    const path = location.pathname;
    if (path.includes('/company')) return 'Company';
    if (path.includes('/employee')) return 'Employee';
    return null;
  };

  const showProgress = location.pathname.includes('/company') || location.pathname.includes('/employee');
  const assessmentType = getAssessmentType();

  // Calculate progress from current assessment state
  const calculateProgress = () => {
    if (!state.currentAssessment) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = state.currentAssessment.responses.length;
    const total = state.questions[state.currentAssessment.type]?.questions.length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const progress = calculateProgress();

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
            {(companyId || employeeId) && (
              <div className="company-info">
                {companyId && (
                  <span className="company-name">Company: {companyId}</span>
                )}
                {employeeId && (
                  <span className="employee-name">• Employee: {employeeId}</span>
                )}
              </div>
            )}
          </div>

          {/* Progress Section */}
          {showProgress && state.currentAssessment && (
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-text">
                  {progress.completed} of {progress.total} completed
                </span>
                <span className="progress-percentage">
                  {progress.percentage}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="header-status">
          {/* Auto-save status */}
          {showProgress && state.currentAssessment && (
            <div className="save-status">
              {state.loading.saving ? (
                <div className="status-indicator saving">
                  <div className="status-icon spinning">⟳</div>
                  <span>Saving...</span>
                </div>
              ) : state.lastAutoSave ? (
                <div className="status-indicator saved">
                  <div className="status-icon">✓</div>
                  <span>Saved {formatTimeAgo(state.lastAutoSave)}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Assessment type badge */}
          {assessmentType && (
            <div className={`assessment-badge ${assessmentType.toLowerCase()}`}>
              {assessmentType === 'Company' ? '🏢' : '👤'} {assessmentType}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;