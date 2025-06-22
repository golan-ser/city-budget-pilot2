import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from './KPICard';
import { SmartAlerts } from './SmartAlerts';
import { ProjectStatusChart } from './ProjectStatusChart';
import { TrendCharts } from './TrendCharts';
import { 
  TrendingUpIcon, 
  Building2Icon, 
  CalendarIcon, 
  UsersIcon,
  PlusIcon,
  FileTextIcon,
  PaperclipIcon,
  DownloadIcon,
  RefreshCwIcon,
  ExternalLinkIcon
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalBudget: {
      value: number;
      formatted: string;
      change: string;
      changeType: string;
    };
    utilizedBudget: {
      value: number;
      formatted: string;
      percentage: number;
      change: string;
      changeType: string;
    };
    monthlyIncome: {
      value: number;
      formatted: string;
      change: string;
      changeType: string;
      reports_count: number;
    };
    projectCompletion: {
      value: number;
      formatted: string;
      change: string;
      changeType: string;
      breakdown: {
        total: number;
        completed: number;
        active: number;
        paused: number;
      };
    };
  };
  projectStatus: Array<{
    status: string;
    count: number;
    budget: number;
    formatted_budget: string;
  }>;
  alerts: Array<{
    type: 'error' | 'warning' | 'info' | 'success';
    icon: string;
    title: string;
    message: string;
    count: number;
    action?: string;
    projects?: any[];
  }>;
  trends: {
    budgetUtilization: any[];
    newProjects: any[];
    executionReports: any[];
  };
  recentReports: Array<{
    id: number;
    number: number;
    name: string;
    status: string;
    progress: number;
    formatted: {
      budget: string;
      actual: string;
      date: string;
      lastUpdate: string;
    };
  }>;
  lastUpdated: string;
}

export const EnhancedDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/dashboard/data');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAlertAction = (alert: any) => {
    // Handle alert actions - navigate to relevant page
    console.log('Alert action:', alert);
    // TODO: Implement navigation to relevant pages
  };

  const handleQuickAction = (action: string) => {
    // Handle quick actions
    console.log('Quick action:', action);
    
    switch (action) {
      case 'export-data':
        handleExportDashboardPDF();
        break;
      case 'new-project':
        // TODO: Navigate to new project page
        window.location.href = '/projects?action=new';
        break;
      case 'execution-report':
        // TODO: Navigate to execution report
        window.location.href = '/reports?type=execution';
        break;
      case 'upload-document':
        // TODO: Open upload modal
        console.log('Upload document modal');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleExportDashboardPDF = async () => {
    try {
      setExportingPDF(true);
      console.log('🔄 Exporting dashboard PDF...');
      
      const response = await fetch('/api/dashboard/export-pdf');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Dashboard PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting dashboard PDF:', error);
      alert('שגיאה בייצוא PDF: ' + (error as Error).message);
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-4">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-lg font-medium">טוען נתוני דשבורד...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">שגיאה בטעינת נתוני הדשבורד</p>
            <Button onClick={fetchDashboardData} variant="outline">
              נסה שוב
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">אין נתונים להצגה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6 space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            דשבורד ניהול תב"ר
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            מעקב ובקרה על פרויקטים ותקציבים
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>עודכן לאחרונה:</span>
            <span>{new Date(dashboardData.lastUpdated).toLocaleString('he-IL')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="mr-2"
            >
              <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => handleQuickAction('new-project')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            פתח פרויקט חדש
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleQuickAction('execution-report')}
          >
            <FileTextIcon className="h-4 w-4 mr-2" />
            שלח דוח ביצוע
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleQuickAction('upload-document')}
          >
            <PaperclipIcon className="h-4 w-4 mr-2" />
            העלה מסמך
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleQuickAction('export-data')}
            disabled={exportingPDF}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            {exportingPDF ? 'מייצא...' : 'ייצא נתונים'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="תקציב כולל"
          value={dashboardData.kpis.totalBudget.formatted}
          change={dashboardData.kpis.totalBudget.change}
          changeType={dashboardData.kpis.totalBudget.changeType as any}
          icon={<Building2Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />
        
        <KPICard
          title="תקציב מנוצל"
          value={dashboardData.kpis.utilizedBudget.formatted}
          change={dashboardData.kpis.utilizedBudget.change}
          changeType={dashboardData.kpis.utilizedBudget.changeType as any}
          percentage={dashboardData.kpis.utilizedBudget.percentage}
          icon={<TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
        />
        
        <KPICard
          title="הכנסות חודשיות"
          value={dashboardData.kpis.monthlyIncome.formatted}
          change={dashboardData.kpis.monthlyIncome.change}
          changeType={dashboardData.kpis.monthlyIncome.changeType as any}
          icon={<CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
        />
        
        <KPICard
          title="השלמת פרויקטים"
          value={dashboardData.kpis.projectCompletion.formatted}
          change={dashboardData.kpis.projectCompletion.change}
          changeType={dashboardData.kpis.projectCompletion.changeType as any}
          icon={<UsersIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
        />
      </div>

      {/* Charts and Alerts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <ProjectStatusChart 
            data={dashboardData.projectStatus} 
          />
        </div>
        
        <div className="xl:col-span-2">
          <SmartAlerts 
            alerts={dashboardData.alerts} 
            onAlertAction={handleAlertAction}
          />
        </div>
      </div>

      {/* Trends Chart */}
      <TrendCharts data={dashboardData.trends} />

      {/* Recent Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>דוחות אחרונים</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {dashboardData.recentReports.length} דוחות
              </Badge>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                הצג הכל
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">מספר תב"ר</th>
                  <th className="text-right py-3 px-4">שם הפרויקט</th>
                  <th className="text-right py-3 px-4">סטטוס</th>
                  <th className="text-right py-3 px-4">תקציב</th>
                  <th className="text-right py-3 px-4">בוצע</th>
                  <th className="text-right py-3 px-4">אחוז ביצוע</th>
                  <th className="text-right py-3 px-4">עדכון אחרון</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentReports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium">{report.number}</td>
                    <td className="py-3 px-4">{report.name}</td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={report.status === 'פעיל' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{report.formatted.budget}</td>
                    <td className="py-3 px-4">{report.formatted.actual}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              report.progress > 100 ? 'bg-red-500' : 
                              report.progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(report.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{report.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {report.formatted.lastUpdate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dashboardData.kpis.projectCompletion.breakdown.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">סה"כ פרויקטים</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dashboardData.kpis.projectCompletion.breakdown.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">פעילים</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {dashboardData.kpis.projectCompletion.breakdown.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">הושלמו</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {dashboardData.kpis.projectCompletion.breakdown.paused}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">מושהים</div>
          </div>
        </div>
      </div>
    </div>
  );
};