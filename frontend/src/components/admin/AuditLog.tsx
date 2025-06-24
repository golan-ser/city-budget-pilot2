import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Search, 
  Filter,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLogEntry {
  log_id: number;
  tenant_id: number;
  tenant_name: string;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: number;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface FilterOptions {
  tenant_id: string;
  action: string;
  resource_type: string;
  date_from: string;
  date_to: string;
}

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    tenant_id: '',
    action: '',
    resource_type: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchAuditLog();
  }, [currentPage, filters]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`http://localhost:3000/api/admin/audit?${params}`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit log');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(Math.ceil((data.total || 0) / 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת לוג פעילות');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLog = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`http://localhost:3000/api/admin/audit/export?${params}`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export audit log');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בייצוא לוג פעילות');
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'view': return <Eye className="h-3 w-3" />;
      case 'login': 
      case 'logout': return <User className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log =>
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>טוען לוג פעילות...</p>
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
            <Shield className="h-6 w-6" />
            לוג פעילות מערכת
          </h2>
          <p className="text-muted-foreground">
            מעקב אחר כל הפעולות במערכת
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAuditLog}>
            <RefreshCw className="h-4 w-4 mr-2" />
            רענן
          </Button>
          <Button variant="outline" onClick={handleExportLog}>
            <Download className="h-4 w-4 mr-2" />
            ייצא CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            סינון וחיפוש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>חיפוש חופשי</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש בלוג..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>סוג פעולה</Label>
              <Select value={filters.action} onValueChange={(value) => 
                setFilters({...filters, action: value === 'all' ? '' : value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="כל הפעולות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הפעולות</SelectItem>
                  <SelectItem value="create">יצירה</SelectItem>
                  <SelectItem value="update">עדכון</SelectItem>
                  <SelectItem value="delete">מחיקה</SelectItem>
                  <SelectItem value="view">צפייה</SelectItem>
                  <SelectItem value="login">כניסה</SelectItem>
                  <SelectItem value="logout">יציאה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סוג משאב</Label>
              <Select value={filters.resource_type} onValueChange={(value) => 
                setFilters({...filters, resource_type: value === 'all' ? '' : value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="כל המשאבים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשאבים</SelectItem>
                  <SelectItem value="tenant">רשות</SelectItem>
                  <SelectItem value="user">משתמש</SelectItem>
                  <SelectItem value="role">תפקיד</SelectItem>
                  <SelectItem value="permission">הרשאה</SelectItem>
                  <SelectItem value="system">מערכת</SelectItem>
                  <SelectItem value="project">פרויקט</SelectItem>
                  <SelectItem value="tabar">טבר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>תאריך מ-</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>רשומות פעילות ({filteredLogs.length})</CardTitle>
          <CardDescription>
            כל הפעולות שבוצעו במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך ושעה</TableHead>
                <TableHead>משתמש</TableHead>
                <TableHead>רשות</TableHead>
                <TableHead>פעולה</TableHead>
                <TableHead>משאב</TableHead>
                <TableHead>פרטים</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.log_id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(log.created_at).toLocaleString('he-IL')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{log.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.tenant_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      <div className="flex items-center gap-1">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {log.resource_type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm" title={log.details}>
                      {log.details}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ip_address}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'לא נמצאו רשומות התואמות לחיפוש' 
                : 'אין רשומות פעילות'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            הקודם
          </Button>
          <span className="text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            הבא
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLog; 