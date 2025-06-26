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
      setPermissions(data.permissions || defaultPermissions);
      
    } catch (err: any) {
      console.warn('📋 API not available, using default permissions:', err);
      setError('API not available');
      setPermissions(defaultPermissions); // Use default permissions as fallback
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (pageId: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
    const permission = permissions[pageId];
    if (!permission) return false;

    switch (action) {
      case 'view': return permission.can_view;
      case 'create': return permission.can_create;
      case 'edit': return permission.can_edit;
      case 'delete': return permission.can_delete;
      case 'export': return permission.can_export;
      default: return false;
    }
  };

  const refreshPermissions = async () => {
    await fetchPermissions();
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