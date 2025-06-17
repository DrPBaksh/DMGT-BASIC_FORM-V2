// DMGT Assessment Form - Employee Assessment Component
// Individual employee assessment form (placeholder for now)

import React from 'react';
import { useAssessment } from '../context/AssessmentContext';
import LoadingSpinner from './common/LoadingSpinner';

const EmployeeAssessment: React.FC = () => {
  const { state, navigation } = useAssessment();

  if (state.isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner 
          size="large" 
          message="Loading your employee assessment questions..." 
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container">
        {/* Header */}
        <div className="assessment-header">
          <h1 className="heading-1">Employee Assessment</h1>
          <p className="body-large">
            Personal evaluation for {navigation.employeeInfo?.name} at {navigation.companyInfo?.name}.
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
            <h2 className="heading-3">Personal Assessment</h2>
            <p className="body-normal">
              This assessment will help evaluate your individual skills, experience, and readiness 
              to contribute to data and AI initiatives.
            </p>
          </div>
          <div className="card-body">
            {state.questions.length > 0 ? (
              <div className="questions-placeholder">
                <div className="placeholder-content">
                  <h3>🚧 Employee Assessment Form Coming Soon</h3>
                  <p>
                    The individual employee assessment form with {state.questions.length} questions 
                    is currently being built. This will include:
                  </p>
                  <ul>
                    <li>Personal background and role information</li>
                    <li>Technical skills and experience evaluation</li>
                    <li>Data analytics capabilities assessment</li>
                    <li>AI/ML familiarity and exposure review</li>
                    <li>Learning and development goal planning</li>
                    <li>Workplace application opportunities</li>
                  </ul>
                  <p>
                    The form will be personalized based on your role and include interactive 
                    elements to capture your unique perspective and experience.
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

        {/* Employee Info Summary */}
        {navigation.employeeInfo && (
          <div className="card">
            <div className="card-header">
              <h3 className="heading-4">Your Information</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{navigation.employeeInfo.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employee ID:</span>
                  <span className="info-value">{navigation.employeeInfo.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Company:</span>
                  <span className="info-value">{navigation.companyInfo?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Company ID:</span>
                  <span className="info-value">{navigation.companyInfo?.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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

export default EmployeeAssessment;