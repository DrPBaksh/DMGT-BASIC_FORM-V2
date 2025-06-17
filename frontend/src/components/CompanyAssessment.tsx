/**
 * Enhanced CompanyAssessment Component for DMGT Basic Form V2
 * Using shared QuestionRenderer for consistency and better UX
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getApiService, handleApiResponse } from '../services/api';
import { Question, AssessmentData, ValidationError, ProgressInfo } from '../types';
import config from '../services/config';
import LoadingSpinner from './common/LoadingSpinner';
import QuestionRenderer from './forms/QuestionRenderer';
import ProgressBar from './forms/ProgressBar';
import SaveIndicator from './forms/SaveIndicator';
import './CompanyAssessment.css';

interface LocationState {
  companyName?: string;
  companyId?: string;
}

interface FormData {
  [questionId: string]: any;
}

const CompanyAssessment: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Component State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const apiService = getApiService();

  /**
   * Calculate completion progress
   */
  const calculateProgress = useCallback((): ProgressInfo => {
    if (questions.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const answeredQuestions = questions.filter(question => {
      const answer = formData[question.id];
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    
    return {
      completed: answeredQuestions,
      total: questions.length,
      percentage: Math.round((answeredQuestions / questions.length) * 100)
    };
  }, [formData, questions]);

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
        setValidationErrors([{ field: 'general', message: 'Failed to load assessment. Please try again.' }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [companyId, apiService]);

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
  const validateQuestion = useCallback((question: Question, value: any): ValidationError | null => {
    if (question.required && (value === undefined || value === null || value === '')) {
      return {
        field: question.id,
        message: 'This field is required',
        code: 'REQUIRED'
      };
    }

    if (question.validation && value !== undefined && value !== null && value !== '') {
      const validation = question.validation;

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          return {
            field: question.id,
            message: `Must be at least ${validation.minLength} characters`,
            code: 'MIN_LENGTH'
          };
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return {
            field: question.id,
            message: `Must be no more than ${validation.maxLength} characters`,
            code: 'MAX_LENGTH'
          };
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          return {
            field: question.id,
            message: 'Please enter a valid format',
            code: 'INVALID_FORMAT'
          };
        }
      }

      // Number validation
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          return {
            field: question.id,
            message: `Must be at least ${validation.min}`,
            code: 'MIN_VALUE'
          };
        }
        if (validation.max !== undefined && value > validation.max) {
          return {
            field: question.id,
            message: `Must be no more than ${validation.max}`,
            code: 'MAX_VALUE'
          };
        }
      }
    }

    return null;
  }, []);

  /**
   * Validate all questions
   */
  const validateAllQuestions = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    questions.forEach(question => {
      const value = formData[question.id];
      const error = validateQuestion(question, value);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  };

  /**
   * Handle form field changes
   */
  const handleFieldChange = useCallback((questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear validation error for this field
    setValidationErrors(prev => prev.filter(error => error.field !== questionId));
  }, []);

  /**
   * Handle file uploads
   */
  const handleFileUpload = async (questionId: string, files: FileList) => {
    if (!companyId) return;

    try {
      const uploadedFiles = await apiService.uploadFiles(companyId, questionId, files);
      handleFieldChange(questionId, uploadedFiles);
    } catch (error) {
      console.error('File upload failed:', error);
      setValidationErrors(prev => [...prev, {
        field: questionId,
        message: 'File upload failed. Please try again.',
        code: 'UPLOAD_ERROR'
      }]);
    }
  };

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
        setValidationErrors(prev => [...prev, {
          field: 'general',
          message: 'Failed to save assessment. Please try again.',
          code: 'SAVE_ERROR'
        }]);
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
    // Validate all questions
    const errors = validateAllQuestions();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationSummary(true);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.form-field.error');
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllQuestions, saveResponse, navigate, companyId, state]);

  const progress = calculateProgress();

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
      </div>

      {/* Progress and Save Indicator */}
      <div className="progress-section">
        <ProgressBar progress={progress} showDetails={true} />
        <SaveIndicator 
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
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

      {/* Validation Summary */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="card error-card">
          <div className="card-header">
            <h3>Please Complete Required Fields</h3>
            <button 
              className="close-btn"
              onClick={() => setShowValidationSummary(false)}
            >
              ×
            </button>
          </div>
          <div className="card-body">
            <ul>
              {validationErrors.map((error, index) => {
                const question = questions.find(q => q.id === error.field);
                return (
                  <li key={index}>
                    <strong>{question?.title || error.field}:</strong> {error.message}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Assessment Form */}
      <div className="assessment-form">
        <div className="section-header">
          <h2>{currentSectionData.title}</h2>
          <p className="section-description">{currentSectionData.description}</p>
        </div>

        <div className="assessment-questions">
          {currentSectionData.questions.map((question) => {
            const error = validationErrors.find(e => e.field === question.id);
            
            return (
              <div key={question.id} className="card question-card">
                <div className="card-header">
                  <h3 className="question-title">
                    {question.title}
                    {question.required && <span className="required-indicator">*</span>}
                  </h3>
                  {question.description && (
                    <p className="question-description">{question.description}</p>
                  )}
                </div>
                
                <div className="card-body">
                  <QuestionRenderer
                    question={question}
                    value={formData[question.id]}
                    onChange={(value) => handleFieldChange(question.id, value)}
                    onFileUpload={question.type === 'file' ? handleFileUpload : undefined}
                    error={error}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="assessment-actions">
        <div className="action-buttons">
          {/* Section Navigation */}
          {questionSections.length > 1 && (
            <>
              <button
                type="button"
                className="btn btn-outline"
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
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || progress.percentage < 100}
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
                </button>
              )}
            </>
          )}

          {/* Single section - show submit button */}
          {questionSections.length === 1 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || progress.percentage < 100}
            >
              {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
            </button>
          )}

          {/* Save Progress Button */}
          <button
            type="button"
            className="btn btn-outline"
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
