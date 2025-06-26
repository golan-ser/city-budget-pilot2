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
   * Fetch user permissions with better error handling
   */
  static async fetchUserPermissions(tenantId: number, systemId: number, userId: string): Promise<any> {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.ADMIN.PERMISSIONS}/user?tenantId=${tenantId}&systemId=${systemId}&userId=${userId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user permissions`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('AdminService.fetchUserPermissions error:', error);
      // Re-throw with more context
      throw new Error(`Failed to fetch user permissions: ${error.message}`);
    }
  }

  /**
   * Fetch system statistics
   */
  static async fetchStatistics(): Promise<AdminStatistics> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.STATISTICS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch statistics`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchStatistics error:', error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  /**
   * Fetch recent activity
   */
  static async fetchRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOG}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch recent activity`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchRecentActivity error:', error);
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }
  }

  /**
   * Fetch tenants
   */
  static async fetchTenants(): Promise<any[]> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.TENANTS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch tenants`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchTenants error:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }
  }

  /**
   * Create tenant
   */
  static async createTenant(tenantData: any): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.ADMIN.TENANTS, tenantData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create tenant`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.createTenant error:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string | number, tenantData: any): Promise<any> {
    try {
      const response = await api.put(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}`, tenantData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update tenant`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.updateTenant error:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(tenantId: string | number): Promise<void> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete tenant`);
      }
    } catch (error: any) {
      console.error('AdminService.deleteTenant error:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  /**
   * Fetch tenant systems
   */
  static async fetchTenantSystems(tenantId: string | number): Promise<any[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}/systems`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch tenant systems`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchTenantSystems error:', error);
      throw new Error(`Failed to fetch tenant systems: ${error.message}`);
    }
  }

  /**
   * Fetch systems
   */
  static async fetchSystems(): Promise<any[]> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.SYSTEMS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch systems`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchSystems error:', error);
      throw new Error(`Failed to fetch systems: ${error.message}`);
    }
  }

  /**
   * Create system
   */
  static async createSystem(systemData: any): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.ADMIN.SYSTEMS, systemData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create system`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.createSystem error:', error);
      throw new Error(`Failed to create system: ${error.message}`);
    }
  }

  /**
   * Update system
   */
  static async updateSystem(systemId: string | number, systemData: any): Promise<any> {
    try {
      const response = await api.put(`${API_ENDPOINTS.ADMIN.SYSTEMS}/${systemId}`, systemData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update system`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.updateSystem error:', error);
      throw new Error(`Failed to update system: ${error.message}`);
    }
  }

  /**
   * Delete system
   */
  static async deleteSystem(systemId: string | number): Promise<void> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.ADMIN.SYSTEMS}/${systemId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete system`);
      }
    } catch (error: any) {
      console.error('AdminService.deleteSystem error:', error);
      throw new Error(`Failed to delete system: ${error.message}`);
    }
  }

  /**
   * Fetch roles
   */
  static async fetchRoles(): Promise<any[]> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.ROLES);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch roles`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchRoles error:', error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }
  }

  /**
   * Create role
   */
  static async createRole(roleData: any): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.ADMIN.ROLES, roleData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create role`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.createRole error:', error);
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, roleData: any): Promise<any> {
    try {
      const response = await api.put(`${API_ENDPOINTS.ADMIN.ROLES}/${roleId}`, roleData);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update role`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.updateRole error:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string): Promise<void> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.ADMIN.ROLES}/${roleId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete role`);
      }
    } catch (error: any) {
      console.error('AdminService.deleteRole error:', error);
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  }

  /**
   * Fetch audit log
   */
  static async fetchAuditLog(params?: any): Promise<any> {
    try {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOG}${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch audit log`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchAuditLog error:', error);
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }
  }

  /**
   * Fetch locked users
   */
  static async fetchLockedUsers(): Promise<any[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}/locked`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch locked users`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchLockedUsers error:', error);
      throw new Error(`Failed to fetch locked users: ${error.message}`);
    }
  }

  /**
   * Unlock user
   */
  static async unlockUser(userId: string): Promise<void> {
    try {
      const response = await api.post(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/unlock`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to unlock user`);
      }
    } catch (error: any) {
      console.error('AdminService.unlockUser error:', error);
      throw new Error(`Failed to unlock user: ${error.message}`);
    }
  }

  /**
   * Lock user
   */
  static async lockUser(userId: string, reason: string): Promise<void> {
    try {
      const response = await api.post(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/lock`, { reason });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to lock user`);
      }
    } catch (error: any) {
      console.error('AdminService.lockUser error:', error);
      throw new Error(`Failed to lock user: ${error.message}`);
    }
  }

  /**
   * Fetch users
   */
  static async fetchUsers(): Promise<any[]> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.USERS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch users`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('AdminService.fetchUsers error:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }
} 