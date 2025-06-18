// DMGT Assessment Form - Utility Functions
// Professional utility functions for enterprise-grade application

/**
 * Form validation utilities
 */
export const validateResponse = (question, value) => {
  // Check if required field is empty
  if (question.required && (value === undefined || value === '' || value === null ||
      (Array.isArray(value) && value.length === 0))) {
    return { isValid: false, error: 'This field is required' };
  }

  // If value is empty and not required, it's valid
  if (!question.required && (value === undefined || value === '' || value === null)) {
    return { isValid: true };
  }

  // Validate based on question type and validation rules
  if (question.validation && value !== undefined && value !== '') {
    const validation = question.validation;

    // String validation
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
    if (question.type === 'number' && (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value))))) {
      const numValue = Number(value);
      if (validation.min !== undefined && numValue < validation.min) {
        return { isValid: false, error: `Minimum value is ${validation.min}` };
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return { isValid: false, error: `Maximum value is ${validation.max}` };
      }
    }

    // Email validation
    if (question.type === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
    }

    // URL validation
    if (question.type === 'url' && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        return { isValid: false, error: 'Please enter a valid URL' };
      }
    }

    // File validation
    if (question.type === 'file' && question.validation.fileTypes && Array.isArray(value)) {
      for (const file of value) {
        if (file.contentType && !question.validation.fileTypes.includes(file.contentType)) {
          return { isValid: false, error: 'File type not supported' };
        }
        if (question.validation.maxFileSize && file.fileSize > question.validation.maxFileSize * 1024 * 1024) {
          return { isValid: false, error: `File size must be less than ${question.validation.maxFileSize}MB` };
        }
      }
    }
  }

  return { isValid: true };
};

/**
 * Calculate form progress
 */
export const calculateProgress = (responses, questions) => {
  const completedQuestions = Object.keys(responses).filter(questionId => {
    const value = responses[questionId];
    return value !== undefined && value !== '' && value !== null &&
           !(Array.isArray(value) && value.length === 0);
  });

  const totalQuestions = questions.length;
  const percentComplete = totalQuestions > 0 ? Math.round((completedQuestions.length / totalQuestions) * 100) : 0;

  // Calculate section progress
  const sections = [...new Set(questions.map(q => q.section).filter(Boolean))];
  const currentSection = Math.min(
    Math.floor((completedQuestions.length / totalQuestions) * Math.max(sections.length, 1)),
    Math.max(sections.length - 1, 0)
  );

  return {
    currentSection,
    totalSections: Math.max(sections.length, 1),
    completedQuestions,
    totalQuestions,
    percentComplete
  };
};

/**
 * File handling utilities
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (contentType) => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
  if (contentType.includes('text')) return '📃';
  if (contentType.includes('csv')) return '📋';
  return '📎';
};

export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file, maxSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Performance utilities
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = (func, wait) => {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
};

/**
 * Date and time utilities
 */
export const formatDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeAgo = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return formatDate(d);
};

/**
 * String utilities
 */
export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelToTitle = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Array utilities
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const unique = (array) => {
  return [...new Set(array)];
};

export const sortBy = (array, key) => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
};

/**
 * Object utilities
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

export const isEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !isEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
};

/**
 * Local storage utilities with error handling
 */
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * Session storage utilities with error handling
 */
export const safeSessionStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to get item from sessionStorage:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Failed to set item in sessionStorage:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove item from sessionStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
      return false;
    }
  }
};

/**
 * URL utilities
 */
export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

export const setQueryParams = (params) => {
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  
  window.history.replaceState({}, '', url.toString());
};

/**
 * Random utilities
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const randomColor = () => {
  const colors = [
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D92', '#FF3B30',
    '#FF9500', '#FFCC02', '#34C759', '#00C7BE', '#007AFF'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Animation utilities
 */
export const easeInOutQuart = (t) => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
};

export const animateValue = (
  start,
  end,
  duration,
  callback,
  easing = easeInOutQuart
) => {
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = start + (end - start) * easedProgress;
    
    callback(currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Accessibility utilities
 */
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Export all utilities as default object
export default {
  validateResponse,
  calculateProgress,
  formatFileSize,
  getFileIcon,
  isValidFileType,
  isValidFileSize,
  debounce,
  throttle,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  capitalizeFirst,
  camelToTitle,
  slugify,
  truncateText,
  groupBy,
  unique,
  sortBy,
  deepClone,
  isEqual,
  safeLocalStorage,
  safeSessionStorage,
  getQueryParams,
  setQueryParams,
  generateId,
  randomColor,
  easeInOutQuart,
  animateValue,
  announceToScreenReader,
  trapFocus
};
