import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangleIcon, 
  XCircleIcon, 
  InfoIcon, 
  CheckCircleIcon,
  ChevronLeftIcon 
} from 'lucide-react';

interface Alert {
  type: 'warning' | 'error' | 'info' | 'success';
  icon: string;
  title: string;
  message: string;
  count: number;
  action?: string | null;
  projects?: any[];
  totalAmount?: number;
}

interface SmartAlertsProps {
  alerts: Alert[];
  onAlertAction?: (alert: Alert) => void;
  className?: string;
}

export const SmartAlerts: React.FC<SmartAlertsProps> = ({
  alerts,
  onAlertAction,
  className = ''
}) => {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'error':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />,
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
        };
      case 'warning':
        return {
          border: 'border-yellow-200 dark:border-yellow-800',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: <AlertTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
        };
      case 'info':
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
        };
      case 'success':
        return {
          border: 'border-green-200 dark:border-green-800',
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
          badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
        };
      default:
        return {
          border: 'border-gray-200 dark:border-gray-800',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: <InfoIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
        };
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">התראות מערכת</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              אין התראות פעילות
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
          <CardTitle className="text-right">התראות חכמות</CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.length} פעילות
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const styles = getAlertStyles(alert.type);
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${styles.border} ${styles.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {styles.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                        {alert.count > 0 && (
                          <Badge className={`text-xs ${styles.badge}`}>
                            {alert.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {alert.message}
                      </p>
                      
                      {/* Additional info for unpaid invoices */}
                      {alert.totalAmount && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          סכום כולל: ₪{alert.totalAmount.toLocaleString('he-IL')}
                        </div>
                      )}
                      
                      {/* Project details */}
                      {alert.projects && alert.projects.length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                              הצג פרטים ({alert.projects.length} פרויקטים)
                            </summary>
                            <div className="mt-2 space-y-1 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                              {alert.projects.slice(0, 3).map((project, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {project.name}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {project.number}
                                  </span>
                                </div>
                              ))}
                              {alert.projects.length > 3 && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  ועוד {alert.projects.length - 3} פרויקטים...
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action button */}
                  {alert.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlertAction?.(alert)}
                      className="mr-2 text-xs"
                    >
                      {alert.action}
                      <ChevronLeftIcon className="h-3 w-3 mr-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 