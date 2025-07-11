import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { APIService } from '../services/api';
import { 
  DEFAULT_LOADING_STATE,
  DEFAULT_ERROR_STATE
} from '../types';

// Initial state
const initialState = {
  currentAssessment: null,
  questions: {
    Company: null,
    Employee: null
  },
  loading: DEFAULT_LOADING_STATE,
  errors: DEFAULT_ERROR_STATE,
  config: {
    apiUrl: '',
    environment: 'dev',
    region: 'eu-west-2',
    cloudfrontUrl: '',
    isDevelopment: true,
    isProduction: false
  },
  autoSaveEnabled: true,
  lastAutoSave: null
};

// Reducer
const assessmentReducer = (state, action) => {
  switch (action.type) {
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.payload.type]: action.payload.questions
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value
        }
      };

    case 'START_ASSESSMENT':
      const newAssessment = {
        id: `${action.payload.type.toLowerCase()}-${action.payload.companyId}-${Date.now()}`,
        type: action.payload.type,
        companyId: action.payload.companyId,
        employeeId: action.payload.employeeId,
        responses: [],
        status: 'draft',
        progress: 0,
        lastSaved: new Date().toISOString(),
        metadata: {
          startedAt: new Date().toISOString(),
          version: '2.0',
          userAgent: navigator.userAgent
        }
      };
      return {
        ...state,
        currentAssessment: newAssessment
      };

    case 'UPDATE_RESPONSE':
      if (!state.currentAssessment) return state;
      
      const updatedResponses = state.currentAssessment.responses.filter(
        r => r.questionId !== action.payload.questionId
      );
      updatedResponses.push(action.payload);
      
      const totalQuestions = state.questions[state.currentAssessment.type]?.questions.length || 0;
      const progress = totalQuestions > 0 ? (updatedResponses.length / totalQuestions) * 100 : 0;
      
      return {
        ...state,
        currentAssessment: {
          ...state.currentAssessment,
          responses: updatedResponses,
          progress: Math.round(progress),
          status: progress > 0 ? 'in-progress' : 'draft',
          lastSaved: new Date().toISOString()
        }
      };

    case 'SET_ASSESSMENT_STATUS':
      if (!state.currentAssessment) return state;
      return {
        ...state,
        currentAssessment: {
          ...state.currentAssessment,
          status: action.payload,
          lastSaved: new Date().toISOString(),
          metadata: {
            ...state.currentAssessment.metadata,
            completedAt: action.payload === 'completed' ? new Date().toISOString() : undefined
          }
        }
      };

    case 'LOAD_ASSESSMENT':
      return {
        ...state,
        currentAssessment: action.payload
      };

    case 'CLEAR_ASSESSMENT':
      return {
        ...state,
        currentAssessment: null
      };

    case 'SET_AUTO_SAVE':
      return {
        ...state,
        lastAutoSave: action.payload
      };

    case 'TOGGLE_AUTO_SAVE':
      return {
        ...state,
        autoSaveEnabled: action.payload
      };

    default:
      return state;
  }
};

const AssessmentContext = createContext(undefined);

