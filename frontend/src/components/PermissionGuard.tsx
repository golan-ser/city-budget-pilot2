import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';

interface Permission {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_create: boolean;
  can_export: boolean;
  can_import: boolean;
}

interface PermissionGuardProps {
  pageId: number;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'export';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  pageId,
  action = 'view',
  children,
  fallback
}) => {
  const { hasPermission, loading } = usePermissions();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h2>
          <p className="text-gray-600">עליך להתחבר למערכת</p>
        </div>
      </div>
    );
  }

  // Map action to permission key
  const permissionKey = `can_${action}` as keyof Permission;
  const hasAccess = hasPermission(pageId.toString(), permissionKey);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">אין הרשאה</h2>
          <p className="text-gray-600 mb-4">
            אין לך הרשאה לצפות בעמוד זה
          </p>
          <div className="text-sm text-gray-500">
            <p>משתמש: {user.full_name}</p>
            <p>תפקיד: {user.role_name}</p>
            <p>רשות: {user.tenant_name}</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 