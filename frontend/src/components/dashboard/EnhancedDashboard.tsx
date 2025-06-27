import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  RefreshCw, 
  FileText, 
  BarChart3, 
  TrendingUp,
  AlertTriangle,
  Eye,
  Settings,
  Calendar,
  Users,
  Building2
} from 'lucide-react';

// Import enhanced components
import { KPICard } from './KPICard';
import { TrendCharts } from './TrendCharts';
import { SmartAlerts } from './SmartAlerts';
import { ProjectStatusChart } from './ProjectStatusChart';

// Import services
import { DashboardService, DashboardData } from '@/services/dashboardService';

export const EnhancedDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Use the new dashboard service
      const combinedData = await DashboardService.fetchCombinedData();
      setData(combinedData);
      
      if (showRefreshIndicator) {
        toast({
          title: "הנתונים עודכנו בהצלחה",
          description: "הדשבורד הועמס מחדש עם הנתונים העדכניים",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "שגיאה בטעינת הנתונים",
        description: "לא ניתן היה לטעון את נתוני הדשבורד. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleExportDashboardPDF = async () => {
    try {
      setExportingPDF(true);
      
      // For now, show a simple message since PDF export is not implemented
      toast({
        title: "ייצוא PDF",
        description: "ייצוא PDF יהיה זמין בקרוב",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "שגיאה בייצוא הדוח",
        description: "לא ניתן היה לייצא את הדוח. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">לא ניתן לטעון את הדשבורד</h2>
        <p className="text-gray-600 mb-4">אירעה שגיאה בטעינת הנתונים</p>
        <Button onClick={() => fetchDashboardData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          נסה שוב
        </Button>
      </div>
    );
  }

  const totalProjects = (data.projectStatus || []).reduce((sum, item) => sum + (item?.count || 0), 0);
  const totalBudgetFromProjects = (data.projectStatus || []).reduce((sum, item) => sum + (item?.total_budget || 0), 0);

  // Create properly typed data for components
  const projectStatusData = (data.projectStatus || []).map(item => ({
    status: item.status,
    count: item.count,
    percentage: totalProjects > 0 ? (item.count / totalProjects) * 100 : 0,
    total_budget: item.total_budget || 0,
    formatted_budget: `₪${(item.total_budget || 0).toLocaleString('he-IL')}`,
    color: item.status === 'פעיל' ? '#10b981' : item.status === 'הושלם' ? '#3b82f6' : '#f59e0b'
  }));

  const alertsData = (data.alerts || []).map(alert => ({
    id: alert.id,
    type: alert.type as 'warning' | 'error' | 'info' | 'success',
    category: 'budget' as const,
    title: alert.type === 'error' ? 'שגיאה' : alert.type === 'warning' ? 'אזהרה' : 'מידע',
    message: alert.message,
    severity: 'medium' as const,
    created_at: alert.timestamp
  }));

  const trendsData = {
    budgetUtilization: (data.trends?.budgetUtilization || []).map(item => ({
      month: item.month,
      monthName: item.month,
      value: item.amount,
      formatted: `₪${item.amount.toLocaleString('he-IL')}`
    })),
    monthlyExecution: (data.trends?.monthlyExecution || []).map(item => ({
      month: item.month,
      monthName: item.month,
      value: item.amount,
      formatted: `₪${item.amount.toLocaleString('he-IL')}`
    })),
    newProjects: [],
    executionReports: []
  };

  const budgetByMinistryData = (data.budgetByMinistry || []).map(item => ({
    ministry: item.ministry,
    total_authorized: item.amount,
    total_executed: item.amount * (item.percentage / 100),
    formatted_authorized: `₪${item.amount.toLocaleString('he-IL')}`,
    formatted_executed: `₪${(item.amount * (item.percentage / 100)).toLocaleString('he-IL')}`,
    utilization_percentage: item.percentage
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            דשבורד ראש העיר
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            עדכון אחרון: {new Date(data.lastUpdated).toLocaleString('he-IL')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'מעדכן...' : 'רענן'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDashboardPDF}
            disabled={exportingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportingPDF ? 'מייצא...' : 'ייצא PDF'}
          </Button>
          
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            הגדרות
          </Button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            סקירה כללית
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            תקציב וביצוע
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            פרויקטים
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            התראות
            {data.alerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {data.alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="תקציב כולל"
              value={data.kpis?.totalBudget?.formatted || "₪0"}
              change="סך כל התקציב המאושר"
              changeType="neutral"
              trend={data.kpis?.totalBudget?.trend ? [data.kpis.totalBudget.trend] : [0]}
              icon={<BarChart3 className="h-6 w-6" />}
            />
            
            <KPICard
              title="תקציב מנוצל"
              value={data.kpis?.utilizedBudget?.formatted || "₪0"}
              change={`${(data.kpis?.utilizedBudget?.percentage || 0).toFixed(1)}% מהתקציב`}
              changeType="neutral"
              trend={data.kpis?.utilizedBudget?.trend ? [data.kpis.utilizedBudget.trend] : [0]}
              icon={<TrendingUp className="h-6 w-6" />}
              percentage={data.kpis?.utilizedBudget?.percentage || 0}
            />
            
            <KPICard
              title="הכנסות חודשיות"
              value={data.kpis?.monthlyRevenue?.formatted || "₪0"}
              change="הכנסות החודש הנוכחי"
              changeType="neutral"
              trend={data.kpis?.monthlyRevenue?.trend ? [data.kpis.monthlyRevenue.trend] : [0]}
              icon={<Calendar className="h-6 w-6" />}
            />
            
            <KPICard
              title="פרויקטים הושלמו"
              value={(data.kpis?.completedProjects?.value || 0).toString()}
              change={`${(data.kpis?.completedProjects?.percentage || 0).toFixed(1)}% מכלל הפרויקטים`}
              changeType="positive"
              trend={data.kpis?.completedProjects?.trend ? [data.kpis.completedProjects.trend] : [0]}
              icon={<Building2 className="h-6 w-6" />}
              percentage={data.kpis?.completedProjects?.percentage || 0}
            />
            
            <KPICard
              title="פרויקטים פעילים"
              value={(data.kpis?.activeProjects?.value || 0).toString()}
              change="פרויקטים בביצוע"
              changeType="neutral"
              trend={data.kpis?.activeProjects?.trend ? [data.kpis.activeProjects.trend] : [0]}
              icon={<Users className="h-6 w-6" />}
            />
            
            <KPICard
              title="ממתינים לאישור"
              value={(data.kpis?.pendingApprovals?.value || 0).toString()}
              change={`כולל ${data.kpis?.pendingApprovals?.urgent || 0} דחופים`}
              changeType={(data.kpis?.pendingApprovals?.urgent || 0) > 0 ? "negative" : "neutral"}
              icon={<FileText className="h-6 w-6" />}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectStatusChart
              data={projectStatusData}
              totalProjects={totalProjects}
              totalBudget={totalBudgetFromProjects}
              formattedTotalBudget={`₪${totalBudgetFromProjects.toLocaleString('he-IL')}`}
            />
            
            <TrendCharts
              data={trendsData as any}
            />
          </div>

          {/* Alerts Section */}
          <SmartAlerts alerts={alertsData as any} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget by Ministry Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">תקציב לפי משרד</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendCharts
                  data={trendsData as any}
                  budgetByMinistry={budgetByMinistryData as any}
                  type="ministry-comparison"
                />
              </CardContent>
            </Card>

            {/* Monthly Execution Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">מגמת ביצוע חודשית</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendCharts
                  data={trendsData as any}
                  type="monthly-execution"
                />
              </CardContent>
            </Card>
          </div>

          {/* Budget KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="תקציב כולל"
              value={data.kpis?.totalBudget?.formatted || "₪0"}
              change="סך כל התקציב המאושר"
              changeType="neutral"
              icon={<BarChart3 className="h-6 w-6" />}
            />
            
            <KPICard
              title="ביצוע בפועל"
              value={data.kpis?.utilizedBudget?.formatted || "₪0"}
              change={`${(data.kpis?.utilizedBudget?.percentage || 0).toFixed(1)}% ניצול`}
              changeType="neutral"
              icon={<TrendingUp className="h-6 w-6" />}
              percentage={data.kpis?.utilizedBudget?.percentage || 0}
            />
            
            <KPICard
              title="יתרה זמינה"
              value={`₪${((data.kpis?.totalBudget?.value || 0) - (data.kpis?.utilizedBudget?.value || 0)).toLocaleString('he-IL')}`}
              change="תקציב זמין להקצאה"
              changeType="neutral"
              icon={<Calendar className="h-6 w-6" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectStatusChart
              data={projectStatusData}
              totalProjects={totalProjects}
              totalBudget={totalBudgetFromProjects}
              formattedTotalBudget={`₪${totalBudgetFromProjects.toLocaleString('he-IL')}`}
            />
            
            <TrendCharts
              data={trendsData as any}
            />
          </div>

          {/* Project KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard
              title="סה&quot;כ פרויקטים"
              value={totalProjects.toString()}
              change="כל הפרויקטים במערכת"
              changeType="neutral"
              icon={<Building2 className="h-6 w-6" />}
            />
            
            <KPICard
              title="פרויקטים פעילים"
              value={(data.kpis?.activeProjects?.value || 0).toString()}
              change="פרויקטים בביצוע"
              changeType="neutral"
              icon={<Users className="h-6 w-6" />}
            />
            
            <KPICard
              title="פרויקטים הושלמו"
              value={(data.kpis?.completedProjects?.value || 0).toString()}
              change={`${(data.kpis?.completedProjects?.percentage || 0).toFixed(1)}% מכלל`}
              changeType="positive"
              icon={<TrendingUp className="h-6 w-6" />}
              percentage={data.kpis?.completedProjects?.percentage || 0}
            />
            
            <KPICard
              title="ממתינים לאישור"
              value={(data.kpis?.pendingApprovals?.value || 0).toString()}
              change={`כולל ${data.kpis?.pendingApprovals?.urgent || 0} דחופים`}
              changeType={(data.kpis?.pendingApprovals?.urgent || 0) > 0 ? "negative" : "neutral"}
              icon={<FileText className="h-6 w-6" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <SmartAlerts alerts={alertsData as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
};