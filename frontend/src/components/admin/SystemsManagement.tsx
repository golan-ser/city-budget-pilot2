import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Settings,
  Activity,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface System {
  system_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  pages_count?: number;
  tenants_count?: number;
}

interface SystemFormData {
  name: string;
  description: string;
  is_active: boolean;
}

const SystemsManagement: React.FC = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [formData, setFormData] = useState<SystemFormData>({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/systems', {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }

      const data = await response.json();
      setSystems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת מערכות');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSystem = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/systems', {
        method: 'POST',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create system');
      }

      await fetchSystems();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת מערכת');
    }
  };

  const handleUpdateSystem = async () => {
    if (!editingSystem) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/systems/${editingSystem.system_id}`, {
        method: 'PUT',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update system');
      }

      await fetchSystems();
      setIsDialogOpen(false);
      setEditingSystem(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון מערכת');
    }
  };

  const handleDeleteSystem = async (systemId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מערכת זו?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/systems/${systemId}`, {
        method: 'DELETE',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete system');
      }

      await fetchSystems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת מערכת');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingSystem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (system: System) => {
    setFormData({
      name: system.name,
      description: system.description,
      is_active: system.is_active
    });
    setEditingSystem(system);
    setIsDialogOpen(true);
  };

  const filteredSystems = systems.filter(system =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>טוען מערכות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            ניהול מערכות
          </h2>
          <p className="text-muted-foreground">
            נהל מערכות ומודולים זמינים לרשויות
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          הוסף מערכת חדשה
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש מערכות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Systems Table */}
      <Card>
        <CardHeader>
          <CardTitle>מערכות במערכת ({filteredSystems.length})</CardTitle>
          <CardDescription>
            רשימת כל המערכות והמודולים הזמינים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם המערכת</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>עמודים</TableHead>
                <TableHead>רשויות</TableHead>
                <TableHead>תאריך יצירה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSystems.map((system) => (
                <TableRow key={system.system_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {system.name}
                    </div>
                  </TableCell>
                  <TableCell>{system.description}</TableCell>
                  <TableCell>
                    <Badge variant={system.is_active ? "default" : "secondary"}>
                      {system.is_active ? (
                        <><Check className="h-3 w-3 mr-1" /> פעיל</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> לא פעיל</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {system.pages_count || 0} עמודים
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {system.tenants_count || 0} רשויות
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(system.created_at).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(system)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSystem(system.system_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSystems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'לא נמצאו מערכות התואמות לחיפוש' : 'אין מערכות במערכת'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingSystem ? 'עריכת מערכת' : 'הוספת מערכת חדשה'}
            </DialogTitle>
            <DialogDescription>
              {editingSystem 
                ? 'עדכן את פרטי המערכת' 
                : 'הוסף מערכת חדשה למערכת'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם המערכת</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="הזן שם מערכת..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">תיאור</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="הזן תיאור המערכת..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">מערכת פעילה</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={editingSystem ? handleUpdateSystem : handleCreateSystem}
              disabled={!formData.name.trim()}
            >
              {editingSystem ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemsManagement; 