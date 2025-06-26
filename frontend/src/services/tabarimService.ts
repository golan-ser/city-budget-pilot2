import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface Tabar {
  id: string;
  tabar_number: string | number;
  name: string;
  description?: string;
  status: string;
  budget: number;
  total_authorized: number;
  utilized: number;
  utilization_percentage: number;
  ministry: string;
  department: string;
  year: number;
  open_date: string;
  close_date: string | null;
  permission_number: string;
  municipal_participation: number;
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
        budget: 15000000,
        total_authorized: 15000000,
        utilized: 12500000,
        utilization_percentage: 83.3,
        ministry: 'משרד התחבורה',
        department: 'תחבורה ותשתיות',
        year: 2024,
        open_date: '2024-01-15',
        close_date: null,
        permission_number: 'T-001-2024',
        municipal_participation: 3000000
      },
      {
        id: '2',
        tabar_number: 'TB-2024-002',
        name: 'פרויקט חינוך דיגיטלי',
        description: 'הטמעת טכנולוגיות דיגיטליות בבתי ספר',
        status: 'בתכנון',
        budget: 8500000,
        total_authorized: 8500000,
        utilized: 2100000,
        utilization_percentage: 24.7,
        ministry: 'משרד החינוך',
        department: 'חינוך ותרבות',
        year: 2024,
        open_date: '2024-02-01',
        close_date: null,
        permission_number: 'E-002-2024',
        municipal_participation: 1700000
      },
      {
        id: '3',
        tabar_number: 'TB-2024-003',
        name: 'פרויקט פארקים עירוניים',
        description: 'הקמת ושיפוץ פארקים ומרחבים ציבוריים',
        status: 'פעיל',
        budget: 6200000,
        total_authorized: 6200000,
        utilized: 4800000,
        utilization_percentage: 77.4,
        ministry: 'משרד הפנים',
        department: 'פיתוח ותכנון עירוני',
        year: 2024,
        open_date: '2024-01-20',
        close_date: null,
        permission_number: 'P-003-2024',
        municipal_participation: 1240000
      },
      {
        id: '4',
        tabar_number: 'TB-2024-004',
        name: 'פרויקט תחבורה ציבורית',
        description: 'שיפור רשת התחבורה הציבורית בעיר',
        status: 'בהמתנה',
        budget: 12000000,
        total_authorized: 12000000,
        utilized: 800000,
        utilization_percentage: 6.7,
        ministry: 'משרד התחבורה',
        department: 'תחבורה ציבורית',
        year: 2024,
        open_date: '2024-03-01',
        close_date: null,
        permission_number: 'T-004-2024',
        municipal_participation: 2400000
      },
      {
        id: '5',
        tabar_number: 'TB-2024-005',
        name: 'פרויקט מרכז קהילתי',
        description: 'הקמת מרכז קהילתי חדש באזור הדרום',
        status: 'הושלם',
        budget: 4500000,
        total_authorized: 4500000,
        utilized: 4500000,
        utilization_percentage: 100.0,
        ministry: 'משרד הרווחה',
        department: 'שירותים קהילתיים',
        year: 2023,
        open_date: '2023-06-01',
        close_date: '2024-05-15',
        permission_number: 'W-005-2023',
        municipal_participation: 900000
      },
      {
        id: '6',
        tabar_number: 'TB-2024-006',
        name: 'פרויקט אנרגיה מתחדשת',
        description: 'התקנת פאנלים סולאריים במבני הציבור',
        status: 'פעיל',
        budget: 9800000,
        total_authorized: 9800000,
        utilized: 5880000,
        utilization_percentage: 60.0,
        ministry: 'משרד האנרגיה',
        department: 'אנרגיה מתחדשת',
        year: 2024,
        open_date: '2024-01-10',
        close_date: null,
        permission_number: 'E-006-2024',
        municipal_participation: 1960000
      },
      {
        id: '7',
        tabar_number: 'TB-2024-007',
        name: 'פרויקט דיור ציבורי',
        description: 'הקמת יחידות דיור בהישג יד',
        status: 'בתכנון',
        budget: 25000000,
        total_authorized: 25000000,
        utilized: 1250000,
        utilization_percentage: 5.0,
        ministry: 'משרד הבינוי והשיכון',
        department: 'דיור ציבורי',
        year: 2024,
        open_date: '2024-04-01',
        close_date: null,
        permission_number: 'H-007-2024',
        municipal_participation: 5000000
      },
      {
        id: '8',
        tabar_number: 'TB-2024-008',
        name: 'פרויקט ביוב ומים',
        description: 'שיפור מערכת הביוב והמים העירונית',
        status: 'פעיל',
        budget: 18000000,
        total_authorized: 18000000,
        utilized: 10800000,
        utilization_percentage: 60.0,
        ministry: 'רשות המים',
        department: 'תשתיות מים וביוב',
        year: 2024,
        open_date: '2024-02-15',
        close_date: null,
        permission_number: 'W-008-2024',
        municipal_participation: 3600000
      },
      {
        id: '101',
        tabar_number: 101,
        name: 'פרויקט מיוחד 101',
        description: 'פרויקט מיוחד לבדיקות מערכת',
        status: 'פעיל',
        budget: 5000000,
        total_authorized: 5000000,
        utilized: 3500000,
        utilization_percentage: 70.0,
        ministry: 'משרד הפנים',
        department: 'פיתוח מערכות',
        year: 2024,
        open_date: '2024-01-01',
        close_date: null,
        permission_number: 'SYS-101-2024',
        municipal_participation: 1000000
      }
    ];
  }
} 