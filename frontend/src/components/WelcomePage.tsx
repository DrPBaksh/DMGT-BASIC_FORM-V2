/**
 * Enhanced WelcomePage Component for DMGT Basic Form V2
 * Premium design with amazing UX, comprehensive form handling, and configuration integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { config, isDevelopment } from '../services/config';
import { getApiService } from '../services/api';
import './WelcomePage.css';

interface FormData {
  assessmentType: 'Company' | 'Employee' | '';
  companyId: string;
  companyName: string;
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

interface ApiHealthStatus {
  healthy: boolean;
  responseTime?: number;
  lastChecked?: string;
}

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    assessmentType: '',
    companyId: '',
    companyName: '',
    employeeId: '',
    employeeName: '',
    email: '',
    department: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({ healthy: true });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get app configuration
  const appConfig = config.getConfig();
  const appMetadata = config.getAppMetadata();

  /**
   * API health check on component mount
   */
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const apiService = getApiService();
        const healthResult = await apiService.checkHealth();
        setApiHealth({
          healthy: healthResult.healthy,
          responseTime: healthResult.details?.responseTime,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        console.warn('API health check failed:', error);
        setApiHealth({ 
          healthy: false, 
          lastChecked: new Date().toISOString() 
        });
      }
    };

    checkApiHealth();
  }, []);

  /**
   * Form validation with comprehensive checks
   */
  const validateForm = useMemo(() => {
    return (data: FormData): FormErrors => {
      const newErrors: FormErrors = {};

      // Assessment type validation
      if (!data.assessmentType) {
        newErrors.assessmentType = 'Please select an assessment type';
      }

      // Company information validation
      if (!data.companyId.trim()) {
        newErrors.companyId = 'Company ID is required';
      } else if (data.companyId.length < 2) {
        newErrors.companyId = 'Company ID must be at least 2 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.companyId)) {
        newErrors.companyId = 'Company ID can only contain letters, numbers, hyphens, and underscores';
      }

      if (!data.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      } else if (data.companyName.length < 2) {
        newErrors.companyName = 'Company name must be at least 2 characters';
      }

      // Employee-specific validation
      if (data.assessmentType === 'Employee') {
        if (!data.employeeId.trim()) {
          newErrors.employeeId = 'Employee ID is required for employee assessments';
        } else if (data.employeeId.length < 2) {
          newErrors.employeeId = 'Employee ID must be at least 2 characters';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(data.employeeId)) {
          newErrors.employeeId = 'Employee ID can only contain letters, numbers, hyphens, and underscores';
        }

        if (!data.employeeName.trim()) {
          newErrors.employeeName = 'Employee name is required for employee assessments';
        } else if (data.employeeName.length < 2) {
          newErrors.employeeName = 'Employee name must be at least 2 characters';
        }

        if (!data.email.trim()) {
          newErrors.email = 'Email is required for employee assessments';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          newErrors.email = 'Please enter a valid email address';
        }

        if (!data.department.trim()) {
          newErrors.department = 'Department is required for employee assessments';
        }

        if (!data.role.trim()) {
          newErrors.role = 'Role is required for employee assessments';
        }
      }

      return newErrors;
    };
  }, []);

  /**
   * Handle form field changes with real-time validation
   */
  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear related errors when user starts typing
      const newErrors = { ...errors };
      delete newErrors[field];
      
      // Special handling for assessment type change
      if (field === 'assessmentType' && value !== prev.assessmentType) {
        // Clear employee-specific fields if switching to company assessment
        if (value === 'Company') {
          updated.employeeId = '';
          updated.employeeName = '';
          updated.email = '';
          updated.department = '';
          updated.role = '';
          
          // Clear employee-specific errors
          delete newErrors.employeeId;
          delete newErrors.employeeName;
          delete newErrors.email;
          delete newErrors.department;
          delete newErrors.role;
        }
      }
      
      setErrors(newErrors);
      return updated;
    });
  };

  /**
   * Generate smart suggestions for company/employee IDs
   */
  const generateSuggestions = (type: 'company' | 'employee') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    
    if (type === 'company') {
      const baseName = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 8);
      return baseName ? `${baseName}-${timestamp}` : `company-${timestamp}`;
    } else {
      const baseName = formData.employeeName.toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 6);
      return baseName ? `${baseName}-${random}` : `emp-${random}`;
    }
  };

  /**
   * Handle form submission with comprehensive validation
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const formErrors = validateForm(formData);
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // Focus on first error field
      const firstErrorField = Object.keys(formErrors)[0];
      const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      fieldElement?.focus();
      
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Check API health before proceeding
      if (!apiHealth.healthy && !isDevelopment()) {
        throw new Error('API service is currently unavailable. Please try again later.');
      }

      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to appropriate assessment
      if (formData.assessmentType === 'Company') {
        navigate(`/company/${formData.companyId}`, {
          state: {
            companyName: formData.companyName,
            companyId: formData.companyId
          }
        });
      } else {
        navigate(`/employee/${formData.companyId}/${formData.employeeId}`, {
          state: {
            companyName: formData.companyName,
            companyId: formData.companyId,
            employeeName: formData.employeeName,
            employeeId: formData.employeeId,
            email: formData.email,
            department: formData.department,
            role: formData.role
          }
        });
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Input field component with enhanced styling
   */
  const InputField: React.FC<{
    name: keyof FormData;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    showSuggestion?: boolean;
    suggestionType?: 'company' | 'employee';
  }> = ({ name, label, type = 'text', placeholder, required, showSuggestion, suggestionType }) => (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          id={name}
          name={name}
          type={type}
          value={formData[name]}
          onChange={handleInputChange(name)}
          placeholder={placeholder}
          className={`form-input ${errors[name] ? 'error' : ''}`}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {showSuggestion && suggestionType && (
          <button
            type="button"
            className="suggestion-button"
            onClick={() => {
              const suggestion = generateSuggestions(suggestionType);
              setFormData(prev => ({ ...prev, [name]: suggestion }));
              setErrors(prev => ({ ...prev, [name]: '' }));
            }}
            title="Generate suggestion"
          >
            ✨
          </button>
        )}
      </div>
      {errors[name] && (
        <div id={`${name}-error`} className="form-error" role="alert">
          {errors[name]}
        </div>
      )}
    </div>
  );

  return (
    <div className="welcome-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">Enterprise Assessment Platform</span>
            <span className="badge-version">v{appMetadata.version}</span>
          </div>
          
          <h1 className="hero-title">
            {appConfig.appName}
          </h1>
          
          <p className="hero-description">
            Comprehensive evaluation tool for organizational data and AI readiness. 
            Choose your assessment type to begin your journey toward digital transformation excellence.
          </p>

          {/* API Health Indicator */}
          <div className={`api-status ${apiHealth.healthy ? 'healthy' : 'unhealthy'}`}>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">
                {apiHealth.healthy ? 'Systems Operational' : 'Limited Connectivity'}
              </span>
              {apiHealth.responseTime && (
                <span className="response-time">({apiHealth.responseTime}ms)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Selection */}
      <div className="assessment-section">
        <div className="section-header">
          <h2>Choose Your Assessment Type</h2>
          <p>Select the assessment that best matches your needs</p>
        </div>

        <div className="assessment-options">
          <div 
            className={`assessment-card ${formData.assessmentType === 'Company' ? 'selected' : ''}`}
            onClick={() => handleInputChange('assessmentType')({ target: { value: 'Company' } } as any)}
          >
            <div className="card-icon">🏢</div>
            <h3>Company Assessment</h3>
            <p>Evaluate your organization's overall data and AI readiness across all departments and systems.</p>
            <ul className="features-list">
              <li>Enterprise-wide evaluation</li>
              <li>Strategic readiness analysis</li>
              <li>Infrastructure assessment</li>
              <li>Governance framework review</li>
            </ul>
            <div className="card-footer">
              <span className="duration">⏱️ 15-20 minutes</span>
              <span className="audience">👥 Leadership team</span>
            </div>
          </div>

          <div 
            className={`assessment-card ${formData.assessmentType === 'Employee' ? 'selected' : ''}`}
            onClick={() => handleInputChange('assessmentType')({ target: { value: 'Employee' } } as any)}
          >
            <div className="card-icon">👤</div>
            <h3>Employee Assessment</h3>
            <p>Assess individual skills, knowledge, and experience with data and AI technologies.</p>
            <ul className="features-list">
              <li>Personal skill evaluation</li>
              <li>Role-specific questions</li>
              <li>Training needs identification</li>
              <li>Career development insights</li>
            </ul>
            <div className="card-footer">
              <span className="duration">⏱️ 10-15 minutes</span>
              <span className="audience">👤 Individual contributors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      {formData.assessmentType && (
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>
                {formData.assessmentType === 'Company' ? '🏢 Company Information' : '👤 Participant Information'}
              </h2>
              <p>Please provide the required information to begin your assessment</p>
            </div>

            <form onSubmit={handleSubmit} className="assessment-form" noValidate>
              {/* Company Information */}
              <div className="form-section-group">
                <h3>Company Details</h3>
                
                <div className="form-row">
                  <InputField
                    name="companyName"
                    label="Company Name"
                    placeholder="Enter your company name"
                    required
                  />
                  <InputField
                    name="companyId"
                    label="Company ID"
                    placeholder="Unique identifier for your company"
                    required
                    showSuggestion
                    suggestionType="company"
                  />
                </div>
              </div>

              {/* Employee Information (if Employee assessment) */}
              {formData.assessmentType === 'Employee' && (
                <div className="form-section-group">
                  <h3>Employee Details</h3>
                  
                  <div className="form-row">
                    <InputField
                      name="employeeName"
                      label="Full Name"
                      placeholder="Enter your full name"
                      required
                    />
                    <InputField
                      name="employeeId"
                      label="Employee ID"
                      placeholder="Unique employee identifier"
                      required
                      showSuggestion
                      suggestionType="employee"
                    />
                  </div>

                  <div className="form-row">
                    <InputField
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="your.email@company.com"
                      required
                    />
                    <InputField
                      name="department"
                      label="Department"
                      placeholder="e.g., Engineering, Marketing, Sales"
                      required
                    />
                  </div>

                  <InputField
                    name="role"
                    label="Job Title/Role"
                    placeholder="e.g., Software Engineer, Data Analyst, Manager"
                    required
                  />
                </div>
              )}

              {/* Advanced Options */}
              <div className="advanced-section">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span>Advanced Options</span>
                  <span className={`toggle-icon ${showAdvanced ? 'expanded' : ''}`}>▼</span>
                </button>

                {showAdvanced && (
                  <div className="advanced-content">
                    <div className="info-box">
                      <h4>Configuration Information</h4>
                      <div className="config-grid">
                        <div className="config-item">
                          <span className="config-label">Environment:</span>
                          <span className="config-value">{appConfig.environment}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Region:</span>
                          <span className="config-value">{config.getAwsConfig().region}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">API Status:</span>
                          <span className={`config-value ${apiHealth.healthy ? 'healthy' : 'error'}`}>
                            {apiHealth.healthy ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Version:</span>
                          <span className="config-value">{appMetadata.version}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Errors */}
              {errors.submit && (
                <div className="form-error-banner" role="alert">
                  <div className="error-icon">⚠️</div>
                  <div className="error-content">
                    <strong>Submission Error</strong>
                    <p>{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || !formData.assessmentType}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Preparing Assessment...</span>
                    </>
                  ) : (
                    <>
                      <span>Begin Assessment</span>
                      <span className="submit-icon">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Assessment Platform?</h2>
          <p>Enterprise-grade features designed for comprehensive evaluation</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Enterprise-grade security with encrypted data transmission and secure cloud storage.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Comprehensive Analysis</h3>
            <p>In-depth evaluation covering all aspects of data and AI readiness across your organization.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Efficient</h3>
            <p>Streamlined assessment process with intelligent question routing and auto-save functionality.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Actionable Insights</h3>
            <p>Detailed reports with specific recommendations for improving your data and AI capabilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;