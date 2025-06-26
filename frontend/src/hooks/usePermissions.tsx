import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { AdminService } from '@/services/adminService';

interface UserPermission {
  page_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface UserPermissions {
  [key: string]: UserPermission;
}

// Default permissions for all users - everything is allowed
const DEFAULT_PERMISSIONS: UserPermissions = {
  '1': { page_id: 1, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // Dashboard
  '2': { page_id: 2, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // Projects
  '3': { page_id: 3, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // Tabarim
  '4': { page_id: 4, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // Reports
  '11': { page_id: 11, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // Reports Management
  '25': { page_id: 25, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }, // System Admin
};

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false); // Start with false, use defaults immediately
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    if (!user || !isAuthenticated) {
      setPermissions(DEFAULT_PERMISSIONS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await AdminService.fetchUserPermissions(
        user.tenant_id || 1,
        1,
        user.id.toString()
      );
      console.log('📋 User permissions loaded:', data.data);
      
      // Convert permissions and roleDefaults to a combined permissions object
      const userPermissions: UserPermissions = {};
      
      if (data.data?.pages) {
        data.data.pages.forEach((page: any) => {
          const userPerm = data.data.permissions?.[`${user.id}-${page.page_id}`];
          const roleDefault = data.data.roleDefaults?.[page.page_id];
          
          // Use user-specific permission if exists, otherwise use role default, otherwise use system default
          userPermissions[page.page_id] = userPerm || roleDefault || DEFAULT_PERMISSIONS[page.page_id] || {
            page_id: page.page_id,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
            can_export: true
          };
        });
      }
      
      // If no permissions returned, use defaults
      if (Object.keys(userPermissions).length === 0) {
        setPermissions(DEFAULT_PERMISSIONS);
      } else {
        setPermissions(userPermissions);
      }
      setError(null);
    } catch (err) {
      console.log('📋 API not available, using default permissions:', err);
      setPermissions(DEFAULT_PERMISSIONS);
      setError(null); // Don't show error, just use defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user, isAuthenticated]);

  const hasPermission = (pageId: number, action: 'view' | 'create' | 'edit' | 'delete' | 'export' = 'view'): boolean => {
    const permission = permissions[pageId];
    if (!permission) {
      // If no specific permission found, default to allowing everything
      return true;
    }
    
    switch (action) {
      case 'view': return permission.can_view;
      case 'create': return permission.can_create;
      case 'edit': return permission.can_edit;
      case 'delete': return permission.can_delete;
      case 'export': return permission.can_export;
      default: return true;
    }
  };

  const canViewPage = (pageId: number): boolean => {
    return hasPermission(pageId, 'view');
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canViewPage,
    refetchPermissions: fetchPermissions
  };
}; 