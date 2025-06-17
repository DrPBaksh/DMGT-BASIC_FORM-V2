// DMGT Assessment Form - Welcome Page Component
// Premium landing page with exceptional design and user experience

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { generateId } from '../utils';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { actions } = useAssessment();
  
  const [selectedType, setSelectedType] = useState<'Company' | 'Employee' | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelection = (type: 'Company' | 'Employee') => {
    setSelectedType(type);
    // Generate a default company ID if not provided
    if (!companyId) {
      setCompanyId(generateId(8));
    }
  };

  const handleStartAssessment = async () => {
    if (!selectedType || !companyId || !companyName) {
      return;
    }

    if (selectedType === 'Employee' && (!employeeId || !employeeName)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Set assessment type
      actions.setAssessmentType(selectedType);

      // Set company information
      actions.setCompanyInfo({
        id: companyId.trim(),
        name: companyName.trim()
      });

      // Set employee information if applicable
      if (selectedType === 'Employee' && employeeId && employeeName) {
        actions.setEmployeeInfo({
          id: employeeId.trim(),
          name: employeeName.trim(),
          companyId: companyId.trim()
        });
      }

      // Navigate to appropriate assessment
      const route = selectedType === 'Company' ? '/company-assessment' : '/employee-assessment';
      navigate(route);

    } catch (error) {
      console.error('Failed to start assessment:', error);
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!selectedType || !companyId.trim() || !companyName.trim()) {
      return false;
    }

    if (selectedType === 'Employee') {
      return employeeId.trim() && employeeName.trim();
    }

    return true;
  };

  return (
    <div className=\"welcome-page\">
      <div className=\"page-container\">
        {/* Hero Section */}
        <section className=\"hero-section\">
          <div className=\"hero-content\">
            <h1 className=\"hero-title\">
              Data & AI Readiness Assessment
            </h1>
            <p className=\"hero-subtitle\">
              Evaluate your organization's data and artificial intelligence capabilities 
              with our comprehensive assessment platform designed for enterprise excellence.
            </p>
            
            <div className=\"hero-features\">
              <div className=\"hero-feature\">
                <div className=\"hero-feature-icon\">📊</div>
                <h3 className=\"hero-feature-title\">Comprehensive Analysis</h3>
                <p className=\"hero-feature-description\">
                  In-depth evaluation of data infrastructure, AI capabilities, and organizational readiness
                </p>
              </div>
              
              <div className=\"hero-feature\">
                <div className=\"hero-feature-icon\">🎯</div>
                <h3 className=\"hero-feature-title\">Actionable Insights</h3>
                <p className=\"hero-feature-description\">
                  Receive detailed recommendations and strategic guidance for your digital transformation
                </p>
              </div>
              
              <div className=\"hero-feature\">
                <div className=\"hero-feature-icon\">🚀</div>
                <h3 className=\"hero-feature-title\">Enterprise Ready</h3>
                <p className=\"hero-feature-description\">
                  Professional-grade assessment platform designed for organizations of all sizes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Assessment Selection */}
        <section className=\"assessment-selection\">
          <h2 className=\"section-title\">Choose Your Assessment Type</h2>
          <p className=\"section-description\">
            Select the assessment that best fits your role and objectives
          </p>

          <div className=\"assessment-types\">
            {/* Company Assessment Card */}
            <div 
              className={`assessment-card ${selectedType === 'Company' ? 'selected' : ''}`}
              onClick={() => handleTypeSelection('Company')}
            >
              <div className=\"assessment-card-header\">
                <div className=\"assessment-card-icon\">🏢</div>
                <h3 className=\"assessment-card-title\">Company Assessment</h3>
                <p className=\"assessment-card-subtitle\">Organizational Level</p>
              </div>
              
              <p className=\"assessment-card-description\">
                Comprehensive evaluation of your organization's data and AI strategy, 
                infrastructure, governance, and overall readiness for digital transformation.
              </p>
              
              <ul className=\"assessment-card-features\">
                <li>Strategic alignment and vision</li>
                <li>Data infrastructure assessment</li>
                <li>AI capabilities evaluation</li>
                <li>Governance and compliance review</li>
                <li>Organizational readiness analysis</li>
              </ul>
              
              <div className=\"assessment-card-details\">
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Duration:</span>
                  <span className=\"detail-value\">25-35 minutes</span>
                </div>
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Sections:</span>
                  <span className=\"detail-value\">5 comprehensive areas</span>
                </div>
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Access:</span>
                  <span className=\"detail-value\">One per company</span>
                </div>
              </div>
            </div>

            {/* Employee Assessment Card */}
            <div 
              className={`assessment-card ${selectedType === 'Employee' ? 'selected' : ''}`}
              onClick={() => handleTypeSelection('Employee')}
            >
              <div className=\"assessment-card-header\">
                <div className=\"assessment-card-icon\">👤</div>
                <h3 className=\"assessment-card-title\">Employee Assessment</h3>
                <p className=\"assessment-card-subtitle\">Individual Level</p>
              </div>
              
              <p className=\"assessment-card-description\">
                Personal assessment to evaluate your individual skills, experience, and 
                readiness to contribute to data and AI initiatives within your organization.
              </p>
              
              <ul className=\"assessment-card-features\">
                <li>Technical skills and experience</li>
                <li>Data analytics capabilities</li>
                <li>AI/ML familiarity and exposure</li>
                <li>Learning and development goals</li>
                <li>Workplace application opportunities</li>
              </ul>
              
              <div className=\"assessment-card-details\">
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Duration:</span>
                  <span className=\"detail-value\">15-25 minutes</span>
                </div>
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Sections:</span>
                  <span className=\"detail-value\">6 focused areas</span>
                </div>
                <div className=\"detail-item\">
                  <span className=\"detail-label\">Access:</span>
                  <span className=\"detail-value\">Multiple per company</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Information Form */}
        {selectedType && (
          <section className=\"information-form\">
            <div className=\"form-wrapper\">
              <div className=\"form-card\">
                <h3 className=\"form-title\">
                  {selectedType === 'Company' ? 'Company Information' : 'Your Information'}
                </h3>
                <p className=\"form-description\">
                  Please provide the following information to begin your assessment
                </p>

                <div className=\"form-fields\">
                  {/* Company Information */}
                  <div className=\"form-group\">
                    <label className=\"form-label required\" htmlFor=\"companyId\">
                      Company ID
                    </label>
                    <input
                      id=\"companyId\"
                      type=\"text\"
                      className=\"form-input\"
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      placeholder=\"Enter a unique identifier for your company\"
                      required
                    />
                    <p className=\"form-help\">
                      This ID will be used to link assessments. Use a consistent identifier across all employees.
                    </p>
                  </div>

                  <div className=\"form-group\">
                    <label className=\"form-label required\" htmlFor=\"companyName\">
                      Company Name
                    </label>
                    <input
                      id=\"companyName\"
                      type=\"text\"
                      className=\"form-input\"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder=\"Enter your company name\"
                      required
                    />
                  </div>

                  {/* Employee Information (only for Employee assessment) */}
                  {selectedType === 'Employee' && (
                    <>
                      <div className=\"form-group\">
                        <label className=\"form-label required\" htmlFor=\"employeeId\">
                          Employee ID
                        </label>
                        <input
                          id=\"employeeId\"
                          type=\"text\"
                          className=\"form-input\"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          placeholder=\"Enter your employee ID or unique identifier\"
                          required
                        />
                      </div>

                      <div className=\"form-group\">
                        <label className=\"form-label required\" htmlFor=\"employeeName\">
                          Your Name
                        </label>
                        <input
                          id=\"employeeName\"
                          type=\"text\"
                          className=\"form-input\"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder=\"Enter your full name\"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className=\"form-actions\">
                  <button
                    className=\"btn btn-primary btn-large\"
                    onClick={handleStartAssessment}
                    disabled={!isFormValid() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className=\"btn-spinner\"></div>
                        Starting Assessment...
                      </>
                    ) : (
                      `Start ${selectedType} Assessment`
                    )}
                  </button>
                  
                  <button
                    className=\"btn btn-outline\"
                    onClick={() => setSelectedType(null)}
                    disabled={isSubmitting}
                  >
                    Change Assessment Type
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Additional Information */}
        <section className=\"additional-info\">
          <div className=\"info-grid\">
            <div className=\"info-card\">
              <h3>🔒 Privacy & Security</h3>
              <p>
                Your responses are encrypted and stored securely. We follow enterprise-grade 
                security practices to protect your data.
              </p>
            </div>
            
            <div className=\"info-card\">
              <h3>📊 Detailed Reports</h3>
              <p>
                Receive comprehensive analysis with actionable recommendations 
                tailored to your organization's needs.
              </p>
            </div>
            
            <div className=\"info-card\">
              <h3>🎯 Benchmarking</h3>
              <p>
                Compare your results against industry standards and best practices 
                to identify improvement opportunities.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WelcomePage;