import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, TrendingUp, Building2, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BudgetExecutionData {
  tabar_id: number;
  project_name: string;
  tabar_number: number;
  ministry_name: string;
  report_count: number;
  total_reported_amount: number;
  total_budget: number;
  execution_percent: number;
  last_report_date: string;
  report_statuses: string;
}

interface InvoiceData {
  id: number;
  invoice_number: string;
  amount: number;
  invoice_date: string;
  due_date: string;
  status: string;
  priority: string;
  project_name: string;
  tabar_number: number;
  ministry_name: string;
  supplier_name: string;
}

interface MinistryData {
  id: number;
  ministry_name: string;
  ministry_code: string;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_budget: number;
  total_executed: number;
  execution_percentage: number;
  total_reports: number;
}

interface CashFlowData {
  period: string;
  total_reported: number;
  total_received: number;
  total_reports: number;
  cash_flow_difference: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportsCenter: React.FC = () => {
  const [budgetExecutionData, setBudgetExecutionData] = useState<BudgetExecutionData[]>([]);
  const [invoicesData, setInvoicesData] = useState<InvoiceData[]>([]);
  const [ministryData, setMinistryData] = useState<MinistryData[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('budget-execution');
  
  // Filters
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ministryFilter, setMinistryFilter] = useState<string>('');

  useEffect(() => {
    fetchBudgetExecutionReport();
  }, []);

  const fetchBudgetExecutionReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/budget-execution');
      const data = await response.json();
      if (data.success) {
        setBudgetExecutionData(data.data);
      }
    } catch (error) {
      console.error('Error fetching budget execution report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', format(dateFrom, 'yyyy-MM-dd'));
      if (dateTo) params.append('date_to', format(dateTo, 'yyyy-MM-dd'));
      
      const response = await fetch(`/api/reports/invoices?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setInvoicesData(data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMinistryReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/ministry');
      const data = await response.json();
      if (data.success) {
        setMinistryData(data.data);
      }
    } catch (error) {
      console.error('Error fetching ministry report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlowReport = async (period: string = 'month') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/cash-flow?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setCashFlowData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cash flow report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          filters: {
            dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
            dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
            status: statusFilter,
            ministry: ministryFilter
          }
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // כאן תוכל להוסיף לוגיקה להורדת הקובץ
        console.log('Export successful:', data.filename);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'פיגור': 'destructive',
      'דחוף': 'secondary',
      'רגיל': 'outline'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'שולמה': 'default',
      'דווחה': 'secondary',
      'אושרה': 'outline',
      'התקבלה': 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">מרכז דיווחים</h1>
          <p className="text-muted-foreground">דיווחים מפורטים על ביצוע תקציב ופעילות פרויקטים</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport(activeTab)}>
            <Download className="w-4 h-4 ml-2" />
            ייצא לאקסל
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budget-execution" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            ביצוע תקציבי
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            חשבוניות
          </TabsTrigger>
          <TabsTrigger value="ministry" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            משרדים
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            תזרים מזומנים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget-execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>דיווח ביצוע תקציבי לפי תב"ר</CardTitle>
              <CardDescription>מעקב אחר ביצוע התקציב והתקדמות הפרויקטים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={fetchBudgetExecutionReport} disabled={loading}>
                  {loading ? 'טוען...' : 'רענן נתונים'}
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>מספר תב"ר</TableHead>
                      <TableHead>שם הפרויקט</TableHead>
                      <TableHead>משרד</TableHead>
                      <TableHead>מספר דיווחים</TableHead>
                      <TableHead>סכום דווח</TableHead>
                      <TableHead>תקציב כולל</TableHead>
                      <TableHead>אחוז ביצוע</TableHead>
                      <TableHead>דיווח אחרון</TableHead>
                      <TableHead>סטטוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetExecutionData.map((item) => (
                      <TableRow key={item.tabar_id}>
                        <TableCell className="font-medium">{item.tabar_number}</TableCell>
                        <TableCell>{item.project_name}</TableCell>
                        <TableCell>{item.ministry_name}</TableCell>
                        <TableCell>{item.report_count}</TableCell>
                        <TableCell>{formatCurrency(item.total_reported_amount)}</TableCell>
                        <TableCell>{formatCurrency(item.total_budget)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.execution_percent}%</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-blue-600 rounded-full" 
                                style={{ width: `${Math.min(item.execution_percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.last_report_date ? format(new Date(item.last_report_date), 'dd/MM/yyyy', { locale: he }) : 'אין'}
                        </TableCell>
                        <TableCell>{item.report_statuses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>דיווח חשבוניות ותשלומים</CardTitle>
              <CardDescription>מעקב אחר חשבוניות, תשלומים ותאריכי פירעון</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="status-filter">סטטוס</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">הכל</SelectItem>
                      <SelectItem value="התקבלה">התקבלה</SelectItem>
                      <SelectItem value="אושרה">אושרה</SelectItem>
                      <SelectItem value="דווחה">דווחה</SelectItem>
                      <SelectItem value="שולמה">שולמה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>מתאריך</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>עד תאריך</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={fetchInvoicesReport} disabled={loading} className="w-full">
                    {loading ? 'טוען...' : 'חפש'}
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>מספר חשבונית</TableHead>
                      <TableHead>פרויקט</TableHead>
                      <TableHead>ספק</TableHead>
                      <TableHead>סכום</TableHead>
                      <TableHead>תאריך חשבונית</TableHead>
                      <TableHead>תאריך פירעון</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>עדיפות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesData.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.project_name}</div>
                            <div className="text-sm text-muted-foreground">תב"ר {invoice.tabar_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.supplier_name}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{getPriorityBadge(invoice.priority)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ministry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>דיווח לפי משרדים</CardTitle>
              <CardDescription>סיכום פעילות ותקציבים לפי משרדי ממשלה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={fetchMinistryReport} disabled={loading}>
                  {loading ? 'טוען...' : 'רענן נתונים'}
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>משרד</TableHead>
                      <TableHead>קוד</TableHead>
                      <TableHead>סה"כ פרויקטים</TableHead>
                      <TableHead>פרויקטים פעילים</TableHead>
                      <TableHead>פרויקטים שהושלמו</TableHead>
                      <TableHead>תקציב כולל</TableHead>
                      <TableHead>בוצע</TableHead>
                      <TableHead>אחוז ביצוע</TableHead>
                      <TableHead>מספר דיווחים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ministryData.map((ministry) => (
                      <TableRow key={ministry.id}>
                        <TableCell className="font-medium">{ministry.ministry_name}</TableCell>
                        <TableCell>{ministry.ministry_code}</TableCell>
                        <TableCell>{ministry.total_projects}</TableCell>
                        <TableCell>{ministry.active_projects}</TableCell>
                        <TableCell>{ministry.completed_projects}</TableCell>
                        <TableCell>{formatCurrency(ministry.total_budget || 0)}</TableCell>
                        <TableCell>{formatCurrency(ministry.total_executed || 0)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{ministry.execution_percentage}%</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-green-600 rounded-full" 
                                style={{ width: `${Math.min(ministry.execution_percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{ministry.total_reports}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>דיווח תזרים מזומנים</CardTitle>
              <CardDescription>מעקב אחר תזרים כספי - דיווחים מול תקבולים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Button onClick={() => fetchCashFlowReport('week')} variant="outline" size="sm">
                  שבועי
                </Button>
                <Button onClick={() => fetchCashFlowReport('month')} variant="outline" size="sm">
                  חודשי
                </Button>
                <Button onClick={() => fetchCashFlowReport('year')} variant="outline" size="sm">
                  שנתי
                </Button>
              </div>
              
              {cashFlowData.length > 0 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowData.reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_reported" 
                        stroke="#3B82F6" 
                        name="סכום דווח"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total_received" 
                        stroke="#10B981" 
                        name="סכום התקבל"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsCenter; 