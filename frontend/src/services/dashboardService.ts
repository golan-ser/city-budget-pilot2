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
   * Fetch enhanced dashboard data - MOCK VERSION FOR DEMO
   */
  static async fetchEnhanced(): Promise<DashboardData> {
    console.log('🎭 Using mock dashboard data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.getMockDashboardData();
  }

  /**
   * Fetch advanced analytics data - MOCK VERSION FOR DEMO
   */
  static async fetchAnalytics(): Promise<any> {
    console.log('🎭 Using mock analytics data - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      monthlyTrend: [
        { month: 'ינואר', value: 85 },
        { month: 'פברואר', value: 92 },
        { month: 'מרץ', value: 78 },
        { month: 'אפריל', value: 88 },
        { month: 'מאי', value: 94 }
      ],
      topProjects: [
        { name: 'פרויקט תשתית דרכים', budget: 15000000, status: 'פעיל' },
        { name: 'פרויקט חינוך דיגיטלי', budget: 8500000, status: 'בתכנון' },
        { name: 'פרויקט פארקים עירוניים', budget: 6200000, status: 'פעיל' }
      ]
    };
  }

  /**
   * Fetch combined dashboard data with analytics - MOCK VERSION FOR DEMO
   */
  static async fetchCombined(): Promise<DashboardData> {
    try {
      console.log('🎭 Using mock combined dashboard data - API disabled');
      
      // Simulate API calls
      const [dashboardData, analyticsData] = await Promise.all([
        this.fetchEnhanced(),
        this.fetchAnalytics()
      ]);

      return {
        ...dashboardData,
        // Add analytics data if needed
        analyticsData: analyticsData
      } as DashboardData;
    } catch (error) {
      console.error('Error in mock dashboard data:', error);
      return this.getMockDashboardData();
    }
  }

  /**
   * Export dashboard as PDF - MOCK VERSION FOR DEMO
   */
  static async exportPDF(): Promise<Blob> {
    console.log('🎭 PDF export disabled - returning mock blob');
    
    // Create a simple mock PDF blob
    const mockPdfContent = 'Mock PDF Content - Dashboard Report';
    return new Blob([mockPdfContent], { type: 'application/pdf' });
  }

  /**
   * Download PDF export - MOCK VERSION FOR DEMO
   */
  static async downloadPDF(): Promise<void> {
    console.log('🎭 PDF download disabled for demo');
    alert('PDF export feature is disabled in demo mode');
  }

  /**
   * Get mock dashboard data for demo
   */
  private static getMockDashboardData(): DashboardData {
    return {
      kpis: {
        totalBudget: { 
          value: 125000000, 
          formatted: '₪125,000,000', 
          trend: 8.5 
        },
        utilizedBudget: { 
          value: 89000000, 
          formatted: '₪89,000,000', 
          percentage: 71.2, 
          trend: 5.3 
        },
        monthlyRevenue: { 
          value: 12500000, 
          formatted: '₪12,500,000', 
          trend: -2.1 
        },
        completedProjects: { 
          value: 23, 
          percentage: 68.5, 
          trend: 12.8 
        },
        activeProjects: { 
          value: 18, 
          trend: 3.2 
        },
        pendingApprovals: { 
          value: 7, 
          urgent: 3 
        }
      },
      projectStatus: [
        { 
          status: 'פעיל', 
          count: 18, 
          percentage: 45, 
          total_budget: 65000000, 
          formatted_budget: '₪65,000,000', 
          color: '#10b981' 
        },
        { 
          status: 'בתכנון', 
          count: 12, 
          percentage: 30, 
          total_budget: 35000000, 
          formatted_budget: '₪35,000,000', 
          color: '#f59e0b' 
        },
        { 
          status: 'הושלם', 
          count: 8, 
          percentage: 20, 
          total_budget: 18000000, 
          formatted_budget: '₪18,000,000', 
          color: '#3b82f6' 
        },
        { 
          status: 'מושהה', 
          count: 2, 
          percentage: 5, 
          total_budget: 7000000, 
          formatted_budget: '₪7,000,000', 
          color: '#ef4444' 
        }
      ],
      trendData: {
        budgetUtilization: [
          { month: '2024-01', monthName: 'ינואר', value: 65, formatted: '65%' },
          { month: '2024-02', monthName: 'פברואר', value: 68, formatted: '68%' },
          { month: '2024-03', monthName: 'מרץ', value: 72, formatted: '72%' },
          { month: '2024-04', monthName: 'אפריל', value: 69, formatted: '69%' },
          { month: '2024-05', monthName: 'מאי', value: 71, formatted: '71%' }
        ],
        monthlyExecution: [
          { month: '2024-01', execution: 8500000, projects: 15, formatted: '₪8,500,000' },
          { month: '2024-02', execution: 9200000, projects: 18, formatted: '₪9,200,000' },
          { month: '2024-03', execution: 7800000, projects: 16, formatted: '₪7,800,000' },
          { month: '2024-04', execution: 8800000, projects: 17, formatted: '₪8,800,000' },
          { month: '2024-05', execution: 9400000, projects: 19, formatted: '₪9,400,000' }
        ],
        newProjects: [
          { month: '2024-01', monthName: 'ינואר', value: 3 },
          { month: '2024-02', monthName: 'פברואר', value: 5 },
          { month: '2024-03', monthName: 'מרץ', value: 2 },
          { month: '2024-04', monthName: 'אפריל', value: 4 },
          { month: '2024-05', monthName: 'מאי', value: 6 }
        ],
        executionReports: [
          { month: '2024-01', monthName: 'ינואר', count: 45, amount: 8500000, formatted: '₪8,500,000' },
          { month: '2024-02', monthName: 'פברואר', count: 52, amount: 9200000, formatted: '₪9,200,000' },
          { month: '2024-03', monthName: 'מרץ', count: 38, amount: 7800000, formatted: '₪7,800,000' },
          { month: '2024-04', monthName: 'אפריל', count: 47, amount: 8800000, formatted: '₪8,800,000' },
          { month: '2024-05', monthName: 'מאי', count: 55, amount: 9400000, formatted: '₪9,400,000' }
        ]
      },
      budgetByMinistry: [
        {
          ministry: 'משרד התחבורה',
          total_authorized: 45000000,
          total_executed: 32000000,
          formatted_authorized: '₪45,000,000',
          formatted_executed: '₪32,000,000',
          utilization_percentage: 71.1
        },
        {
          ministry: 'משרד החינוך',
          total_authorized: 35000000,
          total_executed: 28000000,
          formatted_authorized: '₪35,000,000',
          formatted_executed: '₪28,000,000',
          utilization_percentage: 80.0
        },
        {
          ministry: 'משרד הבריאות',
          total_authorized: 25000000,
          total_executed: 18000000,
          formatted_authorized: '₪25,000,000',
          formatted_executed: '₪18,000,000',
          utilization_percentage: 72.0
        },
        {
          ministry: 'משרד הפנים',
          total_authorized: 20000000,
          total_executed: 11000000,
          formatted_authorized: '₪20,000,000',
          formatted_executed: '₪11,000,000',
          utilization_percentage: 55.0
        }
      ],
      alerts: [
        {
          id: '1',
          type: 'warning',
          category: 'budget',
          title: 'חריגה בתקציב',
          message: 'פרויקט תשתית דרכים חרג מהתקציב הרבעוני ב-8%',
          severity: 'high',
          count: 3,
          amount: 2400000,
          formatted_amount: '₪2,400,000',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          project_id: 1,
          project_name: 'פרויקט תשתית דרכים',
          tabar_number: 'TB-2024-001',
          action_required: true
        },
        {
          id: '2',
          type: 'info',
          category: 'reporting',
          title: 'דיווח חודשי נדרש',
          message: '5 פרויקטים מחכים לדיווח ביצוע חודשי',
          severity: 'medium',
          count: 5,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          action_required: true,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'error',
          category: 'approval',
          title: 'אישורים ממתינים',
          message: '3 פרויקטים דורשים אישור דחוף לפני סוף השבוע',
          severity: 'high',
          count: 3,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          action_required: true,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          overdue_days: 1
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
} 