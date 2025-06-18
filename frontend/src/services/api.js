/**
 * API Service for DMGT Assessment Platform
 * Handles all communication with AWS API Gateway and backend services
 */

class APIServiceClass {
  constructor() {
    this.config = null;
    this.requestId = 0;
  }

  /**
   * Initialize the API service with configuration
   */
  initialize(baseUrl) {
    this.config = {
      baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000 // 1 second
    };
    
    console.log('🔧 API Service initialized:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    if (!this.config) {
      throw new Error('API Service not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId() {
    return `req-${Date.now()}-${++this.requestId}`;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    const config = this.getConfig();
    const requestId = this.generateRequestId();
    const url = `${config.baseUrl}${endpoint}`;
    
    console.log(`🌐 [${requestId}] ${options.method || 'GET'} ${url}`);
    
    try {
      // Set default headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Timestamp': new Date().toISOString(),
        ...options.headers
      };

      // Create request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }

        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      
      console.log(`✅ [${requestId}] Request successful`);
      
      return {
        data,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ [${requestId}] Request failed:`, error);

      // Retry logic for network errors
      if (retryCount < config.retryAttempts && this.isRetryableError(error)) {
        console.log(`🔄 [${requestId}] Retrying request (${retryCount + 1}/${config.retryAttempts})...`);
        
        await this.delay(config.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    
    if (error.name === 'AbortError') {
      return true; // Timeout
    }
    
    return false;
  }

  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convert File to base64 string
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Remove data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file for upload
   */
  validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) {
      throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type '${file.type}' is not allowed. Please upload PDF, Word, Excel, text, image, or ZIP files.`);
    }
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get questions for assessment type
   */
  async getQuestions(type) {
    console.log(`📋 Fetching ${type} questions...`);
    
    const response = await this.makeRequest(`/questions/${type}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch questions');
    }

    // Validate response structure
    if (!response.data.questions || !Array.isArray(response.data.questions)) {
      throw new Error('Invalid questions format received from server');
    }

    console.log(`✅ Loaded ${response.data.questions.length} ${type} questions`);
    return response.data.questions;
  }

  /**
   * Save assessment response
   */
  async saveResponse(request) {
    console.log(`💾 Saving ${request.assessmentType} assessment response...`);
    
    const response = await this.makeRequest('/responses', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to save assessment response');
    }

    console.log('✅ Assessment response saved successfully');
  }

  /**
   * Get existing assessment response
   */
  async getResponse(type, companyId, employeeId) {
    console.log(`📂 Fetching existing ${type} assessment response...`);
    
    let endpoint = `/responses/${type}/${companyId}`;
    if (type === 'Employee' && employeeId) {
      endpoint += `/${employeeId}`;
    }

    const response = await this.makeRequest(endpoint);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch assessment response');
    }

    console.log('✅ Assessment response loaded successfully');
    return response.data;
  }

  /**
   * Upload multiple files for assessment question
   */
  async uploadFiles(companyId, questionId, files) {
    const uploadPromises = Array.from(files).map(file => 
      this.uploadFile({ companyId, questionId, file })
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Upload file for assessment question
   */
  async uploadFile(request) {
    console.log(`📎 Uploading file: ${request.file.name} (${Math.round(request.file.size / 1024)}KB)`);
    
    // Validate file
    this.validateFile(request.file);
    
    // Convert file to base64
    const fileContent = await this.fileToBase64(request.file);
    
    const uploadData = {
      companyId: request.companyId,
      questionId: request.questionId,
      fileName: request.file.name,
      fileContent: fileContent,
      contentType: request.file.type
    };

    const response = await this.makeRequest('/files', {
      method: 'POST',
      body: JSON.stringify(uploadData)
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to upload file');
    }

    console.log(`✅ File uploaded successfully: ${response.data.fileKey}`);
    return response.data;
  }

  /**
   * Health check to verify API connectivity
   */
  async healthCheck() {
    try {
      console.log('🏥 Performing API health check...');
      
      // Try to fetch company questions as a health check
      const response = await this.makeRequest('/questions/Company');
      
      if (response.success) {
        console.log('✅ API health check passed');
        return true;
      } else {
        console.warn('⚠️ API health check failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ API health check error:', error);
      return false;
    }
  }

  /**
   * Get API status information
   */
  getStatus() {
    return {
      initialized: this.config !== null,
      baseUrl: this.config?.baseUrl || null,
      config: this.config
    };
  }
}

// Export singleton instance
export const APIService = new APIServiceClass();

// Export the main service instance as apiService for compatibility
export const apiService = APIService;

// Export factory function that components expect
export const getApiService = () => APIService;

// Export response handler utility that components expect
export const handleApiResponse = async (apiCall, options = {}) => {
  try {
    return await apiCall();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : (options.errorMessage || 'An error occurred');
    console.error('API call failed:', errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Export for direct use
export default APIService;

// Utility function to initialize API service
export const initializeApiService = (baseUrl) => {
  APIService.initialize(baseUrl);
};
