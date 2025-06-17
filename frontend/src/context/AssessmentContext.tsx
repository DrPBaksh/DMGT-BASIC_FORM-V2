// DMGT Assessment Form - React Context Provider
// Professional state management for enterprise-grade assessment application

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  AssessmentContextType, 
  FormState, 
  NavigationState, 
  AppConfig,
  Question,
  FormResponse,
  FileUpload,
  ValidationResult,
  CompanyInfo,
  EmployeeInfo,
  ProgressState
} from '../types';
import { getApiService, initializeApiService } from '../services/api';
import { getAppConstants } from '../utils/config';

// Action types for reducer
type AssessmentAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_RESPONSE'; payload: { questionId: string; value: string | string[] | FileUpload[] } }
  | { type: 'SET_RESPONSES'; payload: FormResponse }
  | { type: 'SET_ERRORS'; payload: { [questionId: string]: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_PROGRESS'; payload: ProgressState }
  | { type: 'SET_LAST_SAVED'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'ADD_UPLOADING_FILE'; payload: string }
  | { type: 'REMOVE_UPLOADING_FILE'; payload: string }
  | { type: 'RESET_FORM' };

// Initial state
const initialFormState: FormState = {
  questions: [],
  responses: {},
  progress: {
    currentSection: 0,
    totalSections: 0,
    completedQuestions: [],
    totalQuestions: 0,
    percentComplete: 0
  },
  isLoading: false,
  isSaving: false,
  lastSaved: undefined,
  hasUnsavedChanges: false,
  errors: {},
  uploadingFiles: new Set()
};

// Reducer function
const assessmentReducer = (state: FormState, action: AssessmentAction): FormState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    
    case 'SET_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload,
        progress: {
          ...state.progress,
          totalQuestions: action.payload.length,
          totalSections: [...new Set(action.payload.map(q => q.section))].length || 1
        }
      };
    
    case 'UPDATE_RESPONSE':
      const newResponses = {
        ...state.responses,
        [action.payload.questionId]: action.payload.value
      };
      return {
        ...state,
        responses: newResponses,
        hasUnsavedChanges: true,
        progress: calculateProgress(newResponses, state.questions)
      };
    
    case 'SET_RESPONSES':
      return {
        ...state,
        responses: action.payload,
        hasUnsavedChanges: false,
        progress: calculateProgress(action.payload, state.questions)
      };
    
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    
    case 'CLEAR_ERROR':
      const { [action.payload]: removed, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };
    
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload, hasUnsavedChanges: false };
    
    case 'SET_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
    
    case 'ADD_UPLOADING_FILE':
      return { 
        ...state, 
        uploadingFiles: new Set([...state.uploadingFiles, action.payload])
      };
    
    case 'REMOVE_UPLOADING_FILE':
      const newUploadingFiles = new Set(state.uploadingFiles);
      newUploadingFiles.delete(action.payload);
      return { ...state, uploadingFiles: newUploadingFiles };
    
    case 'RESET_FORM':
      return { ...initialFormState };
    
    default:
      return state;
  }
};

// Helper function to calculate progress
const calculateProgress = (responses: FormResponse, questions: Question[]): ProgressState => {
  const completedQuestions = Object.keys(responses).filter(questionId => {
    const value = responses[questionId];
    return value !== undefined && value !== '' && value !== null &&
           !(Array.isArray(value) && value.length === 0);
  });

  const totalQuestions = questions.length;
  const percentComplete = totalQuestions > 0 ? Math.round((completedQuestions.length / totalQuestions) * 100) : 0;

  // Calculate section progress
  const sections = [...new Set(questions.map(q => q.section))];
  const currentSection = Math.min(
    Math.floor((completedQuestions.length / totalQuestions) * sections.length),
    sections.length - 1
  );

  return {
    currentSection,
    totalSections: sections.length || 1,
    completedQuestions,
    totalQuestions,
    percentComplete
  };
};

// Context creation
const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

// Provider component props
interface AssessmentProviderProps {
  children: React.ReactNode;
  config: AppConfig;
  navigationState: NavigationState;
  updateNavigationState: (updates: Partial<NavigationState>) => void;
}

