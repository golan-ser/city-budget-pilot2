import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminService } from '@/services/adminService';

export interface Permission {
  page_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

export interface UserPermissions {
  [key: string]: Permission;
}

interface PermissionsContextType {
  permissions: UserPermissions;
  loading: boolean;
  error: string | null;
  hasPermission: (pageId: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export') => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Default permissions for fallback when API is not available
const defaultPermissions: UserPermissions = {
  dashboard: {
    page_id: 1,
    can_view: true,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_export: true
  },
  projects: {
    page_id: 2,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: false,
    can_export: true
  },
  tabarim: {
    page_id: 3,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: false,
    can_export: true
  },
  reports: {
    page_id: 4,
    can_view: true,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_export: true
  },
  admin: {
    page_id: 5,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_export: true
  }
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch permissions from API
      const data = await AdminService.fetchUserPermissions(1, 1, '3');
      
      // Handle different possible response structures
      let apiPermissions: UserPermissions = {};
      
      if (data && typeof data === 'object') {
        // If data has permissions property
        if (data.permissions && typeof data.permissions === 'object') {
          apiPermissions = data.permissions;
        }
        // If data has data.permissions property
        else if (data.data && data.data.permissions && typeof data.data.permissions === 'object') {
          apiPermissions = data.data.permissions;
        }
        // If data itself is the permissions object
        else if (data.page_id || Object.values(data).some((val: any) => val && val.page_id)) {
          apiPermissions = data;
        }
      }
      
      // Validate that we have valid permissions
      const hasValidPermissions = Object.keys(apiPermissions).length > 0 && 
        Object.values(apiPermissions).every((perm: any) => 
          perm && typeof perm === 'object' && 
          typeof perm.can_view === 'boolean'
        );
      
      if (hasValidPermissions) {
        setPermissions(apiPermissions);
        console.log('✅ Permissions loaded from API:', apiPermissions);
      } else {
        console.warn('⚠️ Invalid permissions structure from API, using defaults');
        setPermissions(defaultPermissions);
      }
      
    } catch (err: any) {
      console.warn('📋 API not available, using default permissions:', err);
      setError('API not available');
      setPermissions(defaultPermissions); // Use default permissions as fallback
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (pageId: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
    try {
      // Extra safety checks
      if (!permissions || typeof permissions !== 'object') {
        console.warn('Permissions object is invalid, using false');
        return false;
      }

      const permission = permissions[pageId];
      if (!permission || typeof permission !== 'object') {
        console.warn(`Permission for pageId ${pageId} not found or invalid`);
        return false;
      }

      // Ensure all required properties exist
      if (typeof permission.can_view !== 'boolean' ||
          typeof permission.can_create !== 'boolean' ||
          typeof permission.can_edit !== 'boolean' ||
          typeof permission.can_delete !== 'boolean' ||
          typeof permission.can_export !== 'boolean') {
        console.warn(`Permission object for ${pageId} has invalid structure:`, permission);
        return false;
      }

      switch (action) {
        case 'view': return Boolean(permission.can_view);
        case 'create': return Boolean(permission.can_create);
        case 'edit': return Boolean(permission.can_edit);
        case 'delete': return Boolean(permission.can_delete);
        case 'export': return Boolean(permission.can_export);
        default: 
          console.warn(`Invalid action: ${action}`);
          return false;
      }
    } catch (err) {
      console.error('Error in hasPermission:', err, { pageId, action });
      return false;
    }
  };

  const refreshPermissions = async () => {
    try {
      await fetchPermissions();
    } catch (err) {
      console.error('Error refreshing permissions:', err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <PermissionsContext.Provider value={{
      permissions,
      loading,
      error,
      hasPermission,
      refreshPermissions
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