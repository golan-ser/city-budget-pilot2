/**
 * Enhanced Error Handling Utilities v2.2
 * מערכת טיפול שגיאות מתקדמת
 */
import React from 'react';

export interface ApiError {
  status: 'error' | 'success';
  message: string;
  data?: any;
  code?: number;
}

export interface SafeFilterOptions<T> {
  fallback?: T[];
  logErrors?: boolean;
  validator?: (item: T) => boolean;
}

export class ErrorHandler {
  /**
   * Safe filter function that prevents "o is not a function" errors
   * פונקציה בטוחה לסינון שמונעת שגיאת "o is not a function"
   */
  static safeFilter<T>(
    data: any, 
    filterFn: (item: T) => boolean, 
    options: SafeFilterOptions<T> = {}
  ): T[] {
    const { fallback = [], logErrors = true, validator } = options;

    try {
      // Step 1: Validate input data
      if (!data) {
        if (logErrors) console.warn('🚨 SafeFilter: Data is null/undefined');
        return fallback;
      }

      // Step 2: Ensure data is array
      if (!Array.isArray(data)) {
        if (logErrors) console.warn('🚨 SafeFilter: Data is not an array:', typeof data);
        return fallback;
      }

      // Step 3: Validate filter function
      if (typeof filterFn !== 'function') {
        if (logErrors) console.error('🚨 SafeFilter: Filter function is not a function:', typeof filterFn);
        return fallback;
      }

      // Step 4: Additional validation if provided
      if (validator && typeof validator !== 'function') {
        if (logErrors) console.warn('🚨 SafeFilter: Validator is not a function');
        return fallback;
      }

      // Step 5: Safe filtering with error handling
      const result = data.filter((item: T, index: number) => {
        try {
          // Additional validation per item if provided
          if (validator && !validator(item)) {
            if (logErrors) console.warn(`🚨 SafeFilter: Item at index ${index} failed validation:`, item);
            return false;
          }

          // Apply the filter function
          return filterFn(item);
        } catch (error) {
          if (logErrors) {
            console.error(`🚨 SafeFilter: Error filtering item at index ${index}:`, error);
            console.error('Item data:', item);
          }
          return false; // Skip problematic items
        }
      });

      if (logErrors && result.length !== data.length) {
        console.log(`📊 SafeFilter: Filtered ${data.length} items to ${result.length} items`);
      }

      return result;

    } catch (error) {
      if (logErrors) {
        console.error('🚨 SafeFilter: Critical error in filtering process:', error);
        console.error('Original data:', data);
        console.error('Filter function:', filterFn.toString());
      }
      return fallback;
    }
  }

  /**
   * Safe array map function
   * פונקציה בטוחה למיפוי מערכים
   */
  static safeMap<T, R>(
    data: any,
    mapFn: (item: T, index: number) => R,
    fallback: R[] = []
  ): R[] {
    try {
      if (!Array.isArray(data)) return fallback;
      if (typeof mapFn !== 'function') return fallback;

      return data.map((item, index) => {
        try {
          return mapFn(item, index);
        } catch (error) {
          console.error(`🚨 SafeMap: Error mapping item at index ${index}:`, error);
          return null as any; // Return null for failed mappings
        }
      }).filter(item => item !== null);

    } catch (error) {
      console.error('🚨 SafeMap: Critical error:', error);
      return fallback;
    }
  }

