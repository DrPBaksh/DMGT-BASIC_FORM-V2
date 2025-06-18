/**
 * TypeScript Type Definitions for DMGT Assessment Platform
 * Defines interfaces and types for consistent typing across components
 */

// ===== CORE INTERFACES =====

export interface Question {
  id: string;
  title: string;
  type: string;
  description?: string;
  required?: boolean;
  category?: string;
  section?: string;
  options?: string[] | { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  placeholder?: string;
  helpText?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ProgressInfo {
  completed: number;
  total: number;
  percentage: number;
}

export interface AssessmentData {
  assessmentType: string;
  companyId: string;
  employeeId?: string;
  responses: { [questionId: string]: any };
  metadata?: {
    startedAt?: string;
    progress?: number;
    status?: string;
  };
}

export interface AssessmentResponse {
  questionId: string;
  value: any;
  fileData?: FileData | null;
  timestamp: string;
}

export interface FileData {
  fileName: string;
  fileKey: string;
  downloadUrl?: string;
}

// ===== LOADING & ERROR STATES =====

export interface LoadingState {
  questions: boolean;
  saving: boolean;
  uploading: boolean;
  submitting: boolean;
}

export interface ErrorState {
  questions: string | null;
  saving: string | null;
  uploading: string | null;
  submitting: string | null;
  general: string | null;
}

// ===== CONSTANTS =====

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
} as const;

export const ASSESSMENT_TYPES = {
  COMPANY: 'Company',
  EMPLOYEE: 'Employee'
} as const;

export const ASSESSMENT_STATUSES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted'
} as const;

// ===== DEFAULT VALUES =====

export const DEFAULT_LOADING_STATE: LoadingState = {
  questions: false,
  saving: false,
  uploading: false,
  submitting: false,
};

export const DEFAULT_ERROR_STATE: ErrorState = {
  questions: null,
  saving: null,
  uploading: null,
  submitting: null,
  general: null,
};

export const DEFAULT_PROGRESS: ProgressInfo = {
  completed: 0,
  total: 0,
  percentage: 0,
};

// ===== TYPE VALIDATION FUNCTIONS =====

export const isQuestion = (obj: any): obj is Question => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.type === 'string';
};

export const isValidationError = (obj: any): obj is ValidationError => {
  return obj && typeof obj.field === 'string' && typeof obj.message === 'string';
};

export const isAssessmentResponse = (obj: any): obj is AssessmentResponse => {
  return obj && typeof obj.questionId === 'string' && obj.value !== undefined && typeof obj.timestamp === 'string';
};

// ===== UTILITY FUNCTIONS =====

export const createValidationError = (field: string, message: string, code?: string): ValidationError => ({
  field,
  message,
  code,
});

export const createProgressInfo = (completed: number, total: number): ProgressInfo => ({
  completed,
  total,
  percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
});

export const createFileData = (fileName: string, fileKey: string, downloadUrl?: string): FileData => ({
  fileName,
  fileKey,
  downloadUrl,
});

export const createAssessmentResponse = (questionId: string, value: any, fileData?: FileData | null): AssessmentResponse => ({
  questionId,
  value,
  fileData,
  timestamp: new Date().toISOString()
});

export const createAssessmentData = (assessmentType: string, companyId: string, employeeId?: string): AssessmentData => ({
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

// ===== VALIDATION HELPERS =====

export const validateRequired = (value: any): ValidationError | null => {
  if (value === undefined || value === null || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return createValidationError('field', 'This field is required', 'REQUIRED');
  }
  return null;
};

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createValidationError('field', 'Please enter a valid email address', 'INVALID_EMAIL');
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number): ValidationError | null => {
  if (typeof value === 'string' && value.length < minLength) {
    return createValidationError('field', `Minimum length is ${minLength} characters`, 'MIN_LENGTH');
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number): ValidationError | null => {
  if (typeof value === 'string' && value.length > maxLength) {
    return createValidationError('field', `Maximum length is ${maxLength} characters`, 'MAX_LENGTH');
  }
  return null;
};

export const validateNumberRange = (value: any, min?: number, max?: number): ValidationError | null => {
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

export const validateFileType = (file: File, allowedTypes: string[]): ValidationError | null => {
  if (!allowedTypes.includes(file.type)) {
    return createValidationError('field', 'File type not supported', 'INVALID_FILE_TYPE');
  }
  return null;
};

export const validateFileSize = (file: File, maxSizeBytes: number): ValidationError | null => {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return createValidationError('field', `File size must be less than ${maxSizeMB}MB`, 'FILE_TOO_LARGE');
  }
  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ===== PROGRESS CALCULATION =====

export const calculateProgress = (responses: { [key: string]: any }, totalQuestions: number): ProgressInfo => {
  const answeredCount = Object.values(responses).filter(value => 
    value !== undefined && value !== null && value !== '' &&
    !(Array.isArray(value) && value.length === 0)
  ).length;
  
  return createProgressInfo(answeredCount, totalQuestions);
};

// ===== ERROR HANDLING =====

export const formatApiError = (error: any): string => {
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

export const createErrorState = (field: keyof ErrorState, message: string): ErrorState => ({
  ...DEFAULT_ERROR_STATE,
  [field]: message
});

// ===== EVENT TRACKING =====

export interface AssessmentEvent {
  type: string;
  questionId?: string | null;
  assessmentId?: string | null;
  timestamp: string;
  metadata: { [key: string]: any };
}

export const createAssessmentEvent = (type: string, questionId?: string | null, assessmentId?: string | null, metadata: { [key: string]: any } = {}): AssessmentEvent => ({
  type,
  questionId,
  assessmentId,
  timestamp: new Date().toISOString(),
  metadata
});

// ===== BROWSER UTILITIES =====

export const isMobileDevice = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

export const isTabletDevice = (): boolean => {
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
