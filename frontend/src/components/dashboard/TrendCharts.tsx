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
  Area
} from 'recharts';

interface TrendData {
  budgetUtilization: Array<{
    month: string;
    monthName: string;
    value: number;
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

interface TrendChartsProps {
  data: TrendData;
  className?: string;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  data,
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
          {payload.map((entry: any, index: number) => (
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
                    yAxisId="count"
                    orientation="right"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatNumber}
                  />
                  <YAxis 
                    yAxisId="amount"
                    orientation="left"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">
                              {label}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  מספר דוחות: {data.count}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  סכום: {data.formatted}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                    name="מספר דוחות"
                  />
                  <Line
                    yAxisId="amount"
                    type="monotone"
                    dataKey="amount"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 6, fill: '#F59E0B' }}
                    name="סכום דוחות"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              דוחות ביצוע מאושרים - 6 חודשים אחרונים
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              ממוצע ניצול חודשי
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {data.budgetUtilization?.length > 0 
                ? formatCurrency(data.budgetUtilization.reduce((sum, item) => sum + item.value, 0) / data.budgetUtilization.length)
                : '₪0'
              }
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-900 dark:text-green-200">
              פרויקטים חדשים (6 חודשים)
            </div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {data.newProjects?.reduce((sum, item) => sum + item.value, 0) || 0}
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-900 dark:text-purple-200">
              דוחות ביצוע (6 חודשים)
            </div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {data.executionReports?.reduce((sum, item) => sum + item.count, 0) || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};