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
   * Fetch system statistics - MOCK VERSION FOR DEMO
   */
  static async fetchStatistics(): Promise<AdminStatistics> {
    console.log('🎭 Using mock admin statistics - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      totalUsers: 28,
      activeUsers: 24,
      totalProjects: 18,
      totalBudget: 125000000
    };
  }

  /**
   * Fetch recent activity - MOCK VERSION FOR DEMO
   */
  static async fetchRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    console.log('🎭 Using mock recent activity - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
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
      },
      {
        id: '3',
        action: 'אישור תקציב',
        user: 'דני אברהם',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        details: 'אישר תקציב נוסף עבור פרויקט החינוך'
      },
      {
        id: '4',
        action: 'העלאת מסמך',
        user: 'רחל מזרחי',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        details: 'העלה תיעוד טכני לפרויקט הפארקים'
      },
      {
        id: '5',
        action: 'הוספת אבן דרך',
        user: 'יוסי רוזן',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        details: 'הוסיף אבן דרך חדשה לפרויקט התשתית'
      }
    ];
    
    return activities.slice(0, limit);
  }

  /**
   * Fetch tenants - MOCK VERSION FOR DEMO
   */
  static async fetchTenants(): Promise<any[]> {
    console.log('🎭 Using mock tenants data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 1,
        name: 'עיריית ירושלים',
        code: 'JER001',
        status: 'פעיל',
        created_date: '2024-01-01'
      },
      {
        id: 2,  
        name: 'עיריית תל אביב',
        code: 'TLV001',
        status: 'פעיל',
        created_date: '2024-01-15'
      }
    ];
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
   * Fetch audit log - MOCK VERSION FOR DEMO
   */
  static async fetchAuditLog(params?: any): Promise<any> {
    console.log('🎭 Using mock audit log data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
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
        },
        {
          id: 2,
          action: 'VIEW',
          user_id: 'demo',
          user_name: 'משתמש דמו',
          resource_type: 'PROJECT',
          resource_id: '101',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          ip_address: '127.0.0.1',
          details: 'צפייה בפרויקט תב"ר 101'
        },
        {
          id: 3,
          action: 'EDIT',
          user_id: 'demo',
          user_name: 'משתמש דמו',
          resource_type: 'TABAR',
          resource_id: '102',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          ip_address: '127.0.0.1',
          details: 'עריכת טבר 102'
        }
      ],
      total: 3
    };
  }

  /**
   * Fetch locked users - MOCK VERSION FOR DEMO
   */
  static async fetchLockedUsers(): Promise<any[]> {
    console.log('🎭 Using mock locked users data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
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