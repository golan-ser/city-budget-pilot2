import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  UserCheck, 
  UserPlus,
  AlertTriangle,
  Building,
  Crown,
  Key,
  Shuffle,
  Copy,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Plus,
  Edit,
  Lock,
  Unlock,
  Search,
  Filter,
  UserCog,
  Shield,
  UserX
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import existing components
import RolesManagement from './RolesManagement';
import PermissionsMatrix from './PermissionsMatrix';
import UserPermissionsMatrix from './UserPermissionsMatrix';
import LockedUsersManagement from './LockedUsersManagement';

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
}

interface System {
  system_id: number;
  name: string;
}

interface User {
  id: number; // Primary key from database
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  last_login: string;
  role_name: string;
  role_description: string;
  tenant_name: string;
}

// Enhanced Users List Component
const UsersListTab = ({ selectedTenant, selectedSystem }: { selectedTenant: number | null, selectedSystem: number | null }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleExport = (type: 'excel' | 'pdf') => {
    console.log(`Exporting users as ${type} for tenant ${selectedTenant}, system ${selectedSystem}`);
    // TODO: Implement export functionality
  };

  const handlePasswordReset = (userId: number) => {
    console.log(`Resetting password for user ${userId}`);
    // TODO: Implement password reset
  };

  const handleUserEdit = (userId: number) => {
    console.log(`Editing user ${userId}`);
    // TODO: Implement user edit
  };

  const handleUserLock = (userId: number) => {
    console.log(`Locking user ${userId}`);
    // TODO: Implement user lock
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">רשימת משתמשים</h3>
          <p className="text-gray-600">ניהול משתמשים, עריכה ואיפוס סיסמאות</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            ייצוא Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            ייצוא PDF
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            הוסף משתמש
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">חיפוש משתמש</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="חפש לפי שם או אימייל..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">סטטוס</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                  <SelectItem value="locked">נעול</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">לא נמצאו משתמשים</p>
                {!selectedTenant && (
                  <p className="text-sm text-gray-400">בחר רשות ומערכת כדי לראות משתמשים</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.role_name}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleUserEdit(user.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePasswordReset(user.id)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUserLock(user.id)}
                          className={user.status === 'locked' ? 'text-green-600' : 'text-red-600'}
                        >
                          {user.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Users Management Component
export const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState("users-list");
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    // Load tenants and systems
    // TODO: Implement API calls
    setTenants([
      { tenant_id: 1, name: "Demo Authority", status: "active" },
      { tenant_id: 2, name: "Test Authority", status: "active" }
    ]);
    setSystems([
      { system_id: 1, name: "Budget System" },
      { system_id: 2, name: "HR System" }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Context Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            בחירת הקשר
          </CardTitle>
          <CardDescription>
            בחר רשות ומערכת לניהול המשתמשים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenant">רשות</Label>
              <Select value={selectedTenant?.toString()} onValueChange={(value) => setSelectedTenant(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר רשות" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenant_id} value={tenant.tenant_id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="system">מערכת</Label>
              <Select value={selectedSystem?.toString()} onValueChange={(value) => setSelectedSystem(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מערכת" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((system) => (
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

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users-list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            רשימת משתמשים
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            ניהול תפקידים
          </TabsTrigger>
          <TabsTrigger value="role-permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            הרשאות תפקידים
          </TabsTrigger>
          <TabsTrigger value="user-permissions" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            הרשאות אישיות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users-list" className="space-y-6">
          <UsersListTab selectedTenant={selectedTenant} selectedSystem={selectedSystem} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">ניהול תפקידים</h3>
              <p className="text-gray-600">יצירה ועריכה של תפקידים במערכת</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                ייצוא Excel
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                ייצוא PDF
              </Button>
            </div>
          </div>
          <RolesManagement />
        </TabsContent>

        <TabsContent value="role-permissions" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">הרשאות תפקידים</h3>
              <p className="text-gray-600">הגדרת הרשאות ברירת מחדל לכל תפקיד</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                ייצוא Excel
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                ייצוא PDF
              </Button>
            </div>
          </div>
          <PermissionsMatrix />
        </TabsContent>

        <TabsContent value="user-permissions" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">הרשאות אישיות</h3>
              <p className="text-gray-600">התאמת הרשאות ספציפיות למשתמשים בודדים</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                ייצוא Excel
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                ייצוא PDF
              </Button>
            </div>
          </div>
          <UserPermissionsMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
};
