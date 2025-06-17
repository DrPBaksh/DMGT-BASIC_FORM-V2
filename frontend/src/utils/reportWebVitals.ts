import { ReportHandler } from 'web-vitals';

/**
 * Report web vitals to the console or analytics service
 * This function reports Core Web Vitals and other performance metrics
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // Silently fail if web-vitals is not available
      console.warn('Web vitals library not available');
    });
  }
};

export default reportWebVitals;

/**
 * Enhanced web vitals reporting with custom metrics
 */
export const reportWebVitalsWithCustomMetrics = (onPerfEntry?: ReportHandler) => {
  // Report standard web vitals
  reportWebVitals(onPerfEntry);
  
  // Report custom performance metrics
  if (typeof onPerfEntry === 'function') {
    // Report navigation timing
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0] as PerformanceNavigationTiming;
        
        // Custom metrics
        const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
        const loadComplete = entry.loadEventEnd - entry.loadEventStart;
        const totalPageLoad = entry.loadEventEnd - entry.fetchStart;
        
        onPerfEntry({
          name: 'custom-dom-content-loaded',
          value: domContentLoaded,
          id: 'dom-content-loaded',
          delta: domContentLoaded,
          entries: [entry],
          navigationType: 'navigate'
        } as any);
        
        onPerfEntry({
          name: 'custom-load-complete',
          value: loadComplete,
          id: 'load-complete',
          delta: loadComplete,
          entries: [entry],
          navigationType: 'navigate'
        } as any);
        
        onPerfEntry({
          name: 'custom-total-page-load',
          value: totalPageLoad,
          id: 'total-page-load',
          delta: totalPageLoad,
          entries: [entry],
          navigationType: 'navigate'
        } as any);
      }
    }
    
    // Report memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      onPerfEntry({
        name: 'custom-memory-usage',
        value: memory.usedJSHeapSize,
        id: 'memory-usage',
        delta: 0,
        entries: [],
        navigationType: 'navigate'
      } as any);
    }
  }
};

/**
 * Send web vitals to analytics service
 */
export const sendToAnalytics = (metric: any) => {
  // Example: Send to Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // Example: Send to custom analytics endpoint
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail if analytics endpoint is not available
      console.warn('Failed to send analytics data');
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${metric.name}`, metric);
  }
};
