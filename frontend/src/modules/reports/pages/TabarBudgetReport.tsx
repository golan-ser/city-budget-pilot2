import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TabarItem {
  id: number;
  tabar_number: string;
  name: string;
  year: number;
  status: string;
  department: string;
  ministry: string;
  total_authorized: number;
  open_date: string;
  close_date: string;
  permission_number: string;
  created_at: string;
  municipal_participation: number;
  additional_funders: string;
}

// Dynamic filter options will be generated from actual data

export default function TabarBudgetReport() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<any>({});
  const [data, setData] = useState<TabarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{key: string | null, direction: 'asc' | 'desc'}>({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState<any>({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev: any) => ({
      ...prev,
      [column]: value === 'all' || value === '' ? undefined : value
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
    setColumnFilters({});
    setGlobalSearch('');
  };

  const sortedAndFilteredData = useMemo(() => {
    let filteredData = [...data];

    // Apply global search
    if (globalSearch) {
      filteredData = filteredData.filter(item => 
        item.tabar_number.toString().includes(globalSearch) ||
        item.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.ministry.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.permission_number?.toLowerCase().includes(globalSearch.toLowerCase())
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, value]) => {
      if (value && value !== 'all') {
        filteredData = filteredData.filter(item => {
          if (column === 'tabar_number') {
            return item.tabar_number.toString().includes(value as string);
          }
          if (column === 'name') {
            return item.name.toLowerCase().includes((value as string).toLowerCase());
          }
          if (column === 'permission_number') {
            return item.permission_number?.toLowerCase().includes((value as string).toLowerCase());
          }
          if (column === 'total_authorized') {
            return item.total_authorized >= Number(value);
          }
          if (column === 'open_date') {
            const itemDate = new Date(item.open_date).toISOString().split('T')[0];
            return itemDate === value;
          }
          if (column === 'close_date') {
            const itemDate = new Date(item.close_date).toISOString().split('T')[0];
            return itemDate === value;
          }
          if (column === 'created_at') {
            const itemDate = new Date(item.created_at).toISOString().split('T')[0];
            return itemDate === value;
          }
          if (column === 'year') {
            return item.year.toString() === value;
          }
          if (column === 'status') {
            return item.status === value;
          }
          if (column === 'ministry') {
            return item.ministry === value;
          }
          return (item as any)[column] === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = (a as any)[sortConfig.key!];
        let bValue = (b as any)[sortConfig.key!];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }, [data, sortConfig, columnFilters, globalSearch]);

  const totalBudget = useMemo(() => {
    return sortedAndFilteredData.reduce((sum, item) => {
      const amount = Number(item.total_authorized) || 0;
      return sum + amount;
    }, 0);
  }, [sortedAndFilteredData]);

  // Generate dynamic filter options from actual data
  const filterOptions = useMemo(() => {
    const years = [...new Set(data.map(item => item.year))].filter(Boolean).sort((a, b) => b - a);
    const statuses = [...new Set(data.map(item => item.status))].filter(Boolean).sort();
    const ministries = [...new Set(data.map(item => item.ministry))].filter(Boolean).sort();
    
    return {
      years: years.map(String),
      statuses,
      ministries
    };
  }, [data]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '0 ₪';
    return new Intl.NumberFormat('he-IL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ₪';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const exportAsPDF = async () => {
    if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }

    try {
      setExportingPDF(true);
      
      // בניית URL עם פרמטרים
      const params = new URLSearchParams();
      
      // הוספת פילטרי עמודות
      Object.keys(columnFilters).forEach(key => {
        if (columnFilters[key]) {
          params.append(key, columnFilters[key]);
        }
      });
      
      // הוספת חיפוש גלובלי
      if (globalSearch) {
        params.append('search', globalSearch);
      }
      
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/reports/tabar-budget/export-pdf?${params.toString()}`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tabar-budget-report-${new Date().getTime()}.pdf`;
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

  const exportAsExcel = () => {
    if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }

    const exportData = sortedAndFilteredData.map(row => ({
      "מספר תב\"ר": row.tabar_number,
      "שם פרויקט": row.name,
      "שנה": row.year,
      "סטטוס": row.status,
      "משרד": row.ministry,
      "תקציב מאושר": row.total_authorized,
      "תאריך פתיחה": formatDate(row.open_date),
      "תאריך סגירה": formatDate(row.close_date),
      "מספר הרשאה": row.permission_number || '-',
      "תאריך יצירה": formatDate(row.created_at)
    }));

    // Add summary row
    exportData.push({
      "מספר תב\"ר": '',
      "שם פרויקט": '',
      "שנה": '',
      "סטטוס": '',
      "משרד": 'סה"כ:',
      "תקציב מאושר": totalBudget,
      "תאריך פתיחה": '',
      "תאריך סגירה": '',
      "מספר הרשאה": '',
      "תאריך יצירה": `${sortedAndFilteredData.length} תב"רים`
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח תב\"רים");
    XLSX.writeFile(workbook, "tabar_budget_report.xlsx");
  };

  useEffect(() => {
    setLoading(true);
          fetch(`/api/report-schemas/run`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
      },
      body: JSON.stringify({
        module: "tabarim",
        fields: [
          "id", "tabar_number", "name", "year", "status", "ministry", 
          "total_authorized", "open_date", "close_date", "permission_number", 
          "created_at", "department", "municipal_participation", "additional_funders"
        ],
        filters: filters
      })
    })
      .then(res => res.json())
      .then(response => {
        console.log('Server response:', response);
        let rows = [];
        if (Array.isArray(response)) {
          rows = response;
        } else if (response && Array.isArray(response.data)) {
          rows = response.data;
        } else if (response && Array.isArray(response.results)) {
          rows = response.results;
        } else {
          console.warn('Unexpected response format:', response);
          rows = [];
        }
        // Clean and format the data
        const cleanedRows = rows.map((row: any) => ({
          ...row,
          total_authorized: Number(row.total_authorized) || 0,
          year: Number(row.year) || 0,
          status: row.status || '',
          ministry: row.ministry || '',
          name: row.name || ''
        }));
        console.log('Cleaned data:', cleanedRows);
        setData(cleanedRows);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setData([]);
        setLoading(false);
      });
  }, [filters]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-lg">טוען נתונים...</div>
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="p-6 text-center">
      <div className="text-lg text-gray-500">לא נמצאו תוצאות.</div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/reports')}
          className="p-1 h-auto"
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          דוחות
        </Button>
        <span>›</span>
        <span className="font-medium text-gray-900">דוח תב"רים</span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-blue-800">דוח תב"רים</h1>
        <p className="text-gray-600">סיכום תב"רים לפי משרד, סטטוס ושנה</p>
        <div className="text-sm text-gray-500">
          מציג {sortedAndFilteredData.length} מתוך {data.length} תוצאות
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        {/* Global Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש חופשי..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Export and Filter Controls */}
        <div className="flex flex-wrap gap-2">
          <Button variant="default" onClick={exportAsExcel} className="bg-green-600 hover:bg-green-700 text-white">
            ייצוא Excel
          </Button>
          <Button 
            variant="default" 
            onClick={exportAsPDF} 
            disabled={exportingPDF}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {exportingPDF ? 'מייצא...' : 'ייצוא PDF'}
          </Button>
          
          {(Object.keys(columnFilters).some(key => columnFilters[key]) || globalSearch) && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <Filter className="h-4 w-4 ml-2" />
              נקה כל הסינונים
            </Button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שנה</label>
            <Select value={columnFilters.year?.toString() || 'all'} onValueChange={(value) => handleColumnFilter('year', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="הכל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {filterOptions.years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
            <Select value={columnFilters.status?.toString() || 'all'} onValueChange={(value) => handleColumnFilter('status', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="הכל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {filterOptions.statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">משרד</label>
            <Select value={columnFilters.ministry?.toString() || 'all'} onValueChange={(value) => handleColumnFilter('ministry', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="הכל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {filterOptions.ministries.map(ministry => (
                  <SelectItem key={ministry} value={ministry}>{ministry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תקציב מינימלי</label>
            <Input
              placeholder="0"
              type="number"
              value={columnFilters.total_authorized || ''}
              onChange={(e) => handleColumnFilter('total_authorized', e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-2 text-right font-semibold min-w-[80px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('tabar_number')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    תב"ר
                    <SortIcon column="tabar_number" />
                  </Button>
                </th>
                <th className="p-2 text-right font-semibold min-w-[150px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    פרויקט
                    <SortIcon column="name" />
                  </Button>
                </th>
                <th className="p-2 text-right font-semibold min-w-[60px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('year')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    שנה
                    <SortIcon column="year" />
                  </Button>
                </th>
                <th className="p-2 text-right font-semibold min-w-[80px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    סטטוס
                    <SortIcon column="status" />
                  </Button>
                </th>
                <th className="p-2 text-right font-semibold min-w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('ministry')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    משרד
                    <SortIcon column="ministry" />
                  </Button>
                </th>
                <th className="p-2 text-right font-semibold min-w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('total_authorized')}
                    className="flex items-center gap-1 font-semibold text-xs p-1"
                  >
                    תקציב
                    <SortIcon column="total_authorized" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    לא נמצאו תוצאות התואמות לקריטריונים שנבחרו
                  </td>
                </tr>
              ) : (
                sortedAndFilteredData.map((row, index) => (
                  <tr key={row.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-2 font-medium text-blue-900 text-sm">{row.tabar_number}</td>
                    <td className="p-2 max-w-[200px] truncate text-sm" title={row.name}>{row.name}</td>
                    <td className="p-2 text-center text-sm">{row.year}</td>
                    <td className="p-2">
                      <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                        row.status === 'פעיל' ? 'bg-green-100 text-green-800' :
                        row.status === 'סגור' ? 'bg-red-100 text-red-800' :
                        row.status === 'אושר' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm truncate max-w-[120px]" title={row.ministry}>{row.ministry}</td>
                    <td className="p-2 font-semibold text-blue-700 text-left text-sm">
                      {formatCurrency(row.total_authorized)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Summary Row */}
            <tfoot className="bg-blue-50 border-t-2 border-blue-200">
              <tr>
                <td colSpan={4} className="p-3 font-bold text-blue-800 text-sm">
                  סה"כ ({sortedAndFilteredData.length} תב"רים)
                </td>
                <td className="p-3 font-bold text-blue-800 text-base text-left">
                  {formatCurrency(totalBudget)}
                </td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
