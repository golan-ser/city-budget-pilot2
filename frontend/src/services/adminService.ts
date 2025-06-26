import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface UserPermission {
  page_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

export interface UserPermissions {
  [key: string]: UserPermission;
}

export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalBudget: number;
  // Add more fields as needed
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export class AdminService {
  /**
   * Fetch user permissions
   */
  static async fetchUserPermissions(tenantId: number, systemId: number, userId: string): Promise<any> {
    const response = await api.get(
      `${API_ENDPOINTS.ADMIN.PERMISSIONS}/user?tenantId=${tenantId}&systemId=${systemId}&userId=${userId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user permissions');
    }
    
    return response.json();
  }

  /**
   * Fetch system statistics
   */
  static async fetchStatistics(): Promise<AdminStatistics> {
    const response = await api.get(API_ENDPOINTS.ADMIN.STATISTICS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    
    return response.json();
  }

  /**
   * Fetch recent activity
   */
  static async fetchRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    const response = await api.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOG}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }
    
    return response.json();
  }

  /**
   * Fetch tenants
   */
  static async fetchTenants(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.ADMIN.TENANTS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }
    
    return response.json();
  }

  /**
   * Create tenant
   */
  static async createTenant(tenantData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.ADMIN.TENANTS, tenantData);
    
    if (!response.ok) {
      throw new Error('Failed to create tenant');
    }
    
    return response.json();
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string | number, tenantData: any): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}`, tenantData);
    
    if (!response.ok) {
      throw new Error('Failed to update tenant');
    }
    
    return response.json();
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(tenantId: string | number): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete tenant');
    }
  }

  /**
   * Fetch tenant systems
   */
  static async fetchTenantSystems(tenantId: string | number): Promise<any[]> {
    const response = await api.get(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}/systems`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tenant systems');
    }
    
    return response.json();
  }

  /**
   * Fetch systems
   */
  static async fetchSystems(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.ADMIN.SYSTEMS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch systems');
    }
    
    return response.json();
  }

  /**
   * Create system
   */
  static async createSystem(systemData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.ADMIN.SYSTEMS, systemData);
    
    if (!response.ok) {
      throw new Error('Failed to create system');
    }
    
    return response.json();
  }

  /**
   * Update system
   */
  static async updateSystem(systemId: string | number, systemData: any): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.ADMIN.SYSTEMS}/${systemId}`, systemData);
    
    if (!response.ok) {
      throw new Error('Failed to update system');
    }
    
    return response.json();
  }

  /**
   * Delete system
   */
  static async deleteSystem(systemId: string | number): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.ADMIN.SYSTEMS}/${systemId}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete system');
    }
  }

  /**
   * Fetch roles
   */
  static async fetchRoles(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.ADMIN.ROLES);
    
    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }
    
    return response.json();
  }

  /**
   * Create role
   */
  static async createRole(roleData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.ADMIN.ROLES, roleData);
    
    if (!response.ok) {
      throw new Error('Failed to create role');
    }
    
    return response.json();
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, roleData: any): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.ADMIN.ROLES}/${roleId}`, roleData);
    
    if (!response.ok) {
      throw new Error('Failed to update role');
    }
    
    return response.json();
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.ADMIN.ROLES}/${roleId}`);
    
    if (!response.ok) {
      throw new Error('Failed to delete role');
    }
  }

  /**
   * Fetch audit log
   */
  static async fetchAuditLog(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOG}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit log');
    }
    
    return response.json();
  }

  /**
   * Fetch locked users
   */
  static async fetchLockedUsers(): Promise<any[]> {
    const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}/locked`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch locked users');
    }
    
    return response.json();
  }

  /**
   * Unlock user
   */
  static async unlockUser(userId: string): Promise<void> {
    const response = await api.post(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/unlock`);
    
    if (!response.ok) {
      throw new Error('Failed to unlock user');
    }
  }

  /**
   * Lock user
   */
  static async lockUser(userId: string, reason: string): Promise<void> {
    const response = await api.post(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/lock`, { reason });
    
    if (!response.ok) {
      throw new Error('Failed to lock user');
    }
  }

  /**
   * Fetch all users
   */
  static async fetchUsers(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.ADMIN.USERS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  }
} 