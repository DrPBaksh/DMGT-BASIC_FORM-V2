// DMGT Assessment Form - Company Assessment Component
// Comprehensive company-level assessment form (placeholder for now)

import React from 'react';
import { useAssessment } from '../context/AssessmentContext';
import LoadingSpinner from './common/LoadingSpinner';

const CompanyAssessment: React.FC = () => {
  const { state, navigation } = useAssessment();

  if (state.isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner 
          size="large" 
          message="Loading your company assessment questions..." 
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container">
        {/* Header */}
        <div className="assessment-header">
          <h1 className="heading-1">Company Assessment</h1>
          <p className="body-large">
            Comprehensive evaluation of {navigation.companyInfo?.name}'s data and AI readiness.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-3">Assessment Progress</h2>
          </div>
          <div className="card-body">
            <div className="progress-summary">
              <div className="progress-stat">
                <span className="stat-value">{state.progress.completedQuestions.length}</span>
                <span className="stat-label">Questions Completed</span>
              </div>
              <div className="progress-stat">
                <span className="stat-value">{state.progress.totalQuestions}</span>
                <span className="stat-label">Total Questions</span>
              </div>
              <div className="progress-stat">
                <span className="stat-value">{state.progress.percentComplete}%</span>
                <span className="stat-label">Progress</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${state.progress.percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assessment Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-3">Assessment Questions</h2>
            <p className="body-normal">
              Please answer all questions to the best of your knowledge. Your responses will help us 
              evaluate your organization's data and AI readiness.
            </p>
          </div>
          <div className="card-body">
            {state.questions.length > 0 ? (
              <div className="questions-placeholder">
                <div className="placeholder-content">
                  <h3>🚧 Assessment Form Coming Soon</h3>
                  <p>
                    The comprehensive company assessment form with {state.questions.length} questions 
                    is currently being built. This will include:
                  </p>
                  <ul>
                    <li>Strategic alignment and vision questions</li>
                    <li>Data infrastructure assessment</li>
                    <li>AI capabilities evaluation</li>
                    <li>Governance and compliance review</li>
                    <li>Organizational readiness analysis</li>
                  </ul>
                  <p>
                    The form will support multiple question types including text input, multiple choice, 
                    file uploads, and rating scales with auto-save functionality.
                  </p>
                </div>
              </div>
            ) : (
              <div className="no-questions">
                <h3>No Questions Available</h3>
                <p>Questions are being loaded. Please wait...</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="assessment-actions">
          <button className="btn btn-outline">
            Save Progress
          </button>
          <button className="btn btn-primary" disabled>
            Complete Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyAssessment;