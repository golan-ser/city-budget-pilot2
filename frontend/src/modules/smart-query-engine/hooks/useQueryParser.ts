import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../lib/apiConfig';

/**
 * Two-Stage Architecture Frontend Hook
 * Stage 1: Natural Language → Structured Intent (via API)
 * Stage 2: Structured Intent → SQL Execution (via API)
 * 
 * This hook manages the complete two-stage process with proper error handling,
 * confidence thresholds, and user confirmation for low-confidence queries.
 */

// ===== TYPESCRIPT INTERFACES =====

export interface ParsedIntent {
  intent: string;
  domain: string;
  action: 'list' | 'count' | 'sum' | 'average' | 'group';
  filters: Record<string, any>;
  fields?: string[];
  confidence: number;
  explanation: string;
  source: 'openai' | 'rules';
}

export interface QueryResult {
  success: boolean;
  columns: Array<{
    key: string;
    label: string;
    type: string;
  }>;
  rows: Record<string, any>[];
  summary: {
    totalRows: number;
    message: string;
    intent: string;
    domain: string;
    action: string;
    filters?: Record<string, any>;
  };
  metadata: {
    executedAt: string;
    querySource: string;
    confidence: number;
  };
}

export interface ProcessQueryResponse {
  success: boolean;
  stage: 'parsing' | 'complete';
  processingTime?: string;
  
  // Stage 1 output
  parsedIntent?: ParsedIntent;
  
  // Stage 2 output (only if stage === 'complete')
  queryResult?: QueryResult;
  
  // Low confidence handling
  lowConfidence?: boolean;
  message?: string;
  suggestedAction?: 'confirm_or_refine';
  
  // Error handling
  error?: string;
  originalQuery?: string;
  timestamp?: string;
}

export interface QueryOptions {
  minConfidence?: number;
  timeout?: number;
}

export interface QueryParserState {
  // Processing state
  isLoading: boolean;
  isProcessing: boolean;
  
  // Current query
  currentQuery: string;
  
  // Stage 1 results
  parsedIntent: ParsedIntent | null;
  
  // Stage 2 results
  queryResult: QueryResult | null;
  
  // UI state
  showConfirmation: boolean;
  lowConfidenceMessage: string;
  
  // Error handling
  error: string | null;
  
  // Metadata
  processingTime: string | null;
  lastUpdated: string | null;
}

// ===== MAIN HOOK =====

export const useQueryParser = () => {
  const [state, setState] = useState<QueryParserState>({
    isLoading: false,
    isProcessing: false,
    currentQuery: '',
    parsedIntent: null,
    queryResult: null,
    showConfirmation: false,
    lowConfidenceMessage: '',
    error: null,
    processingTime: null,
    lastUpdated: null
  });

  // ===== API FUNCTIONS =====

  /**
   * Process natural language query using two-stage architecture
   */
  const processQuery = useCallback(async (
    query: string, 
    options: QueryOptions = {}
  ): Promise<ProcessQueryResponse> => {
    console.log('🚀 Starting two-stage query processing:', query);
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isProcessing: true,
      currentQuery: query,
      error: null,
      showConfirmation: false,
      parsedIntent: null,
      queryResult: null
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'DEMO_SECURE_TOKEN_2024'}`,
        },
        body: JSON.stringify({
          query,
          options: {
            minConfidence: options.minConfidence || 0.3,
            timeout: options.timeout || 30000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ProcessQueryResponse = await response.json();
      console.log('✅ API Response:', result);

      // Handle low confidence case
      if (result.lowConfidence && result.parsedIntent) {
        console.log('⚠️ Low confidence detected, showing confirmation');
        setState(prev => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          parsedIntent: result.parsedIntent!,
          showConfirmation: true,
          lowConfidenceMessage: result.message || 'זוהה בביטחון נמוך',
          processingTime: result.processingTime || null,
          lastUpdated: new Date().toISOString()
        }));
        
        return result;
      }

      // Handle complete processing
      if (result.stage === 'complete' && result.queryResult) {
        console.log('✅ Complete processing successful');
        setState(prev => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          parsedIntent: result.parsedIntent!,
          queryResult: result.queryResult!,
          processingTime: result.processingTime || null,
          lastUpdated: new Date().toISOString()
        }));
        
        return result;
      }

      // Handle unexpected response
      throw new Error('Unexpected API response format');

    } catch (error) {
      console.error('❌ Query processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isProcessing: false,
        error: errorMessage,
        lastUpdated: new Date().toISOString()
      }));

      return {
        success: false,
        stage: 'parsing',
        error: errorMessage,
        originalQuery: query
      };
    }
  }, []);

  /**
   * Confirm and execute low-confidence query
   */
  const confirmQuery = useCallback(async (): Promise<QueryResult | null> => {
    if (!state.parsedIntent) {
      console.warn('No parsed intent to confirm');
      return null;
    }

    console.log('✅ Confirming low-confidence query');
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isProcessing: true,
      showConfirmation: false,
      error: null
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'DEMO_SECURE_TOKEN_2024'}`,
        },
        body: JSON.stringify({
          parsedIntent: state.parsedIntent,
          originalQuery: state.currentQuery
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Confirmation successful:', result);

      if (result.success && result.queryResult) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          queryResult: result.queryResult,
          lastUpdated: new Date().toISOString()
        }));
        
        return result.queryResult;
      }

      throw new Error(result.error || 'Confirmation failed');

    } catch (error) {
      console.error('❌ Confirmation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'שגיאה באישור השאילתה';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isProcessing: false,
        error: errorMessage,
        lastUpdated: new Date().toISOString()
      }));

      return null;
    }
  }, [state.parsedIntent, state.currentQuery]);

  /**
   * Reject low-confidence query and allow user to refine
   */
  const rejectQuery = useCallback(() => {
    console.log('❌ User rejected low-confidence query');
    
    setState(prev => ({
      ...prev,
      showConfirmation: false,
      parsedIntent: null,
      lowConfidenceMessage: '',
      error: 'השאילתה נדחתה. נסה לנסח מחדש באופן ברור יותר.'
    }));
  }, []);

  /**
   * Clear all state and start fresh
   */
  const clearResults = useCallback(() => {
    console.log('🧹 Clearing query results');
    
    setState({
      isLoading: false,
      isProcessing: false,
      currentQuery: '',
      parsedIntent: null,
      queryResult: null,
      showConfirmation: false,
      lowConfidenceMessage: '',
      error: null,
      processingTime: null,
      lastUpdated: null
    });
  }, []);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Get system status and capabilities
   */
  const getSystemStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get system status:', error);
      return null;
    }
  }, []);

  /**
   * Get available domains
   */
  const getDomains = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/domains`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get domains:', error);
      return null;
    }
  }, []);

  /**
   * Get example queries
   */
  const getExamples = useCallback(async (domain?: string) => {
    try {
      const url = domain 
        ? `${API_BASE_URL}/api/smart-query/examples?domain=${domain}`
        : `${API_BASE_URL}/api/smart-query/examples`;
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get examples:', error);
      return null;
    }
  }, []);

  /**
   * Validate query before processing
   */
  const validateQuery = useCallback(async (query: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'DEMO_SECURE_TOKEN_2024'}`,
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to validate query:', error);
      return null;
    }
  }, []);

  // ===== COMPUTED VALUES =====

  const hasResults = state.queryResult !== null;
  const hasError = state.error !== null;
  const needsConfirmation = state.showConfirmation;
  const isReady = !state.isLoading && !state.isProcessing;

  // ===== RETURN HOOK INTERFACE =====

  return {
    // State
    ...state,
    
    // Computed values
    hasResults,
    hasError,
    needsConfirmation,
    isReady,
    
    // Main functions
    processQuery,
    confirmQuery,
    rejectQuery,
    clearResults,
    
    // Utility functions
    getSystemStatus,
    getDomains,
    getExamples,
    validateQuery
  };
};

