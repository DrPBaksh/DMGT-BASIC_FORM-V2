/**
 * Question Renderer Component
 * Renders different types of questions based on the question type
 */

import React, { useState } from 'react';
import { Question, ValidationError } from '../../types';
import FileUpload from './FileUpload';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onFileUpload?: (questionId: string, files: FileList) => void;
  error?: ValidationError;
  disabled?: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  onFileUpload,
  error,
  disabled = false
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (newValue: any) => {
    setLocalError(null);
    onChange(newValue);
  };

  const validateValue = (val: any): boolean => {
    if (question.required && (val === undefined || val === null || val === '')) {
      setLocalError('This field is required');
      return false;
    }

    if (question.validation) {
      const { minLength, maxLength, min, max, pattern } = question.validation;

      if (typeof val === 'string') {
        if (minLength && val.length < minLength) {
          setLocalError(`Minimum length is ${minLength} characters`);
          return false;
        }
        if (maxLength && val.length > maxLength) {
          setLocalError(`Maximum length is ${maxLength} characters`);
          return false;
        }
        if (pattern && !new RegExp(pattern).test(val)) {
          setLocalError('Please enter a valid format');
          return false;
        }
      }

      if (typeof val === 'number') {
        if (min !== undefined && val < min) {
          setLocalError(`Minimum value is ${min}`);
          return false;
        }
        if (max !== undefined && val > max) {
          setLocalError(`Maximum value is ${max}`);
          return false;
        }
      }
    }

    return true;
  };

  const renderTextInput = () => (
    <div className="form-group">
      <input
        type="text"
        className={`form-input ${error || localError ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => validateValue(e.target.value)}
        placeholder={question.placeholder || 'Enter your answer...'}
        disabled={disabled}
      />
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderTextarea = () => (
    <div className="form-group">
      <textarea
        className={`form-textarea ${error || localError ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => validateValue(e.target.value)}
        placeholder={question.placeholder || 'Enter your detailed answer...'}
        rows={question.rows || 4}
        disabled={disabled}
      />
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderEmail = () => (
    <div className="form-group">
      <input
        type="email"
        className={`form-input ${error || localError ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => validateValue(e.target.value)}
        placeholder={question.placeholder || 'Enter email address...'}
        disabled={disabled}
      />
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderNumber = () => (
    <div className="form-group">
      <input
        type="number"
        className={`form-input ${error || localError ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(Number(e.target.value))}
        onBlur={(e) => validateValue(Number(e.target.value))}
        placeholder={question.placeholder || 'Enter number...'}
        min={question.validation?.min}
        max={question.validation?.max}
        disabled={disabled}
      />
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderRadio = () => (
    <div className="form-group">
      <div className="radio-group">
        {question.options?.map((option, index) => (
          <label key={index} className="radio-label">
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
            />
            <span className="radio-text">{option}</span>
          </label>
        ))}
      </div>
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderCheckbox = () => (
    <div className="form-group">
      <div className="checkbox-group">
        {question.options?.map((option, index) => (
          <label key={index} className="checkbox-label">
            <input
              type="checkbox"
              value={option}
              checked={(value || []).includes(option)}
              onChange={(e) => {
                const currentValues = value || [];
                const newValues = e.target.checked
                  ? [...currentValues, option]
                  : currentValues.filter((v: string) => v !== option);
                handleChange(newValues);
              }}
              disabled={disabled}
            />
            <span className="checkbox-text">{option}</span>
          </label>
        ))}
      </div>
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderSelect = () => (
    <div className="form-group">
      <select
        className={`form-select ${error || localError ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select an option...</option>
        {question.options?.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  const renderRating = () => {
    const maxRating = question.validation?.max || 5;
    const ratings = Array.from({ length: maxRating }, (_, i) => i + 1);

    return (
      <div className="form-group">
        <div className="rating-group">
          {ratings.map((rating) => (
            <button
              key={rating}
              type="button"
              className={`rating-button ${value >= rating ? 'active' : ''}`}
              onClick={() => handleChange(rating)}
              disabled={disabled}
            >
              ★
            </button>
          ))}
          <span className="rating-label">
            {value ? `${value} out of ${maxRating}` : 'Click to rate'}
          </span>
        </div>
        {(error || localError) && (
          <div className="error-message">
            {error?.message || localError}
          </div>
        )}
      </div>
    );
  };

  const renderScale = () => {
    const min = question.validation?.min || 1;
    const max = question.validation?.max || 10;
    const step = 1;

    return (
      <div className="form-group">
        <div className="scale-group">
          <div className="scale-labels">
            <span className="scale-label-min">{min}</span>
            <span className="scale-label-max">{max}</span>
          </div>
          <input
            type="range"
            className="scale-input"
            min={min}
            max={max}
            step={step}
            value={value || min}
            onChange={(e) => handleChange(Number(e.target.value))}
            disabled={disabled}
          />
          <div className="scale-value">
            Current value: <strong>{value || min}</strong>
          </div>
        </div>
        {(error || localError) && (
          <div className="error-message">
            {error?.message || localError}
          </div>
        )}
      </div>
    );
  };

  const renderFile = () => (
    <div className="form-group">
      <FileUpload
        questionId={question.id}
        onFileUpload={onFileUpload}
        existingFiles={value || []}
        accept={question.accept}
        multiple={question.multiple}
        maxSize={question.maxSize}
        disabled={disabled}
      />
      {(error || localError) && (
        <div className="error-message">
          {error?.message || localError}
        </div>
      )}
    </div>
  );

  // Main render function
  const renderQuestion = () => {
    switch (question.type) {
      case 'text':
        return renderTextInput();
      case 'textarea':
        return renderTextarea();
      case 'email':
        return renderEmail();
      case 'number':
        return renderNumber();
      case 'radio':
        return renderRadio();
      case 'checkbox':
        return renderCheckbox();
      case 'select':
        return renderSelect();
      case 'rating':
        return renderRating();
      case 'scale':
        return renderScale();
      case 'file':
        return renderFile();
      default:
        return (
          <div className="form-group">
            <div className="error-message">
              Unsupported question type: {question.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="question-renderer">
      {renderQuestion()}
    </div>
  );
};

export default QuestionRenderer;