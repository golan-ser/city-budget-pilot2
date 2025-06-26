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
   * Fetch all projects
   */
  static async fetchAll(): Promise<Project[]> {
    try {
      const response = await api.get(API_ENDPOINTS.PROJECTS);
      return response;
    } catch (error) {
      console.error('ProjectsService.fetchAll error:', error);
      // Fallback to mock data if API fails
      return this.getMockProjectsData();
    }
  }

  /**
   * Fetch project by ID
   */
  static async fetchById(id: string): Promise<Project> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROJECTS}/${id}`);
      return response;
    } catch (error) {
      console.error('ProjectsService.fetchById error:', error);
      // Fallback to mock data
      const mockData = this.getMockProjectsData();
      const project = mockData.find(p => p.id === id);
      
      if (!project) {
        throw new Error(`Project with id ${id} not found`);
      }
      
      return project;
    }
  }

  /**
   * Fetch project documents
   */
  static async fetchDocuments(projectId: string): Promise<ProjectDocument[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.DOCUMENTS}/${projectId}`);
      return response;
    } catch (error) {
      console.error('ProjectsService.fetchDocuments error:', error);
      // Fallback to mock data
      return [
        {
          id: '1',
          project_id: projectId,
          filename: 'תיעוד_פרoyeket.pdf',
          upload_date: '2024-05-15T10:30:00Z',
          file_size: 1024000,
          file_type: 'application/pdf'
        }
      ];
    }
  }

  /**
   * Upload document to project
   */
  static async uploadDocument(projectId: string, file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      
      await api.post(`${API_ENDPOINTS.DOCUMENTS}/upload`, formData);
    } catch (error) {
      console.error('ProjectsService.uploadDocument error:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Fetch project milestones
   */
  static async fetchMilestones(projectId: string): Promise<ProjectMilestone[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.MILESTONES}/${projectId}`);
      return response;
    } catch (error) {
      console.error('ProjectsService.fetchMilestones error:', error);
      // Fallback to mock data
      return [
        {
          id: '1',
          project_id: projectId,
          title: 'תכנון ראשוני',
          description: 'הכנת תכנית עבודה מפורטת',
          due_date: '2024-02-01',
          status: 'הושלם',
          completed_date: '2024-01-28'
        }
      ];
    }
  }

  /**
   * Add milestone to project
   */
  static async addMilestone(projectId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    try {
      const response = await api.post(`${API_ENDPOINTS.MILESTONES}`, {
        ...milestone,
        project_id: projectId
      });
      return response;
    } catch (error) {
      console.error('ProjectsService.addMilestone error:', error);
      throw new Error('Failed to add milestone');
    }
  }

  /**
   * Update milestone
   */
  static async updateMilestone(projectId: string, milestoneId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    try {
      const response = await api.put(`${API_ENDPOINTS.MILESTONES}/${milestoneId}`, milestone);
      return response;
    } catch (error) {
      console.error('ProjectsService.updateMilestone error:', error);
      throw new Error('Failed to update milestone');
    }
  }

  /**
   * Delete milestone
   */
  static async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.MILESTONES}/${milestoneId}`);
    } catch (error) {
      console.error('ProjectsService.deleteMilestone error:', error);
      throw new Error('Failed to delete milestone');
    }
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