// ===== HELPER HOOKS =====

/**
 * Hook for getting system information
 */
export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSystemInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [status, domains, examples] = await Promise.all([
        fetch(`${API_BASE_URL}/api/smart-query/status`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/smart-query/domains`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/smart-query/examples`).then(r => r.json())
      ]);

      setSystemInfo({ status, domains, examples });
    } catch (error) {
      console.error('❌ Failed to fetch system info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    systemInfo,
    isLoading,
    fetchSystemInfo
  };
};

/**
 * Hook for health monitoring
 */
export const useHealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-query/health`);
      const healthData = await response.json();
      setHealth(healthData);
      setLastCheck(new Date().toISOString());
      return healthData;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setHealth({ success: false, status: 'unhealthy', error: error.message });
      return null;
    }
  }, []);

  return {
    health,
    lastCheck,
    checkHealth
  };
};

/**
 * Generate query suggestions based on input
 */
export const generateSuggestions = (query: string, schema: any): string[] => {
  if (!query || query.length < 2) return [];

  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();

  // Basic Hebrew suggestions
  const basicSuggestions = [
    'דוח חשבוניות',
    'תב״רים של חינוך',
    'כמה פרויקטים פעילים יש',
    'חשבוניות שלא שולמו',
    'תשלומים שלא דווחו',
    'פרויקטים של הנדסה',
    'סעיפי תקציב של חינוך',
    'תקציב מבוצע',
    'ספק חברת הבנייה המובילה',
    'כל הנתונים של תב״ר 2211'
  ];

  // Filter suggestions based on query
  for (const suggestion of basicSuggestions) {
    if (suggestion.includes(query) || query.split(' ').some(word => suggestion.includes(word))) {
      suggestions.push(suggestion);
    }
  }

  // Add domain-specific suggestions
  if (queryLower.includes('חשבונית') || queryLower.includes('תשלום')) {
    suggestions.push(
      'חשבוניות מתב״ר 2211',
      'חשבוניות מעל 10,000 שקל',
      'תשלומים של השנה'
    );
  }

  if (queryLower.includes('תב״ר') || queryLower.includes('פרויקט')) {
    suggestions.push(
      'תב״רים פעילים',
      'פרויקטים של חינוך',
      'תב״ר 2211'
    );
  }

  if (queryLower.includes('תקציב')) {
    suggestions.push(
      'תקציב מאושר',
      'ניצול תקציב',
      'סעיפי תקציב פעילים'
    );
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
};

export default useQueryParser; 