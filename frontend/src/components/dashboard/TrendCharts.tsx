import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface TrendData {
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
}

interface BudgetByMinistry {
  ministry: string;
  total_authorized: number;
  total_executed: number;
  formatted_authorized: string;
  formatted_executed: string;
  utilization_percentage: number;
}

interface TrendChartsProps {
  data: TrendData;
  budgetByMinistry?: BudgetByMinistry[];
  type?: 'default' | 'ministry-comparison' | 'monthly-execution';
  className?: string;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  data,
  budgetByMinistry = [],
  type = 'default',
  className = ''
}) => {
  const [timeRange, setTimeRange] = useState<'monthly' | 'quarterly'>('monthly');

  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {(payload || []).map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}: {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value: number) => `₪${value.toLocaleString('he-IL')}`;
  const formatNumber = (value: number) => value.toLocaleString('he-IL');

  // גרף עמודות - תקציב מול ביצוע לפי משרד
  if (type === 'ministry-comparison') {
    if (!budgetByMinistry?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            אין נתוני משרדים להצגה
          </p>
        </div>
      );
    }

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={budgetByMinistry} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="ministry" 
              className="text-xs"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 11 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              content={(props) => {
                if (props.active && props.payload && props.payload.length) {
                  const data = props.payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">
                        {data.ministry}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-blue-600">תקציב מאושר:</span>
                          <span className="text-sm font-medium">{data.formatted_authorized}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-green-600">ביצוע בפועל:</span>
                          <span className="text-sm font-medium">{data.formatted_executed}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-purple-600">אחוז ניצול:</span>
                          <span className="text-sm font-medium">{data.utilization_percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="total_authorized" 
              fill="#3B82F6" 
              name="תקציב מאושר"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="total_executed" 
              fill="#10B981" 
              name="ביצוע בפועל"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // גרף קו - מגמת ביצוע חודשי
  if (type === 'monthly-execution') {
    if (!data?.monthlyExecution?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            אין נתוני ביצוע חודשי להצגה
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyExecution}>
              <defs>
                <linearGradient id="executionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                content={(props) => {
                  if (props.active && props.payload && props.payload.length) {
                    const data = props.payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">
                          {data.month}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-indigo-600">ביצוע חודשי:</span>
                            <span className="text-sm font-medium">{data.formatted}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-gray-600">פרויקטים פעילים:</span>
                            <span className="text-sm font-medium">{data.projects}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="execution"
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#executionGradient)"
                dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#6366F1', strokeWidth: 2 }}
                name="ביצוע חודשי"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-semibold text-indigo-600">
              {(data.monthlyExecution || [])[(data.monthlyExecution || []).length - 1]?.formatted || '₪0'}
            </div>
            <div className="text-xs text-gray-600">החודש הנוכחי</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              ₪{((data.monthlyExecution || []).reduce((sum, item) => sum + (item?.execution || 0), 0) || 0).toLocaleString('he-IL')}
            </div>
            <div className="text-xs text-gray-600">סה"כ 12 חודשים</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              ₪{((data.monthlyExecution || []).length > 0 
                ? Math.round(((data.monthlyExecution || []).reduce((sum, item) => sum + (item?.execution || 0), 0) || 0) / (data.monthlyExecution || []).length) 
                : 0
              ).toLocaleString('he-IL')}
            </div>
            <div className="text-xs text-gray-600">ממוצע חודשי</div>
          </div>
        </div>
      </div>
    );
  }

  // גרף ברירת מחדל - מגמות כלליות
  if (!data || (!data.budgetUtilization?.length && !data.newProjects?.length && !data.executionReports?.length)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">מגמות ותחזיות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              אין נתוני מגמות להצגה
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-right">מגמות ותחזיות</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={timeRange === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('monthly')}
            >
              חודשי
            </Button>
            <Button
              variant={timeRange === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('quarterly')}
            >
              רבעוני
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="budget">ניצול תקציב</TabsTrigger>
            <TabsTrigger value="projects">פרויקטים חדשים</TabsTrigger>
            <TabsTrigger value="reports">דוחות ביצוע</TabsTrigger>
          </TabsList>
          
          <TabsContent value="budget" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.budgetUtilization}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="monthName" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={formatCurrency} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="סכום מנוצל"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              מגמת ניצול תקציב - 6 חודשים אחרונים
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.newProjects}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="monthName" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={formatNumber} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                    name="פרויקטים חדשים"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              מספר תב"רים שנפתחו - 6 חודשים אחרונים
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.executionReports}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="monthName" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={formatCurrency} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 6, fill: '#F59E0B' }}
                    name="סכום דיווחים"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              סכום דוחות ביצוע - 6 חודשים אחרונים
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};