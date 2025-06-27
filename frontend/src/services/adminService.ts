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
      return response;
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
      return response;
    } catch (error) {
      console.error('AdminService.fetchStatistics error:', error);
      // Fallback to mock data if API fails
      return {
        totalUsers: 28,
        activeUsers: 24,
        totalProjects: 18,
        totalBudget: 125000000
      };
    }
  }

  /**
   * Fetch recent activity
   */
  static async fetchRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.ADMIN.RECENT_ACTIVITY}?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('AdminService.fetchRecentActivity error:', error);
      // Fallback to mock data if API fails
      const activities: RecentActivity[] = [
        {
          id: '1',
          action: 'עדכון פרויקט',
          user: 'משה כהן',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: 'עדכן את סטטוס הפרויקט לפעיל'
        },
        {
          id: '2',
          action: 'יצירת טבר חדש',
          user: 'שרה לוי',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          details: 'יצר טבר חדש עבור פרויקט התחבורה'
        }
      ];
      return activities.slice(0, limit);
    }
  }

  /**
   * Fetch tenants
   */
  static async fetchTenants(): Promise<any[]> {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.TENANTS);
      return response;
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
      return response;
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
      return response;
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
      await api.delete(`${API_ENDPOINTS.ADMIN.TENANTS}/${tenantId}`);
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
      return response;
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
      return response;
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
      return response;
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
      return response;
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
      await api.delete(`${API_ENDPOINTS.ADMIN.SYSTEMS}/${systemId}`);
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
      return response;
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
      return response;
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
      return response;
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
      let url = API_ENDPOINTS.ADMIN.AUDIT_LOG;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }
      
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      console.error('AdminService.fetchAuditLog error:', error);
      // Fallback to mock data if API fails
      return {
        data: [
          {
            id: 1,
            action: 'LOGIN',
            user_id: 'demo',
            user_name: 'משתמש דמו',
            resource_type: 'AUTH',
            resource_id: null,
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            ip_address: '127.0.0.1',
            details: 'התחברות למערכת'
          }
        ],
        total: 1
      };
    }
  }

  /**
   * Fetch locked users
   */
  static async fetchLockedUsers(): Promise<any[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}/locked`);
      return response;
    } catch (error: any) {
      console.error('AdminService.fetchLockedUsers error:', error);
      // Fallback to mock data if API fails
      return [
        {
          id: 'user123',
          username: 'משתמש נעול',
          email: 'locked@example.com',
          locked_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          locked_reason: 'הזנת סיסמה שגויה 3 פעמים',
          lock_duration: 24
        }
      ];
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
   * Fetch users - MOCK VERSION FOR DEMO
   */
  static async fetchUsers(): Promise<any[]> {
    console.log('🎭 Using mock users data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 'demo',
        username: 'דמו',
        email: 'demo@city.gov.il',
        role: 'מנהל',
        status: 'פעיל',
        last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'user2',
        username: 'משה כהן',
        email: 'moshe@city.gov.il',
        role: 'משתמש',
        status: 'פעיל',
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
  }
} 