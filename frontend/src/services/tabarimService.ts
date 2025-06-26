import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface Tabar {
  id: string;
  tabar_number: string;
  name: string;
  description?: string;
  status: string;
  budget: number;
  // Add more fields as needed
}

export interface TabarDocument {
  id: string;
  tabar_id: string;
  filename: string;
  upload_date: string;
  file_size: number;
  file_type: string;
}

export class TabarimService {
  /**
   * Fetch all tabarim
   */
  static async fetchAll(): Promise<Tabar[]> {
    const response = await api.get(API_ENDPOINTS.TABARIM);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabarim');
    }
    
    return response.json();
  }

  /**
   * Fetch tabar by ID
   */
  static async fetchById(id: string): Promise<Tabar> {
    const response = await api.get(API_ENDPOINTS.TABAR_DETAILS(id));
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabar');
    }
    
    return response.json();
  }

  /**
   * Fetch tabarim list
   */
  static async fetchTabarim(filters?: any): Promise<any[]> {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.TABARIM}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabarim');
    }
    
    return response.json();
  }

  /**
   * Fetch tabar details
   */
  static async fetchTabarDetails(tabarId: string): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.TABARIM}/${tabarId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabar details');
    }
    
    return response.json();
  }

  /**
   * Create new tabar
   */
  static async createTabar(tabarData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.TABARIM, tabarData);
    
    if (!response.ok) {
      throw new Error('Failed to create tabar');
    }
    
    return response.json();
  }

  /**
   * Update tabar
   */
  static async updateTabar(tabarId: string, tabarData: any): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.TABARIM}/${tabarId}`, tabarData);
    
    if (!response.ok) {
      throw new Error('Failed to update tabar');
    }
    
    return response.json();
  }

  /**
   * Delete tabar
   */
  static async deleteTabar(tabarId: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.TABARIM}/${tabarId}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete tabar');
    }
  }

  /**
   * Fetch tabar documents
   */
  static async fetchDocuments(tabarId: string): Promise<TabarDocument[]> {
    const response = await api.get(API_ENDPOINTS.TABAR_DOCUMENTS(tabarId));
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabar documents');
    }
    
    return response.json();
  }

  /**
   * Upload document to tabar
   */
  static async uploadDocument(tabarId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post(
      API_ENDPOINTS.TABAR_DOCUMENTS(tabarId),
      formData,
      {
        // Remove Content-Type to let browser set it for FormData
        headers: {}
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload document');
    }
  }
} 