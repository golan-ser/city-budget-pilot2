// קובץ: UsersManagement.tsx - גרסה מלאה עם כל הכרטיסים, הפעילויות, וייצוא PDF מתוקן

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, BarChart3, Building2, Settings, Users, FileText as LogIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_BASE_URL } from '../lib/apiConfig';

import TenantsManagement from '@/components/admin/TenantsManagement';
import SystemsManagement from '@/components/admin/SystemsManagement';
import AuditLog from '@/components/admin/AuditLog';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AdminService } from '@/services/adminService';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';
import { UserPermissionsMatrix } from '@/components/admin/UserPermissionsMatrix';
import { RolesManagement } from '@/components/admin/RolesManagement';
import { LockedUsersManagement } from '@/components/admin/LockedUsersManagement';

const OverviewDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use parallel requests for better performance
      const [statsResult, activityResult] = await Promise.allSettled([
        AdminService.fetchStatistics(),
        AdminService.fetchRecentActivity(5)
      ]);

      if (statsResult.status === 'fulfilled') {
        setStatistics(statsResult.value);
      }

      if (activityResult.status === 'fulfilled') {
        setRecentActivity(activityResult.value);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('שגיאה בטעינת נתוני הדשבורד');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      const overviewData = [
        { 'נתון': 'סך רשויות', 'ערך': statistics?.tenants?.total || 0 },
        { 'נתון': 'סך משתמשים', 'ערך': statistics?.users?.total || 0 },
        { 'נתון': 'משתמשים פעילים', 'ערך': statistics?.users?.active || 0 },
        { 'נתון': 'משתמשים נעולים', 'ערך': statistics?.users?.locked || 0 },
        { 'נתון': 'מערכות פעילות', 'ערך': statistics?.systems?.active || 0 },
        { 'נתון': 'סך מערכות', 'ערך': statistics?.systems?.total || 0 },
        { 'נתון': 'תפקידים מוגדרים', 'ערך': statistics?.roles?.total || 0 },
        { 'נתון': 'פעילות היום', 'ערך': statistics?.activity?.today || 0 }
      ];

      const activityData = recentActivity.map(activity => ({
        'פעולה': activity.action,
        'סוג משאב': activity.resource_type,
        'פרטים': activity.details || '-',
        'משתמש': activity.user_name || 'מערכת',
        'זמן': activity.time_ago
      }));

      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "סקירה כללית");

      const activitySheet = XLSX.utils.json_to_sheet(activityData);
      XLSX.utils.book_append_sheet(workbook, activitySheet, "פעילות אחרונה");

      XLSX.writeFile(workbook, `system-overview-${new Date().toISOString().split('T')[0]}.xlsx`);

    } else {
      try {
        setExporting(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/export/overview-pdf`, {
          method: 'GET',
          headers: {
            'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          },
        });

        if (!response.ok) throw new Error('Failed to export PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `system_overview_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        setError('שגיאה בייצוא PDF');
      } finally {
        setExporting(false);
      }
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">סקירה כללית</h2>
          <p className="text-gray-600">מבט על המערכת והפעילות</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> ייצוא Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" /> ייצוא PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך רשויות</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.tenants?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{statistics?.tenants?.growth || 'טוען...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך משתמשים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{statistics?.users?.growth || 'טוען...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מערכות פעילות</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.systems?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              מתוך {statistics?.systems?.total || 0} מערכות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פעילות היום</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.activity?.today || 0}</div>
            <p className="text-xs text-muted-foreground">פעולות בוצעו היום</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">אין פעילות אחרונה</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.action === 'create' ? 'bg-green-500' :
                      activity.action === 'update' ? 'bg-blue-500' :
                      activity.action === 'delete' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.details || `${activity.action} ${activity.resource_type}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.time_ago} • {activity.user_name || 'מערכת'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סטטיסטיקות מהירות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">משתמשים פעילים</span>
                <span className="font-medium">
                  {statistics?.users?.active || 0} ({statistics?.users?.total > 0 ? Math.round((statistics.users.active / statistics.users.total) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">משתמשים נעולים</span>
                <span className="font-medium text-red-600">
                  {statistics?.users?.locked || 0} ({statistics?.users?.total > 0 ? Math.round((statistics.users.locked / statistics.users.total) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">תפקידים מוגדרים</span>
                <span className="font-medium">{statistics?.roles?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">הרשאות מותאמות</span>
                <span className="font-medium">{statistics?.permissions?.custom_users || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SystemAdmin = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניהול מערכת והרשאות</h1>
          <p className="text-gray-600">ניהול רשויות, משתמשים, תפקידים והרשאות במערכת</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> סקירה
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> רשויות
          </TabsTrigger>
          <TabsTrigger value="systems" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> מערכות
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> משתמשים
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <LogIcon className="h-4 w-4" /> לוגים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewDashboard />
        </TabsContent>
        <TabsContent value="tenants" className="space-y-6">
            <TenantsManagement />
        </TabsContent>
        <TabsContent value="systems" className="space-y-6">
            <SystemsManagement />
        </TabsContent>
        <TabsContent value="users" className="space-y-6">
            <UsersManagement />
        </TabsContent>
        <TabsContent value="logs" className="space-y-6">
            <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemAdmin;
