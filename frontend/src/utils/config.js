// DMGT Assessment Form - Configuration Utilities
// Professional configuration management for enterprise deployment

/**
 * Get application configuration from environment variables
 */
export const getAppConfig = async () => {
  const config = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    awsRegion: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    environment: process.env.REACT_APP_ENVIRONMENT || 'dev',
    autoSaveInterval: parseInt(process.env.REACT_APP_AUTO_SAVE_INTERVAL || '30000', 10),
  };

  // Validate configuration
  validateConfig(config);

  return config;
};

/**
 * Validate application configuration
 */
const validateConfig = (config) => {
  if (!config.apiUrl) {
    throw new Error('API URL is required');
  }

  if (!config.awsRegion) {
    throw new Error('AWS Region is required');
  }

  if (!['dev', 'prod'].includes(config.environment)) {
    throw new Error('Environment must be either "dev" or "prod"');
  }

  if (config.autoSaveInterval < 5000) {
    console.warn('Auto-save interval is very short, this may impact performance');
  }

  // Validate API URL format
  try {
    new URL(config.apiUrl);
  } catch (error) {
    throw new Error('Invalid API URL format');
  }
};

/**
 * Get environment-specific settings
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    enableDebugLogging: isDevelopment || process.env.REACT_APP_DEBUG === 'true',
    enablePerformanceTracking: isProduction,
    enableErrorTracking: isProduction,
    apiTimeout: isDevelopment ? 60000 : 30000, // 60s for dev, 30s for prod
  };
};

/**
 * Feature flags for controlling application behavior
 */
export const getFeatureFlags = () => {
  return {
    enableFileUpload: process.env.REACT_APP_ENABLE_FILE_UPLOAD !== 'false',
    enableAutoSave: process.env.REACT_APP_ENABLE_AUTO_SAVE !== 'false',
    enableOfflineMode: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    maxFileUploadSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760', 10), // 10MB
    enableProgressTracking: process.env.REACT_APP_ENABLE_PROGRESS_TRACKING !== 'false',
  };
};

/**
 * Application constants that can be overridden by environment variables
 */
export const getAppConstants = () => {
  const featureFlags = getFeatureFlags();
  
  return {
    AUTO_SAVE_INTERVAL: parseInt(process.env.REACT_APP_AUTO_SAVE_INTERVAL || '30000', 10),
    FILE_UPLOAD_MAX_SIZE: featureFlags.maxFileUploadSize,
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
    LAST_SAVE_STORAGE_KEY: 'dmgt_assessment_last_save',
    SESSION_STORAGE_KEY: 'dmgt_assessment_session',
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  };
};

/**
 * Get storage configuration
 */
export const getStorageConfig = () => {
  return {
    useSessionStorage: process.env.REACT_APP_USE_SESSION_STORAGE === 'true',
    storagePrefix: process.env.REACT_APP_STORAGE_PREFIX || 'dmgt_',
    enableStorageEncryption: process.env.REACT_APP_ENABLE_STORAGE_ENCRYPTION === 'true',
    maxStorageSize: parseInt(process.env.REACT_APP_MAX_STORAGE_SIZE || '5242880', 10), // 5MB
  };
};

/**
 * Get API configuration
 */
export const getApiConfig = () => {
  const environment = getEnvironmentConfig();
  
  return {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: environment.apiTimeout,
    retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY || '1000', 10),
    enableRequestLogging: environment.enableDebugLogging,
    enableResponseLogging: environment.enableDebugLogging,
  };
};

/**
 * Validate browser compatibility
 */
export const checkBrowserCompatibility = () => {
  const requiredFeatures = [
    'localStorage' in window,
    'sessionStorage' in window,
    'fetch' in window,
    'Promise' in window,
    'FileReader' in window,
    'FormData' in window,
  ];

  const isCompatible = requiredFeatures.every(feature => feature);

  if (!isCompatible) {
    console.warn('Browser compatibility check failed. Some features may not work properly.');
  }

  return isCompatible;
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  
  return {
    userAgent,
    isChrome: /Chrome/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: /Edg/.test(userAgent),
    isMobile: /Mobi|Android/i.test(userAgent),
    isTablet: /iPad|Android(?!.*Mobi)/i.test(userAgent),
    supportsWebP: () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    },
  };
};

/**
 * Performance monitoring configuration
 */
export const getPerformanceConfig = () => {
  const environment = getEnvironmentConfig();
  
  return {
    enablePerformanceMarks: environment.enablePerformanceTracking,
    enableResourceTiming: environment.enablePerformanceTracking,
    enableUserTiming: environment.enablePerformanceTracking,
    performanceBufferSize: 150,
    trackNavigationTiming: true,
    trackResourceTiming: true,
    trackUserInteractions: environment.enablePerformanceTracking,
  };
};

/**
 * Error tracking configuration
 */
export const getErrorConfig = () => {
  const environment = getEnvironmentConfig();
  
  return {
    enableErrorBoundary: true,
    enableGlobalErrorHandler: true,
    enableUnhandledRejectionHandler: true,
    enableConsoleErrorCapture: environment.enableErrorTracking,
    maxErrorLogSize: 100,
    enableErrorReporting: environment.enableErrorTracking,
    errorReportingEndpoint: process.env.REACT_APP_ERROR_REPORTING_URL,
  };
};

/**
 * Analytics configuration
 */
export const getAnalyticsConfig = () => {
  const featureFlags = getFeatureFlags();
  
  return {
    enableAnalytics: featureFlags.enableAnalytics,
    trackPageViews: featureFlags.enableAnalytics,
    trackUserInteractions: featureFlags.enableAnalytics,
    trackFormProgress: featureFlags.enableAnalytics,
    trackFileUploads: featureFlags.enableAnalytics,
    analyticsId: process.env.REACT_APP_ANALYTICS_ID,
    enableDebugMode: process.env.NODE_ENV === 'development',
  };
};

/**
 * Export all configuration functions
 */
export const config = {
  getAppConfig,
  getEnvironmentConfig,
  getFeatureFlags,
  getAppConstants,
  getStorageConfig,
  getApiConfig,
  checkBrowserCompatibility,
  getBrowserInfo,
  getPerformanceConfig,
  getErrorConfig,
  getAnalyticsConfig,
};

export default config;
