// DMGT Assessment Form - Completion Page Component
// Professional completion page with results summary and next steps

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { assessmentType, companyId, employeeId } = useParams<{
    assessmentType: string;
    companyId: string;
    employeeId?: string;
  }>();

  const handleStartNewAssessment = () => {
    navigate('/');
  };

  const handleDownloadResults = () => {
    // Placeholder for download functionality
    alert('Results download functionality will be implemented in the full version.');
  };

  const getCompletionMessage = () => {
    if (assessmentType === 'Company') {
      return `Congratulations! Company ${companyId} has successfully completed the comprehensive Data & AI Readiness Assessment.`;
    } else {
      return `Congratulations! Employee ${employeeId} has successfully completed your individual Data & AI Readiness Assessment.`;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAssessmentSummary = () => {
    return {
      assessmentType: assessmentType || 'Unknown',
      completedAt: new Date().toISOString(),
      companyId,
      employeeId
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
