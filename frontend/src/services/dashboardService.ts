import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface DashboardData {
  totalBudget: number;
  totalProjects: number;
  totalUtilized: number;
  utilizationRate: number;
  // Add more fields as needed
}

export interface AnalyticsData {
  monthlyExecution: Array<{
    month: string;
    amount: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    amount: number;
    percentage: number;
  }>;
  projectStatus: Array<{
    status: string;
    count: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
}

export class DashboardService {
  /**
   * Fetch combined dashboard data
   */
  static async fetchCombinedData(): Promise<DashboardData> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.COMBINED);
      return response;
    } catch (error) {
      console.error('DashboardService.fetchCombinedData error:', error);
      // Fallback to mock data if API fails
      return {
        totalBudget: 125000000,
        totalProjects: 18,
        totalUtilized: 87500000,
        utilizationRate: 70
      };
    }
  }

  /**
   * Fetch dashboard data
   */
  static async fetchDashboard(): Promise<DashboardData> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.MAIN);
      return response;
    } catch (error) {
      console.error('DashboardService.fetchDashboard error:', error);
      // Fallback to mock data if API fails
      return {
        totalBudget: 125000000,
        totalProjects: 18,
        totalUtilized: 87500000,
        utilizationRate: 70
      };
    }
  }

  /**
   * Fetch analytics data
   */
  static async fetchAnalytics(): Promise<AnalyticsData> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.ANALYTICS);
      return response;
    } catch (error) {
      console.error('DashboardService.fetchAnalytics error:', error);
      // Fallback to mock data if API fails
      return {
        monthlyExecution: [
          { month: 'ינואר', amount: 5200000 },
          { month: 'פברואר', amount: 6800000 },
          { month: 'מרץ', amount: 7500000 },
          { month: 'אפריל', amount: 6200000 },
          { month: 'מאי', amount: 8100000 },
          { month: 'יוני', amount: 7900000 }
        ],
        departmentBreakdown: [
          { department: 'תשתיות', amount: 45000000, percentage: 36 },
          { department: 'חינוך', amount: 31250000, percentage: 25 },
          { department: 'בריאות', amount: 25000000, percentage: 20 },
          { department: 'תרבות', amount: 12500000, percentage: 10 },
          { department: 'אחר', amount: 11250000, percentage: 9 }
        ],
        projectStatus: [
          { status: 'פעיל', count: 8 },
          { status: 'בתכנון', count: 5 },
          { status: 'הושלם', count: 3 },
          { status: 'מושהה', count: 2 }
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'פרויקט תשתית דרכים חורג מהתקציב ב-15%',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'info',
            message: 'פרויקט הפארקים מתקדם לפי לוח הזמנים',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    }
  }

  /**
   * Export dashboard data to PDF
   */
  static async exportToPDF(): Promise<Blob> {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.EXPORT_PDF, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('DashboardService.exportToPDF error:', error);
      throw new Error('Failed to export dashboard to PDF');
    }
  }
} 