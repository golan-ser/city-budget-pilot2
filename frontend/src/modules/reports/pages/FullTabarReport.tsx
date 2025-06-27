import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  X, 
  FileText, 
  Table, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Mail,
  Plus,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowLeft,
  RefreshCw,
  Building,
  Calendar,
  DollarSign
} from "lucide-react";
import pdfIcon from "@/assets/PDF.png";
import excelIcon from "@/assets/Excel.svg";
import { useNavigate } from "react-router-dom";
import { ReportsService } from '@/services/reportsService';

interface TabarItem {
  id: number;
  tabar_number: string;
  name: string;
  year: number;
  ministry: string;
  department: string;
  status: string;
  total_authorized: number;
  municipal_participation: number;
  additional_funders: number;
  open_date: string;
  close_date: string | null;
  permission_number: string;
  budget_item: string;
  budget: number;
  spent: number;
  updated_at: string;
}

interface Filters {
  year?: string;
  ministry?: string;
  status?: string;
  search?: string;
}

interface SortConfig {
  key: keyof TabarItem | null;
  direction: 'asc' | 'desc';
}

const YEARS = ['2024', '2023', '2022', '2021', '2020'];
const MINISTRIES = ['הנדסה', 'חינוך', 'רווחה', 'תרבות', 'ביטחון', 'תחבורה'];
const STATUSES = ['פעיל', 'מושהה', 'הושלם', 'בתכנון', 'מבוטל'];

