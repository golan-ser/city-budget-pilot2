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
   * Fetch all tabarim - MOCK VERSION FOR DEMO
   */
  static async fetchAll(): Promise<Tabar[]> {
    console.log('🎭 Using mock tabarim data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.getMockTabarimData();
  }

  /**
   * Fetch tabar by ID - MOCK VERSION FOR DEMO
   */
  static async fetchById(id: string): Promise<Tabar> {
    console.log('🎭 Using mock tabar data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockData = this.getMockTabarimData();
    const tabar = mockData.find(t => t.id === id);
    
    if (!tabar) {
      throw new Error(`Tabar with id ${id} not found`);
    }
    
    return tabar;
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
   * Create new tabar - MOCK VERSION FOR DEMO
   */
  static async createTabar(tabarData: any): Promise<any> {
    console.log('🎭 Mock tabar creation - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newTabar = {
      id: `mock-${Date.now()}`,
      tabar_number: `TB-${Date.now()}`,
      ...tabarData,
      status: 'בתכנון',
      created_date: new Date().toISOString()
    };
    
    return newTabar;
  }

  /**
   * Update tabar - MOCK VERSION FOR DEMO
   */
  static async updateTabar(tabarId: string, tabarData: any): Promise<any> {
    console.log('🎭 Mock tabar update - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      id: tabarId,
      ...tabarData,
      updated_date: new Date().toISOString()
    };
  }

  /**
   * Delete tabar - MOCK VERSION FOR DEMO
   */
  static async deleteTabar(tabarId: string): Promise<void> {
    console.log('🎭 Mock tabar deletion - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Mock: Tabar ${tabarId} deleted successfully`);
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
   * Get mock tabarim data
   */
  private static getMockTabarimData(): Tabar[] {
    return [
      {
        id: '1',
        tabar_number: 'TB-2024-001',
        name: 'פרויקט תשתית דרכים מרכזיות',
        description: 'שיפור ופיתוח תשתית דרכים במרכז העיר',
        status: 'פעיל',
        budget: 15000000
      },
      {
        id: '2',
        tabar_number: 'TB-2024-002',
        name: 'פרויקט חינוך דיגיטלי',
        description: 'הטמעת טכנולוגיות דיגיטליות בבתי ספר',
        status: 'בתכנון',
        budget: 8500000
      },
      {
        id: '3',
        tabar_number: 'TB-2024-003',
        name: 'פרויקט פארקים עירוניים',
        description: 'הקמת ושיפוץ פארקים ומרחבים ציבוריים',
        status: 'פעיל',
        budget: 6200000
      },
      {
        id: '4',
        tabar_number: 'TB-2024-004',
        name: 'פרויקט תחבורה ציבורית',
        description: 'שיפור רשת התחבורה הציבורית בעיר',
        status: 'בהמתנה',
        budget: 12000000
      },
      {
        id: '5',
        tabar_number: 'TB-2024-005',
        name: 'פרויקט מרכז קהילתי',
        description: 'הקמת מרכז קהילתי חדש באזור הדרום',
        status: 'הושלם',
        budget: 4500000
      },
      {
        id: '6',
        tabar_number: 'TB-2024-006',
        name: 'פרויקט אנרגיה מתחדשת',
        description: 'התקנת פאנלים סולאריים במבני הציבור',
        status: 'פעיל',
        budget: 9800000
      },
      {
        id: '7',
        tabar_number: 'TB-2024-007',
        name: 'פרויקט דיור ציבורי',
        description: 'הקמת יחידות דיור בהישג יד',
        status: 'בתכנון',
        budget: 25000000
      },
      {
        id: '8',
        tabar_number: 'TB-2024-008',
        name: 'פרויקט ביוב ומים',
        description: 'שיפור מערכת הביוב והמים העירונית',
        status: 'פעיל',
        budget: 18000000
      }
    ];
  }
} 