// Provider component
export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({
  children,
  config,
  navigationState,
  updateNavigationState
}) => {
  const [state, dispatch] = useReducer(assessmentReducer, initialFormState);
  const constants = getAppConstants();

  // Initialize API service
  useEffect(() => {
    initializeApiService(config.apiUrl);
  }, [config.apiUrl]);

  // Auto-save functionality
  useEffect(() => {
    if (!state.hasUnsavedChanges || state.isSaving) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      if (navigationState.companyInfo?.id && navigationState.assessmentType) {
        saveProgress();
      }
    }, config.autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [state.hasUnsavedChanges, state.isSaving, navigationState, config.autoSaveInterval]);

  // Load questions when assessment type changes
  useEffect(() => {
    if (navigationState.assessmentType) {
      loadQuestions(navigationState.assessmentType);
    }
  }, [navigationState.assessmentType]);

  // Load existing responses when company/employee info is available
  useEffect(() => {
    if (navigationState.companyInfo?.id && navigationState.assessmentType) {
      loadProgress();
    }
  }, [navigationState.companyInfo?.id, navigationState.employeeInfo?.id, navigationState.assessmentType]);

  /**
   * Load questions for the current assessment type
   */
  const loadQuestions = useCallback(async (assessmentType: 'Company' | 'Employee') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiService = getApiService();
      const questions = await apiService.getQuestions(assessmentType);
      dispatch({ type: 'SET_QUESTIONS', payload: questions });
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Handle error appropriately
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Update a response value
   */
  const updateResponse = useCallback((questionId: string, value: string | string[] | FileUpload[]) => {
    dispatch({ type: 'UPDATE_RESPONSE', payload: { questionId, value } });
    dispatch({ type: 'CLEAR_ERROR', payload: questionId });
  }, []);

  /**
   * Save progress to backend
   */
  const saveProgress = useCallback(async () => {
    if (!navigationState.companyInfo?.id || !navigationState.assessmentType) {
      return;
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      const apiService = getApiService();
      
      const saveRequest = {
        assessmentType: navigationState.assessmentType,
        companyId: navigationState.companyInfo.id,
        employeeId: navigationState.employeeInfo?.id,
        responses: state.responses
      };

      await apiService.saveResponse(saveRequest);
      dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() });
      
      // Save to localStorage as backup
      localStorage.setItem(constants.PROGRESS_STORAGE_KEY, JSON.stringify({
        ...saveRequest,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('Failed to save progress:', error);
      // Handle error appropriately
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.responses, navigationState, constants.PROGRESS_STORAGE_KEY]);

  /**
   * Load existing progress from backend
   */
  const loadProgress = useCallback(async () => {
    if (!navigationState.companyInfo?.id || !navigationState.assessmentType) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiService = getApiService();
      
      const existingData = await apiService.getResponse(
        navigationState.assessmentType,
        navigationState.companyInfo.id,
        navigationState.employeeInfo?.id
      );

      if (existingData?.responses) {
        dispatch({ type: 'SET_RESPONSES', payload: existingData.responses });
        dispatch({ type: 'SET_LAST_SAVED', payload: existingData.lastUpdated });
      } else {
        // Try to load from localStorage backup
        const backupData = localStorage.getItem(constants.PROGRESS_STORAGE_KEY);
        if (backupData) {
          try {
            const parsed = JSON.parse(backupData);
            if (parsed.companyId === navigationState.companyInfo.id &&
                parsed.assessmentType === navigationState.assessmentType &&
                parsed.employeeId === navigationState.employeeInfo?.id) {
              dispatch({ type: 'SET_RESPONSES', payload: parsed.responses });
            }
          } catch (error) {
            console.warn('Failed to parse backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [navigationState, constants.PROGRESS_STORAGE_KEY]);

  /**
   * Upload file for a question
   */
  const uploadFile = useCallback(async (questionId: string, file: File): Promise<FileUpload> => {
    if (!navigationState.companyInfo?.id) {
      throw new Error('Company ID is required for file upload');
    }

    try {
      dispatch({ type: 'ADD_UPLOADING_FILE', payload: questionId });
      const apiService = getApiService();
      
      const fileUpload = await apiService.uploadFile(
        navigationState.companyInfo.id,
        questionId,
        file,
        (progress) => {
          // Handle upload progress if needed
          console.log(`Upload progress for ${questionId}: ${progress}%`);
        }
      );

      return fileUpload;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'REMOVE_UPLOADING_FILE', payload: questionId });
    }
  }, [navigationState.companyInfo?.id]);

  /**
   * Set assessment type and update navigation
   */
  const setAssessmentType = useCallback((type: 'Company' | 'Employee') => {
    updateNavigationState({ assessmentType: type });
  }, [updateNavigationState]);

  /**
   * Set company information
   */
  const setCompanyInfo = useCallback((info: CompanyInfo) => {
    updateNavigationState({ companyInfo: info });
  }, [updateNavigationState]);

  /**
   * Set employee information
   */
  const setEmployeeInfo = useCallback((info: EmployeeInfo) => {
    updateNavigationState({ employeeInfo: info });
  }, [updateNavigationState]);

  /**
   * Validate a specific question
   */
  const validateQuestion = useCallback((questionId: string): ValidationResult => {
    const question = state.questions.find(q => q.id === questionId);
    if (!question) {
      return { isValid: false, error: 'Question not found' };
    }

    const value = state.responses[questionId];

    // Check if required field is empty
    if (question.required && (value === undefined || value === '' || value === null ||
        (Array.isArray(value) && value.length === 0))) {
      return { isValid: false, error: 'This field is required' };
    }

    // Validate based on question type and validation rules
    if (question.validation && value !== undefined && value !== '') {
      const validation = question.validation;

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          return { isValid: false, error: `Minimum length is ${validation.minLength} characters` };
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return { isValid: false, error: `Maximum length is ${validation.maxLength} characters` };
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return { isValid: false, error: 'Invalid format' };
          }
        }
      }

      // Number validation
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        const numValue = Number(value);
        if (validation.min !== undefined && numValue < validation.min) {
          return { isValid: false, error: `Minimum value is ${validation.min}` };
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return { isValid: false, error: `Maximum value is ${validation.max}` };
        }
      }
    }

    return { isValid: true };
  }, [state.questions, state.responses]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback((page: NavigationState['currentPage']) => {
    updateNavigationState({ currentPage: page });
  }, [updateNavigationState]);

  // Context value
  const contextValue: AssessmentContextType = {
    state,
    navigation: navigationState,
    config,
    actions: {
      updateResponse,
      saveProgress,
      loadProgress,
      uploadFile,
      setAssessmentType,
      setCompanyInfo,
      setEmployeeInfo,
      validateQuestion,
      resetForm,
      goToPage
    }
  };

  return (
    <AssessmentContext.Provider value={contextValue}>
      {children}
    </AssessmentContext.Provider>
  );
};

// Custom hook to use the assessment context
export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

// Custom hook for form management
export const useForm = () => {
  const { state, actions } = useAssessment();
  
  return {
    formState: state,
    updateResponse: actions.updateResponse,
    saveProgress: actions.saveProgress,
    loadProgress: actions.loadProgress,
    validateForm: () => {
      // Validate all required questions
      const errors: { [questionId: string]: string } = {};
      let isValid = true;

      state.questions.forEach(question => {
        if (question.required) {
          const validation = actions.validateQuestion(question.id);
          if (!validation.isValid) {
            errors[question.id] = validation.error || 'This field is required';
            isValid = false;
          }
        }
      });

      return isValid;
    },
    resetForm: actions.resetForm
  };
};

// Custom hook for auto-save functionality
export const useAutoSave = () => {
  const { state, actions } = useAssessment();
  
  return {
    lastSaved: state.lastSaved,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    manualSave: actions.saveProgress
  };
};

// Custom hook for file upload
export const useFileUpload = () => {
  const { state, actions } = useAssessment();
  
  return {
    uploadFile: actions.uploadFile,
    uploadProgress: {}, // Could be enhanced to track individual file progress
    isUploading: (questionId: string) => state.uploadingFiles.has(questionId)
  };
};

export default AssessmentContext;