import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Crown,
  AlertTriangle,
  Building
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { API_BASE_URL } from '../../lib/apiConfig';

interface Tenant {
  tenant_id: number;
  name: string;
  status: string;
}

interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  is_system_role: boolean;
  is_active: boolean;
  user_count: number;
  permission_count: number;
  created_at: string;
}

const RolesManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    roleName: '',
    roleDescription: '',
    isActive: true
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchRoles();
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const data = await AdminService.fetchTenants();
      setTenants(data.filter((t: Tenant) => t.status === 'active'));
    } catch (err) {
      setError('שגיאה בטעינת רשויות');
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await AdminService.fetchRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת תפקידים');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      await AdminService.createRole(formData);
      await fetchRoles();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת תפקיד');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      await AdminService.updateRole(editingRole.role_id, formData);
      await fetchRoles();
      setIsDialogOpen(false);
      setEditingRole(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון תפקיד');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תפקיד זה?')) return;

    try {
      await AdminService.deleteRole(roleId);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת תפקיד');
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.role_name,
      roleDescription: role.role_description || '',
      isActive: role.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      roleName: '',
      roleDescription: '',
      isActive: true
    });
    setEditingRole(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UserCheck className="h-6 w-6" />
        <h2 className="text-2xl font-bold">ניהול תפקידים</h2>
      </div>

      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle>בחירת רשות</CardTitle>
          <CardDescription>בחר רשות כדי לנהל את התפקידים שלה</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenant?.toString()} onValueChange={(value) => setSelectedTenant(parseInt(value))}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="בחר רשות" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(tenant => (
                <SelectItem key={tenant.tenant_id} value={tenant.tenant_id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {tenant.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Roles Management */}
      {selectedTenant && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  תפקידים ב{tenants.find(t => t.tenant_id === selectedTenant)?.name}
                </CardTitle>
                <CardDescription>
                  ניהול תפקידים והרשאות ברשות
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    תפקיד חדש
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRole ? 'עריכת תפקיד' : 'תפקיד חדש'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRole ? 'עדכן פרטי התפקיד' : 'הוסף תפקיד חדש לרשות'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roleName">שם התפקיד</Label>
                      <Input
                        id="roleName"
                        value={formData.roleName}
                        onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                        placeholder="הכנס שם תפקיד"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleDescription">תיאור התפקיד</Label>
                      <Textarea
                        id="roleDescription"
                        value={formData.roleDescription}
                        onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                        placeholder="תיאור מפורט של התפקיד והאחריות"
                        rows={3}
                      />
                    </div>
                    {editingRole && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="isActive">תפקיד פעיל</Label>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                      {editingRole ? 'עדכן' : 'צור'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">טוען תפקידים...</p>
                </div>
              </div>
            ) : roles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם התפקיד</TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead>סוג</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>משתמשים</TableHead>
                    <TableHead>הרשאות</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.role_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {role.is_system_role && <Crown className="h-4 w-4 text-yellow-500" />}
                          <span className="font-medium">{role.role_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={role.role_description}>
                          {role.role_description || 'ללא תיאור'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_system_role ? 'default' : 'outline'}>
                          {role.is_system_role ? 'מערכת' : 'רשות'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? 'default' : 'secondary'}>
                          {role.is_active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{role.user_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-4 w-4" />
                          <span>{role.permission_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(role.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                            disabled={role.is_system_role}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role.role_id.toString())}
                            disabled={role.is_system_role || role.user_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>לא נמצאו תפקידים ברשות זו</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolesManagement; 