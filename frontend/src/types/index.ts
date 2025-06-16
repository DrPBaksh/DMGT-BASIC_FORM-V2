// DMGT Assessment Form - TypeScript Interfaces and Types
// Professional type definitions for enterprise-grade application

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
  fileUpload?: FileUploadConfig;
  conditional?: ConditionalLogic;
  section?: string;
}

export type QuestionType = 
  | 'text' 
  | 'textarea' 
  | 'radio' 
  | 'checkbox' 
  | 'select' 
  | 'file' 
  | 'rating' 
  | 'number' 
  | 'email' 
  | 'url';

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  fileTypes?: string[];
  maxFileSize?: number; // in MB
}

export interface FileUploadConfig {
  allowedTypes: string[];
  maxSize: number; // in MB
  multiple: boolean;
  description?: string;
}

export interface ConditionalLogic {
  dependsOn: string; // question ID
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface FormResponse {
  [questionId: string]: string | string[] | FileUpload[];
}

export interface FileUpload {
  fileName: string;
  fileKey: string;
  downloadUrl: string;
  uploadDate: string;
  fileSize: number;
  contentType: string;
}

export interface AssessmentData {
  assessmentType: 'Company' | 'Employee';
  companyId: string;
  employeeId?: string;
  responses: FormResponse;
  lastUpdated: string;
  version: string;
  progress?: number;
  isComplete?: boolean;
}

export interface SaveRequest {
  assessmentType: 'Company' | 'Employee';
  companyId: string;
  employeeId?: string;
  responses: FormResponse;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProgressState {
  currentSection: number;
  totalSections: number;
  completedQuestions: string[];
  totalQuestions: number;
  percentComplete: number;
}

export interface FormState {
  questions: Question[];
  responses: FormResponse;
  progress: ProgressState;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved?: string;
  hasUnsavedChanges: boolean;
  errors: FormErrors;
  uploadingFiles: Set<string>;
}

export interface FormErrors {
  [questionId: string]: string;
}

export interface AppConfig {
  apiUrl: string;
  awsRegion: string;
  environment: 'dev' | 'prod';
  autoSaveInterval: number; // in milliseconds
}

export interface CompanyInfo {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  region?: string;
}

export interface EmployeeInfo {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  companyId: string;
}

export interface NavigationState {
  currentPage: 'welcome' | 'company-form' | 'employee-form' | 'completed';
  assessmentType?: 'Company' | 'Employee';
  companyInfo?: CompanyInfo;
  employeeInfo?: EmployeeInfo;
}

// Form validation utilities
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// API endpoints
export const API_ENDPOINTS = {
  GET_QUESTIONS: (type: string) => `/questions/${type}`,
  SAVE_RESPONSE: '/responses',
  GET_RESPONSE: (type: string, companyId: string, employeeId?: string) => 
    employeeId ? `/responses/${type}/${companyId}/${employeeId}` : `/responses/${type}/${companyId}`,
  UPLOAD_FILE: '/files',
} as const;

// Application constants
export const APP_CONSTANTS = {
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  FILE_UPLOAD_MAX_SIZE: 10, // 10 MB
  SUPPORTED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  MIN_COMPANY_ID_LENGTH: 3,
  MIN_EMPLOYEE_ID_LENGTH: 2,
  PROGRESS_STORAGE_KEY: 'dmgt_assessment_progress',
  LAST_SAVE_STORAGE_KEY: 'dmgt_assessment_last_save'
} as const;

// Theme and styling types
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryUltraLight: string;
  white: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const THEME_COLORS: ThemeColors = {
  primary: '#007AFF',
  primaryDark: '#005cbf',
  primaryLight: '#4da3ff',
  primaryUltraLight: '#e6f3ff',
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#e5e5e5',
  gray300: '#d4d4d4',
  gray400: '#a3a3a3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#007AFF'
};

// Animation and transition constants
export const ANIMATIONS = {
  FAST: '0.15s ease-out',
  NORMAL: '0.25s ease-out',
  SLOW: '0.35s ease-out',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  EASE_OUT_QUART: 'cubic-bezier(0.25, 1, 0.5, 1)',
  EASE_IN_OUT_QUART: 'cubic-bezier(0.76, 0, 0.24, 1)'
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
} as const;

// Error types
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

export class ValidationError extends AssessmentError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AssessmentError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

export class FileUploadError extends AssessmentError {
  constructor(message: string, public fileName?: string) {
    super(message, 'FILE_UPLOAD_ERROR');
    this.name = 'FileUploadError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Context types for React
export interface AssessmentContextType {
  state: FormState;
  navigation: NavigationState;
  config: AppConfig;
  actions: {
    updateResponse: (questionId: string, value: string | string[] | FileUpload[]) => void;
    saveProgress: () => Promise<void>;
    loadProgress: () => Promise<void>;
    uploadFile: (questionId: string, file: File) => Promise<FileUpload>;
    setAssessmentType: (type: 'Company' | 'Employee') => void;
    setCompanyInfo: (info: CompanyInfo) => void;
    setEmployeeInfo: (info: EmployeeInfo) => void;
    validateQuestion: (questionId: string) => ValidationResult;
    resetForm: () => void;
    goToPage: (page: NavigationState['currentPage']) => void;
  };
}

// Hook return types
export interface UseFormReturn {
  formState: FormState;
  updateResponse: (questionId: string, value: string | string[] | FileUpload[]) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  validateForm: () => boolean;
  resetForm: () => void;
}

export interface UseFileUploadReturn {
  uploadFile: (questionId: string, file: File) => Promise<FileUpload>;
  uploadProgress: { [questionId: string]: number };
  isUploading: (questionId: string) => boolean;
}

export interface UseAutoSaveReturn {
  lastSaved: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  manualSave: () => Promise<void>;
}

// Component prop types
export interface QuestionProps {
  question: Question;
  value: string | string[] | FileUpload[];
  onChange: (value: string | string[] | FileUpload[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  loading?: boolean;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
}

export interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

// Form section types
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

export interface SectionProgress {
  sectionId: string;
  completedQuestions: number;
  totalQuestions: number;
  isComplete: boolean;
}

// Export helper functions interface
export interface FormHelpers {
  calculateProgress: (responses: FormResponse, questions: Question[]) => ProgressState;
  validateResponse: (question: Question, value: any) => ValidationResult;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (contentType: string) => string;
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
  throttle: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
}