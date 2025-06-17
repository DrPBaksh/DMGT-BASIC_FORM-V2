// Enhanced DMGT Assessment Form - API Service Layer
// Professional, enterprise-grade API communication with comprehensive error handling
// Integrated with dynamic configuration service

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { config } from './config';
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
  private config: ReturnType<typeof config.getApiConfig>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.config = config.getApiConfig();
    
    // Create axios instance with dynamic configuration
    this.api = axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Version': config.getConfig().appVersion,
        'X-Environment': config.getConfig().environment,
      },
    });

    // Request interceptor with enhanced logging
    this.api.interceptors.request.use(
      (requestConfig) => {
        // Add timestamp to prevent caching
        if (requestConfig.method === 'get') {
          requestConfig.params = {
            ...requestConfig.params,
            _t: Date.now()
          };
        }
        
        // Add request ID for tracking
        const requestId = Math.random().toString(36).substr(2, 9);
        requestConfig.headers['X-Request-ID'] = requestId;
        
        if (config.isDev()) {
          console.log(`🔄 API Request [${requestId}]:`, {
            method: requestConfig.method?.toUpperCase(),
            url: requestConfig.url,
            timeout: requestConfig.timeout,
            headers: requestConfig.headers
          });
        }
        
        return requestConfig;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with enhanced error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.headers['X-Request-ID'];
        
        if (config.isDev()) {
          console.log(`✅ API Response [${requestId}]:`, {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            responseTime: response.headers['x-response-time']
          });
        }
        
        return response;
      },
      (error: AxiosError) => {
        return this.handleApiError(error);
      }
    );
  }

  /**
   * Enhanced error handling with configuration-aware responses
   */
  private handleApiError(error: AxiosError): Promise<never> {
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
    
    console.error(`❌ API Error [${requestId}]:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    });

    // Network-specific errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new NetworkError(
        `Request timeout after ${this.config.timeout}ms. Please check your connection and try again.`
      ));
    }

    if (!error.response) {
      const message = config.isDev() 
        ? `Network error: ${error.message}. Please check your internet connection.`
        : 'Network error. Please check your internet connection.';
      return Promise.reject(new NetworkError(message));
    }

    const { status, data } = error.response;
    const message = (data as any)?.error || (data as any)?.message || 'An unexpected error occurred';

    // Enhanced error messages based on environment
    const getEnhancedMessage = (defaultMessage: string, details?: string) => {
      if (config.isDev() && details) {
        return `${defaultMessage} (Debug: ${details})`;
      }
      return defaultMessage;
    };

    switch (status) {
      case 400:
        return Promise.reject(new ValidationError(getEnhancedMessage(message, `Request ID: ${requestId}`)));
      case 401:
        return Promise.reject(new NetworkError('Unauthorized access. Please check your permissions.', 401));
      case 403:
        return Promise.reject(new NetworkError('Access forbidden. Contact your administrator.', 403));
      case 404:
        return Promise.reject(new NetworkError('Resource not found. The requested data may have been moved or deleted.', 404));
      case 409:
        return Promise.reject(new ValidationError('Conflict: Resource already exists or has been modified.'));
      case 422:
        return Promise.reject(new ValidationError(getEnhancedMessage(message, 'Validation failed')));
      case 429:
        return Promise.reject(new NetworkError('Too many requests. Please wait a moment and try again.', 429));
      case 500:
        const serverMessage = config.isDev() 
          ? `Server error: ${message} (Request ID: ${requestId})`
          : 'Server error. Our team has been notified. Please try again later.';
        return Promise.reject(new NetworkError(serverMessage, 500));
      case 502:
      case 503:
      case 504:
        return Promise.reject(new NetworkError(
          'Service temporarily unavailable. Please try again in a few moments.', 
          status
        ));
      default:
        return Promise.reject(new NetworkError(
          getEnhancedMessage(message, `HTTP ${status} - Request ID: ${requestId}`), 
          status
        ));
    }
  }

  /**
   * Enhanced question fetching with caching and validation
   */
  async getQuestions(assessmentType: 'Company' | 'Employee'): Promise<Question[]> {
    try {
      console.log(`📊 Fetching ${assessmentType} questions...`);
      
      const response = await this.api.get<Question[]>(`/questions/${assessmentType}`);
      
      if (!Array.isArray(response.data)) {
        throw new ValidationError('Invalid questions format received from server');
      }

      // Enhanced question validation
      response.data.forEach((question, index) => {
        if (!question.id || !question.type || !question.title) {
          throw new ValidationError(`Invalid question structure at index ${index}: missing required fields`);
        }
        
        // Validate question type
        const validTypes = ['text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'file', 'rating', 'date'];
        if (!validTypes.includes(question.type)) {
          console.warn(`⚠️ Unknown question type: ${question.type} for question ${question.id}`);
        }
        
        // Validate required fields for specific question types
        if (question.type === 'select' || question.type === 'multiselect' || question.type === 'radio' || question.type === 'checkbox') {
          if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
            throw new ValidationError(`Question ${question.id} requires options for type ${question.type}`);
          }
        }
      });

      console.log(`✅ Successfully loaded ${response.data.length} ${assessmentType} questions`);
      return response.data;
      
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`Failed to load ${assessmentType} questions. Please try again.`);
    }
  }

  /**
   * Enhanced response saving with optimistic updates
   */
  async saveResponse(request: SaveRequest): Promise<ApiResponse> {
    try {
      console.log(`💾 Saving ${request.assessmentType} assessment response...`);
      
      // Enhanced validation
      if (!request.assessmentType || !request.companyId) {
        throw new ValidationError('Assessment type and company ID are required');
      }

      if (request.assessmentType === 'Employee' && !request.employeeId) {
        throw new ValidationError('Employee ID is required for employee assessments');
      }

      // Validate responses object
      if (!request.responses || typeof request.responses !== 'object') {
        throw new ValidationError('Responses must be a valid object');
      }

      // Add metadata to request
      const enhancedRequest = {
        ...request,
        metadata: {
          timestamp: new Date().toISOString(),
          appVersion: config.getConfig().appVersion,
          environment: config.getConfig().environment,
          userAgent: navigator.userAgent,
          responseCount: Object.keys(request.responses).length
        }
      };

      const response = await this.api.post<ApiResponse>('/responses', enhancedRequest);
      
      console.log(`✅ Successfully saved ${request.assessmentType} assessment response`);
      return response.data;
      
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('Failed to save response. Please try again.');
    }
  }

  /**
   * Enhanced response retrieval with caching support
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

      console.log(`📖 Retrieving ${assessmentType} assessment response...`);
      
      const response = await this.api.get<AssessmentData>(url);
      
      console.log(`✅ Successfully retrieved ${assessmentType} assessment response`);
      return response.data;
      
    } catch (error) {
      if (error instanceof NetworkError && error.statusCode === 404) {
        console.log(`ℹ️ No existing ${assessmentType} response found`);
        return null; // No existing response found
      }
      
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError('Failed to load existing response.');
    }
  }

  /**
   * Enhanced file upload with progress tracking and validation
   */
  async uploadFile(
    companyId: string,
    questionId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUpload> {
    try {
      console.log(`📎 Uploading file: ${file.name} (${this.formatFileSize(file.size)})`);
      
      // Get file upload configuration
      const fileConfig = config.getFileUploadConfig();
      
      // Enhanced validation with configuration
      if (!companyId || !questionId || !file) {
        throw new ValidationError('Company ID, question ID, and file are required');
      }

      // Validate file size using configuration
      if (file.size > fileConfig.maxSize) {
        throw new FileUploadError(
          `File size must be less than ${config.getFormattedMaxFileSize()}`, 
          file.name
        );
      }

      // Validate file type using configuration
      if (!fileConfig.supportedTypes.includes(file.type)) {
        throw new FileUploadError(
          `File type not supported. Supported types: ${config.getFormattedSupportedFileTypes()}`, 
          file.name
        );
      }

      // Additional security checks
      const fileName = file.name.toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
      if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
        throw new FileUploadError('File type not allowed for security reasons', file.name);
      }

      // Convert file to base64
      const fileContent = await this.fileToBase64(file);

      const uploadData = {
        companyId,
        questionId,
        fileName: file.name,
        fileContent,
        contentType: file.type,
        metadata: {
          originalSize: file.size,
          lastModified: new Date(file.lastModified).toISOString(),
          uploadTimestamp: new Date().toISOString()
        }
      };

      const response = await this.api.post<{
        message: string;
        fileKey: string;
        downloadUrl: string;
        fileName: string;
      }>('/files', uploadData, {
        timeout: 900000, // 15 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      console.log(`✅ Successfully uploaded file: ${file.name}`);

      return {
        fileName: response.data.fileName,
        fileKey: response.data.fileKey,
        downloadUrl: response.data.downloadUrl,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        contentType: file.type
      };
      
    } catch (error) {
      console.error(`❌ File upload failed for ${file.name}:`, error);
      
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
   * Enhanced file to base64 conversion with error handling
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as string;
          if (!result || !result.includes(',')) {
            throw new Error('Invalid file data');
          }
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        } catch (error) {
          reject(new Error('Failed to process file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Enhanced API health check with detailed diagnostics
   */
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      console.log('🏥 Checking API health...');
      
      const startTime = Date.now();
      const response = await this.api.get('/health', { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      const isHealthy = response.status === 200;
      
      const details = {
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        baseUrl: this.baseURL,
        version: response.data?.version,
        environment: response.data?.environment
      };
      
      if (isHealthy) {
        console.log(`✅ API health check passed (${responseTime}ms)`);
      } else {
        console.warn(`⚠️ API health check returned status ${response.status}`);
      }
      
      return { healthy: isHealthy, details };
      
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return { 
        healthy: false, 
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          baseUrl: this.baseURL
        }
      };
    }
  }

  /**
   * Get comprehensive API information
   */
  getApiInfo() {
    return {
      baseURL: this.baseURL,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      endpoints: this.config.endpoints,
      environment: config.getConfig().environment,
      version: config.getConfig().appVersion,
      region: config.getAwsConfig().region
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfiguration() {
    this.config = config.getApiConfig();
    this.api.defaults.timeout = this.config.timeout;
    console.log('🔄 API configuration updated');
  }
}

// Singleton instance with enhanced management
let apiServiceInstance: ApiService | null = null;

/**
 * Initialize API service with dynamic configuration
 */
export const initializeApiService = (baseURL?: string): ApiService => {
  const configuredBaseURL = baseURL || config.getApiConfig().baseUrl;
  
  if (!configuredBaseURL) {
    throw new Error('API base URL not configured. Please check your environment configuration.');
  }
  
  apiServiceInstance = new ApiService(configuredBaseURL);
  
  console.log('🔗 API Service initialized:', {
    baseURL: configuredBaseURL,
    environment: config.getConfig().environment,
    timeout: config.getApiConfig().timeout
  });
  
  return apiServiceInstance;
};

/**
 * Get API service instance with validation
 */
export const getApiService = (): ApiService => {
  if (!apiServiceInstance) {
    // Try to auto-initialize with configuration
    try {
      return initializeApiService();
    } catch (error) {
      throw new Error('API service not initialized and auto-initialization failed. Please call initializeApiService first.');
    }
  }
  return apiServiceInstance;
};

/**
 * Enhanced API response handler with retry logic
 */
export const handleApiResponse = async <T>(
  apiCall: () => Promise<T>,
  options: {
    errorMessage?: string;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> => {
  const {
    errorMessage = 'An error occurred',
    retries = config.getApiConfig().maxRetries,
    retryDelay = 1000
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation errors or client errors
      if (error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof NetworkError && error.statusCode && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt === retries) {
        break;
      }
      
      console.log(`🔄 Retrying API call (${attempt}/${retries}) in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  console.error(`❌ API call failed after ${retries} attempts`);
  throw lastError!;
};

/**
 * Retry wrapper with exponential backoff
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = config.getApiConfig().maxRetries,
  baseDelay: number = 1000
): Promise<T> => {
  return handleApiResponse(apiCall, {
    retries: maxRetries,
    retryDelay: baseDelay
  });
};

export default ApiService;