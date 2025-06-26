import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget: number;
  // Add more fields as needed
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  filename: string;
  upload_date: string;
  file_size: number;
  file_type: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  completed_date?: string;
}

export class ProjectsService {
  /**
   * Fetch all projects - MOCK VERSION FOR DEMO
   */
  static async fetchAll(): Promise<Project[]> {
    console.log('🎭 Using mock projects data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.getMockProjectsData();
  }

  /**
   * Fetch project by ID - MOCK VERSION FOR DEMO
   */
  static async fetchById(id: string): Promise<Project> {
    console.log('🎭 Using mock project data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockData = this.getMockProjectsData();
    const project = mockData.find(p => p.id === id);
    
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    return project;
  }

  /**
   * Fetch project documents - MOCK VERSION FOR DEMO
   */
  static async fetchDocuments(projectId: string): Promise<ProjectDocument[]> {
    console.log('🎭 Using mock project documents - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        project_id: projectId,
        filename: 'תיעוד_פרoyeket.pdf',
        upload_date: '2024-05-15T10:30:00Z',
        file_size: 1024000,
        file_type: 'application/pdf'
      },
      {
        id: '2',
        project_id: projectId,
        filename: 'תקציב_מפורט.xlsx',
        upload_date: '2024-05-18T14:15:00Z',
        file_size: 512000,
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ];
  }

  /**
   * Upload document to project - MOCK VERSION FOR DEMO
   */
  static async uploadDocument(projectId: string, file: File): Promise<void> {
    console.log('🎭 Mock project document upload - API disabled');
    
    // Simulate API delay for upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Mock: Document ${file.name} uploaded to project ${projectId}`);
  }

  /**
   * Fetch project milestones - MOCK VERSION FOR DEMO
   */
  static async fetchMilestones(projectId: string): Promise<ProjectMilestone[]> {
    console.log('🎭 Using mock project milestones - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return [
      {
        id: '1',
        project_id: projectId,
        title: 'תכנון ראשוני',
        description: 'הכנת תכנית עבודה מפורטת',
        due_date: '2024-02-01',
        status: 'הושלם',
        completed_date: '2024-01-28'
      },
      {
        id: '2',
        project_id: projectId,
        title: 'קבלת אישורים',
        description: 'השגת כל האישורים הדרושים מהרשויות',
        due_date: '2024-03-15',
        status: 'בתהליך'
      },
      {
        id: '3',
        project_id: projectId,
        title: 'התחלת ביצוע',
        description: 'תחילת העבודות בשטח',
        due_date: '2024-06-01',
        status: 'ממתין'
      }
    ];
  }

  /**
   * Add milestone to project - MOCK VERSION FOR DEMO
   */
  static async addMilestone(projectId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    console.log('🎭 Mock milestone creation - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newMilestone: ProjectMilestone = {
      id: `mock-${Date.now()}`,
      project_id: projectId,
      title: milestone.title || 'אבן דרך חדשה',
      description: milestone.description,
      due_date: milestone.due_date || new Date().toISOString().split('T')[0],
      status: milestone.status || 'ממתין',
      completed_date: milestone.completed_date
    };
    
    return newMilestone;
  }

  /**
   * Update milestone - MOCK VERSION FOR DEMO
   */
  static async updateMilestone(projectId: string, milestoneId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    console.log('🎭 Mock milestone update - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: milestoneId,
      project_id: projectId,
      title: milestone.title || 'אבן דרך מעודכנת',
      description: milestone.description,
      due_date: milestone.due_date || new Date().toISOString().split('T')[0],
      status: milestone.status || 'ממתין',
      completed_date: milestone.completed_date
    };
  }

  /**
   * Delete milestone - MOCK VERSION FOR DEMO
   */
  static async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    console.log('🎭 Mock milestone deletion - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`Mock: Milestone ${milestoneId} deleted from project ${projectId}`);
  }

  /**
   * Get mock projects data
   */
  private static getMockProjectsData(): Project[] {
    return [
      {
        id: '1',
        name: 'פרויקט תשתית דרכים מרכזיות',
        description: 'שיפור ופיתוח תשתית דרכים במרכז העיר להגברת הבטיחות והנגישות',
        status: 'פעיל',
        budget: 15000000
      },
      {
        id: '2',
        name: 'פרויקט חינוך דיגיטלי',
        description: 'הטמעת טכנולוגיות דיגיטליות בבתי ספר ומרכזי למידה',
        status: 'בתכנון',
        budget: 8500000
      },
      {
        id: '3',
        name: 'פרויקט פארקים עירוניים',
        description: 'הקמת ושיפוץ פארקים ומרחבים ציבוריים לטובת הקהילה',
        status: 'פעיל',
        budget: 6200000
      },
      {
        id: '4',
        name: 'פרויקט תחבורה ציבורית',
        description: 'שיפור רשת התחבורה הציבורית ובניית תחנות חדשות',
        status: 'בהמתנה',
        budget: 12000000
      },
      {
        id: '5',
        name: 'פרויקט מרכז קהילתי',
        description: 'הקמת מרכז קהילתי חדש באזור הדרום עם מתקנים מתקדמים',
        status: 'הושלם',
        budget: 4500000
      }
    ];
  }
} 