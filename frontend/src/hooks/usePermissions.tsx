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
  dashboard: { can_view: true, can_edit: false, can_delete: false, can_create: false, can_export: true, can_import: false },
  projects: { can_view: true, can_edit: false, can_delete: false, can_create: false, can_export: true, can_import: false },
  tabarim: { can_view: true, can_edit: false, can_delete: false, can_create: false, can_export: true, can_import: false },
  reports: { can_view: true, can_edit: false, can_delete: false, can_create: false, can_export: true, can_import: false },
  admin: { can_view: false, can_edit: false, can_delete: false, can_create: false, can_export: false, can_import: false }
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
    
    // Validate each permission entry
    Object.keys(DEFAULT_PERMISSIONS).forEach(pageId => {
      validated[pageId] = validatePermission(data[pageId]);
    });

    // Add any additional valid permissions from data
    Object.keys(data).forEach(pageId => {
      if (!validated[pageId] && data[pageId]) {
        validated[pageId] = validatePermission(data[pageId]);
      }
    });

    return validated;
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