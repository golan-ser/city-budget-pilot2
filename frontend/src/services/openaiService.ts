import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface OpenAIStatus {
  available: boolean;
  status: string;
  message?: string;
}

export interface SmartQueryRequest {
  query: string;
  context?: string;
}

export interface SmartQueryResponse {
  answer: string;
  data?: any[];
  metadata?: any;
}

export const OpenAIService = {
  /**
   * Check OpenAI service status
   */
  async checkStatus(): Promise<any> {
    const response = await api.get(API_ENDPOINTS.OPENAI_STATUS);
    
    if (!response.ok) {
      throw new Error('Failed to check OpenAI status');
    }
    
    return response.json();
  },

  /**
   * Execute smart query
   */
  async executeSmartQuery(request: SmartQueryRequest): Promise<SmartQueryResponse> {
    const response = await api.post(API_ENDPOINTS.SMART_QUERY, request);
    
    if (!response.ok) {
      throw new Error('Failed to execute smart query');
    }
    
    return response.json();
  }
}; 