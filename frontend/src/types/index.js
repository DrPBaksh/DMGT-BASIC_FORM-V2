/**
 * Constants and Utility Functions for DMGT Assessment Platform
 * JavaScript utilities for consistent data handling across components
 */

// ===== DEFAULT VALUES =====

export const DEFAULT_LOADING_STATE = {
  questions: false,
  saving: false,
  uploading: false,
  submitting: false,
};

export const DEFAULT_ERROR_STATE = {
  questions: null,
  saving: null,
  uploading: null,
  submitting: null,
  general: null,
};

export const DEFAULT_PROGRESS = {
  completed: 0,
  total: 0,
  percentage: 0,
};

// ===== TYPE VALIDATION FUNCTIONS =====

export const isQuestion = (obj) => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.type === 'string';
};

export const isValidationError = (obj) => {
  return obj && typeof obj.field === 'string' && typeof obj.message === 'string';
};

export const isAssessmentResponse = (obj) => {
  return obj && typeof obj.questionId === 'string' && obj.value !== undefined && typeof obj.timestamp === 'string';
};

// ===== UTILITY FUNCTIONS =====

export const createValidationError = (field, message, code) => ({
  field,
  message,
  code,
});

export const createProgressInfo = (completed, total) => ({
  completed,
  total,
  percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
});

export const createFileData = (fileName, fileKey, downloadUrl) => ({
  fileName,
  fileKey,
  downloadUrl,
});

// ===== QUESTION TYPES CONSTANTS =====

export const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  FILE: 'file',
  RATING: 'rating',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  EMAIL: 'email',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  SCALE: 'scale'
};

export const ASSESSMENT_TYPES = {
  COMPANY: 'Company',
  EMPLOYEE: 'Employee'
};

export const ASSESSMENT_STATUSES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted'
};

// ===== VALIDATION HELPERS =====

export const validateRequired = (value) => {
  if (value === undefined || value === null || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return createValidationError('field', 'This field is required', 'REQUIRED');
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createValidationError('field', 'Please enter a valid email address', 'INVALID_EMAIL');
  }
  return null;
};

export const validateMinLength = (value, minLength) => {
  if (typeof value === 'string' && value.length < minLength) {
    return createValidationError('field', `Minimum length is ${minLength} characters`, 'MIN_LENGTH');
  }
  return null;
};

export const validateMaxLength = (value, maxLength) => {
  if (typeof value === 'string' && value.length > maxLength) {
    return createValidationError('field', `Maximum length is ${maxLength} characters`, 'MAX_LENGTH');
  }
  return null;
};

export const validateNumberRange = (value, min, max) => {
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return createValidationError('field', 'Please enter a valid number', 'INVALID_NUMBER');
  }
  if (min !== undefined && numValue < min) {
    return createValidationError('field', `Minimum value is ${min}`, 'MIN_VALUE');
  }
  if (max !== undefined && numValue > max) {
    return createValidationError('field', `Maximum value is ${max}`, 'MAX_VALUE');
  }
  return null;
};

// ===== FILE HANDLING UTILITIES =====

export const validateFileType = (file, allowedTypes) => {
  if (!allowedTypes.includes(file.type)) {
    return createValidationError('field', 'File type not supported', 'INVALID_FILE_TYPE');
  }
  return null;
};

export const validateFileSize = (file, maxSizeBytes) => {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return createValidationError('field', `File size must be less than ${maxSizeMB}MB`, 'FILE_TOO_LARGE');
  }
  return null;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ===== RESPONSE HELPERS =====

export const createAssessmentResponse = (questionId, value, fileData = null) => ({
  questionId,
  value,
  fileData,
  timestamp: new Date().toISOString()
});

export const createAssessmentData = (assessmentType, companyId, employeeId = null) => ({
  assessmentType,
  companyId,
  employeeId,
  responses: {},
  metadata: {
    startedAt: new Date().toISOString(),
    progress: 0,
    status: ASSESSMENT_STATUSES.DRAFT
  }
});

// ===== PROGRESS CALCULATION =====

export const calculateProgress = (responses, totalQuestions) => {
  const answeredCount = Object.values(responses).filter(value => 
    value !== undefined && value !== null && value !== '' &&
    !(Array.isArray(value) && value.length === 0)
  ).length;
  
  return createProgressInfo(answeredCount, totalQuestions);
};

// ===== ERROR HANDLING =====

export const formatApiError = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createErrorState = (field, message) => ({
  ...DEFAULT_ERROR_STATE,
  [field]: message
});

// ===== EVENT TRACKING =====

export const createAssessmentEvent = (type, questionId = null, assessmentId = null, metadata = {}) => ({
  type,
  questionId,
  assessmentId,
  timestamp: new Date().toISOString(),
  metadata
});

// ===== BROWSER UTILITIES =====

export const isMobileDevice = () => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

export const isTabletDevice = () => {
  return /iPad|Android(?!.*Mobi)/i.test(navigator.userAgent);
};

export const getBrowserInfo = () => ({
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  cookieEnabled: navigator.cookieEnabled,
  onLine: navigator.onLine
});

// Export all utilities as default object for convenience
export default {
  // Constants
  DEFAULT_LOADING_STATE,
  DEFAULT_ERROR_STATE,
  DEFAULT_PROGRESS,
  QUESTION_TYPES,
  ASSESSMENT_TYPES,
  ASSESSMENT_STATUSES,
  
  // Validation functions
  isQuestion,
  isValidationError,
  isAssessmentResponse,
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validateNumberRange,
  validateFileType,
  validateFileSize,
  
  // Utility functions
  createValidationError,
  createProgressInfo,
  createFileData,
  createAssessmentResponse,
  createAssessmentData,
  createAssessmentEvent,
  calculateProgress,
  formatFileSize,
  formatApiError,
  createErrorState,
  
  // Browser utilities
  isMobileDevice,
  isTabletDevice,
  getBrowserInfo
};
