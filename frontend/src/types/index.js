/**
 * Type Definitions for DMGT Assessment Platform
 * Basic type definitions for JavaScript development
 */

// ===== QUESTION TYPES =====

/**
 * @typedef {Object} QuestionValidation
 * @property {boolean} [required]
 * @property {number} [minLength]
 * @property {number} [maxLength]
 * @property {number} [min]
 * @property {number} [max]
 * @property {string} [pattern]
 * @property {string[]} [fileTypes]
 * @property {number} [maxFileSize]
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {'text'|'textarea'|'select'|'multiselect'|'file'|'rating'|'boolean'|'number'|'email'|'radio'|'checkbox'|'scale'} type
 * @property {string[]} [options]
 * @property {boolean} [required]
 * @property {string} [category]
 * @property {string} [section]
 * @property {string} [placeholder]
 * @property {QuestionValidation} [validation]
 * @property {string} [dependsOn]
 * @property {any} [showIf]
 * @property {number} [rows]
 * @property {string} [accept]
 * @property {boolean} [multiple]
 * @property {number} [maxSize]
 */

/**
 * @typedef {Object} QuestionSet
 * @property {string} title
 * @property {string} description
 * @property {Question[]} questions
 * @property {string} version
 * @property {string} lastUpdated
 */

// ===== RESPONSE TYPES =====

/**
 * @typedef {Object} FileData
 * @property {string} fileName
 * @property {string} fileKey
 * @property {string} [downloadUrl]
 * @property {number} [fileSize]
 * @property {string} [contentType]
 */

/**
 * @typedef {Object} FormResponse
 * @property {string} questionId
 * @property {string|string[]|number|boolean|FileData[]} value
 * @property {string} timestamp
 * @property {FileData} [fileData]
 */

/**
 * @typedef {Object} AssessmentData
 * @property {'Company'|'Employee'} assessmentType
 * @property {string} companyId
 * @property {string} [employeeId]
 * @property {Object.<string, any>} responses
 * @property {Object} [metadata]
 * @property {string} [metadata.startedAt]
 * @property {string} [metadata.lastUpdated]
 * @property {string} [metadata.completedAt]
 * @property {number} [metadata.progress]
 * @property {'draft'|'in-progress'|'completed'|'submitted'} [metadata.status]
 */

// ===== VALIDATION TYPES =====

/**
 * @typedef {Object} ValidationError
 * @property {string} field
 * @property {string} message
 * @property {string} [code]
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {ValidationError[]} errors
 */

// ===== UI STATE TYPES =====

/**
 * @typedef {Object} LoadingState
 * @property {boolean} questions
 * @property {boolean} saving
 * @property {boolean} uploading
 * @property {boolean} submitting
 */

/**
 * @typedef {Object} ErrorState
 * @property {string|null} questions
 * @property {string|null} saving
 * @property {string|null} uploading
 * @property {string|null} submitting
 * @property {string|null} general
 */

/**
 * @typedef {Object} ProgressInfo
 * @property {number} completed
 * @property {number} total
 * @property {number} percentage
 */

// ===== ASSESSMENT CONTEXT TYPES =====

/**
 * @typedef {Object} AssessmentResponse
 * @property {string} questionId
 * @property {string|string[]|number|boolean} value
 * @property {FileData} [fileData]
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Assessment
 * @property {string} id
 * @property {'Company'|'Employee'} type
 * @property {string} companyId
 * @property {string} [employeeId]
 * @property {AssessmentResponse[]} responses
 * @property {'draft'|'in-progress'|'completed'|'submitted'} status
 * @property {number} progress
 * @property {string} lastSaved
 * @property {Object} metadata
 * @property {string} metadata.startedAt
 * @property {string} [metadata.completedAt]
 * @property {string} metadata.version
 * @property {string} metadata.userAgent
 * @property {string} [metadata.ipAddress]
 */

/**
 * @typedef {Object} AppConfig
 * @property {string} apiUrl
 * @property {string} environment
 * @property {string} region
 * @property {string} cloudfrontUrl
 * @property {boolean} isDevelopment
 * @property {boolean} isProduction
 */

// ===== API TYPES =====

/**
 * @typedef {Object} ApiConfig
 * @property {string} baseUrl
 * @property {number} timeout
 * @property {number} retryAttempts
 * @property {number} retryDelay
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {T} [data]
 * @property {string} [error]
 * @property {boolean} success
 * @property {string} timestamp
 */

/**
 * @typedef {Object} SaveResponseRequest
 * @property {'Company'|'Employee'} assessmentType
 * @property {string} companyId
 * @property {string} [employeeId]
 * @property {Object.<string, any>} responses
 */

/**
 * @typedef {Object} FileUploadRequest
 * @property {string} companyId
 * @property {string} questionId
 * @property {File} file
 */

/**
 * @typedef {Object} FileUploadResponse
 * @property {string} message
 * @property {string} fileKey
 * @property {string} downloadUrl
 * @property {string} fileName
 * @property {number} fileSize
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

// ===== UTILITY FUNCTIONS =====

/**
 * @param {string} field
 * @param {string} message
 * @param {string} [code]
 * @returns {ValidationError}
 */
export const createValidationError = (field, message, code) => ({
  field,
  message,
  code,
});

/**
 * @param {number} completed
 * @param {number} total
 * @returns {ProgressInfo}
 */
export const createProgressInfo = (completed, total) => ({
  completed,
  total,
  percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
});

/**
 * @param {string} fileName
 * @param {string} fileKey
 * @param {string} [downloadUrl]
 * @returns {FileData}
 */
export const createFileData = (fileName, fileKey, downloadUrl) => ({
  fileName,
  fileKey,
  downloadUrl,
});
