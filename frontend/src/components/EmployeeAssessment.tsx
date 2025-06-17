/**
 * Employee Assessment Component - Complete Implementation
 * Individual employee assessment form with full functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { getApiService } from '../services/api';
import { Question, ValidationError, ProgressInfo } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import QuestionRenderer from './forms/QuestionRenderer';
import ProgressBar from './forms/ProgressBar';
import SaveIndicator from './forms/SaveIndicator';

const EmployeeAssessment: React.FC = () => {
  const { companyId, employeeId } = useParams<{ companyId: string; employeeId?: string }>();
  const navigate = useNavigate();
  const { state, startAssessment, loadQuestions, updateResponse, saveAssessment } = useAssessment();

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const apiService = getApiService();

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(responses).length > 0 && !isSaving) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [responses, isSaving]);

  // Load questions on mount
  useEffect(() => {
    if (companyId) {
      loadQuestions('Employee');
      if (employeeId) {
        loadPreviousResponses();
      }
    }
  }, [companyId, employeeId, loadQuestions]);

  const loadPreviousResponses = async () => {
    if (!companyId || !employeeId) return;

    try {
      const savedResponses = await apiService.getResponse('Employee', companyId, employeeId);
      if (savedResponses && Object.keys(savedResponses).length > 0) {
        setResponses(savedResponses);
        
        // Find the first unanswered question
        const firstUnanswered = state.questions.Employee?.questions.findIndex(q => !savedResponses[q.id]) || 0;
        if (firstUnanswered >= 0) {
          setCurrentQuestionIndex(firstUnanswered);
        }
      }
    } catch (error) {
      console.error('Failed to load previous responses:', error);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!companyId || !employeeId || Object.keys(responses).length === 0) return;

    setIsSaving(true);
    try {
      await apiService.saveResponse({
        assessmentType: 'Employee',
        companyId,
        employeeId,
        responses
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [companyId, employeeId, responses, apiService]);

  const handleManualSave = async () => {
    await handleAutoSave();
  };

  const handleQuestionResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear validation errors for this question
    setValidationErrors(prev => prev.filter(error => error.field !== questionId));
  };

  const validateQuestion = (question: Question, value: any): ValidationError | null => {
    // Required field validation
    if (question.required && (value === undefined || value === null || value === '')) {
      return {
        field: question.id,
        message: 'This field is required',
        code: 'REQUIRED'
      };
    }

    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
      switch (question.type) {
        case 'text':
        case 'textarea':
          if (question.validation?.minLength && value.length < question.validation.minLength) {
            return {
              field: question.id,
              message: `Minimum length is ${question.validation.minLength} characters`,
              code: 'MIN_LENGTH'
            };
          }
          if (question.validation?.maxLength && value.length > question.validation.maxLength) {
            return {
              field: question.id,
              message: `Maximum length is ${question.validation.maxLength} characters`,
              code: 'MAX_LENGTH'
            };
          }
          break;
        
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return {
              field: question.id,
              message: 'Please enter a valid email address',
              code: 'INVALID_EMAIL'
            };
          }
          break;

        case 'number':
        case 'rating':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return {
              field: question.id,
              message: 'Please enter a valid number',
              code: 'INVALID_NUMBER'
            };
          }
          if (question.validation?.min !== undefined && numValue < question.validation.min) {
            return {
              field: question.id,
              message: `Minimum value is ${question.validation.min}`,
              code: 'MIN_VALUE'
            };
          }
          if (question.validation?.max !== undefined && numValue > question.validation.max) {
            return {
              field: question.id,
              message: `Maximum value is ${question.validation.max}`,
              code: 'MAX_VALUE'
            };
          }
          break;
      }
    }

    return null;
  };

  const validateAllQuestions = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    state.questions.Employee?.questions.forEach(question => {
      const value = responses[question.id];
      const error = validateQuestion(question, value);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    // Validate all questions
    const errors = validateAllQuestions();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationSummary(true);
      return;
    }

    if (!companyId || !employeeId) return;

    setIsSubmitting(true);
    try {
      // Final save before submission
      await apiService.saveResponse({
        assessmentType: 'Employee',
        companyId,
        employeeId,
        responses
      });
      
      // Navigate to completion page
      navigate(`/complete/Employee/${companyId}/${employeeId}`);
    } catch (error) {
      console.error('Submission failed:', error);
      // Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    const totalQuestions = state.questions.Employee?.questions.length || 0;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFileUpload = async (questionId: string, files: FileList) => {
    if (!companyId || !employeeId) return;

    try {
      const uploadedFiles = await apiService.uploadFiles(companyId, questionId, files);
      handleQuestionResponse(questionId, uploadedFiles);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const calculateProgress = (): ProgressInfo => {
    const totalQuestions = state.questions.Employee?.questions.length || 0;
    const answeredQuestions = state.questions.Employee?.questions.filter(q => responses[q.id] !== undefined).length || 0;
    return {
      completed: answeredQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    };
  };

  const progress = calculateProgress();
  const questions = state.questions.Employee?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const currentValue = currentQuestion ? responses[currentQuestion.id] : undefined;
  const currentError = validationErrors.find(error => error.field === currentQuestion?.id);

  if (state.loading.questions) {
    return (
      <div className="page-container">
        <LoadingSpinner 
          size="large" 
          message="Loading your employee assessment questions..." 
        />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="card-body">
            <h2>No Questions Available</h2>
            <p>Employee assessment questions are not available at this time.</p>
          </div>
        </div>
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
            Personal evaluation for Employee ID: {employeeId} at Company ID: {companyId}
          </p>
        </div>

        {/* Progress */}
        <div className="progress-section">
          <ProgressBar 
            progress={progress}
            showDetails={true}
          />
          <SaveIndicator 
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        </div>

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

        {/* Question Card */}
        {currentQuestion && (
          <div className="card question-card">
            <div className="card-header">
              <div className="question-header">
                <span className="question-number">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                {currentQuestion.category && (
                  <span className="question-category">{currentQuestion.category}</span>
                )}
              </div>
              <h3 className="question-title">
                {currentQuestion.title}
                {currentQuestion.required && <span className="required-indicator">*</span>}
              </h3>
              {currentQuestion.description && (
                <p className="question-description">{currentQuestion.description}</p>
              )}
            </div>
            
            <div className="card-body">
              <QuestionRenderer
                question={currentQuestion}
                value={currentValue}
                onChange={(value) => handleQuestionResponse(currentQuestion.id, value)}
                onFileUpload={currentQuestion.type === 'file' ? handleFileUpload : undefined}
                error={currentError}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="question-navigation">
          <button
            className="btn btn-outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </button>

          <div className="nav-info">
            {currentQuestionIndex + 1} of {questions.length}
          </div>

          <button
            className="btn btn-outline"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next →
          </button>
        </div>

        {/* Actions */}
        <div className="assessment-actions">
          <button 
            className="btn btn-outline"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </button>

          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || progress.percentage < 100}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>

        {/* Assessment Info */}
        <div className="card info-card">
          <div className="card-header">
            <h3>Assessment Information</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Employee ID:</span>
                <span className="info-value">{employeeId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Company ID:</span>
                <span className="info-value">{companyId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Progress:</span>
                <span className="info-value">{progress.percentage}% Complete</span>
              </div>
              {lastSaved && (
                <div className="info-item">
                  <span className="info-label">Last Saved:</span>
                  <span className="info-value">{lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssessment;
