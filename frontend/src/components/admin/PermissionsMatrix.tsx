import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Save, 
  RotateCcw, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  Users,
  Settings
} from 'lucide-react';

interface Tenant {
  tenant_id: number;
  name: string;
  status: string;
}

interface System {
  system_id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  is_system_role: boolean;
  user_count: number;
}

interface Page {
  page_id: number;
  page_name: string;
  page_route: string;
  page_description: string;
  sort_order: number;
}

interface Permission {
  permission_id: number;
  tenant_id: number;
  role_id: number;
  page_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface PermissionsMatrix {
  roles: Role[];
  pages: Page[];
  permissions: Record<string, Permission>;
}

const PermissionsMatrix: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, Partial<Permission>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchSystems();
  }, []);

  useEffect(() => {
    if (selectedTenant && selectedSystem) {
      fetchPermissionsMatrix();
    }
  }, [selectedTenant, selectedSystem]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/tenants', {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data.filter((t: Tenant) => t.status === 'active'));
    } catch (err) {
      setError('שגיאה בטעינת רשויות');
    }
  };

  const fetchSystems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/systems', {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch systems');
      const data = await response.json();
      setSystems(data.filter((s: System) => s.is_active));
    } catch (err) {
      setError('שגיאה בטעינת מערכות');
    }
  };

  const fetchPermissionsMatrix = async () => {
    if (!selectedTenant || !selectedSystem) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/admin/permissions/matrix?tenantId=${selectedTenant}&systemId=${selectedSystem}`,
        {
          headers: {
            'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch permissions matrix');
      const data = await response.json();
      setMatrix(data);
      setChanges({});
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('שגיאה בטעינת מטריצת הרשאות');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (roleId: number, pageId: number, field: keyof Permission, value: boolean) => {
    const key = `${roleId}-${pageId}`;
    const currentPermission = matrix?.permissions[key] || {
      tenant_id: selectedTenant!,
      role_id: roleId,
      page_id: pageId,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_export: false
    };

    const newPermission = {
      ...currentPermission,
      ...changes[key],
      [field]: value
    };

    // Auto-enable view when enabling other permissions
    if (field !== 'can_view' && value && !newPermission.can_view) {
      newPermission.can_view = true;
    }

    // Auto-disable other permissions when disabling view
    if (field === 'can_view' && !value) {
      newPermission.can_create = false;
      newPermission.can_edit = false;
      newPermission.can_delete = false;
      newPermission.can_export = false;
    }

    setChanges(prev => ({
      ...prev,
      [key]: newPermission
    }));
    setHasUnsavedChanges(true);
  };

  const getPermissionValue = (roleId: number, pageId: number, field: keyof Permission): boolean => {
    const key = `${roleId}-${pageId}`;
    const changedPermission = changes[key];
    const originalPermission = matrix?.permissions[key];
    
    if (changedPermission && field in changedPermission) {
      return changedPermission[field] as boolean;
    }
    
    return originalPermission?.[field] as boolean || false;
  };

  const savePermissions = async () => {
    if (!selectedTenant || Object.keys(changes).length === 0) return;

    try {
      setSaving(true);
      const permissions = Object.values(changes).map(permission => ({
        tenantId: selectedTenant,
        roleId: permission.role_id,
        pageId: permission.page_id,
        canView: permission.can_view,
        canCreate: permission.can_create,
        canEdit: permission.can_edit,
        canDelete: permission.can_delete,
        canExport: permission.can_export
      }));

      const response = await fetch('http://localhost:3000/api/admin/permissions', {
        method: 'PUT',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });

      if (!response.ok) throw new Error('Failed to save permissions');

      // Refresh matrix
      await fetchPermissionsMatrix();
      setError(null);
    } catch (err) {
      setError('שגיאה בשמירת הרשאות');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setChanges({});
    setHasUnsavedChanges(false);
  };

  const setRolePermissions = (roleId: number, permissions: Partial<Record<keyof Permission, boolean>>) => {
    if (!matrix) return;

    matrix.pages.forEach(page => {
      Object.entries(permissions).forEach(([field, value]) => {
        if (field !== 'permission_id' && field !== 'tenant_id' && field !== 'role_id' && field !== 'page_id') {
          updatePermission(roleId, page.page_id, field as keyof Permission, value);
        }
      });
    });
  };

  const PermissionIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      default: return null;
    }
  };

  const PermissionHeader: React.FC<{ type: string; label: string }> = ({ type, label }) => (
    <div className="text-center p-2 border-b">
      <div className="flex flex-col items-center gap-1">
        <PermissionIcon type={type} />
        <span className="text-xs font-medium">{label}</span>
      </div>
    </div>
  );

  if (!selectedTenant || !selectedSystem) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">מטריצת הרשאות</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>בחירת רשות ומערכת</CardTitle>
            <CardDescription>בחר רשות ומערכת כדי לנהל הרשאות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">רשות</label>
                <Select value={selectedTenant?.toString()} onValueChange={(value) => setSelectedTenant(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר רשות" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.tenant_id} value={tenant.tenant_id.toString()}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">מערכת</label>
                <Select value={selectedSystem?.toString()} onValueChange={(value) => setSelectedSystem(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מערכת" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map(system => (
                      <SelectItem key={system.system_id} value={system.system_id.toString()}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">מטריצת הרשאות</h2>
          <Badge variant="outline">
            {tenants.find(t => t.tenant_id === selectedTenant)?.name} - {systems.find(s => s.system_id === selectedSystem)?.name}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTenant(null);
              setSelectedSystem(null);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            שנה בחירה
          </Button>
          
          {hasUnsavedChanges && (
            <>
              <Button variant="outline" onClick={resetChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                בטל שינויים
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasUnsavedChanges && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            יש לך שינויים שלא נשמרו. אל תשכח לשמור את השינויים.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>טוען מטריצת הרשאות...</p>
          </div>
        </div>
      ) : matrix ? (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
              <CardDescription>הגדר הרשאות מהירות לתפקידים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {matrix.roles.map(role => (
                  <div key={role.role_id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{role.role_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {role.user_count} משתמשים
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRolePermissions(role.role_id, { can_view: true })}
                      >
                        צפייה בלבד
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRolePermissions(role.role_id, { 
                          can_view: true, can_create: true, can_edit: true, can_export: true 
                        })}
                      >
                        מלא
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRolePermissions(role.role_id, { 
                          can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false 
                        })}
                      >
                        ללא
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>מטריצת הרשאות מפורטת</CardTitle>
              <CardDescription>
                הגדר הרשאות ספציפיות לכל תפקיד ועמוד במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr>
                      <th className="border border-gray-200 p-3 text-right font-medium bg-gray-50 min-w-[200px]">
                        עמוד / תפקיד
                      </th>
                      {matrix.roles.map(role => (
                        <th key={role.role_id} className="border border-gray-200 p-2 text-center bg-gray-50 min-w-[280px]">
                          <div className="space-y-1">
                            <div className="font-medium">{role.role_name}</div>
                            <div className="text-xs text-muted-foreground">{role.role_description}</div>
                            {role.is_system_role && (
                              <Badge variant="secondary" className="text-xs">מערכת</Badge>
                            )}
                            <div className="grid grid-cols-5 gap-1 mt-2">
                              <PermissionHeader type="view" label="צפייה" />
                              <PermissionHeader type="create" label="יצירה" />
                              <PermissionHeader type="edit" label="עריכה" />
                              <PermissionHeader type="delete" label="מחיקה" />
                              <PermissionHeader type="export" label="ייצוא" />
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.pages.map(page => (
                      <tr key={page.page_id}>
                        <td className="border border-gray-200 p-3 font-medium">
                          <div>
                            <div className="font-medium">{page.page_name}</div>
                            <div className="text-sm text-muted-foreground">{page.page_route}</div>
                            {page.page_description && (
                              <div className="text-xs text-muted-foreground mt-1">{page.page_description}</div>
                            )}
                          </div>
                        </td>
                        {matrix.roles.map(role => (
                          <td key={role.role_id} className="border border-gray-200 p-2">
                            <div className="grid grid-cols-5 gap-2">
                              {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export'].map(permission => (
                                <div key={permission} className="flex justify-center">
                                  <Checkbox
                                    checked={getPermissionValue(role.role_id, page.page_id, permission as keyof Permission)}
                                    onCheckedChange={(checked) => 
                                      updatePermission(role.role_id, page.page_id, permission as keyof Permission, checked as boolean)
                                    }
                                    disabled={role.is_system_role}
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">לא נמצאו הרשאות עבור הבחירה הנוכחית</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsMatrix;