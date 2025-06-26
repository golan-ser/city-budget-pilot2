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
   * Fetch budget items report
   */
  static async fetchBudgetItems(filters?: ReportFilters): Promise<any[]> {
    const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.REPORTS.BUDGET_ITEMS}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch budget items report');
    }
    
    return response.json();
  }

  /**
   * Export budget items report as Excel
   */
  static async exportBudgetItemsExcel(filters?: ReportFilters): Promise<Blob> {
    const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.REPORTS_BUDGET_ITEMS}/export/excel${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to export budget items report');
    }
    
    return response.blob();
  }

  /**
   * Fetch full tabar report
   */
  static async fetchFullTabar(filters?: ReportFilters): Promise<FullTabarReport> {
    const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.REPORTS.FULL_TABAR}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch full tabar report');
    }
    
    return response.json();
  }

  /**
   * Export full tabar report as Excel
   */
  static async exportFullTabarExcel(filters?: ReportFilters): Promise<Blob> {
    const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.REPORTS.FULL_TABAR}/export/excel${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to export full tabar report');
    }
    
    return response.blob();
  }

  /**
   * Fetch tabar budget report
   */
  static async fetchTabarBudget(filters?: ReportFilters): Promise<any[]> {
    const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await api.get(`${API_ENDPOINTS.REPORTS.BUDGET_ITEMS_REPORT}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tabar budget report');
    }
    
    return response.json();
  }

  /**
   * Export tabar budget report as Excel
   */
  static async exportTabarBudgetExcel(data?: any): Promise<Blob> {
    // For now, create a simple Excel blob
    // In production, this should call the backend API
    const csvContent = "data:text/csv;charset=utf-8," + 
      data?.map((row: any) => Object.values(row).join(",")).join("\n");
    
    return new Blob([csvContent], { type: 'text/csv' });
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
} 