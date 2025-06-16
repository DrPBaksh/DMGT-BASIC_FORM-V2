// DMGT Assessment Form - API Service Layer
// Professional, enterprise-grade API communication with comprehensive error handling

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  Question, 
  AssessmentData, 
  SaveRequest, 
  ApiResponse, 
  FileUpload,
  NetworkError,
  ValidationError,
  FileUploadError
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          };
        }
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        return this.handleApiError(error);
      }
    );
  }

  /**
   * Handle API errors and convert to custom error types
   */
  private handleApiError(error: AxiosError): Promise<never> {
    console.error('API Error:', error);

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new NetworkError('Request timeout. Please check your connection and try again.'));
    }

    if (!error.response) {
      return Promise.reject(new NetworkError('Network error. Please check your internet connection.'));
    }

    const { status, data } = error.response;
    const message = (data as any)?.error || (data as any)?.message || 'An unexpected error occurred';

    switch (status) {
      case 400:
        return Promise.reject(new ValidationError(message));
      case 401:
        return Promise.reject(new NetworkError('Unauthorized access', 401));
      case 403:
        return Promise.reject(new NetworkError('Access forbidden', 403));
      case 404:
        return Promise.reject(new NetworkError('Resource not found', 404));
      case 409:
        return Promise.reject(new ValidationError('Conflict: Resource already exists'));
      case 422:
        return Promise.reject(new ValidationError(message));
      case 429:
        return Promise.reject(new NetworkError('Too many requests. Please try again later.', 429));
      case 500:
        return Promise.reject(new NetworkError('Server error. Please try again later.', 500));
      case 502:
      case 503:
      case 504:
        return Promise.reject(new NetworkError('Service temporarily unavailable. Please try again later.', status));
      default:
        return Promise.reject(new NetworkError(message, status));
    }
  }

  /**
   * Fetch questions for a specific assessment type
   */
  async getQuestions(assessmentType: 'Company' | 'Employee'): Promise<Question[]> {
    try {
      const response = await this.api.get<Question[]>(`/questions/${assessmentType}`);
      
      if (!Array.isArray(response.data)) {
        throw new ValidationError('Invalid questions format received from server');
      }

      // Validate questions structure
      response.data.forEach((question, index) => {
        if (!question.id || !question.type || !question.title) {
          throw new ValidationError(`Invalid question structure at index ${index}`);
        }
      });

      return response.data;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('Failed to load questions. Please try again.');
    }
  }

  /**
   * Save assessment response
   */
  async saveResponse(request: SaveRequest): Promise<ApiResponse> {
    try {
      // Validate request
      if (!request.assessmentType || !request.companyId) {
        throw new ValidationError('Assessment type and company ID are required');
      }

      if (request.assessmentType === 'Employee' && !request.employeeId) {
        throw new ValidationError('Employee ID is required for employee assessments');
      }

      const response = await this.api.post<ApiResponse>('/responses', request);
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('Failed to save response. Please try again.');
    }
  }

  /**
   * Get existing assessment response
   */
  async getResponse(
    assessmentType: 'Company' | 'Employee',
    companyId: string,
    employeeId?: string
  ): Promise<AssessmentData | null> {
    try {
      if (!assessmentType || !companyId) {
        throw new ValidationError('Assessment type and company ID are required');
      }

      if (assessmentType === 'Employee' && !employeeId) {
        throw new ValidationError('Employee ID is required for employee assessments');
      }

      const url = employeeId 
        ? `/responses/${assessmentType}/${companyId}/${employeeId}`
        : `/responses/${assessmentType}/${companyId}`;

      const response = await this.api.get<AssessmentData>(url);
      return response.data;
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) {
        return null; // No existing response found
      }
      
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Failed to load existing response.');
    }
  }

  /**
   * Upload file for a specific question
   */
  async uploadFile(
    companyId: string,
    questionId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUpload> {
    try {
      // Validate inputs
      if (!companyId || !questionId || !file) {
        throw new ValidationError('Company ID, question ID, and file are required');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new FileUploadError('File size must be less than 10MB', file.name);
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new FileUploadError('File type not supported', file.name);
      }

      // Convert file to base64
      const fileContent = await this.fileToBase64(file);

      const uploadData = {
        companyId,
        questionId,
        fileName: file.name,
        fileContent,
        contentType: file.type
      };

      const response = await this.api.post<{
        message: string;
        fileKey: string;
        downloadUrl: string;
        fileName: string;
      }>('/files', uploadData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return {
        fileName: response.data.fileName,
        fileKey: response.data.fileKey,
        downloadUrl: response.data.downloadUrl,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        contentType: file.type
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof FileUploadError) {
        throw error;
      }
      
      if (error instanceof NetworkError) {
        throw new FileUploadError(`Upload failed: ${error.message}`, file.name);
      }
      
      throw new FileUploadError('File upload failed. Please try again.', file.name);
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Singleton instance
let apiServiceInstance: ApiService | null = null;

/**
 * Initialize API service with configuration
 */
export const initializeApiService = (baseURL: string): ApiService => {
  apiServiceInstance = new ApiService(baseURL);
  return apiServiceInstance;
};

/**
 * Get API service instance
 */
export const getApiService = (): ApiService => {
  if (!apiServiceInstance) {
    throw new Error('API service not initialized. Call initializeApiService first.');
  }
  return apiServiceInstance;
};

/**
 * Utility function to handle API responses consistently
 */
export const handleApiResponse = async <T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    
    if (error instanceof ValidationError || error instanceof NetworkError || error instanceof FileUploadError) {
      throw error;
    }
    
    throw new NetworkError(errorMessage);
  }
};

/**
 * Retry logic for failed requests
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation errors
      if (error instanceof ValidationError) {
        throw error;
      }
      
      // Don't retry client errors (4xx)
      if (error instanceof NetworkError && error.statusCode && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
};

export default ApiService;