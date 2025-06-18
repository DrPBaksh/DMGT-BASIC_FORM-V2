// DMGT Assessment Form - Completion Page Component
// Professional completion page with results summary and next steps

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';

const CompletionPage = () => {
  const navigate = useNavigate();
  const { state, clearAssessment } = useAssessment();
  const { assessmentType, companyId, employeeId } = useParams();

  const handleStartNewAssessment = () => {
    clearAssessment();
    navigate('/');
  };

  const handleDownloadResults = () => {
    alert('Results download functionality will be implemented in the full version.');
  };

  const getCompletionMessage = () => {
    if (assessmentType === 'Company') {
      return `Congratulations! Company ${companyId} has successfully completed the comprehensive Data & AI Readiness Assessment.`;
    } else {
      return `Congratulations! Employee ${employeeId} has successfully completed your individual Data & AI Readiness Assessment.`;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAssessmentSummary = () => {
    return {
      assessmentType: assessmentType || 'Unknown',
      completedAt: state.currentAssessment?.metadata?.completedAt || new Date().toISOString(),
      companyId,
      employeeId,
      progress: state.currentAssessment?.progress || 0,
      responseCount: state.currentAssessment?.responses.length || 0
    };
  };

  const summary = getAssessmentSummary();

  return (
    <div className="page-container">
      <div className="content-container">
        {/* Success Header */}
        <div className="completion-header">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" fill="none"/>
              <path d="m9 12 2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="heading-1">Assessment Complete!</h1>
          
          <p className="completion-message">
            {getCompletionMessage()}
          </p>
        </div>

        {/* Assessment Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-3">Assessment Summary</h2>
          </div>
          <div className="card-body">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Assessment Type</div>
                <div className="summary-value">
                  {summary.assessmentType === 'Company' ? '🏢' : '👤'} {summary.assessmentType} Assessment
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Completed On</div>
                <div className="summary-value">{formatDateTime(summary.completedAt)}</div>
              </div>

              <div className="summary-item">
                <div className="summary-label">Company ID</div>
                <div className="summary-value">{summary.companyId}</div>
              </div>

              {summary.employeeId && (
                <div className="summary-item">
                  <div className="summary-label">Employee ID</div>
                  <div className="summary-value">{summary.employeeId}</div>
                </div>
              )}

              <div className="summary-item">
                <div className="summary-label">Progress</div>
                <div className="summary-value">{summary.progress}% Complete</div>
              </div>

              <div className="summary-item">
                <div className="summary-label">Responses</div>
                <div className="summary-value">{summary.responseCount} Answers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="completion-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={handleDownloadResults}
          >
            Download Preliminary Results
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={handleStartNewAssessment}
          >
            Start New Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;