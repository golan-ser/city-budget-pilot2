import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface DashboardData {
  kpis: {
    totalBudget: { value: number; formatted: string; trend: number };
    utilizedBudget: { value: number; formatted: string; percentage: number; trend: number };
    monthlyRevenue: { value: number; formatted: string; trend: number };
    completedProjects: { value: number; percentage: number; trend: number };
    activeProjects: { value: number; trend: number };
    pendingApprovals: { value: number; urgent: number };
  };
  projectStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    total_budget: number;
    formatted_budget: string;
    color: string;
  }>;
  trendData: {
    budgetUtilization: Array<{
      month: string;
      monthName: string;
      value: number;
      formatted: string;
    }>;
    monthlyExecution: Array<{
      month: string;
      execution: number;
      projects: number;
      formatted: string;
    }>;
    newProjects: Array<{
      month: string;
      monthName: string;
      value: number;
    }>;
    executionReports: Array<{
      month: string;
      monthName: string;
      count: number;
      amount: number;
      formatted: string;
    }>;
  };
  budgetByMinistry: Array<{
    ministry: string;
    total_authorized: number;
    total_executed: number;
    formatted_authorized: string;
    formatted_executed: string;
    utilization_percentage: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    category: 'budget' | 'reporting' | 'approval' | 'payment' | 'timeline' | 'performance';
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    count?: number;
    amount?: number;
    formatted_amount?: string;
    created_at: string;
    project_id?: number;
    project_name?: string;
    tabar_number?: string;
    action_required?: boolean;
    due_date?: string;
    overdue_days?: number;
  }>;
  lastUpdated: string;
}

export class DashboardService {
  /**
   * Fetch enhanced dashboard data
   */
  static async fetchEnhanced(): Promise<DashboardData> {
    const response = await api.get(API_ENDPOINTS.DASHBOARD_ENHANCED);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    return response.json();
  }

  /**
   * Fetch advanced analytics data
   */
  static async fetchAnalytics(): Promise<any> {
    const response = await api.get(API_ENDPOINTS.DASHBOARD_ANALYTICS);
    
    if (!response.ok) {
      // Analytics data is optional, don't throw error
      return {};
    }
    
    return response.json();
  }

  /**
   * Fetch combined dashboard data with analytics
   */
  static async fetchCombined(): Promise<DashboardData> {
    try {
      // Fetch both main dashboard and analytics data
      const [dashboardResponse, analyticsResponse] = await Promise.allSettled([
        this.fetchEnhanced(),
        this.fetchAnalytics()
      ]);

      const dashboardData = dashboardResponse.status === 'fulfilled' 
        ? dashboardResponse.value 
        : this.getDefaultDashboardData();
      
      const analyticsData = analyticsResponse.status === 'fulfilled' 
        ? analyticsResponse.value 
        : {};

      // Combine all data
      return {
        kpis: {
          totalBudget: {
            value: dashboardData.kpis?.totalBudget?.value || 0,
            formatted: dashboardData.kpis?.totalBudget?.formatted || '₪0',
            trend: dashboardData.kpis?.totalBudget?.trend || 0
          },
          utilizedBudget: {
            value: dashboardData.kpis?.utilizedBudget?.value || 0,
            formatted: dashboardData.kpis?.utilizedBudget?.formatted || '₪0',
            percentage: dashboardData.kpis?.utilizedBudget?.percentage || 0,
            trend: dashboardData.kpis?.utilizedBudget?.trend || 0
          },
          monthlyRevenue: {
            value: dashboardData.kpis?.monthlyRevenue?.value || 0,
            formatted: dashboardData.kpis?.monthlyRevenue?.formatted || '₪0',
            trend: dashboardData.kpis?.monthlyRevenue?.trend || 0
          },
          completedProjects: {
            value: dashboardData.kpis?.completedProjects?.value || 0,
            percentage: dashboardData.kpis?.completedProjects?.percentage || 0,
            trend: dashboardData.kpis?.completedProjects?.trend || 0
          },
          activeProjects: {
            value: dashboardData.kpis?.activeProjects?.value || 0,
            trend: dashboardData.kpis?.activeProjects?.trend || 0
          },
          pendingApprovals: {
            value: dashboardData.kpis?.pendingApprovals?.value || 0,
            urgent: dashboardData.kpis?.pendingApprovals?.urgent || 0
          }
        },
        projectStatus: dashboardData.projectStatus || [],
        trendData: {
          budgetUtilization: dashboardData.trendData?.budgetUtilization || [],
          monthlyExecution: dashboardData.trendData?.monthlyExecution || [],
          newProjects: dashboardData.trendData?.newProjects || [],
          executionReports: dashboardData.trendData?.executionReports || []
        },
        budgetByMinistry: dashboardData.budgetByMinistry || [],
        alerts: dashboardData.alerts || [],
        lastUpdated: dashboardData.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching combined dashboard data:', error);
      throw error;
    }
  }

  /**
   * Export dashboard as PDF
   */
  static async exportPDF(): Promise<Blob> {
    const response = await api.post(API_ENDPOINTS.DASHBOARD_EXPORT_PDF);
    
    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }
    
    return response.blob();
  }

  /**
   * Download PDF export
   */
  static async downloadPDF(): Promise<void> {
    const blob = await this.exportPDF();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get default dashboard data for fallback
   */
  private static getDefaultDashboardData(): Partial<DashboardData> {
    return {
      kpis: {
        totalBudget: { value: 0, formatted: '₪0', trend: 0 },
        utilizedBudget: { value: 0, formatted: '₪0', percentage: 0, trend: 0 },
        monthlyRevenue: { value: 0, formatted: '₪0', trend: 0 },
        completedProjects: { value: 0, percentage: 0, trend: 0 },
        activeProjects: { value: 0, trend: 0 },
        pendingApprovals: { value: 0, urgent: 0 }
      },
      projectStatus: [],
      trendData: {
        budgetUtilization: [],
        monthlyExecution: [],
        newProjects: [],
        executionReports: []
      },
      budgetByMinistry: [],
      alerts: [],
      lastUpdated: new Date().toISOString()
    };
  }
} 