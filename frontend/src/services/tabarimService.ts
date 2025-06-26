import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface Tabar {
  id: string;
  tabar_number: string | number;
  name: string;
  description?: string;
  status: string;
  total_authorized: number;
  utilized: number;
  utilization_percentage: number;
  year: number;
  ministry: string;
  department: string;
  open_date: string;
  close_date?: string;
  permission_number?: string;
  municipal_participation?: number;
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
    try {
      const response = await api.get(API_ENDPOINTS.TABARIM.LIST);
      return response;
    } catch (error) {
      console.error('TabarimService.fetchAll error:', error);
      // Fallback to basic mock data if API fails
      return this.getMockTabarimData();
    }
  }

  /**
   * Fetch tabar by ID
   */
  static async fetchById(id: string): Promise<Tabar> {
    try {
      const response = await api.get(`${API_ENDPOINTS.TABARIM.DETAILS}/${id}`);
      return response;
    } catch (error) {
      console.error('TabarimService.fetchById error:', error);
      // Return mock data for this specific ID
      const mockData = this.getMockTabarimData();
      const tabar = mockData.find(t => t.id === id || t.tabar_number.toString() === id);
      if (!tabar) {
        throw new Error(`Tabar with id ${id} not found`);
      }
      return tabar;
    }
  }

  /**
   * Fetch tabarim list - MOCK VERSION FOR DEMO
   */
  static async fetchTabarim(filters?: any): Promise<any[]> {
    console.log('🎭 Using mock tabarim list - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let mockData = this.getMockTabarimData();
    
    // Apply simple filtering if provided
    if (filters?.status) {
      mockData = mockData.filter(t => t.status === filters.status);
    }
    
    return mockData;
  }

  /**
   * Fetch tabar details - MOCK VERSION FOR DEMO
   */
  static async fetchTabarDetails(tabarId: string): Promise<any> {
    console.log('🎭 Using mock tabar details - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));
    
    const mockData = this.getMockTabarimData();
    const tabar = mockData.find(t => t.id === tabarId);
    
    if (!tabar) {
      throw new Error(`Tabar details for id ${tabarId} not found`);
    }
    
    // Add detailed information
    return {
      ...tabar,
      created_date: '2024-01-15',
      updated_date: '2024-05-20',
      department: 'משרד התחבורה',
      manager: 'אברהם כהן',
      completion_percentage: Math.floor(Math.random() * 100),
      milestones: [
        { id: '1', name: 'תכנון ראשוני', status: 'הושלם', date: '2024-02-01' },
        { id: '2', name: 'אישורים', status: 'בתהליך', date: '2024-03-15' },
        { id: '3', name: 'ביצוע', status: 'ממתין', date: '2024-06-01' }
      ]
    };
  }

  /**
   * Create new tabar
   */
  static async create(tabar: Partial<Tabar>): Promise<Tabar> {
    try {
      const response = await api.post(API_ENDPOINTS.TABARIM.CREATE, tabar);
      return response;
    } catch (error) {
      console.error('TabarimService.create error:', error);
      throw new Error('Failed to create tabar');
    }
  }

  /**
   * Update existing tabar
   */
  static async update(id: string, tabar: Partial<Tabar>): Promise<Tabar> {
    try {
      const response = await api.put(`${API_ENDPOINTS.TABARIM.UPDATE}/${id}`, tabar);
      return response;
    } catch (error) {
      console.error('TabarimService.update error:', error);
      throw new Error('Failed to update tabar');
    }
  }

  /**
   * Delete tabar
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.TABARIM.DELETE}/${id}`);
    } catch (error) {
      console.error('TabarimService.delete error:', error);
      throw new Error('Failed to delete tabar');
    }
  }

  /**
   * Fetch tabar documents - MOCK VERSION FOR DEMO
   */
  static async fetchDocuments(tabarId: string): Promise<TabarDocument[]> {
    console.log('🎭 Using mock documents - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        tabar_id: tabarId,
        filename: 'תכנון_פרויקט.pdf',
        upload_date: '2024-05-15T10:30:00Z',
        file_size: 2048000,
        file_type: 'application/pdf'
      },
      {
        id: '2',
        tabar_id: tabarId,
        filename: 'אישורים_רשויות.docx',
        upload_date: '2024-05-18T14:15:00Z',
        file_size: 1024000,
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      {
        id: '3',
        tabar_id: tabarId,
        filename: 'תקציב_מפורט.xlsx',
        upload_date: '2024-05-20T09:45:00Z',
        file_size: 512000,
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ];
  }

  /**
   * Upload document to tabar - MOCK VERSION FOR DEMO
   */
  static async uploadDocument(tabarId: string, file: File): Promise<void> {
    console.log('🎭 Mock document upload - API disabled');
    
    // Simulate API delay for upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Mock: Document ${file.name} uploaded to tabar ${tabarId}`);
  }

  /**
   * Get mock tabarim data as fallback
   */
  private static getMockTabarimData(): Tabar[] {
    return [
      {
        id: '1',
        tabar_number: 'TB-2024-001',
        name: 'פרויקט תשתית דרכים מרכזיות',
        description: 'שיפור ופיתוח תשתית דרכים במרכז העיר',
        status: 'פעיל',
        total_authorized: 15000000,
        utilized: 12500000,
        utilization_percentage: 83.3,
        year: 2024,
        ministry: 'משרד התחבורה',
        department: 'תשתיות',
        open_date: '2024-01-15',
        close_date: '2024-12-31',
        permission_number: 'PERM-2024-001',
        municipal_participation: 2500000
      },
      {
        id: '2',
        tabar_number: 'TB-2024-002',
        name: 'פרויקט חינוך דיגיטלי',
        description: 'הטמעת טכנולוגיה חדשה בבתי הספר',
        status: 'בתכנון',
        total_authorized: 8500000,
        utilized: 2100000,
        utilization_percentage: 24.7,
        year: 2024,
        ministry: 'משרד החינוך',
        department: 'חינוך וטכנולוגיה',
        open_date: '2024-03-01',
        close_date: '2025-02-28',
        permission_number: 'PERM-2024-002',
        municipal_participation: 1700000
      },
      {
        id: '101',
        tabar_number: 101,
        name: 'פרויקט מיוחד 101',
        description: 'פרויקט מיוחד לצורך בדיקות',
        status: 'פעיל',
        total_authorized: 5000000,
        utilized: 3500000,
        utilization_percentage: 70,
        year: 2024,
        ministry: 'משרד הפנים',
        department: 'פרויקטים מיוחדים',
        open_date: '2024-01-01',
        close_date: '2024-12-31',
        permission_number: 'PERM-2024-101',
        municipal_participation: 1000000
      }
    ];
  }
} 