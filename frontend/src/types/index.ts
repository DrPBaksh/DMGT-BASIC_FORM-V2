/**
 * TypeScript Type Definitions for DMGT Assessment Platform
 * Comprehensive type system ensuring consistency across all components
 */

// ===== QUESTION TYPES =====

export interface QuestionValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'rating' | 'boolean' | 'number' | 'email';
  options?: string[];
  required?: boolean;
  category?: string;
  section?: string;
  placeholder?: string;
  validation?: QuestionValidation;
  dependsOn?: string; // Question ID this depends on
  showIf?: any; // Value that triggers showing this question
}

export interface QuestionSet {
  title: string;
  description: string;
  questions: Question[];
  version: string;
  lastUpdated: string;
}

// ===== RESPONSE TYPES =====

export interface FileData {
  fileName: string;
  fileKey: string;
  downloadUrl?: string;
  fileSize?: number;
  contentType?: string;
}

export interface FormResponse {
  questionId: string;
  value: string | string[] | number | boolean | FileData[];
  timestamp: string;
  fileData?: FileData;
}

export interface AssessmentData {
  assessmentType: 'Company' | 'Employee';
  companyId: string;
  employeeId?: string;
  responses: Record<string, any>;
  metadata?: {
    startedAt: string;
    lastUpdated?: string;
    completedAt?: string;
    progress: number;
    status: 'draft' | 'in-progress' | 'completed' | 'submitted';
  };
}

// ===== VALIDATION TYPES =====

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ===== UI STATE TYPES =====

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

export interface ProgressInfo {
  completed: number;
  total: number;
  percentage: number;
}

// ===== ASSESSMENT CONTEXT TYPES =====

export interface AssessmentResponse {
  questionId: string;
  value: string | string[] | number | boolean;
  fileData?: FileData;
  timestamp: string;
}

export interface Assessment {
  id: string;
  type: 'Company' | 'Employee';
  companyId: string;
  employeeId?: string;
  responses: AssessmentResponse[];
  status: 'draft' | 'in-progress' | 'completed' | 'submitted';
  progress: number;
  lastSaved: string;
  metadata: {
    startedAt: string;
    completedAt?: string;
    version: string;
    userAgent: string;
    ipAddress?: string;
  };
}

export interface AppConfig {
  apiUrl: string;
  environment: string;
  region: string;
  cloudfrontUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// ===== COMPONENT PROP TYPES =====

export interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onFileUpload?: (questionId: string, files: FileList) => Promise<void>;
  error?: ValidationError;
  disabled?: boolean;
}

export interface ProgressBarProps {
  progress: ProgressInfo;
  showDetails?: boolean;
  className?: string;
}

export interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  autoSaveEnabled?: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

// ===== API TYPES =====

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: string;
}

export interface SaveResponseRequest {
  assessmentType: 'Company' | 'Employee';
  companyId: string;
  employeeId?: string;
  responses: Record<string, any>;
}

export interface FileUploadRequest {
  companyId: string;
  questionId: string;
  file: File;
}

export interface FileUploadResponse {
  message: string;
  fileKey: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
}

// ===== ROUTE TYPES =====

export interface RouteParams {
  companyId?: string;
  employeeId?: string;
  assessmentType?: 'Company' | 'Employee';
}

export interface LocationState {
  companyName?: string;
  companyId?: string;
  employeeName?: string;
  employeeId?: string;
  fromPage?: string;
}

// ===== FORM TYPES =====

export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

export interface FormData {
  [key: string]: any;
}

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  errors: ValidationError[];
}

// ===== UTILITY TYPES =====

export type AssessmentType = 'Company' | 'Employee';

export type QuestionType = Question['type'];

export type ResponseValue = string | string[] | number | boolean | FileData[];

export type ValidationRule = (value: any, question: Question) => ValidationError | null;

// ===== CONFIGURATION TYPES =====

export interface EnvironmentConfig {
  apiUrl: string;
  environment: string;
  region: string;
  cloudfrontUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableDebugLogging: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
}

export interface FeatureFlags {
  fileUpload: boolean;
  autoSave: boolean;
  progressTracking: boolean;
  offlineMode: boolean;
  analytics: boolean;
  accessibilityFeatures: boolean;
}

export interface UIConfig {
  theme: string;
  primaryColor: string;
  animationDuration: number;
  pageTransitionDelay: number;
}

// ===== EVENT TYPES =====

export interface AssessmentEvent {
  type: 'question_answered' | 'section_completed' | 'assessment_started' | 'assessment_completed' | 'file_uploaded';
  questionId?: string;
  assessmentId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ===== HOOK TYPES =====

export interface UseAssessmentReturn {
  state: {
    currentAssessment: Assessment | null;
    questions: Question[];
    loading: LoadingState;
    errors: ErrorState;
  };
  actions: {
    startAssessment: (type: AssessmentType, companyId: string, employeeId?: string) => void;
    loadQuestions: (type: AssessmentType) => Promise<void>;
    updateResponse: (questionId: string, value: any) => void;
    saveAssessment: () => Promise<void>;
    submitAssessment: () => Promise<void>;
    uploadFile: (questionId: string, file: File) => Promise<void>;
  };
  utils: {
    getResponse: (questionId: string) => AssessmentResponse | undefined;
    getProgress: () => ProgressInfo;
    isComplete: () => boolean;
    validateQuestion: (question: Question, value: any) => ValidationError | null;
  };
}

// ===== EXPORT COLLECTIONS =====

export type {
  // React types for convenience
  React,
} from 'react';

// Component prop types collection
export interface ComponentProps {
  QuestionRenderer: QuestionRendererProps;
  ProgressBar: ProgressBarProps;
  SaveIndicator: SaveIndicatorProps;
  LoadingSpinner: LoadingSpinnerProps;
  ErrorBoundary: ErrorBoundaryProps;
}

// API types collection
export interface ApiTypes {
  Config: ApiConfig;
  Response: ApiResponse;
  SaveRequest: SaveResponseRequest;
  FileUploadRequest: FileUploadRequest;
  FileUploadResponse: FileUploadResponse;
}

// State types collection
export interface StateTypes {
  Assessment: Assessment;
  Question: Question;
  Response: AssessmentResponse;
  Validation: ValidationError;
  Loading: LoadingState;
  Error: ErrorState;
  Progress: ProgressInfo;
}

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

// ===== TYPE GUARDS =====

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
