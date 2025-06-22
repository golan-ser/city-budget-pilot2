import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  trend?: number[];
  percentage?: number;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  trend,
  percentage,
  className = ''
}) => {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <ArrowUpIcon className="h-3 w-3" />;
      case 'negative':
        return <ArrowDownIcon className="h-3 w-3" />;
      default:
        return <TrendingUpIcon className="h-3 w-3" />;
    }
  };

  const getProgressColor = (percent?: number) => {
    if (!percent) return 'bg-blue-500';
    if (percent > 100) return 'bg-red-500';
    if (percent > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {title}
              </p>
            </div>
          </div>
          
          {/* Mini trend chart */}
          {trend && (
            <div className="flex items-end space-x-1 h-8">
              {trend.slice(-6).map((value, index) => (
                <div
                  key={index}
                  className="bg-blue-200 dark:bg-blue-700 rounded-sm"
                  style={{
                    height: `${Math.max(4, (value / Math.max(...trend)) * 24)}px`,
                    width: '3px'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {percentage !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({percentage}%)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-1 ${getChangeColor(changeType)}`}>
              {getChangeIcon(changeType)}
              <span className="text-xs font-medium">{change}</span>
            </div>
            
            {percentage !== undefined && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                מהתקציב
              </div>
            )}
          </div>

          {/* Progress bar for utilization */}
          {percentage !== undefined && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
              {percentage > 100 && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  חריגה: {percentage - 100}%
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Gradient overlay for visual appeal */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-3xl" />
    </Card>
  );
}; 