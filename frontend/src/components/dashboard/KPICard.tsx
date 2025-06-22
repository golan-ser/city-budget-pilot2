import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  subtitle?: string;
  trend?: number[];
  percentage?: number;
  progress?: number;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color = 'blue',
  subtitle,
  trend,
  percentage,
  progress,
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

  const getColorClasses = (colorName: string) => {
    const colors = {
      blue: {
        bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
        icon: 'text-blue-600 dark:text-blue-400',
        gradient: 'from-blue-500/10'
      },
      green: {
        bg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
        icon: 'text-green-600 dark:text-green-400',
        gradient: 'from-green-500/10'
      },
      orange: {
        bg: 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20',
        icon: 'text-orange-600 dark:text-orange-400',
        gradient: 'from-orange-500/10'
      },
      purple: {
        bg: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
        icon: 'text-purple-600 dark:text-purple-400',
        gradient: 'from-purple-500/10'
      },
      red: {
        bg: 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
        icon: 'text-red-600 dark:text-red-400',
        gradient: 'from-red-500/10'
      }
    };
    return colors[colorName] || colors.blue;
  };

  const colorClasses = getColorClasses(color);

  return (
    <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses.bg}`}>
              <div className={colorClasses.icon}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
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

          {/* Progress bar for utilization or custom progress */}
          {(percentage !== undefined || progress !== undefined) && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percentage || progress)}`}
                style={{ width: `${Math.min(percentage || progress || 0, 100)}%` }}
              />
              {(percentage || progress || 0) > 100 && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  חריגה: {(percentage || progress || 0) - 100}%
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Gradient overlay for visual appeal */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${colorClasses.gradient} to-transparent rounded-bl-3xl`} />
    </Card>
  );
}; 