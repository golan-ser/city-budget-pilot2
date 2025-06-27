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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { API_BASE_URL } from '../../lib/apiConfig';

interface Tenant {
  tenant_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  system_count: number;
}

interface System {
  system_id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  tenant_active?: boolean;
  page_count: number;
}

const TenantsManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantSystems, setTenantSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });

  useEffect(() => {
    fetchTenants();
    fetchSystems();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await AdminService.fetchTenants();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת רשויות');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystems = async () => {
    try {
      const data = await AdminService.fetchSystems();
      setSystems(data);
    } catch (err) {
      console.error('Error fetching systems:', err);
    }
  };

  const fetchTenantSystems = async (tenantId: number) => {
    try {
      const data = await AdminService.fetchTenantSystems(tenantId);
      setTenantSystems(data);
    } catch (err) {
      console.error('Error fetching tenant systems:', err);
    }
  };

  const handleCreateTenant = async () => {
    try {
      await AdminService.createTenant(formData);
      await fetchTenants();
      setIsDialogOpen(false);
      setFormData({ name: '', status: 'active' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת רשות');
    }
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    try {
      await AdminService.updateTenant(editingTenant.tenant_id, formData);
      await fetchTenants();
      setIsDialogOpen(false);
      setEditingTenant(null);
      setFormData({ name: '', status: 'active' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון רשות');
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הרשות? פעולה זו אינה הפיכה.')) {
      return;
    }

    try {
      await AdminService.deleteTenant(tenantId);
      await fetchTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת רשות');
    }
  };

  const updateTenantSystem = async (tenantId: number, systemId: number, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tenants/${tenantId}/systems/${systemId}`, {
        method: 'PUT',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (!response.ok) throw new Error('Failed to update tenant system');
      
      // Refresh data
      fetchTenants();
      fetchSystems();
    } catch (err) {
      setError('שגיאה בעדכון מערכת לרשות');
    }
  };

  const openCreateDialog = () => {
    setEditingTenant(null);
    setFormData({ name: '', status: 'active' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({ name: tenant.name, status: tenant.status });
    setIsDialogOpen(true);
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    fetchTenantSystems(tenant.tenant_id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>טוען רשויות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            ניהול רשויות
          </h2>
          <p className="text-muted-foreground">ניהול רשויות במערכת והגדרת מערכות זמינות</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              רשות חדשה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'עריכת רשות' : 'רשות חדשה'}
              </DialogTitle>
              <DialogDescription>
                {editingTenant ? 'עדכן פרטי הרשות' : 'הוסף רשות חדשה למערכת'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">שם הרשות</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="הכנס שם רשות"
                />
              </div>
              <div>
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">פעיל</SelectItem>
                    <SelectItem value="inactive">לא פעיל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={editingTenant ? handleUpdateTenant : handleCreateTenant}>
                {editingTenant ? 'עדכן' : 'צור'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle>רשימת רשויות</CardTitle>
            <CardDescription>כל הרשויות הרשומות במערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הרשות</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>משתמשים</TableHead>
                  <TableHead>מערכות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow 
                    key={tenant.tenant_id}
                    className={selectedTenant?.tenant_id === tenant.tenant_id ? 'bg-muted' : ''}
                  >
                    <TableCell 
                      className="font-medium cursor-pointer"
                      onClick={() => selectTenant(tenant)}
                    >
                      {tenant.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.user_count}</TableCell>
                    <TableCell>{tenant.system_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.tenant_id)}
                          disabled={tenant.user_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tenant Systems Management */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTenant ? `מערכות - ${selectedTenant.name}` : 'בחר רשות'}
            </CardTitle>
            <CardDescription>
              {selectedTenant ? 'הגדר אילו מערכות זמינות לרשות זו' : 'בחר רשות כדי לנהל את המערכות שלה'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTenant ? (
              <div className="space-y-4">
                {tenantSystems.map((system) => (
                  <div key={system.system_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{system.name}</h4>
                        <p className="text-sm text-muted-foreground">{system.description}</p>
                        <p className="text-xs text-muted-foreground">{system.page_count} עמודים</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={system.tenant_active || false}
                        onCheckedChange={(checked) => 
                          updateTenantSystem(selectedTenant.tenant_id, system.system_id, checked)
                        }
                      />
                      {system.tenant_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>בחר רשות מהרשימה כדי לנהל את המערכות שלה</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantsManagement; 