// Provider component
export const AssessmentProvider = ({ children, config }) => {
  const [state, dispatch] = useReducer(assessmentReducer, {
    ...initialState,
    config
  });

  // Initialize API service
  useEffect(() => {
    if (config.apiUrl) {
      APIService.initialize(config.apiUrl);
      console.log('✅ API Service initialized with URL:', config.apiUrl);
    }
  }, [config.apiUrl]);

  // Auto-save functionality
  useEffect(() => {
    if (!state.autoSaveEnabled || !state.currentAssessment || state.loading.saving) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      // More explicit checking for JavaScript
      if (state.currentAssessment && state.currentAssessment.responses && state.currentAssessment.responses.length > 0) {
        saveAssessment();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [state.currentAssessment?.responses, state.autoSaveEnabled]);

  // Load questions
  const loadQuestions = useCallback(async (type) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'questions', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'questions', value: null } });

    try {
      console.log(`📋 Loading ${type} questions...`);
      const questions = await APIService.getQuestions(type);
      
      // Convert array to QuestionSet format
      const questionSet = {
        title: `${type} Assessment`,
        description: `Data & AI Readiness Assessment for ${type}`,
        questions,
        version: '2.0',
        lastUpdated: new Date().toISOString()
      };
      
      dispatch({ 
        type: 'SET_QUESTIONS', 
        payload: { type, questions: questionSet } 
      });
      
      console.log(`✅ ${type} questions loaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      console.error(`❌ Error loading ${type} questions:`, error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'questions', value: errorMessage } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'questions', value: false } });
    }
  }, []);

  // Start assessment
  const startAssessment = useCallback((type, companyId, employeeId) => {
    console.log(`🚀 Starting ${type} assessment for company ${companyId}${employeeId ? `, employee ${employeeId}` : ''}`);
    dispatch({ 
      type: 'START_ASSESSMENT', 
      payload: { type, companyId, employeeId } 
    });
  }, []);

  // Load existing assessment
  const loadAssessment = useCallback(async (type, companyId, employeeId) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'saving', value: true } });
    
    try {
      console.log(`📂 Loading existing ${type} assessment...`);
      const assessment = await APIService.getResponse(type, companyId, employeeId);
      
      dispatch({ type: 'LOAD_ASSESSMENT', payload: assessment });
      console.log('✅ Assessment loaded successfully');
    } catch (error) {
      console.log('ℹ️ No existing assessment found, starting new one');
      startAssessment(type, companyId, employeeId);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'saving', value: false } });
    }
  }, [startAssessment]);

  // Clear assessment
  const clearAssessment = useCallback(() => {
    dispatch({ type: 'CLEAR_ASSESSMENT' });
  }, []);

  // Update response
  const updateResponse = useCallback((questionId, value) => {
    const response = {
      questionId,
      value,
      timestamp: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_RESPONSE', payload: response });
    console.log(`💾 Response updated for question ${questionId}`);
  }, []);

  // Save assessment
  const saveAssessment = useCallback(async () => {
    if (!state.currentAssessment) {
      console.warn('⚠️ No current assessment to save');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: { key: 'saving', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'saving', value: null } });

    try {
      console.log('💾 Saving assessment...');
      
      await APIService.saveResponse({
        assessmentType: state.currentAssessment.type,
        companyId: state.currentAssessment.companyId,
        employeeId: state.currentAssessment.employeeId,
        responses: state.currentAssessment.responses.reduce((acc, response) => {
          acc[response.questionId] = response.value;
          return acc;
        }, {})
      });

      dispatch({ 
        type: 'SET_AUTO_SAVE', 
        payload: new Date().toISOString() 
      });
      
      console.log('✅ Assessment saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save assessment';
      console.error('❌ Error saving assessment:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'saving', value: errorMessage } 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'saving', value: false } });
    }
  }, [state.currentAssessment]);

  // Submit assessment
  const submitAssessment = useCallback(async () => {
    if (!state.currentAssessment) {
      throw new Error('No assessment to submit');
    }

    // First save the assessment
    await saveAssessment();
    
    // Then mark as completed
    dispatch({ type: 'SET_ASSESSMENT_STATUS', payload: 'completed' });
    
    console.log('🎉 Assessment submitted successfully');
  }, [saveAssessment]);

  // Upload file
  const uploadFile = useCallback(async (questionId, file) => {
    if (!state.currentAssessment) {
      throw new Error('No active assessment for file upload');
    }

    dispatch({ type: 'SET_LOADING', payload: { key: 'uploading', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'uploading', value: null } });

    try {
      console.log(`📎 Uploading file for question ${questionId}:`, file.name);
      
      const result = await APIService.uploadFile({
        companyId: state.currentAssessment.companyId,
        questionId,
        file
      });

      // Update response with file information
      const response = {
        questionId,
        value: file.name,
        fileData: {
          fileName: file.name,
          fileKey: result.fileKey,
          downloadUrl: result.downloadUrl
        },
        timestamp: new Date().toISOString()
      };

      dispatch({ type: 'UPDATE_RESPONSE', payload: response });
      console.log('✅ File uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      console.error('❌ Error uploading file:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: 'uploading', value: errorMessage } 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'uploading', value: false } });
    }
  }, [state.currentAssessment]);

  // Toggle auto-save
  const toggleAutoSave = useCallback((enabled) => {
    dispatch({ type: 'TOGGLE_AUTO_SAVE', payload: enabled });
    console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  // Get response for a specific question
  const getResponse = useCallback((questionId) => {
    return state.currentAssessment?.responses.find(r => r.questionId === questionId);
  }, [state.currentAssessment?.responses]);

  // Get progress percentage
  const getProgress = useCallback(() => {
    return state.currentAssessment?.progress || 0;
  }, [state.currentAssessment?.progress]);

  // Check if assessment is complete
  const isComplete = useCallback(() => {
    if (!state.currentAssessment) return false;
    
    const requiredQuestions = state.questions[state.currentAssessment.type]?.questions.filter(q => q.required) || [];
    const answeredRequired = requiredQuestions.filter(q => 
      state.currentAssessment?.responses.some(r => r.questionId === q.id)
    );
    
    return answeredRequired.length === requiredQuestions.length;
  }, [state.currentAssessment, state.questions]);

  const contextValue = {
    state,
    startAssessment,
    loadAssessment,
    clearAssessment,
    loadQuestions,
    updateResponse,
    saveAssessment,
    submitAssessment,
    uploadFile,
    toggleAutoSave,
    getResponse,
    getProgress,
    isComplete
  };

  return (
    <AssessmentContext.Provider value={contextValue}>
      {children}
    </AssessmentContext.Provider>
  );
};

// Custom hook to use the context
export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

export default AssessmentContext;
