import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProjectStatus {
  status: string;
  count: number;
  budget: number;
  formatted_budget: string;
}

interface ProjectStatusChartProps {
  data: ProjectStatus[];
  className?: string;
}

const COLORS = {
  'פעיל': '#10B981',  // Green
  'סגור': '#6B7280',  // Gray
  'מושהה': '#F59E0B', // Yellow
  'בביצוע': '#3B82F6', // Blue
  'באיחור': '#EF4444', // Red
  'מתוכנן': '#8B5CF6', // Purple
};

const DEFAULT_COLOR = '#94A3B8'; // Slate

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({
  data,
  className = ''
}) => {
  // Prepare data for the pie chart
  const chartData = data.map(item => ({
    name: item.status,
    value: item.count,
    budget: item.budget,
    formatted_budget: item.formatted_budget,
    color: COLORS[item.status as keyof typeof COLORS] || DEFAULT_COLOR
  }));

  const totalProjects = data.reduce((sum, item) => sum + item.count, 0);
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            פרויקטים: {data.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            תקציב: {data.formatted_budget}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            אחוז: {((data.value / totalProjects) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderActiveShape = (props: any) => {
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent
    } = props;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text 
          x={x} 
          y={y} 
          fill={fill} 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-xs font-medium"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">סטטוס פרויקטים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              אין נתונים להצגה
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-right">סטטוס פרויקטים</CardTitle>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>סה"כ: {totalProjects} פרויקטים</span>
          <span>תקציב: ₪{totalBudget.toLocaleString('he-IL')}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {data.slice(0, 4).map((item, index) => (
            <div 
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.status}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {item.count} פרויקטים
                  </div>
                </div>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ 
                    backgroundColor: COLORS[item.status as keyof typeof COLORS] || DEFAULT_COLOR 
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {item.formatted_budget}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for active sector
const Sector = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }: any) => {
  return (
    <g>
      <path
        d={`M ${cx} ${cy} L ${cx + innerRadius * Math.cos(-startAngle * Math.PI / 180)} ${cy + innerRadius * Math.sin(-startAngle * Math.PI / 180)} A ${innerRadius} ${innerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${cx + innerRadius * Math.cos(-endAngle * Math.PI / 180)} ${cy + innerRadius * Math.sin(-endAngle * Math.PI / 180)} Z`}
        fill={fill}
      />
    </g>
  );
}; 