export default function FullTabarReport() {
  const [filters, setFilters] = useState<Filters>({});
  const [data, setData] = useState<TabarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [exportingPDF, setExportingPDF] = useState(false);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('fullTabarFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFilters(parsedFilters);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    if (Object.keys(filters).some(key => filters[key as keyof Filters])) {
      localStorage.setItem('fullTabarFilters', JSON.stringify(filters));
    }
  }, [filters]);

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
    setFilters({});
    localStorage.removeItem('fullTabarFilters');
  };

  const handleSort = (key: keyof TabarItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const getUtilizationColor = (percent: number) => {
    if (percent >= 100) return "text-red-600 font-bold";
    if (percent >= 90) return "text-orange-600 font-semibold";
    return "text-green-600";
  };

  const getUtilizationBadge = (percent: number) => {
    if (percent >= 100) return "destructive";
    if (percent >= 90) return "secondary";
    return "default";
  };

  const totalBudget = useMemo(() => {
    return data.reduce((sum, item) => sum + item.budget, 0);
  }, [data]);

  const totalSpent = useMemo(() => {
    return data.reduce((sum, item) => sum + item.spent, 0);
  }, [data]);

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportAsPDF = async () => {
    try {
      setExportingPDF(true);
      
      // Convert filters to the format expected by the API
      const apiFilters = {
        year: filters.year && filters.year !== 'all' ? filters.year : undefined,
        ministry: filters.ministry && filters.ministry !== 'all' ? filters.ministry : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined
      };
      
      console.log('📄 Exporting PDF with filters:', apiFilters);
      const blob = await ReportsService.exportFullTabarExcel(apiFilters);
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full-tabar-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      alert('שגיאה בייצוא PDF: ' + error.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const exportAsExcel = async () => {
    try {
      // Convert filters to the format expected by the API
      const apiFilters = {
        year: filters.year && filters.year !== 'all' ? filters.year : undefined,
        ministry: filters.ministry && filters.ministry !== 'all' ? filters.ministry : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined
      };
      
      console.log('📊 Exporting Excel with filters:', apiFilters);
      const blob = await ReportsService.exportFullTabarExcel(apiFilters);
      ReportsService.downloadExcelFile(blob, `full-tabar-report-${new Date().getTime()}.xlsx`);
      console.log('✅ Excel exported successfully');
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      // Fallback to local export with current data
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sortedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Full Tabar Report');
      XLSX.writeFile(wb, `full-tabar-report-${new Date().getTime()}.xlsx`);
    }
  };

  const SortIcon = ({ column }: { column: keyof TabarItem }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Convert filters to the format expected by the API
        const apiFilters = {
          year: filters.year && filters.year !== 'all' ? filters.year : undefined,
          ministry: filters.ministry && filters.ministry !== 'all' ? filters.ministry : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined
        };
        
        console.log('🔍 Loading full tabar data with filters:', apiFilters);
        const fullTabarData = await ReportsService.fetchFullTabar(apiFilters);
        
        // Handle the response properly - it's a FullTabarReport object with data property
        if (fullTabarData && fullTabarData.data) {
          setData(fullTabarData.data);
          console.log('✅ Full tabar data loaded:', fullTabarData.data.length, 'records');
        } else {
          setData([]);
          console.log('⚠️ No data received from API');
        }
      } catch (error) {
        console.error('❌ Error loading full tabar data:', error);
        // Fallback to empty array since we're using real API now
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]); // Re-run when filters change

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message when no data is available
  if (!loading && data.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
        {/* Header Section */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              דוח תב"רים מלא
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              סקירה מלאה של כל תב"רי העירייה כולל סעיפים תקציביים, מימון וסטטוסים
            </p>
          </CardHeader>
        </Card>

        {/* No Data Message */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
      <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
        {/* Header Section */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              דוח תב"רים מלא
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              סקירה מלאה של כל תב"רי העירייה כולל סעיפים תקציביים, מימון וסטטוסים
            </p>
          </CardHeader>
        </Card>

        {/* Filters Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">שנה</label>
                <Select value={filters.year || "all"} onValueChange={(value) => updateFilter('year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שנה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל השנים</SelectItem>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ministry Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">משרד</label>
                <Select value={filters.ministry || "all"} onValueChange={(value) => updateFilter('ministry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משרד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המשרדים</SelectItem>
                    {MINISTRIES.map(ministry => (
                      <SelectItem key={ministry} value={ministry}>{ministry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">סטטוס</label>
                <Select value={filters.status || "all"} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    {STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">חיפוש</label>
                <Input
                  placeholder="חפש לפי שם תב״ר או סעיף..."
                  value={filters.search || ""}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
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

              <div className="flex flex-wrap gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsPDF}
                      disabled={exportingPDF}
                      className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                    >
                      <img src={pdfIcon} alt="PDF" className="w-5 h-5" />
                      {exportingPDF ? 'מייצא...' : 'ייצוא PDF'}
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

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <Mail className="h-4 w-4" />
                  שליחה למייל
                </Button>

                <Button
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  יצירת תב"ר חדש
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400">סה"כ תב"רים</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{data.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">סה"כ תקציב</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">{totalBudget.toLocaleString()} ₪</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-orange-600 dark:text-orange-400">סה"כ בוצע</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{totalSpent.toLocaleString()} ₪</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-purple-600 dark:text-purple-400">אחוז ביצוע כולל</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Table */}
        {data.length === 0 ? (
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
                <table className="w-full border-collapse min-w-[1400px]">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('tabar_number')}
                          className="flex items-center gap-2"
                        >
                          מספר תב"ר
                          <SortIcon column="tabar_number" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2"
                        >
                          שם תב"ר
                          <SortIcon column="name" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('year')}
                          className="flex items-center gap-2"
                        >
                          שנה
                          <SortIcon column="year" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('ministry')}
                          className="flex items-center gap-2"
                        >
                          משרד
                          <SortIcon column="ministry" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2"
                        >
                          סטטוס
                          <SortIcon column="status" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('budget')}
                          className="flex items-center gap-2"
                        >
                          תקציב סעיף
                          <SortIcon column="budget" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('spent')}
                          className="flex items-center gap-2"
                        >
                          בוצע בפועל
                          <SortIcon column="spent" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">אחוז ניצול</th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('open_date')}
                          className="flex items-center gap-2"
                        >
                          תאריך פתיחה
                          <SortIcon column="open_date" />
                        </Button>
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row, index) => {
                      const percent = row.budget > 0 ? ((row.spent / row.budget) * 100) : 0;
                      const percentFormatted = percent.toFixed(1);
                      const isExpanded = expandedRows.has(row.id);
                      
                      return (
                        <React.Fragment key={row.id}>
                          <tr 
                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-muted transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <td className="p-3 font-medium text-blue-600">{row.tabar_number}</td>
                            <td className="p-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help hover:text-blue-600 transition-colors">
                                    {row.name.length > 30 ? `${row.name.substring(0, 30)}...` : row.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p>{row.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="p-3">{row.year}</td>
                            <td className="p-3">{row.ministry}</td>
                            <td className="p-3">
                              <Badge variant={
                                row.status === 'פעיל' ? 'default' : 
                                row.status === 'הושלם' ? 'secondary' : 
                                row.status === 'מבוטל' ? 'destructive' : 'outline'
                              }>
                                {row.status}
                              </Badge>
                            </td>
                            <td className="p-3 font-medium">{Number(row.budget).toLocaleString()} ₪</td>
                            <td className="p-3 font-medium">{Number(row.spent).toLocaleString()} ₪</td>
                            <td className="p-3">
                              <div className="space-y-2">
                                <Badge variant={getUtilizationBadge(percent)} className={getUtilizationColor(percent)}>
                                  {percentFormatted}%
                                </Badge>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      percent >= 100 ? 'bg-red-500' : 
                                      percent >= 90 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(row.open_date).toLocaleDateString("he-IL")}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(row.id)}
                                className="flex items-center gap-1"
                              >
                                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {isExpanded ? 'הסתר' : 'הצג'}
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-blue-50 dark:bg-blue-900/20">
                              <td colSpan={10} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <strong>מחלקה:</strong> {row.department}
                                  </div>
                                  <div>
                                    <strong>תקציב מאושר:</strong> {Number(row.total_authorized).toLocaleString()} ₪
                                  </div>
                                  <div>
                                    <strong>השתתפות עירייה:</strong> {Number(row.municipal_participation).toLocaleString()} ₪
                                  </div>
                                  <div>
                                    <strong>מימון נוסף:</strong> {Number(row.additional_funders).toLocaleString()} ₪
                                  </div>
                                  <div>
                                    <strong>תאריך סגירה:</strong> {row.close_date ? new Date(row.close_date).toLocaleDateString("he-IL") : "לא נקבע"}
                                  </div>
                                  <div>
                                    <strong>מס' היתר:</strong> {row.permission_number}
                                  </div>
                                  <div className="md:col-span-2 lg:col-span-3">
                                    <strong>שם סעיף תקציבי:</strong> {row.budget_item}
                                  </div>
                                  <div>
                                    <strong>תאריך עדכון:</strong> {new Date(row.updated_at).toLocaleDateString("he-IL")}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
