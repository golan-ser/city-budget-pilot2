import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  ministryId?: string;
  status?: string;
  // Add more filters as needed
}

export interface BudgetItem {
  id: number;
  name: string;
  department: string;  
  status: string;
  approved_budget: number;
  executed_budget: number;
  fiscal_year: number;
  tabar_id?: number;
  created_at: string;
  notes?: string;
}

export interface FullTabarReport {
  // Define structure based on your API response
  data: any[];
  totals: any;
}

export interface TabarBudgetReport {
  // Define structure based on your API response
  budgetData: any[];
  analysis: any;
}

export class ReportsService {
  /**
   * Fetch budget items report - MOCK VERSION FOR DEMO
   */
  static async fetchBudgetItems(filters?: ReportFilters): Promise<any[]> {
    console.log('🎭 Using mock budget items report - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return this.getMockBudgetItems(filters);
  }

  /**
   * Export budget items report as Excel - MOCK VERSION FOR DEMO
   */
  static async exportBudgetItemsExcel(filters?: ReportFilters): Promise<Blob> {
    console.log('🎭 Mock Excel export - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockData = this.getMockBudgetItems(filters);
    const csvContent = this.convertToCSV(mockData);
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Fetch full tabar report - MOCK VERSION FOR DEMO
   */
  static async fetchFullTabar(filters?: ReportFilters): Promise<FullTabarReport> {
    console.log('🎭 Using mock full tabar report - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: this.getMockTabarData(),
      totals: {
        totalBudget: 125000000,
        totalExecuted: 89000000,
        utilizationRate: 71.2,
        totalProjects: 18
      }
    };
  }

  /**
   * Export full tabar report as Excel - MOCK VERSION FOR DEMO
   */
  static async exportFullTabarExcel(filters?: ReportFilters): Promise<Blob> {
    console.log('🎭 Mock full tabar Excel export - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const mockData = this.getMockTabarData();
    const csvContent = this.convertToCSV(mockData);
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Fetch tabar budget report - MOCK VERSION FOR DEMO
   */
  static async fetchTabarBudget(filters?: ReportFilters): Promise<any[]> {
    console.log('🎭 Using mock tabar budget report - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));
    
    return this.getMockBudgetReport();
  }

  /**
   * Export tabar budget report as Excel - MOCK VERSION FOR DEMO
   */
  static async exportTabarBudgetExcel(data?: any): Promise<Blob> {
    console.log('🎭 Mock tabar budget Excel export - API disabled');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const exportData = data || this.getMockBudgetReport();
    const csvContent = this.convertToCSV(exportData);
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Download Excel blob as file
   */
  static downloadExcelFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get mock budget items data
   */
  private static getMockBudgetItems(filters?: ReportFilters): BudgetItem[] {
    const budgetItems: BudgetItem[] = [
      {
        id: 1,
        name: 'תשתית דרכים',
        department: 'משרד התחבורה',
        status: 'פעיל',
        approved_budget: 15000000,
        executed_budget: 12500000,
        fiscal_year: 2024,
        tabar_id: 1,
        created_at: '2024-01-15T10:00:00Z',
        notes: 'פרויקט בביצוע מתקדם'
      },
      {
        id: 2,
        name: 'חינוך דיגיטלי',
        department: 'משרד החינוך',
        status: 'בתכנון',
        approved_budget: 8500000,
        executed_budget: 2100000,
        fiscal_year: 2024,
        tabar_id: 2,
        created_at: '2024-02-01T10:00:00Z',
        notes: 'בשלבי תכנון מפורט'
      },
      {
        id: 3,
        name: 'פארקים עירוניים',
        department: 'מחלקת פיתוח',
        status: 'פעיל',
        approved_budget: 6200000,
        executed_budget: 4800000,
        fiscal_year: 2024,
        tabar_id: 3,
        created_at: '2024-01-20T10:00:00Z',
        notes: 'התקדמות טובה'
      }
    ];

    // Apply simple filtering
    let filtered = budgetItems;
    if (filters?.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(item => item.created_at >= filters.dateFrom!);
    }

    return filtered;
  }

  /**
   * Get mock tabar data
   */
  private static getMockTabarData(): any[] {
    return [
      {
        tabar_number: 'TB-2024-001',
        name: 'פרויקט תשתית דרכים',
        department: 'משרד התחבורה',
        status: 'פעיל',
        budget: 15000000,
        executed: 12500000,
        percentage: 83.3
      },
      {
        tabar_number: 'TB-2024-002',
        name: 'פרויקט חינוך דיגיטלי',
        department: 'משרד החינוך',
        status: 'בתכנון',
        budget: 8500000,
        executed: 2100000,
        percentage: 24.7
      },
      {
        tabar_number: 'TB-2024-003',
        name: 'פרויקט פארקים עירוניים',
        department: 'מחלקת פיתוח',
        status: 'פעיל',
        budget: 6200000,
        executed: 4800000,
        percentage: 77.4
      }
    ];
  }

  /**
   * Get mock budget report data
   */
  private static getMockBudgetReport(): any[] {
    return [
      {
        ministry: 'משרד התחבורה',
        approved: 45000000,
        executed: 32000000,
        percentage: 71.1,
        status: 'טוב'
      },
      {
        ministry: 'משרד החינוך',
        approved: 35000000,
        executed: 28000000,
        percentage: 80.0,
        status: 'מעולה'
      },
      {
        ministry: 'משרד הבריאות',
        approved: 25000000,
        executed: 18000000,
        percentage: 72.0,
        status: 'טוב'
      }
    ];
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        typeof row[header] === 'string' && row[header].includes(',') 
          ? `"${row[header]}"` 
          : row[header]
      ).join(','))
    ].join('\n');
    
    return csvContent;
  }
} 