import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Lock, 
  Unlock, 
  Clock, 
  User, 
  Building, 
  AlertTriangle,
  History,
  Search
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { API_BASE_URL } from '../../lib/apiConfig';

interface LockedUser {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  failed_login_attempts: number;
  locked_at: string;
  tenant_id: number;
  tenant_name: string;
  role_name: string;
  hours_locked: number;
}

interface UnlockHistoryItem {
  unlock_id: number;
  unlocked_at: string;
  reason: string;
  previous_failed_attempts: number;
  ip_address: string;
  unlocked_user_name: string;
  unlocked_user_email: string;
  unlocked_by_name: string;
  unlocked_by_email: string;
  tenant_name: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const LockedUsersManagement: React.FC = () => {
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [unlockHistory, setUnlockHistory] = useState<UnlockHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [historyPagination, setHistoryPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<LockedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);

  // טעינת משתמשים נעולים
  const fetchLockedUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.fetchLockedUsers();
      setLockedUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת משתמשים נעולים');
    } finally {
      setLoading(false);
    }
  };

  // טעינת היסטוריית שחרורים
  const fetchUnlockHistory = async (page: number = 1) => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/unlock-history?page=${page}&limit=20`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch unlock history');
      const data = await response.json();
      setUnlockHistory(data.history || []);
      setHistoryPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
    } catch (err) {
      setError('שגיאה בטעינת היסטוריית פתיחת נעילות');
    } finally {
      setHistoryLoading(false);
    }
  };

  // שחרור משתמש
  const handleUnlockUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את הנעילה של משתמש זה?')) return;

    try {
      await AdminService.unlockUser(userId);
      await fetchLockedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בביטול נעילת משתמש');
    }
  };

  const handleLockUser = async (userId: string, reason: string) => {
    try {
      await AdminService.lockUser(userId, reason);
      await fetchLockedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בנעילת משתמש');
    }
  };

  // פילטור משתמשים לפי חיפוש
  const filteredUsers = lockedUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // פורמט זמן
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL');
  };

  // פורמט שעות נעילה
  const formatHoursLocked = (hours: number) => {
    if (hours < 1) return 'פחות משעה';
    if (hours < 24) return `${Math.floor(hours)} שעות`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days} ימים${remainingHours > 0 ? ` ו-${remainingHours} שעות` : ''}`;
  };

  useEffect(() => {
    fetchLockedUsers();
    fetchUnlockHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ניהול משתמשים נעולים</h2>
        <Button onClick={() => fetchLockedUsers()} disabled={loading}>
          {loading ? 'טוען...' : 'רענן'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="locked-users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locked-users" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            משתמשים נעולים ({pagination.total})
          </TabsTrigger>
          <TabsTrigger value="unlock-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            היסטוריית שחרורים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locked-users" className="space-y-4">
          {/* חיפוש */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="חיפוש לפי שם, אימייל או רשות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-500" />
                משתמשים נעולים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {lockedUsers.length === 0 ? 'אין משתמשים נעולים' : 'לא נמצאו תוצאות חיפוש'}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>משתמש</TableHead>
                        <TableHead>רשות</TableHead>
                        <TableHead>תפקיד</TableHead>
                        <TableHead>ניסיונות כושלים</TableHead>
                        <TableHead>זמן נעילה</TableHead>
                        <TableHead>משך נעילה</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              {user.tenant_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role_name}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {user.failed_login_attempts}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              {formatDate(user.locked_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatHoursLocked(user.hours_locked)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Unlock className="h-4 w-4 mr-1" />
                                  שחרר
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>שחרור משתמש נעול</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium">{selectedUser?.full_name}</h4>
                                    <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                                    <p className="text-sm text-gray-600">רשות: {selectedUser?.tenant_name}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">סיבת השחרור</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="הזן סיבה לשחרור החשבון..."
                                      value={unlockReason}
                                      onChange={(e) => setUnlockReason(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsUnlockDialogOpen(false);
                                        setUnlockReason('');
                                        setSelectedUser(null);
                                      }}
                                    >
                                      ביטול
                                    </Button>
                                    <Button
                                      onClick={() => handleLockUser(selectedUser!.user_id.toString(), unlockReason)}
                                      disabled={loading}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {loading ? 'משחרר...' : 'שחרר משתמש'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => fetchLockedUsers()}
                        disabled={pagination.page <= 1 || loading}
                      >
                        הקודם
                      </Button>
                      <span className="text-sm text-gray-600">
                        עמוד {pagination.page} מתוך {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => fetchLockedUsers()}
                        disabled={pagination.page >= pagination.totalPages || loading}
                      >
                        הבא
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unlock-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                היסטוריית שחרורים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">טוען היסטוריה...</div>
              ) : unlockHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">אין היסטוריית שחרורים</div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>משתמש ששוחרר</TableHead>
                        <TableHead>שוחרר על ידי</TableHead>
                        <TableHead>רשות</TableHead>
                        <TableHead>סיבה</TableHead>
                        <TableHead>ניסיונות קודמים</TableHead>
                        <TableHead>תאריך שחרור</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unlockHistory.map((item) => (
                        <TableRow key={item.unlock_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.unlocked_user_name}</div>
                              <div className="text-sm text-gray-500">{item.unlocked_user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.unlocked_by_name}</div>
                              <div className="text-sm text-gray-500">{item.unlocked_by_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.tenant_name}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={item.reason}>
                              {item.reason}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {item.previous_failed_attempts}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.unlocked_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* History Pagination */}
                  {historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => fetchUnlockHistory(historyPagination.page - 1)}
                        disabled={historyPagination.page <= 1 || historyLoading}
                      >
                        הקודם
                      </Button>
                      <span className="text-sm text-gray-600">
                        עמוד {historyPagination.page} מתוך {historyPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => fetchUnlockHistory(historyPagination.page + 1)}
                        disabled={historyPagination.page >= historyPagination.totalPages || historyLoading}
                      >
                        הבא
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LockedUsersManagement; 