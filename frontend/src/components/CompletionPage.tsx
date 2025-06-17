// DMGT Assessment Form - Completion Page Component
// Professional completion page with results summary and next steps

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { formatDateTime } from '../utils';

const CompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, navigation, actions } = useAssessment();

  const handleStartNewAssessment = () => {
    actions.resetForm();
    navigate('/');
  };

  const handleDownloadResults = () => {
    // Placeholder for download functionality
    alert('Results download functionality will be implemented in the full version.');
  };

  const getCompletionMessage = () => {
    if (navigation.assessmentType === 'Company') {
      return `Congratulations! ${navigation.companyInfo?.name} has successfully completed the comprehensive Data & AI Readiness Assessment.`;
    } else {
      return `Congratulations ${navigation.employeeInfo?.name}! You have successfully completed your individual Data & AI Readiness Assessment.`;
    }
  };

  const getAssessmentSummary = () => {
    const totalQuestions = state.progress.totalQuestions;
    const completedQuestions = state.progress.completedQuestions.length;
    const completionRate = state.progress.percentComplete;

    return {
      totalQuestions,
      completedQuestions,
      completionRate,
      assessmentType: navigation.assessmentType,
      completedAt: new Date().toISOString()
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
                <div className="summary-label">Completion Rate</div>
                <div className="summary-value">{summary.completionRate}%</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Questions Answered</div>
                <div className="summary-value">{summary.completedQuestions} of {summary.totalQuestions}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Completed On</div>
                <div className="summary-value">{formatDateTime(summary.completedAt)}</div>
              </div>

              {navigation.companyInfo && (
                <div className="summary-item">
                  <div className="summary-label">Company</div>
                  <div className="summary-value">{navigation.companyInfo.name}</div>
                </div>
              )}

              {navigation.employeeInfo && (
                <div className="summary-item">
                  <div className="summary-label">Employee</div>
                  <div className="summary-value">{navigation.employeeInfo.name}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-3">What Happens Next?</h2>
          </div>
          <div className="card-body">
            <div className="next-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Data Processing</h4>
                  <p>Your responses are being analyzed using our advanced assessment algorithms to generate comprehensive insights.</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Report Generation</h4>
                  <p>A detailed report with personalized recommendations and benchmarking data will be prepared for your organization.</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Results Delivery</h4>
                  <p>You will receive your comprehensive assessment report via email within 24-48 hours, including actionable insights and strategic recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-3">Your Assessment Will Include</h2>
          </div>
          <div className="card-body">
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">📊</div>
                <h4>Comprehensive Analysis</h4>
                <p>Detailed evaluation of your current data and AI capabilities with scoring across multiple dimensions.</p>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">🎯</div>
                <h4>Personalized Recommendations</h4>
                <p>Tailored action plans and strategic recommendations based on your specific responses and industry context.</p>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">📈</div>
                <h4>Benchmarking Insights</h4>
                <p>Compare your readiness against industry standards and best practices from similar organizations.</p>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">🚀</div>
                <h4>Implementation Roadmap</h4>
                <p>Step-by-step guidance for improving your data and AI capabilities with prioritized initiatives.</p>
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

        {/* Contact Information */}
        <div className="contact-card">
          <h3>Need Assistance?</h3>
          <p>
            If you have questions about your assessment or need support, please don't hesitate to contact our team.
          </p>
          <div className="contact-methods">
            <div className="contact-method">
              <strong>Email:</strong> support@dmgt-assessment.com
            </div>
            <div className="contact-method">
              <strong>Phone:</strong> +1 (555) 123-4567
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;