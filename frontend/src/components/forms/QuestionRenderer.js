import React from 'react';

const QuestionRenderer = ({ question, value, onChange, onFileUpload, error }) => {
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFileUpload) {
      onFileUpload(question.id, files);
    }
  };

  const handleCheckboxChange = (e) => {
    if (question.type === 'multiselect') {
      const currentValues = Array.isArray(value) ? value : [];
      const optionValue = e.target.value;
      
      if (e.target.checked) {
        onChange([...currentValues, optionValue]);
      } else {
        onChange(currentValues.filter(v => v !== optionValue));
      }
    } else {
      onChange(e.target.checked);
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={question.type}
            value={value || ''}
            onChange={handleInputChange}
            placeholder={question.placeholder}
            className={`form-input ${error ? 'error' : ''}`}
            required={question.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={handleInputChange}
            placeholder={question.placeholder}
            rows={question.rows || 4}
            className={`form-textarea ${error ? 'error' : ''}`}
            required={question.required}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={handleInputChange}
            className={`form-select ${error ? 'error' : ''}`}
            required={question.required}
          >
            <option value="">Please select...</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {question.options?.map((option, index) => (
              <label key={index} className="radio-label">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={handleInputChange}
                  className="radio-input"
                />
                <span className="radio-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <span className="checkbox-text">Yes</span>
          </label>
        );

      case 'multiselect':
        return (
          <div className="checkbox-group">
            {question.options?.map((option, index) => (
              <label key={index} className="checkbox-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={handleCheckboxChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={handleFileChange}
            accept={question.accept}
            multiple={question.multiple}
            className={`form-file ${error ? 'error' : ''}`}
          />
        );

      case 'rating':
      case 'scale':
        const max = question.validation?.max || 5;
        return (
          <div className="rating-group">
            {Array.from({ length: max }, (_, i) => i + 1).map(num => (
              <label key={num} className="rating-label">
                <input
                  type="radio"
                  name={question.id}
                  value={num}
                  checked={parseInt(value) === num}
                  onChange={handleInputChange}
                  className="rating-input"
                />
                <span className="rating-text">{num}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={handleInputChange}
            placeholder={question.placeholder}
            className={`form-input ${error ? 'error' : ''}`}
            required={question.required}
          />
        );
    }
  };

  return (
    <div className={`question-renderer ${error ? 'has-error' : ''}`}>
      {renderInput()}
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