  /**
   * Handle API errors with enhanced logging
   * טיפול בשגיאות API עם לוגים מתקדמים
   */
  static handleApiError(error: any, context: string = 'API'): ApiError {
    const timestamp = new Date().toISOString();
    
    console.group(`🚨 ${context} Error - ${timestamp}`);
    
    if (error.message?.includes('Failed to fetch')) {
      console.error('🌐 Network/CORS Error:', error.message);
      console.error('📋 Likely causes:');
      console.error('   - CORS policy blocking request');
      console.error('   - Network connectivity issue');
      console.error('   - Server is down');
      console.error('   - Wrong API URL');
      
      console.groupEnd();
      return {
        status: 'error',
        message: 'Failed to connect to API - Network or CORS issue',
        code: 0
      };
    }

    if (error.name === 'TypeError' && error.message?.includes('not a function')) {
      console.error('🔧 JavaScript Type Error:', error.message);
      console.error('📋 Likely causes:');
      console.error('   - Undefined function being called');
      console.error('   - Wrong data type in filter/map operation');
      console.error('   - Missing import or export');
      console.error('Stack trace:', error.stack);
      
      console.groupEnd();
      return {
        status: 'error',
        message: 'JavaScript type error - Function not found',
        code: -1
      };
    }

    if (error.status) {
      console.error(`📡 HTTP Error ${error.status}:`, error.message);
      
      switch (error.status) {
        case 401:
          console.error('🔐 Authentication required or token expired');
          break;
        case 403:
          console.error('🚫 Access forbidden - insufficient permissions');
          break;
        case 404:
          console.error('🔍 Resource not found - check API endpoint');
          break;
        case 500:
          console.error('💥 Server error - check backend logs');
          break;
        default:
          console.error('❓ Unknown HTTP error');
      }
      
      console.groupEnd();
      return {
        status: 'error',
        message: `HTTP ${error.status}: ${error.message}`,
        code: error.status
      };
    }

    // Generic error handling
    console.error('❓ Unknown error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor?.name);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    console.groupEnd();
    
    return {
      status: 'error',
      message: error.message || 'Unknown error occurred',
      code: -999
    };
  }

  /**
   * Validate API response structure
   * אימות מבנה תגובת API
   */
  static validateApiResponse(response: any, expectedFields: string[] = []): boolean {
    try {
      if (!response) {
        console.warn('🚨 API Response is null/undefined');
        return false;
      }

      if (typeof response !== 'object') {
        console.warn('🚨 API Response is not an object:', typeof response);
        return false;
      }

      // Check for expected fields
      for (const field of expectedFields) {
        if (!(field in response)) {
          console.warn(`🚨 API Response missing field: ${field}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('🚨 Error validating API response:', error);
      return false;
    }
  }

  /**
   * Safe JSON parse with fallback
   * פירוק JSON בטוח עם fallback
   */
  static safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('🚨 Failed to parse JSON:', error);
      return fallback;
    }
  }

  /**
   * Retry mechanism for failed operations
   * מנגנון חזרה על פעולות שנכשלו
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ Operation succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        }
      }
    }

    console.error(`💥 All ${maxRetries} attempts failed`);
    throw lastError;
  }
}

/**
 * Global error boundary for React components
 */
export class ComponentErrorBoundary {
  static wrapComponent<P>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error }>
  ) {
    return (props: P) => {
      try {
        return React.createElement(Component, props);
      } catch (error) {
        console.error('❌ Component error:', error);
        
        if (fallback) {
          return React.createElement(fallback, { error: error as Error });
        }

        return React.createElement('div', {
          className: 'error-fallback p-4 border border-red-300 bg-red-50 rounded'
        }, 'שגיאה בטעינת הרכיב');
      }
    };
  }
}

/**
 * Safe permission checker
 */
export const safePermissionCheck = (
  permissions: any,
  pageId: string,
  action: string
): boolean => {
  try {
    if (!permissions || typeof permissions !== 'object') {
      return false;
    }

    const permission = permissions[pageId];
    if (!permission || typeof permission !== 'object') {
      return false;
    }

    return Boolean(permission[action]);
  } catch (error) {
    console.error('❌ safePermissionCheck error:', error);
    return false;
  }
};

// Export individual functions for convenience
export const {
  safeFilter,
  safeMap,
  handleApiError,
  validateApiResponse,
  safeJsonParse,
  withRetry
} = ErrorHandler;

export default ErrorHandler; 