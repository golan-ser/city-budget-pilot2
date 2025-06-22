import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Eye, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface ProjectStatusData {
  status: string;
  count: number;
  percentage: number;
  total_budget: number;
  formatted_budget: string;
  color: string;
}

interface ProjectStatusChartProps {
  data: ProjectStatusData[];
  totalProjects: number;
  totalBudget: number;
  formattedTotalBudget: string;
  className?: string;
}

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({
  data = [],
  totalProjects = 0,
  totalBudget = 0,
  formattedTotalBudget = '₪0',
  className = ''
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Enhanced color palette
  const statusColors: Record<string, string> = {
    'נפתח': '#10B981', // green-500
    'אושר': '#3B82F6', // blue-500
    'סגור': '#8B5CF6', // purple-500
    'מושעה': '#F59E0B', // amber-500
    'בוטל': '#EF4444', // red-500
    'default': '#6B7280' // gray-500
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || statusColors.default;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'נפתח': return <TrendingUp className="h-4 w-4" />;
      case 'אושר': return <Eye className="h-4 w-4" />;
      case 'סגור': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {data.status}
            </h4>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">מספר פרויקטים:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">אחוז:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">תקציב כולל:</span>
              <span className="font-medium">{data.formatted_budget}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">התפלגות פרויקטים לפי סטטוס</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              אין נתוני פרויקטים להצגה
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data with colors
  const chartData = data.map(item => ({
    ...item,
    color: getStatusColor(item.status)
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-right">התפלגות פרויקטים לפי סטטוס</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalProjects}
            </div>
            <div className="text-sm text-blue-500">סה"כ פרויקטים</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {formattedTotalBudget}
            </div>
            <div className="text-sm text-green-500">תקציב כולל</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartType === 'pie' ? (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="count"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={activeIndex === index ? '#fff' : 'none'}
                        strokeWidth={activeIndex === index ? 2 : 0}
                        style={{
                          filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {chartData.map((item, index) => (
                <div 
                  key={item.status}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                    activeIndex === index ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">{item.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{item.count}</div>
                      <div className="text-xs">פרויקטים</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</div>
                      <div className="text-xs">מכלל</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{item.formatted_budget}</div>
                      <div className="text-xs">תקציב</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Bar Chart View
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="status" 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="מספר פרויקטים"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Performance indicators */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-right">מדדי ביצועים</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">פרויקטים פעילים:</span>
              <span className="font-medium">
                {(chartData.find(d => d.status === 'נפתח')?.count || 0) + 
                 (chartData.find(d => d.status === 'אושר')?.count || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">פרויקטים הושלמו:</span>
              <span className="font-medium">
                {chartData.find(d => d.status === 'סגור')?.count || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">אחוז השלמה:</span>
              <span className="font-medium">
                {totalProjects > 0 
                  ? ((chartData.find(d => d.status === 'סגור')?.count || 0) / totalProjects * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">תקציב פעיל:</span>
              <span className="font-medium">
                ₪{((chartData.find(d => d.status === 'נפתח')?.total_budget || 0) + 
                   (chartData.find(d => d.status === 'אושר')?.total_budget || 0)).toLocaleString('he-IL')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 