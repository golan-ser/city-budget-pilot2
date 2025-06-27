import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { ErrorHandler } from '@/utils/errorHandling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
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
  Settings,
  UserCheck,
  FileSpreadsheet,
  FileText
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

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_active: boolean;
  last_login: string | null;
}

interface Page {
  page_id: number;
  page_name: string;
  page_route: string;
  page_description: string;
  sort_order: number;
}

interface UserPermission {
  permission_id?: number;
  tenant_id: number;
  user_id: number;
  page_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  custom_permissions?: string; // JSON for future detailed permissions
}

interface UserPermissionsData {
  user: User;
  pages: Page[];
  permissions: Record<string, UserPermission>;
  roleDefaults: Record<string, UserPermission>; // Default permissions from role
}

const UserPermissionsMatrix: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, Partial<UserPermission>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchSystems();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchUsers();
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (selectedTenant && selectedSystem && selectedUser) {
      fetchUserPermissions();
    }
  }, [selectedTenant, selectedSystem, selectedUser]);

  const fetchTenants = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.ADMIN.TENANTS);
      const filteredTenants = ErrorHandler.safeFilter<Tenant>(data, (t: Tenant) => t.status === 'active');
      setTenants(filteredTenants);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('שגיאה בטעינת רשויות');
    }
  };

  const fetchSystems = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.ADMIN.SYSTEMS);
      const filteredSystems = ErrorHandler.safeFilter<System>(data, (s: System) => s.is_active);
      setSystems(filteredSystems);
    } catch (err) {
      console.error('Error fetching systems:', err);
      setError('שגיאה בטעינת מערכות');
    }
  };

  const fetchUsers = async () => {
    if (!selectedTenant) return;

    try {
      const result = await api.get(`${API_ENDPOINTS.ADMIN.USERS}?tenantId=${selectedTenant}`);
      console.log('Users API response:', result); // Debug log
      
      // Handle both formats: direct data or wrapped in data object
      const data = result.data || result;
      const activeUsers = ErrorHandler.safeFilter<User>(data, (u: User) => u.status === 'active');
      console.log('Filtered users:', activeUsers); // Debug log
      
      setUsers(activeUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('שגיאה בטעינת משתמשים');
    }
  };

  const fetchUserPermissions = async () => {
    if (!selectedTenant || !selectedSystem || !selectedUser) return;

    try {
      setLoading(true);
      const data = await api.get(
        `${API_ENDPOINTS.ADMIN.PERMISSIONS}/user?tenantId=${selectedTenant}&systemId=${selectedSystem}&userId=${selectedUser}`
      );

      console.log('🔍 User permissions API response:', data);
      console.log('📄 Pages data:', data.data?.pages);
      console.log('🔐 Permissions data:', data.data?.permissions);
      console.log('👤 User data:', data.data?.user);
      setUserPermissions(data.data);
      setChanges({});
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('שגיאה בטעינת הרשאות משתמש');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermission = (pageId: number, field: keyof UserPermission, value: boolean) => {
    const key = `${selectedUser}-${pageId}`;
    const currentPermission = userPermissions?.permissions[key] || {
      tenant_id: selectedTenant!,
      user_id: selectedUser!,
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

  const getUserPermissionValue = (pageId: number, field: keyof UserPermission): boolean => {
    const key = `${selectedUser}-${pageId}`;
    const changedPermission = changes[key];
    const originalPermission = userPermissions?.permissions[key];
    const roleDefault = userPermissions?.roleDefaults[pageId];
    
    if (changedPermission && field in changedPermission) {
      return changedPermission[field] as boolean;
    }
    
    if (originalPermission && field in originalPermission) {
      return originalPermission[field] as boolean;
    }

    // Fallback to role default
    if (roleDefault && field in roleDefault) {
      return roleDefault[field] as boolean;
    }
    
    return false;
  };

  const isPermissionCustomized = (pageId: number, field: keyof UserPermission): boolean => {
    const key = `${selectedUser}-${pageId}`;
    const originalPermission = userPermissions?.permissions[key];
    const roleDefault = userPermissions?.roleDefaults[pageId];
    
    if (!originalPermission || !roleDefault) return false;
    
    return originalPermission[field] !== roleDefault[field];
  };

  const saveUserPermissions = async () => {
    if (!selectedTenant || !selectedSystem || !selectedUser) return;

    try {
      setSaving(true);
      const permissionsToSave = Object.values(changes).map(permission => ({
        ...permission,
        tenant_id: selectedTenant,
        user_id: selectedUser,
        system_id: selectedSystem
      }));

      await api.post(`${API_ENDPOINTS.ADMIN.PERMISSIONS}/user`, { permissions: permissionsToSave });
      
      await fetchUserPermissions(); // Refresh data
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

  const resetToRoleDefaults = () => {
    if (!userPermissions?.pages || !userPermissions?.roleDefaults) return;
    
    const resetChanges: Record<string, Partial<UserPermission>> = {};
    
    userPermissions.pages.forEach(page => {
      const roleDefault = userPermissions.roleDefaults[page.page_id];
      if (roleDefault) {
        const key = `${selectedUser}-${page.page_id}`;
        resetChanges[key] = { ...roleDefault };
      }
    });
    
    setChanges(resetChanges);
    setHasUnsavedChanges(true);
  };

  const PermissionHeader: React.FC<{ type: string; label: string }> = ({ type, label }) => (
    <div className="text-center">
      <div className="text-xs font-medium">{label}</div>
    </div>
  );

  const getUserInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const exportAsExcel = async () => {
    if (!selectedTenant || !selectedSystem) return;

    try {
      const result = await api.get(
        `/admin/export/user-permissions/excel?tenantId=${selectedTenant}&systemId=${selectedSystem}`
      );
      
      if (result.success && result.data) {
        const worksheet = XLSX.utils.json_to_sheet(result.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "הרשאות משתמשים");
        XLSX.writeFile(workbook, result.filename || "user_permissions.xlsx");
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setError('שגיאה בייצוא ל-Excel');
    }
  };

  const exportAsPDF = async () => {
    if (!selectedTenant || !selectedSystem) return;

    try {
      const result = await api.get(
        `/admin/export/user-permissions/pdf?tenantId=${selectedTenant}&systemId=${selectedSystem}`
      );

      if (result.success && result.url) {
        // If API returns a URL to the generated PDF
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = result.url;
        a.download = result.filename || `user_permissions_${selectedTenant}_${selectedSystem}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (result.content) {
        // If API returns HTML content
        const blob = new Blob([result.content], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = result.filename || `user_permissions_${selectedTenant}_${selectedSystem}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('שגיאה בייצוא ל-PDF');
    }
  };

  // Selection UI
  if (!selectedTenant || !selectedSystem || !selectedUser) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6" />
          <h2 className="text-2xl font-bold">הרשאות אישיות למשתמשים</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>בחר משתמש לניהול הרשאות</CardTitle>
            <CardDescription>
              בחר רשות, מערכת ומשתמש ספציפי כדי להגדיר הרשאות מותאמות אישית
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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

              <div>
                <label className="text-sm font-medium mb-2 block">משתמש</label>
                <Select 
                  value={selectedUser?.toString()} 
                  onValueChange={(value) => setSelectedUser(parseInt(value))}
                  disabled={!selectedTenant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משתמש" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
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

  const selectedUserData = users.find(u => u.id === selectedUser);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6" />
          <h2 className="text-2xl font-bold">הרשאות אישיות</h2>
          {selectedUserData && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm">
                  {getUserInitials(selectedUserData.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedUserData.full_name}</div>
                <Badge variant="outline" className="text-xs">
                  {selectedUserData.role}
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportAsExcel}
            disabled={!selectedTenant || !selectedSystem}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            ייצוא Excel
          </Button>
          
          <Button
            variant="outline"
            onClick={exportAsPDF}
            disabled={!selectedTenant || !selectedSystem}
          >
            <FileText className="h-4 w-4 mr-2" />
            ייצוא PDF
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTenant(null);
              setSelectedSystem(null);
              setSelectedUser(null);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            שנה בחירה
          </Button>
          
          <Button
            variant="outline"
            onClick={resetToRoleDefaults}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            איפוס לברירת מחדל
          </Button>
          
          {hasUnsavedChanges && (
            <>
              <Button variant="outline" onClick={resetChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                בטל שינויים
              </Button>
              <Button onClick={saveUserPermissions} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'שומר...' : 'שמור הרשאות'}
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
            <p>טוען הרשאות משתמש...</p>
          </div>
        </div>
      ) : userPermissions ? (
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטי המשתמש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">שם מלא</label>
                  <p className="text-sm text-muted-foreground">{userPermissions?.user?.full_name || 'לא זמין'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">אימייל</label>
                  <p className="text-sm text-muted-foreground">{userPermissions?.user?.email || 'לא זמין'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">תפקיד בסיסי</label>
                  <Badge variant="outline">{userPermissions?.user?.role || 'לא זמין'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">כניסה אחרונה</label>
                  <p className="text-sm text-muted-foreground">
                    {userPermissions?.user?.last_login 
                      ? new Date(userPermissions.user.last_login).toLocaleString('he-IL')
                      : 'מעולם לא נכנס'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>הרשאות מותאמות אישית</CardTitle>
              <CardDescription>
                הגדר הרשאות ספציפיות למשתמש זה. הרשאות מותאמות אישית יחליפו את הרשאות התפקיד הבסיסיות.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr>
                      <th className="border border-gray-200 p-3 text-right font-medium bg-gray-50 min-w-[200px]">
                        עמוד במערכת
                      </th>
                      <th className="border border-gray-200 p-2 text-center bg-gray-50 min-w-[400px]">
                        <div className="space-y-1">
                          <div className="font-medium">הרשאות אישיות</div>
                          <div className="text-xs text-muted-foreground">הרשאות מותאמות למשתמש זה</div>
                          <div className="grid grid-cols-5 gap-1 mt-2">
                            <PermissionHeader type="view" label="צפייה" />
                            <PermissionHeader type="create" label="יצירה" />
                            <PermissionHeader type="edit" label="עריכה" />
                            <PermissionHeader type="delete" label="מחיקה" />
                            <PermissionHeader type="export" label="ייצוא" />
                          </div>
                        </div>
                      </th>
                      <th className="border border-gray-200 p-2 text-center bg-gray-100 min-w-[300px]">
                        <div className="space-y-1">
                          <div className="font-medium">ברירת מחדל מתפקיד</div>
                          <div className="text-xs text-muted-foreground">הרשאות בסיסיות לפי התפקיד</div>
                          <div className="grid grid-cols-5 gap-1 mt-2">
                            <PermissionHeader type="view" label="צפייה" />
                            <PermissionHeader type="create" label="יצירה" />
                            <PermissionHeader type="edit" label="עריכה" />
                            <PermissionHeader type="delete" label="מחיקה" />
                            <PermissionHeader type="export" label="ייצוא" />
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPermissions?.pages?.map(page => (
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
                        {/* Custom Permissions */}
                        <td className="border border-gray-200 p-2">
                          <div className="grid grid-cols-5 gap-2">
                            {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export'].map(permission => (
                              <div key={permission} className="flex justify-center relative">
                                <Checkbox
                                  checked={getUserPermissionValue(page.page_id, permission as keyof UserPermission)}
                                  onCheckedChange={(checked) => 
                                    updateUserPermission(page.page_id, permission as keyof UserPermission, checked as boolean)
                                  }
                                />
                                {isPermissionCustomized(page.page_id, permission as keyof UserPermission) && (
                                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* Role Default Permissions */}
                        <td className="border border-gray-200 p-2 bg-gray-50">
                          <div className="grid grid-cols-5 gap-2">
                            {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export'].map(permission => (
                              <div key={permission} className="flex justify-center">
                                                                 <Checkbox
                                   checked={Boolean(userPermissions?.roleDefaults?.[page.page_id]?.[permission as keyof UserPermission]) || false}
                                   disabled={true}
                                 />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>נקודה כחולה מציינת הרשאה מותאמת אישית (שונה מברירת המחדל של התפקיד)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">לא נמצאו הרשאות עבור המשתמש הנבחר</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserPermissionsMatrix;