import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService } from '@/services/adminService';

interface Permission {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_create: boolean;
  can_export: boolean;
  can_import: boolean;
}

interface PermissionsData {
  [pageId: string]: Permission;
}

interface PermissionsContextType {
  permissions: PermissionsData;
  loading: boolean;
  error: string | null;
  hasPermission: (pageId: string, action: keyof Permission) => boolean;
  canAccessPage: (pageId: string) => boolean;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Default permissions for fallback
const DEFAULT_PERMISSIONS: PermissionsData = {
  dashboard: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  projects: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  tabarim: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  reports: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  admin: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  // הוספת עמודים נוספים שעלולים להיחסר
  1: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  2: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  3: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  4: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  5: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  11: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true },
  25: { can_view: true, can_edit: true, can_delete: true, can_create: true, can_export: true, can_import: true }
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<PermissionsData>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safe validation function
  const validatePermission = (perm: any): Permission => {
    if (!perm || typeof perm !== 'object') {
      return DEFAULT_PERMISSIONS.dashboard;
    }
    
    return {
      can_view: Boolean(perm.can_view),
      can_edit: Boolean(perm.can_edit),
      can_delete: Boolean(perm.can_delete),
      can_create: Boolean(perm.can_create),
      can_export: Boolean(perm.can_export),
      can_import: Boolean(perm.can_import)
    };
  };

  // Safe validation of entire permissions object
  const validatePermissions = (data: any): PermissionsData => {
    if (!data || typeof data !== 'object') {
      console.warn('📋 Invalid permissions data, using defaults');
      return DEFAULT_PERMISSIONS;
    }

    const validated: PermissionsData = {};
    
    try {
      // Validate each permission entry
      Object.keys(DEFAULT_PERMISSIONS).forEach(pageId => {
        if (data[pageId]) {
          validated[pageId] = validatePermission(data[pageId]);
        } else {
          validated[pageId] = DEFAULT_PERMISSIONS[pageId];
        }
      });

      // Add any additional valid permissions from data
      Object.keys(data).forEach(pageId => {
        if (!validated[pageId] && data[pageId] && typeof data[pageId] === 'object') {
          validated[pageId] = validatePermission(data[pageId]);
        }
      });

      return validated;
    } catch (error) {
      console.error('📋 Error validating permissions:', error);
      return DEFAULT_PERMISSIONS;
    }
  };

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching user permissions...');
      
             const data = await AdminService.fetchUserPermissions(1, 1, '3');
      
      if (data && typeof data === 'object') {
        console.log('✅ Raw permissions data:', data);
        
        let apiPermissions: any = {};
        
        // Handle different API response structures
        if (data.permissions && typeof data.permissions === 'object') {
          apiPermissions = data.permissions;
        } else if (data.data?.permissions && typeof data.data.permissions === 'object') {
          apiPermissions = data.data.permissions;
        } else if (data.page_id || data.can_view !== undefined) {
          // Single permission object
          apiPermissions = { [data.page_id || 'dashboard']: data };
        } else {
          // Assume the data itself is the permissions object
          apiPermissions = data;
        }
        
        console.log('🔧 Processed permissions:', apiPermissions);
        
        // Validate and set permissions
        const validatedPermissions = validatePermissions(apiPermissions);
        setPermissions(validatedPermissions);
        
        console.log('✅ Final validated permissions:', validatedPermissions);
      } else {
        throw new Error('Invalid permissions data structure');
      }
      
    } catch (error: any) {
      console.warn('📋 API not available, using default permissions:', error.message);
      setError(error.message);
      setPermissions(DEFAULT_PERMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  // Safe permission check function
  const hasPermission = (pageId: string, action: keyof Permission): boolean => {
    try {
      if (!pageId || !action) {
        console.warn('📋 Invalid permission check parameters');
        return false;
      }
      
      // 🔓 ADMIN BYPASS: Admin users always have full permissions
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === 'demo@demo.com' || user.role_name === 'admin' || user.role_name === 'demo') {
            console.log(`🔓 ADMIN BYPASS: Full permissions granted for ${pageId}.${action} (User: ${user.email}, Role: ${user.role_name})`);
            return true;
          }
        }
      } catch (e) {
        console.warn('📋 Error parsing userData from localStorage:', e);
      }
      
      const permission = permissions[pageId];
      if (!permission || typeof permission !== 'object') {
        console.warn(`📋 No permission found for page: ${pageId}`);
        return false;
      }
      
      const result = Boolean(permission[action]);
      console.log(`🔍 Permission check: ${pageId}.${action} = ${result}`);
      return result;
    } catch (error) {
      console.error('📋 Error in permission check:', error);
      return false;
    }
  };

  // Safe page access check
  const canAccessPage = (pageId: string): boolean => {
    try {
      // 🔓 ADMIN BYPASS: Admin users can access all pages
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === 'demo@demo.com' || user.role_name === 'admin' || user.role_name === 'demo') {
            console.log(`🔓 ADMIN BYPASS: Page access granted for ${pageId} (User: ${user.email}, Role: ${user.role_name})`);
            return true;
          }
        }
      } catch (e) {
        console.warn('📋 Error parsing userData for page access:', e);
      }
      
      return hasPermission(pageId, 'can_view');
    } catch (error) {
      console.error('📋 Error checking page access:', error);
      return false;
    }
  };

  return (
    <PermissionsContext.Provider value={{
      permissions,
      loading,
      error,
      hasPermission,
      canAccessPage,
      refetch: fetchUserPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}; 