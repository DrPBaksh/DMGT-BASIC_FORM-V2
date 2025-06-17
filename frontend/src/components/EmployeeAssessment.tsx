/**
 * Employee Assessment Component - Complete Implementation
 * Individual employee assessment form with full functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { apiService } from '../services/api';
import { Question, FormResponse, ValidationError } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import QuestionRenderer from './forms/QuestionRenderer';
import ProgressBar from './forms/ProgressBar';
import SaveIndicator from './forms/SaveIndicator';
import FileUpload from './forms/FileUpload';

const EmployeeAssessment: React.FC = () => {
  const { companyId, employeeId } = useParams<{ companyId: string; employeeId?: string }>();
  const navigate = useNavigate();
  const { state, navigation, actions } = useAssessment();

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(responses).length > 0 && !isSaving) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [responses, isSaving]);

  // Load previous responses on mount
  useEffect(() => {
    if (companyId && employeeId) {
      loadPreviousResponses();
    }
  }, [companyId, employeeId]);

  const loadPreviousResponses = async () => {
    if (!companyId || !employeeId) return;

    try {
      const savedResponses = await apiService.getEmployeeResponses(companyId, employeeId);
      if (savedResponses && Object.keys(savedResponses).length > 0) {
        setResponses(savedResponses);
        
        // Find the first unanswered question
        const firstUnanswered = state.questions.findIndex(q => !savedResponses[q.id]);
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
      await apiService.saveEmployeeResponses(companyId, employeeId, responses);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [companyId, employeeId, responses]);

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
    
    state.questions.forEach(question => {
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
      await apiService.saveEmployeeResponses(companyId, employeeId, responses);
      
      // Submit assessment
      await apiService.submitEmployeeAssessment(companyId, employeeId, responses);
      
      // Navigate to completion page
      navigate(`/complete/employee/${companyId}/${employeeId}`);
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
    if (currentQuestionIndex < state.questions.length - 1) {
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

  const calculateProgress = () => {
    const totalQuestions = state.questions.length;
    const answeredQuestions = state.questions.filter(q => responses[q.id] !== undefined).length;
    return {
      completed: answeredQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    };
  };

  const progress = calculateProgress();
  const currentQuestion = state.questions[currentQuestionIndex];
  const currentValue = currentQuestion ? responses[currentQuestion.id] : undefined;
  const currentError = validationErrors.find(error => error.field === currentQuestion?.id);

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

  if (!navigation.employeeInfo || !navigation.companyInfo) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="card-body">
            <h2>Employee Information Required</h2>
            <p>Please complete the employee information form before starting the assessment.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/employee/${companyId}`)}
            >
              Complete Employee Information
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.questions.length === 0) {
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
            Personal evaluation for {navigation.employeeInfo.name} at {navigation.companyInfo.name}
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
                  const question = state.questions.find(q => q.id === error.field);
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
                  Question {currentQuestionIndex + 1} of {state.questions.length}
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
            {currentQuestionIndex + 1} of {state.questions.length}
          </div>

          <button
            className="btn btn-outline"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === state.questions.length - 1}
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

        {/* Employee Info Summary */}
        <div className="card info-card">
          <div className="card-header">
            <h3>Assessment Information</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Employee:</span>
                <span className="info-value">{navigation.employeeInfo.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role:</span>
                <span className="info-value">{navigation.employeeInfo.role || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Department:</span>
                <span className="info-value">{navigation.employeeInfo.department || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Company:</span>
                <span className="info-value">{navigation.companyInfo.name}</span>
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