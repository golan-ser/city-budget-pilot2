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
    const response = await api.get(API_ENDPOINTS.PROJECTS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return response.json();
  }

  /**
   * Fetch project by ID
   */
  static async fetchById(id: string): Promise<Project> {
    const response = await api.get(API_ENDPOINTS.PROJECT_DETAILS(id));
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    
    return response.json();
  }

  /**
   * Fetch project documents
   */
  static async fetchDocuments(projectId: string): Promise<ProjectDocument[]> {
    const response = await api.get(API_ENDPOINTS.PROJECTS_DOCUMENTS(projectId));
    
    if (!response.ok) {
      throw new Error('Failed to fetch project documents');
    }
    
    return response.json();
  }

  /**
   * Upload document to project
   */
  static async uploadDocument(projectId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post(
      API_ENDPOINTS.PROJECTS_DOCUMENTS(projectId),
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

  /**
   * Fetch project milestones
   */
  static async fetchMilestones(projectId: string): Promise<ProjectMilestone[]> {
    const response = await api.get(API_ENDPOINTS.PROJECTS_MILESTONES(projectId));
    
    if (!response.ok) {
      throw new Error('Failed to fetch project milestones');
    }
    
    return response.json();
  }

  /**
   * Add milestone to project
   */
  static async addMilestone(projectId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    const response = await api.post(API_ENDPOINTS.PROJECTS_MILESTONES(projectId), milestone);
    
    if (!response.ok) {
      throw new Error('Failed to add milestone');
    }
    
    return response.json();
  }

  /**
   * Update milestone
   */
  static async updateMilestone(projectId: string, milestoneId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    const response = await api.put(`${API_ENDPOINTS.PROJECTS_MILESTONES(projectId)}/${milestoneId}`, milestone);
    
    if (!response.ok) {
      throw new Error('Failed to update milestone');
    }
    
    return response.json();
  }

  /**
   * Delete milestone
   */
  static async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.PROJECTS_MILESTONES(projectId)}/${milestoneId}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete milestone');
    }
  }
} 