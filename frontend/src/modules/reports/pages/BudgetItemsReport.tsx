import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  X, 
  Download, 
  FileText, 
  Table, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Info,
  Calendar,
  DollarSign,
  Building,
  Activity,
  ArrowLeft,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import pdfIcon from "@/assets/PDF.png";
import excelIcon from "@/assets/Excel.svg";
import { ReportsService } from '@/services/reportsService';

interface BudgetItem {
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

interface Filters {
  department?: string;
  status?: string;
  fiscal_year?: string;
  utilization_range?: string;
  search?: string;
}

interface FilterOptions {
  departments: string[];
  statuses: string[];
  years: string[];
}

export default function BudgetItemsReport() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [data, setData] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Dynamic filter options based on actual data
  const filterOptions = useMemo<FilterOptions>(() => {
    const departments = [...new Set(data.map(item => item.department))].filter(Boolean).sort();
    const statuses = [...new Set(data.map(item => item.status))].filter(Boolean).sort();
    const years = [...new Set(data.map(item => item.fiscal_year))].filter(Boolean).sort((a, b) => b - a);
    
    return {
      departments,
      statuses,
      years: years.map(String)
    };
  }, [data]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Convert filters to the format expected by the API
        const apiFilters = {
          department: filters.department && filters.department !== 'all' ? filters.department : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          year: filters.fiscal_year && filters.fiscal_year !== 'all' ? filters.fiscal_year : undefined,
          search: filters.search || undefined
        };
        
        console.log('📊 Loading budget items with filters:', apiFilters);
        const budgetItems = await ReportsService.fetchBudgetItems(apiFilters);
        setData(budgetItems);
        console.log('✅ Budget items loaded:', budgetItems.length, 'items');
      } catch (error) {
        console.error('❌ Error loading budget items:', error);
        // Fallback to empty array since we're using real API now
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]); // Re-run when filters change

  // Mock data as fallback
  const mockData: BudgetItem[] = [
    {
      id: 1,
      name: "שיפוצי בתי ספר",
      department: "חינוך",
      status: "פעיל",
      approved_budget: 2500000,
      executed_budget: 1800000,
      fiscal_year: 2025,
      tabar_id: 2025001,
      created_at: "2025-01-01T00:00:00Z",
      notes: "שיפוץ כיתות לימוד ומעבדות"
    },
    {
      id: 2,
      name: "תשתיות תקשורת",
      department: "טכנולוגיות מידע",
      status: "פעיל",
      approved_budget: 1200000,
      executed_budget: 1350000,
      fiscal_year: 2025,
      tabar_id: 2025002,
      created_at: "2025-01-01T00:00:00Z",
      notes: "שדרוג רשת האינטרנט העירונית"
    },
    {
      id: 3,
      name: "פיתוח פארקים",
      department: "שירותים עירוניים",
      status: "פעיל",
      approved_budget: 800000,
      executed_budget: 320000,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "הקמת פארק חדש באזור הצפון"
    },
    {
      id: 4,
      name: "תחזוקת כבישים",
      department: "תחבורה",
      status: "פעיל",
      approved_budget: 1500000,
      executed_budget: 1425000,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "שיפוץ כבישים ראשיים"
    },
    {
      id: 5,
      name: "מערכות אבטחה",
      department: "ביטחון",
      status: "מוקפא",
      approved_budget: 600000,
      executed_budget: 0,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "התקנת מצלמות אבטחה"
    },
    {
      id: 6,
      name: "תוכניות רווחה",
      department: "רווחה",
      status: "פעיל",
      approved_budget: 900000,
      executed_budget: 750000,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "תמיכה במשפחות נזקקות"
    },
    {
      id: 7,
      name: "פעילויות תרבות",
      department: "תרבות וספורט",
      status: "פעיל",
      approved_budget: 450000,
      executed_budget: 380000,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "אירועים תרבותיים ופסטיבלים"
    },
    {
      id: 8,
      name: "שירותי בריאות",
      department: "בריאות",
      status: "פעיל",
      approved_budget: 1100000,
      executed_budget: 990000,
      fiscal_year: 2025,
      created_at: "2025-01-01T00:00:00Z",
      notes: "שירותי בריאות קהילתיים"
    }
  ];

  // Calculate utilization percentage
  const calculateUtilization = (executed: number, approved: number): number => {
    return approved > 0 ? (executed / approved) * 100 : 0;
  };

  // Get utilization status and styling
  const getUtilizationStatus = (percent: number) => {
    if (percent > 100) {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50",
        progressColor: "bg-red-500",
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        label: "חריגה מהתקציב",
        badge: "destructive" as const
      };
    } else if (percent >= 90) {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        progressColor: "bg-orange-500",
        icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
        label: "מתקרב לגבול",
        badge: "secondary" as const
      };
    } else if (percent < 50) {
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        progressColor: "bg-blue-500",
        icon: <TrendingDown className="h-4 w-4 text-blue-500" />,
        label: "ניצול נמוך",
        badge: "outline" as const
      };
    } else if (percent === 0) {
      return {
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        progressColor: "bg-gray-400",
        icon: <Info className="h-4 w-4 text-gray-500" />,
        label: "סעיף לא תוקצב",
        badge: "secondary" as const
      };
    }
    return {
      color: "text-green-600",
      bgColor: "bg-green-50",
      progressColor: "bg-green-500",
      icon: <Activity className="h-4 w-4 text-green-500" />,
      label: "ניצול תקין",
      badge: "default" as const
    };
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'פעיל': return 'default';
      case 'מוקפא': return 'secondary';
      case 'סגור': return 'destructive';
      default: return 'outline';
    }
  };

  // Format currency in Hebrew locale
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply filters
    if (filters.department && filters.department !== 'all') {
      filtered = filtered.filter(item => item.department === filters.department);
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.fiscal_year && filters.fiscal_year !== 'all') {
      filtered = filtered.filter(item => item.fiscal_year.toString() === filters.fiscal_year);
    }
    if (filters.utilization_range && filters.utilization_range !== 'all') {
      filtered = filtered.filter(item => {
        const percent = calculateUtilization(item.executed_budget, item.approved_budget);
        switch (filters.utilization_range) {
          case 'over_100': return percent > 100;
          case '90_100': return percent >= 90 && percent <= 100;
          case 'under_50': return percent < 50;
          case 'zero': return percent === 0;
          default: return true;
        }
      });
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.department.toLowerCase().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof BudgetItem];
        let bValue = b[sortConfig.key as keyof BudgetItem];

        // Handle special cases
        if (sortConfig.key === 'utilization') {
          aValue = calculateUtilization(a.executed_budget, a.approved_budget);
          bValue = calculateUtilization(b.executed_budget, b.approved_budget);
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'he')
            : bValue.localeCompare(aValue, 'he');
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalApproved = filteredData.reduce((sum, item) => sum + item.approved_budget, 0);
    const totalExecuted = filteredData.reduce((sum, item) => sum + item.executed_budget, 0);
    const overBudgetCount = filteredData.filter(item => 
      calculateUtilization(item.executed_budget, item.approved_budget) > 100
    ).length;
    const underUtilizedCount = filteredData.filter(item => 
      calculateUtilization(item.executed_budget, item.approved_budget) < 50
    ).length;

    return {
      totalApproved,
      totalExecuted,
      overallUtilization: totalApproved > 0 ? (totalExecuted / totalApproved) * 100 : 0,
      overBudgetCount,
      underUtilizedCount,
      totalItems: filteredData.length
    };
  }, [filteredData]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportAsPDF = async () => {
    try {
      setExportingPDF(true);
      const response = await fetch('/api/budget-items/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: JSON.stringify({ filters }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'budget_items_report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  const exportAsExcel = () => {
    const exportData = filteredData.map(row => ({
      "שם סעיף": row.name,
      "מחלקה": row.department,
      "סטטוס": row.status,
      "תקציב מאושר": row.approved_budget,
      "ניצול בפועל": row.executed_budget,
      "אחוז ניצול": calculateUtilization(row.executed_budget, row.approved_budget).toFixed(1) + '%',
      "שנת תקציב": row.fiscal_year,
      "תב\"ר מקושר": row.tabar_id || '',
      "תאריך פתיחה": new Date(row.created_at).toLocaleDateString("he-IL"),
      "הערות": row.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח סעיפי תקציב");
    XLSX.writeFile(workbook, "budget_items_report.xlsx");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Show message when no data is available
  if (!loading && data.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            חזרה לדוחות
          </Button>
          <span>/</span>
          <span className="text-gray-900 font-medium">דוח סעיפי תקציב</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            דוח סעיפי תקציב
          </h1>
        </div>

        {/* No Data Message */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                אין נתונים זמינים כרגע
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                המערכת מתחברת לנתונים האמיתיים מהמסד נתונים.<br/>
                אם הבעיה נמשכת, אנא פנה למנהל המערכת.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                רענן דף
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-4 max-w-7xl mx-auto" dir="rtl">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            חזרה לדוחות
          </Button>
          <span>/</span>
          <span className="text-gray-900 font-medium">דוח סעיפי תקציב</span>
        </div>

        {/* Compact Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
              דוח סעיפי תקציב
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredData.length} סעיפים מתוך {data.length} • סה"כ תקציב: {formatCurrency(summaryStats.totalApproved)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2"
            >
              <img src={pdfIcon} alt="PDF" className="w-4 h-4" />
              {exportingPDF ? 'מייצא...' : 'PDF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsExcel}
              className="flex items-center gap-2"
            >
              <img src={excelIcon} alt="Excel" className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {summaryStats.overBudgetCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>התרעה:</strong> {summaryStats.overBudgetCount} סעיפים חורגים מהתקציב המאושר
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Table with Integrated Filters */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Table Header with Integrated Filters */}
                <thead>
                  {/* Column Headers */}
                  <tr className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[200px]"
                        onClick={() => handleSort('name')}>
                      <div className="flex items-center justify-between">
                        שם סעיף
                        {sortConfig?.key === 'name' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[140px]"
                        onClick={() => handleSort('department')}>
                      <div className="flex items-center justify-between">
                        מחלקה
                        {sortConfig?.key === 'department' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[100px]"
                        onClick={() => handleSort('status')}>
                      <div className="flex items-center justify-between">
                        סטטוס
                        {sortConfig?.key === 'status' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[130px]"
                        onClick={() => handleSort('approved_budget')}>
                      <div className="flex items-center justify-between">
                        תקציב מאושר
                        {sortConfig?.key === 'approved_budget' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[130px]"
                        onClick={() => handleSort('executed_budget')}>
                      <div className="flex items-center justify-between">
                        ניצול בפועל
                        {sortConfig?.key === 'executed_budget' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[150px]"
                        onClick={() => handleSort('utilization')}>
                      <div className="flex items-center justify-between">
                        אחוז ניצול
                        {sortConfig?.key === 'utilization' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold cursor-pointer hover:bg-blue-800 transition-colors min-w-[100px]"
                        onClick={() => handleSort('fiscal_year')}>
                      <div className="flex items-center justify-between">
                        שנת תקציב
                        {sortConfig?.key === 'fiscal_year' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right font-semibold min-w-[80px]">הערות</th>
                  </tr>
                  
                  {/* Integrated Filter Row */}
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <td className="p-2">
                      <div className="relative">
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="חיפוש..."
                          value={filters.search || ""}
                          onChange={(e) => updateFilter('search', e.target.value)}
                          className="pr-8 h-8 text-sm bg-white"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <Select value={filters.department || "all"} onValueChange={(value) => updateFilter('department', value)}>
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="כל המחלקות" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל המחלקות</SelectItem>
                          {filterOptions.departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={filters.status || "all"} onValueChange={(value) => updateFilter('status', value)}>
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="כל הסטטוסים" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל הסטטוסים</SelectItem>
                          {filterOptions.statuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <div className="text-xs text-gray-500 text-center">
                        {formatCurrency(summaryStats.totalApproved)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs text-gray-500 text-center">
                        {formatCurrency(summaryStats.totalExecuted)}
                      </div>
                    </td>
                    <td className="p-2">
                      <Select value={filters.utilization_range || "all"} onValueChange={(value) => updateFilter('utilization_range', value)}>
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="כל הטווחים" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל הטווחים</SelectItem>
                          <SelectItem value="over_100">מעל 100%</SelectItem>
                          <SelectItem value="90_100">90%-100%</SelectItem>
                          <SelectItem value="under_50">מתחת ל-50%</SelectItem>
                          <SelectItem value="zero">ללא תקציב</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={filters.fiscal_year || "all"} onValueChange={(value) => updateFilter('fiscal_year', value)}>
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="כל השנים" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל השנים</SelectItem>
                          {filterOptions.years.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      {Object.keys(filters).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <Table className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">לא נמצאו תוצאות</p>
                        <p className="text-gray-500 text-sm mt-2">נסה לשנות את הפילטרים או לנקות אותם</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, index) => {
                      const utilization = calculateUtilization(row.executed_budget, row.approved_budget);
                      const utilizationStatus = getUtilizationStatus(utilization);
                      
                      return (
                        <tr 
                          key={row.id} 
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            utilization > 100 ? 'bg-red-50' :
                            utilization >= 90 ? 'bg-orange-50' :
                            utilization < 50 ? 'bg-blue-50' :
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {utilizationStatus.icon}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help hover:text-blue-600 transition-colors font-medium">
                                    {row.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1 text-sm">
                                    <p><strong>תקציב מאושר:</strong> {formatCurrency(row.approved_budget)}</p>
                                    <p><strong>ניצול בפועל:</strong> {formatCurrency(row.executed_budget)}</p>
                                    <p><strong>מחלקה:</strong> {row.department}</p>
                                    <p><strong>סטטוס:</strong> {row.status}</p>
                                    <p><strong>שנת תקציב:</strong> {row.fiscal_year}</p>
                                    {row.tabar_id && <p><strong>תב"ר מקושר:</strong> {row.tabar_id}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-gray-100">
                              {row.department}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={getStatusBadgeVariant(row.status)}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            {formatCurrency(row.approved_budget)}
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            {formatCurrency(row.executed_budget)}
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${utilizationStatus.color}`}>
                                  {utilization.toFixed(1)}%
                                </span>
                                <Badge variant={utilizationStatus.badge} className="text-xs">
                                  {utilizationStatus.label}
                                </Badge>
                              </div>
                              <Progress 
                                value={Math.min(utilization, 100)} 
                                className="h-2"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            {row.fiscal_year}
                          </td>
                          <td className="p-3">
                            {row.notes ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{row.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
