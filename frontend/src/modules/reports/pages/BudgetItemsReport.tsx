import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import pdfIcon from "@/assets/PDF.png";
import excelIcon from "@/assets/Excel.svg";

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
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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

  // Load filters from localStorage on component mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('budgetItemsFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        console.log("📁 Loaded filters from localStorage:", JSON.stringify(parsedFilters, null, 2));
        
        // Validate filters - remove any invalid values
        const validatedFilters: Filters = {};
        
        // Known valid status values based on database
        const validStatuses = ['פעיל', 'סגור'];
        
        if (parsedFilters.department && parsedFilters.department !== 'all') {
          validatedFilters.department = parsedFilters.department;
        }
        if (parsedFilters.status && parsedFilters.status !== 'all') {
          // Only keep status if it's in the valid list
          if (validStatuses.includes(parsedFilters.status)) {
            validatedFilters.status = parsedFilters.status;
          } else {
            console.log(`⚠️ Removing invalid status filter: "${parsedFilters.status}"`);
          }
        }
        if (parsedFilters.fiscal_year && parsedFilters.fiscal_year !== 'all') {
          validatedFilters.fiscal_year = parsedFilters.fiscal_year;
        }
        if (parsedFilters.utilization_range && parsedFilters.utilization_range !== 'all') {
          validatedFilters.utilization_range = parsedFilters.utilization_range;
        }
        if (parsedFilters.search) {
          validatedFilters.search = parsedFilters.search;
        }
        
        console.log("✅ Validated filters:", JSON.stringify(validatedFilters, null, 2));
        
        // If validation removed filters, update localStorage
        if (Object.keys(validatedFilters).length !== Object.keys(parsedFilters).length) {
          console.log("🧹 Updating localStorage with validated filters");
          if (Object.keys(validatedFilters).length > 0) {
            localStorage.setItem('budgetItemsFilters', JSON.stringify(validatedFilters));
          } else {
            localStorage.removeItem('budgetItemsFilters');
          }
        }
        
        setFilters(validatedFilters);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
        setFilters({});
      }
    } else {
      console.log("📁 No saved filters found, starting with empty filters");
      setFilters({});
    }
    setFiltersLoaded(true);
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(filters).some(key => filters[key as keyof Filters])) {
      localStorage.setItem('budgetItemsFilters', JSON.stringify(filters));
    }
  }, [filters]);

  // Fetch data from API
  useEffect(() => {
    // Don't fetch until filters are loaded
    if (!filtersLoaded) return;
    
    setLoading(true);
    
    const apiFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const requestBody = {
      module: "budget_items",
      fields: [
        "id", "name", "department", "status", 
        "approved_budget", "executed_budget", "fiscal_year", 
        "tabar_id", "created_at", "notes"
      ],
      filters: apiFilters
    };

    console.log("🔄 Sending request to API:", JSON.stringify(requestBody, null, 2));
    console.log("🔍 Current filters state:", JSON.stringify(filters, null, 2));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/report-schemas/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    })
      .then(res => {
        console.log("📡 Response status:", res.status);
        console.log("📡 Response headers:", res.headers);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text().then(text => {
          console.log("📄 Raw response text:", text);
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("❌ JSON parse error:", e);
            throw new Error("Invalid JSON response");
          }
        });
      })
      .then(rows => {
        console.log("📊 Received data:", rows);
        console.log("📊 Data type:", typeof rows);
        console.log("📊 Data length:", rows?.length || 0);
        console.log("📊 Is Array:", Array.isArray(rows));
        
        // Clean and format data
        const cleanedData = (rows || []).map((item: any) => ({
          ...item,
          approved_budget: Number(item.approved_budget) || 0,
          executed_budget: Number(item.executed_budget) || 0,
          fiscal_year: Number(item.fiscal_year) || new Date().getFullYear(),
        }));
        
        console.log("✅ Cleaned data:", cleanedData);
        setData(cleanedData);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching data:', error);
        setData([]);
        setLoading(false);
      });
  }, [filters, filtersLoaded]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    if (value === 'all' || value === '') {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const clearFilters = () => {
    console.log("🧹 Clearing all filters and localStorage");
    setFilters({});
    setSortConfig(null);
    localStorage.removeItem('budgetItemsFilters');
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("דוח סעיפי תקציב", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`נוצר בתאריך: ${new Date().toLocaleDateString("he-IL")}`, 14, 30);
    doc.text(`סה"כ פריטים: ${filteredData.length}`, 14, 35);

    const tableData = filteredData.map(row => [
      row.name,
      row.department,
      row.status,
      formatCurrency(row.approved_budget),
      formatCurrency(row.executed_budget),
      `${calculateUtilization(row.executed_budget, row.approved_budget).toFixed(1)}%`,
      row.fiscal_year.toString(),
      new Date(row.created_at).toLocaleDateString("he-IL")
    ]);

    autoTable(doc, {
      head: [["שם סעיף", "מחלקה", "סטטוס", "תקציב מאושר", "ניצול בפועל", "אחוז ניצול", "שנת תקציב", "תאריך פתיחה"]],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });

    doc.save("budget_items_report.pdf");
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

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
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

        {/* Header Section */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              דוח סעיפי תקציב
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              בחר פילטרים לפי מחלקה וסטטוס להצגת ביצועים תקציביים מפורטים
            </p>
          </CardHeader>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סה"כ תקציב מאושר</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summaryStats.totalApproved)}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סה"כ ניצול בפועל</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalExecuted)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">אחוז ניצול כולל</p>
                  <p className={`text-2xl font-bold ${getUtilizationStatus(summaryStats.overallUtilization).color}`}>
                    {summaryStats.overallUtilization.toFixed(1)}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סעיפים בחריגה</p>
                  <p className="text-2xl font-bold text-red-600">{summaryStats.overBudgetCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="חיפוש לפי שם סעיף, מחלקה או הערות..."
                  value={filters.search || ""}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    מחלקה
                  </label>
                  <Select value={filters.department || "all"} onValueChange={(value) => updateFilter('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מחלקה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המחלקות</SelectItem>
                      {filterOptions.departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    סטטוס
                  </label>
                  <Select value={filters.status || "all"} onValueChange={(value) => updateFilter('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסטטוסים</SelectItem>
                      {filterOptions.statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    שנת תקציב
                  </label>
                  <Select value={filters.fiscal_year || "all"} onValueChange={(value) => updateFilter('fiscal_year', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר שנה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל השנים</SelectItem>
                      {filterOptions.years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    אחוז ניצול
                  </label>
                  <Select value={filters.utilization_range || "all"} onValueChange={(value) => updateFilter('utilization_range', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר טווח" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הטווחים</SelectItem>
                      <SelectItem value="over_100">מעל 100%</SelectItem>
                      <SelectItem value="90_100">90%-100%</SelectItem>
                      <SelectItem value="under_50">מתחת ל-50%</SelectItem>
                      <SelectItem value="zero">ללא תקציב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  {Object.keys(filters).length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      נקה סינון
                    </Button>
                  )}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsPDF}
                      className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
                    >
                      <img src={pdfIcon} alt="PDF" className="w-5 h-5" />
                      ייצוא PDF
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ייצא את הדוח כקובץ PDF</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsExcel}
                      className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200"
                    >
                      <img src={excelIcon} alt="Excel" className="w-5 h-5" />
                      ייצוא Excel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ייצא את הדוח כקובץ Excel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts for important insights */}
        {summaryStats.overBudgetCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>התרעה:</strong> {summaryStats.overBudgetCount} סעיפים חורגים מהתקציב המאושר
            </AlertDescription>
          </Alert>
        )}

        {summaryStats.underUtilizedCount > 5 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>המלצה:</strong> {summaryStats.underUtilizedCount} סעיפים עם ניצול נמוך - ניתן לשקול העברת תקציב
            </AlertDescription>
          </Alert>
        )}

        {/* Results Summary */}
        {filteredData.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                נמצאו <span className="font-bold">{filteredData.length}</span> סעיפי תקציב
                {data.length !== filteredData.length && (
                  <span> מתוך {data.length} סעיפים סה"כ</span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Table className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">לא נמצאו תוצאות</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">נסה לשנות את הפילטרים או לנקות אותם</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-blue-200 bg-blue-600 text-white">
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center justify-between">
                          שם סעיף
                          {sortConfig?.key === 'name' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center justify-between">
                          מחלקה
                          {sortConfig?.key === 'department' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-between">
                          סטטוס
                          {sortConfig?.key === 'status' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('approved_budget')}
                      >
                        <div className="flex items-center justify-between">
                          תקציב מאושר
                          {sortConfig?.key === 'approved_budget' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('executed_budget')}
                      >
                        <div className="flex items-center justify-between">
                          ניצול בפועל
                          {sortConfig?.key === 'executed_budget' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('utilization')}
                      >
                        <div className="flex items-center justify-between">
                          אחוז ניצול
                          {sortConfig?.key === 'utilization' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('fiscal_year')}
                      >
                        <div className="flex items-center justify-between">
                          שנת תקציב
                          {sortConfig?.key === 'fiscal_year' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-right font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center justify-between">
                          תאריך פתיחה
                          {sortConfig?.key === 'created_at' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-right font-semibold">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => {
                      const utilization = calculateUtilization(row.executed_budget, row.approved_budget);
                      const utilizationStatus = getUtilizationStatus(utilization);
                      
                      return (
                        <tr 
                          key={row.id} 
                          className={`border-b border-gray-200 dark:border-gray-700 hover:bg-muted transition-colors ${
                            utilization > 100 ? 'bg-red-50 dark:bg-red-900/10' :
                            utilization >= 90 ? 'bg-orange-50 dark:bg-orange-900/10' :
                            utilization < 50 ? 'bg-blue-50 dark:bg-blue-900/10' :
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <td className="p-4">
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
                          <td className="p-4">
                            <Badge variant="outline" className="bg-gray-100">
                              {row.department}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={getStatusBadgeVariant(row.status)}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="p-4 font-medium text-gray-900 dark:text-white">
                            {formatCurrency(row.approved_budget)}
                          </td>
                          <td className="p-4 font-medium text-gray-900 dark:text-white">
                            {formatCurrency(row.executed_budget)}
                          </td>
                          <td className="p-4">
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
                          <td className="p-4 text-gray-600 dark:text-gray-400">
                            {row.fiscal_year}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(row.created_at).toLocaleDateString("he-IL")}
                          </td>
                          <td className="p-4">
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
                    })}
                  </tbody>
                  
                  {/* Summary Row */}
                  <tfoot>
                    <tr className="border-t-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 font-bold">
                      <td className="p-4" colSpan={3}>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          סיכום כולל
                        </div>
                      </td>
                      <td className="p-4 text-blue-900 dark:text-blue-100">
                        {formatCurrency(summaryStats.totalApproved)}
                      </td>
                      <td className="p-4 text-blue-900 dark:text-blue-100">
                        {formatCurrency(summaryStats.totalExecuted)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getUtilizationStatus(summaryStats.overallUtilization).color}`}>
                            {summaryStats.overallUtilization.toFixed(1)}%
                          </span>
                          <Badge variant={getUtilizationStatus(summaryStats.overallUtilization).badge}>
                            {getUtilizationStatus(summaryStats.overallUtilization).label}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4" colSpan={3}>
                        <span className="text-sm text-gray-600">
                          {summaryStats.totalItems} סעיפים סה"כ
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
