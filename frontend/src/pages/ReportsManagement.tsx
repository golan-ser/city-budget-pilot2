import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Eye,
  Plus,
  BarChart3,
  PieChart,
  Info,
  FileSpreadsheet
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import * as XLSX from 'xlsx';

// Types
interface Report {
  id: number;
  report_identifier: string;
  tabar_number: number;
  project_name: string;
  ministry: string;
  request_year: number;
  tabar_status: 'פעיל' | 'אושר' | 'סגור';
  report_status: 'הוגש' | 'בטיפול' | 'אושר' | 'שולם';
  report_amount: number;
  amount_received: number;
  balance: number;
  last_report_date?: string;
  order_id?: string;
  documents_count: number;
  invoices_count: number;
}

interface DashboardStats {
  unreported_count: number;
  reported_unpaid_count: number;
  total_pending_amount: number;
  status_distribution: { name: string; value: number; color: string }[];
  comparison_data: { name: string; reported: number; received: number }[];
}

export default function ReportsManagement() {
  // State
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ministryFilter, setMinistryFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [advancedFilter, setAdvancedFilter] = useState<string>("all");
  
  // Sort
  const [sortField, setSortField] = useState<keyof Report>("report_identifier");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Mock data kept as fallback only - will be replaced by real API data
  const getFallbackReports = (): Report[] => [
    {
      id: 1,
      report_identifier: "DEMO-251",
      tabar_number: 2025001,
      project_name: "דוגמה - שיפוץ בית ספר יסודי",
      ministry: "משרד החינוך",
      request_year: 2025,
      tabar_status: "פעיל",
      report_status: "הוגש",
      report_amount: 500000,
      amount_received: 0,
      balance: 500000,
      last_report_date: "2025-01-15",
      order_id: "ORD-DEMO-001",
      documents_count: 3,
      invoices_count: 2
    }
  ];

  const getFallbackDashboardStats = (): DashboardStats => ({
    unreported_count: 0,
    reported_unpaid_count: 1,
    total_pending_amount: 500000,
    status_distribution: [
      { name: "הוגש", value: 1, color: "#3b82f6" }
    ],
    comparison_data: [
      { name: "דמו", reported: 500000, received: 0 }
    ]
  });

  // Load data from real API
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📊 Loading real reports data from API...');
        
        // Load real reports data
        const reportsResponse = await fetch('/api/reports', {
          signal: abortController.signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (abortController.signal.aborted) return;
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          console.log('✅ Real reports loaded:', reportsData.length, 'reports');
          
          // Transform data to match our interface
          const transformedReports: Report[] = reportsData.map((report: any) => ({
            id: report.id,
            report_identifier: report.report_identifier || report.id.toString(),
            tabar_number: report.tabar_id || report.project_id,
            project_name: report.project_name || 'לא מוגדר',
            ministry: report.ministry_name || 'לא מוגדר',
            request_year: report.year || new Date().getFullYear(),
            tabar_status: report.tabar_status || 'פעיל',
            report_status: report.status || 'הוגש',
            report_amount: parseFloat(report.amount) || 0,
            amount_received: parseFloat(report.amount_received) || 0,
            balance: (parseFloat(report.amount) || 0) - (parseFloat(report.amount_received) || 0),
            last_report_date: report.report_date || report.created_at,
            order_id: report.order_id || 'לא מוגדר',
            documents_count: report.documents_count || 0,
            invoices_count: report.invoices_count || 0
          }));
          
          if (!abortController.signal.aborted) {
            setReports(transformedReports);
            setFilteredReports(transformedReports);
          }
        } else {
          console.warn('⚠️ Failed to load reports, using fallback data');
          if (!abortController.signal.aborted) {
            const fallbackReports = getFallbackReports();
            setReports(fallbackReports);
            setFilteredReports(fallbackReports);
          }
        }
        
        // Load dashboard stats
        if (!abortController.signal.aborted) {
          try {
            const statsResponse = await fetch('/api/reports/dashboard', {
              signal: abortController.signal,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (abortController.signal.aborted) return;
            
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              if (!abortController.signal.aborted) {
                setDashboardStats(statsData);
                console.log('✅ Real dashboard stats loaded');
              }
            } else {
              console.warn('⚠️ Failed to load dashboard stats, using fallback data');
              if (!abortController.signal.aborted) {
                setDashboardStats(getFallbackDashboardStats());
              }
            }
          } catch (statsError) {
            if (!abortController.signal.aborted) {
              console.warn('⚠️ Dashboard stats error, using fallback:', statsError);
              setDashboardStats(getFallbackDashboardStats());
            }
          }
        }
        
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('❌ Error loading data, using fallback:', error);
          const fallbackReports = getFallbackReports();
          setReports(fallbackReports);
          setFilteredReports(fallbackReports);
          setDashboardStats(getFallbackDashboardStats());
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    // Cleanup function to cancel fetch requests
    return () => {
      abortController.abort();
    };
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...reports];

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tabar_number.toString().includes(searchTerm) ||
        report.report_identifier.includes(searchTerm) ||
        report.ministry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.report_status === statusFilter);
    }

    if (ministryFilter !== "all") {
      filtered = filtered.filter(report => report.ministry === ministryFilter);
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter(report => report.request_year.toString() === yearFilter);
    }

    if (advancedFilter === "open") {
      filtered = filtered.filter(report => 
        report.report_status === "הוגש" || report.report_status === "בטיפול"
      );
    } else if (advancedFilter === "unreported") {
      filtered = filtered.filter(report => !report.last_report_date);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal, 'he') 
          : bVal.localeCompare(aVal, 'he');
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, ministryFilter, yearFilter, advancedFilter, sortField, sortDirection]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "הוגש": { variant: "secondary" as const, icon: Clock },
      "בטיפול": { variant: "default" as const, icon: AlertTriangle },
      "אושר": { variant: "default" as const, icon: CheckCircle },
      "שולם": { variant: "default" as const, icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    
    return (
      <Badge variant={config?.variant || "secondary"} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleSort = (field: keyof Report) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (report: Report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const exportToPDF = async () => {
    try {
      console.log('Exporting to PDF...');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredReports.map(report => ({
        "מזהה דיווח": report.report_identifier,
        "מספר תב\"ר": report.tabar_number,
        "שם פרויקט": report.project_name,
        "משרד": report.ministry,
        "שנת בקשה": report.request_year,
        "סטטוס תב\"ר": report.tabar_status,
        "סטטוס דיווח": report.report_status,
        "סכום בדיווח": report.report_amount,
        "סכום התקבל": report.amount_received,
        "יתרה": report.balance,
        "תאריך דיווח אחרון": report.last_report_date || 'לא זמין',
        "מזהה הזמנה": report.order_id || 'לא זמין',
        "מספר מסמכים": report.documents_count,
        "מספר חשבוניות": report.invoices_count
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "דיווחים");
      
      // Set column widths
      const colWidths = [
        { wch: 12 }, // מזהה דיווח
        { wch: 15 }, // מספר תב"ר
        { wch: 30 }, // שם פרויקט
        { wch: 20 }, // משרד
        { wch: 12 }, // שנת בקשה
        { wch: 15 }, // סטטוס תב"ר
        { wch: 15 }, // סטטוס דיווח
        { wch: 15 }, // סכום בדיווח
        { wch: 15 }, // סכום התקבל
        { wch: 15 }, // יתרה
        { wch: 18 }, // תאריך דיווח אחרון
        { wch: 15 }, // מזהה הזמנה
        { wch: 15 }, // מספר מסמכים
        { wch: 15 }  // מספר חשבוניות
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `דיווחים_${new Date().toLocaleDateString('he-IL')}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני דיווחים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-w-full mx-auto" dir="rtl">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold text-primary">מערכת דיווחים</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            מעקב אחר דיווחי תב"רים, תשלומים וסטטוסים
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 text-xs">
            <FileSpreadsheet className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Compact Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-2 md:p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                <span className="text-xs font-medium text-red-800">לא דווחו</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-red-600">
                {dashboardStats.unreported_count}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-2 md:p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-800">ממתינים</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-yellow-600">
                {dashboardStats.reported_unpaid_count}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-2 md:p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">סכום ממתין</span>
              </div>
              <div className="text-sm md:text-lg font-bold text-blue-600">
                ₪{(dashboardStats.total_pending_amount / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-2 md:p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">סה"כ דיווחים</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-green-600">
                {reports.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact Charts - Hidden on mobile */}
      {dashboardStats && (
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                פילוח סטטוסי דיווחים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPieChart>
                  <Pie
                    data={dashboardStats.status_distribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dashboardStats.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                השוואת דיווח מול קבלה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dashboardStats.comparison_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="reported" fill="#3b82f6" name="סכום מדווח" />
                  <Bar dataKey="received" fill="#10b981" name="סכום התקבל" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact Filters */}
      <Card>
        <CardContent className="p-2 md:p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <div className="sm:col-span-2 md:col-span-2">
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-6 md:pr-8 h-8 md:h-9 text-xs md:text-sm"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="הוגש">הוגש</SelectItem>
                <SelectItem value="בטיפול">בטיפול</SelectItem>
                <SelectItem value="אושר">אושר</SelectItem>
                <SelectItem value="שולם">שולם</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ministryFilter} onValueChange={setMinistryFilter}>
              <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="משרד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המשרדים</SelectItem>
                <SelectItem value="משרד החינוך">משרד החינוך</SelectItem>
                <SelectItem value="משרד הפנים">משרד הפנים</SelectItem>
                <SelectItem value="משרד הדיגיטל">משרד הדיגיטל</SelectItem>
                <SelectItem value="משרד התקשורת">משרד התקשורת</SelectItem>
                <SelectItem value="משרד התחבורה">משרד התחבורה</SelectItem>
                <SelectItem value="משרד הגנת הסביבה">משרד הגנת הסביבה</SelectItem>
                <SelectItem value="משרד התרבות והספורט">משרד התרבות והספורט</SelectItem>
                <SelectItem value="משרד הבריאות">משרד הבריאות</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="שנה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל השנים</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>

            <Select value={advancedFilter} onValueChange={setAdvancedFilter}>
              <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="מתקדם" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="open">דיווחים פתוחים</SelectItem>
                <SelectItem value="unreported">טרם דווחו</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compact Reports Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm md:text-base">טבלת דיווחים</CardTitle>
            <div className="text-xs md:text-sm text-muted-foreground">
              מציג {filteredReports.length} מתוך {reports.length} דיווחים
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 p-1 md:p-2 min-w-[80px]"
                    onClick={() => handleSort('report_identifier')}
                  >
                    מזהה דיווח
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 p-1 md:p-2 min-w-[100px]"
                    onClick={() => handleSort('tabar_number')}
                  >
                    מספר תב"ר
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 p-1 md:p-2 min-w-[150px]"
                    onClick={() => handleSort('project_name')}
                  >
                    שם פרויקט
                  </TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[120px] hidden sm:table-cell">משרד</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[60px] hidden md:table-cell">שנה</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[100px] hidden lg:table-cell">סטטוס תב"ר</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[100px]">סטטוס דיווח</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[100px] hidden md:table-cell">סכום בדיווח</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[100px] hidden md:table-cell">סכום התקבל</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[80px]">יתרה</TableHead>
                  <TableHead className="text-right p-1 md:p-2 min-w-[60px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/50 text-xs"
                    onClick={() => handleRowClick(report)}
                  >
                    <TableCell className="text-right font-medium p-1 md:p-2">
                      {report.report_identifier}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2">
                      {report.tabar_number}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 max-w-[150px] md:max-w-[200px] truncate">
                      {report.project_name}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 max-w-[120px] md:max-w-[150px] truncate hidden sm:table-cell">
                      {report.ministry}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 hidden md:table-cell">
                      {report.request_year}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs">{report.tabar_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2">
                      {getStatusBadge(report.report_status)}
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 hidden md:table-cell">
                      <span className="text-xs">
                        {formatCurrency(report.report_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2 hidden md:table-cell">
                      <span className="text-xs">
                        {formatCurrency(report.amount_received)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2">
                      <span className={`text-xs ${report.balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                        ₪{(report.balance / 1000).toFixed(0)}K
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-1 md:p-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(report);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              פרטי דיווח {selectedReport?.report_identifier}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">פרטים כלליים</TabsTrigger>
                <TabsTrigger value="financial">פרטים כספיים</TabsTrigger>
                <TabsTrigger value="documents">מסמכים</TabsTrigger>
                <TabsTrigger value="history">היסטוריה</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">מספר תב"ר</label>
                    <p className="text-lg">{selectedReport.tabar_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">שם פרויקט</label>
                    <p className="text-lg">{selectedReport.project_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">משרד ממשלתי</label>
                    <p className="text-lg">{selectedReport.ministry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">סטטוס דיווח</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedReport.report_status)}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">סכום בדיווח</label>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(selectedReport.report_amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">סכום שהתקבל</label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedReport.amount_received)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">יתרה</label>
                    <p className={`text-xl font-bold ${selectedReport.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedReport.balance)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">מזהה הזמנה</label>
                    <p className="text-lg">{selectedReport.order_id || 'לא זמין'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {selectedReport.documents_count} מסמכים • {selectedReport.invoices_count} חשבוניות
                  </p>
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף מסמך
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    דיווח אחרון: {selectedReport.last_report_date || 'לא זמין'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 