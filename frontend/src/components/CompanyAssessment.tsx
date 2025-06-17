/**
 * Enhanced CompanyAssessment Component for DMGT Basic Form V2
 * Amazing UX with comprehensive form handling, auto-save, and progress tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { config } from '../services/config';
import { getApiService, handleApiResponse } from '../services/api';
import { Question, AssessmentData } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import './CompanyAssessment.css';

interface LocationState {
  companyName?: string;
  companyId?: string;
}

interface FormData {
  [questionId: string]: any;
}

interface ValidationErrors {
  [questionId: string]: string;
}

const CompanyAssessment: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Component State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const apiService = getApiService();

  /**
   * Calculate completion progress
   */
  const calculateProgress = useCallback((data: FormData, questionsArray: Question[]) => {
    if (questionsArray.length === 0) return 0;
    
    const answeredCount = questionsArray.filter(question => {
      const answer = data[question.id];
      if (question.required) {
        return answer !== undefined && answer !== null && answer !== '';
      }
      return true; // Optional questions don't affect progress
    }).length;
    
    return Math.round((answeredCount / questionsArray.length) * 100);
  }, []);

  /**
   * Group questions into logical sections
   */
  const questionSections = useMemo(() => {
    const sections = [
      {
        title: 'Strategic Overview',
        description: 'High-level organizational readiness',
        questions: questions.filter(q => q.category === 'strategy' || q.section === 'strategic')
      },
      {
        title: 'Infrastructure & Technology',
        description: 'Technical capabilities and systems',
        questions: questions.filter(q => q.category === 'infrastructure' || q.section === 'technology')
      },
      {
        title: 'Data Management',
        description: 'Data governance and quality',
        questions: questions.filter(q => q.category === 'data' || q.section === 'data_management')
      },
      {
        title: 'AI & Analytics',
        description: 'AI/ML capabilities and analytics maturity',
        questions: questions.filter(q => q.category === 'ai' || q.section === 'analytics')
      },
      {
        title: 'Governance & Compliance',
        description: 'Policies, compliance, and risk management',
        questions: questions.filter(q => q.category === 'governance' || q.section === 'compliance')
      }
    ].filter(section => section.questions.length > 0);

    // If no categories are defined, create a single section
    if (sections.length === 0 || sections.every(s => s.questions.length === 0)) {
      return [{
        title: 'Company Assessment',
        description: 'Comprehensive organizational evaluation',
        questions: questions
      }];
    }

    return sections;
  }, [questions]);

  /**
   * Load questions and existing responses
   */
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        setIsLoading(true);

        // Load questions
        const questionsData = await handleApiResponse(
          () => apiService.getQuestions('Company'),
          { errorMessage: 'Failed to load assessment questions' }
        );

        setQuestions(questionsData);

        // Try to load existing responses
        if (companyId) {
          try {
            const existingData = await apiService.getResponse('Company', companyId);
            if (existingData?.responses) {
              setFormData(existingData.responses);
              setLastSaved(new Date(existingData.lastUpdated || ''));
            }
          } catch (error) {
            // No existing data found, start fresh
            console.log('No existing assessment found, starting fresh');
          }
        }

      } catch (error) {
        console.error('Failed to load assessment:', error);
        setErrors({ general: 'Failed to load assessment. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [companyId, apiService]);

  /**
   * Update progress when form data changes
   */
  useEffect(() => {
    const newProgress = calculateProgress(formData, questions);
    setProgress(newProgress);
  }, [formData, questions, calculateProgress]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (!config.isFeatureEnabled('autoSave') || !companyId || Object.keys(formData).length === 0) {
      return;
    }

    const autoSaveTimer = setTimeout(async () => {
      try {
        await saveResponse(false); // Silent save
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, config.getConfig().autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [formData, companyId]);

  /**
   * Validate individual question
   */
  const validateQuestion = useCallback((question: Question, value: any): string | null => {
    if (question.required && (value === undefined || value === null || value === '')) {
      return `${question.title} is required`;
    }

    if (question.validation) {
      const validation = question.validation;

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          return `Must be at least ${validation.minLength} characters`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return `Must be no more than ${validation.maxLength} characters`;
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          return validation.patternMessage || 'Invalid format';
        }
      }

      // Number validation
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          return `Must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && value > validation.max) {
          return `Must be no more than ${validation.max}`;
        }
      }

      // Array validation (for multiselect)
      if (Array.isArray(value)) {
        if (validation.minItems && value.length < validation.minItems) {
          return `Please select at least ${validation.minItems} options`;
        }
        if (validation.maxItems && value.length > validation.maxItems) {
          return `Please select no more than ${validation.maxItems} options`;
        }
      }
    }

    return null;
  }, []);

  /**
   * Handle form field changes
   */
  const handleFieldChange = useCallback((questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear validation error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  }, []);

  /**
   * Save assessment response
   */
  const saveResponse = useCallback(async (showUI: boolean = true) => {
    if (!companyId) return;

    try {
      if (showUI) setIsSaving(true);

      const response = await handleApiResponse(
        () => apiService.saveResponse({
          assessmentType: 'Company',
          companyId,
          responses: formData
        }),
        { errorMessage: 'Failed to save assessment' }
      );

      setLastSaved(new Date());
      
      if (showUI) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }

      return response;
    } catch (error) {
      if (showUI) {
        setErrors({ general: 'Failed to save assessment. Please try again.' });
      }
      throw error;
    } finally {
      if (showUI) setIsSaving(false);
    }
  }, [companyId, formData, apiService]);

  /**
   * Submit assessment
   */
  const handleSubmit = useCallback(async () => {
    // Validate all required fields
    const newErrors: ValidationErrors = {};
    
    questions.forEach(question => {
      const error = validateQuestion(question, formData[question.id]);
      if (error) {
        newErrors[question.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.form-field.error');
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return;
    }

    try {
      await saveResponse();
      
      // Navigate to completion page
      navigate(`/complete/Company/${companyId}`, {
        state: {
          companyName: state?.companyName,
          companyId,
          completionTime: new Date().toISOString(),
          progress: 100
        }
      });
    } catch (error) {
      console.error('Submission failed:', error);
    }
  }, [questions, formData, validateQuestion, saveResponse, navigate, companyId, state]);

  /**
   * Render question field based on type
   */
  const renderQuestionField = useCallback((question: Question) => {
    const value = formData[question.id];
    const error = errors[question.id];
    const fieldId = `question-${question.id}`;

    const commonProps = {
      id: fieldId,
      className: `form-input ${error ? 'error' : ''}`,
      'aria-describedby': error ? `${fieldId}-error` : undefined,
      'aria-required': question.required
    };

    switch (question.type) {
      case 'text':
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleFieldChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={question.rows || 4}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleFieldChange(question.id, e.target.value)}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="multiselect-options">
            {question.options?.map((option) => (
              <label key={option.value} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value);
                    handleFieldChange(question.id, newValues);
                  }}
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="radio-options">
            {question.options?.map((option) => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={fieldId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(question.id, e.target.value)}
                />
                <span className="radio-label">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const maxRating = question.maxRating || 5;
        return (
          <div className="rating-input">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map(rating => (
              <button
                key={rating}
                type="button"
                className={`rating-star ${value >= rating ? 'filled' : ''}`}
                onClick={() => handleFieldChange(question.id, rating)}
                aria-label={`Rate ${rating} out of ${maxRating}`}
              >
                ★
              </button>
            ))}
            {value && (
              <span className="rating-text">{value} / {maxRating}</span>
            )}
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );
    }
  }, [formData, errors, handleFieldChange]);

  /**
   * Render question component
   */
  const renderQuestion = useCallback((question: Question) => {
    const error = errors[question.id];
    
    return (
      <div key={question.id} className={`form-field ${error ? 'error' : ''}`}>
        <label htmlFor={`question-${question.id}`} className="form-label">
          <span className="label-text">
            {question.title}
            {question.required && <span className="required-indicator">*</span>}
          </span>
          {question.description && (
            <span className="label-description">{question.description}</span>
          )}
        </label>
        
        <div className="field-wrapper">
          {renderQuestionField(question)}
          
          {error && (
            <div id={`question-${question.id}-error`} className="field-error" role="alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {question.helpText && (
            <div className="field-help">
              <span className="help-icon">💡</span>
              {question.helpText}
            </div>
          )}
        </div>
      </div>
    );
  }, [errors, renderQuestionField]);

  if (isLoading) {
    return (
      <div className="assessment-loading">
        <LoadingSpinner size="large" message="Loading company assessment..." />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="assessment-error">
        <div className="error-content">
          <h2>Assessment Not Available</h2>
          <p>We couldn't load the company assessment questions. Please try again later.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentSectionData = questionSections[currentSection];

  return (
    <div className="company-assessment">
      {/* Header */}
      <div className="assessment-header">
        <div className="header-content">
          <h1>Company Assessment</h1>
          <p className="company-info">
            {state?.companyName && (
              <span className="company-name">{state.companyName}</span>
            )}
            <span className="company-id">ID: {companyId}</span>
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              Progress: {progress}% Complete
            </span>
            {lastSaved && (
              <span className="last-saved">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      {questionSections.length > 1 && (
        <div className="section-navigation">
          <div className="section-tabs">
            {questionSections.map((section, index) => (
              <button
                key={index}
                className={`section-tab ${index === currentSection ? 'active' : ''}`}
                onClick={() => setCurrentSection(index)}
              >
                <span className="tab-title">{section.title}</span>
                <span className="tab-count">
                  {section.questions.length} questions
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Form */}
      <div className="assessment-form">
        <div className="section-header">
          <h2>{currentSectionData.title}</h2>
          <p className="section-description">{currentSectionData.description}</p>
        </div>

        {errors.general && (
          <div className="form-error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <strong>Error</strong>
              <p>{errors.general}</p>
            </div>
          </div>
        )}

        <form className="assessment-questions" onSubmit={(e) => e.preventDefault()}>
          {currentSectionData.questions.map(renderQuestion)}
        </form>
      </div>

      {/* Navigation & Actions */}
      <div className="assessment-actions">
        <div className="action-buttons">
          {/* Section Navigation */}
          {questionSections.length > 1 && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentSection === 0}
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
              >
                ← Previous Section
              </button>
              
              {currentSection < questionSections.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentSection(prev => Math.min(questionSections.length - 1, prev + 1))}
                >
                  Next Section →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-submit"
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Submitting...
                    </>
                  ) : (
                    'Complete Assessment'
                  )}
                </button>
              )}
            </>
          )}

          {/* Single section - show submit button */}
          {questionSections.length === 1 && (
            <button
              type="button"
              className="btn btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="loading-spinner small"></span>
                  Submitting...
                </>
              ) : (
                'Complete Assessment'
              )}
            </button>
          )}

          {/* Save Progress Button */}
          <button
            type="button"
            className="btn btn-outline save-button"
            onClick={() => saveResponse(true)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            Assessment saved successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyAssessment;