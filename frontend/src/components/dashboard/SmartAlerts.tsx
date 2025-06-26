import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Info,
  TrendingUp,
  Calendar,
  Building2,
  Users
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  category: 'budget' | 'reporting' | 'approval' | 'payment' | 'timeline' | 'performance';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  count?: number;
  amount?: number;
  formatted_amount?: string;
  created_at: string;
  project_id?: number;
  project_name?: string;
  tabar_number?: string;
  action_required?: boolean;
  due_date?: string;
  overdue_days?: number;
}

interface SmartAlertsProps {
  alerts: Alert[];
  className?: string;
}

export const SmartAlerts: React.FC<SmartAlertsProps> = ({
  alerts = [],
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Alert['category']>('all');

  const getAlertIcon = (type: Alert['type'], category: Alert['category']) => {
    if (category === 'budget') return DollarSign;
    if (category === 'reporting') return FileText;
    if (category === 'approval') return CheckCircle2;
    if (category === 'payment') return Building2;
    if (category === 'timeline') return Calendar;
    if (category === 'performance') return TrendingUp;
    
    switch (type) {
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle2;
      default: return AlertCircle;
    }
  };

  const getAlertColor = (type: Alert['type'], severity: Alert['severity']) => {
    if (severity === 'high') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (severity === 'medium') {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getSeverityBadgeColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: Alert['category']) => {
    switch (category) {
      case 'budget': return 'תקציב';
      case 'reporting': return 'דיווח';
      case 'approval': return 'אישורים';
      case 'payment': return 'תשלומים';
      case 'timeline': return 'לוחות זמנים';
      case 'performance': return 'ביצועים';
      default: return 'כללי';
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high': return 'דחוף';
      case 'medium': return 'בינוני';
      case 'low': return 'נמוך';
      default: return 'רגיל';
    }
  };

  const filteredAlerts = (alerts || []).filter(alert => {
    if (filter !== 'all' && alert.severity !== filter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  const alertsByCategory = (alerts || []).reduce((acc, alert) => {
    acc[alert.category] = (acc[alert.category] || 0) + 1;
    return acc;
  }, {} as Record<Alert['category'], number>);

  const alertsBySeverity = (alerts || []).reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<Alert['severity'], number>);

  if (!alerts.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            התראות חכמות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-medium">
              מצוין! אין התראות פעילות
            </p>
            <p className="text-gray-500 text-sm mt-2">
              כל המערכות פועלות כצפוי
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
          <CardTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            התראות חכמות
            <Badge variant="secondary" className="mr-2">
              {alerts.length}
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">כל הרמות</option>
              <option value="high">דחוף ({alertsBySeverity.high || 0})</option>
              <option value="medium">בינוני ({alertsBySeverity.medium || 0})</option>
              <option value="low">נמוך ({alertsBySeverity.low || 0})</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">כל הקטגוריות</option>
              <option value="budget">תקציב ({alertsByCategory.budget || 0})</option>
              <option value="reporting">דיווח ({alertsByCategory.reporting || 0})</option>
              <option value="approval">אישורים ({alertsByCategory.approval || 0})</option>
              <option value="payment">תשלומים ({alertsByCategory.payment || 0})</option>
              <option value="timeline">לוחות זמנים ({alertsByCategory.timeline || 0})</option>
              <option value="performance">ביצועים ({alertsByCategory.performance || 0})</option>
            </select>
          </div>
        </div>
        
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {alertsBySeverity.high || 0}
            </div>
            <div className="text-xs text-red-500">דחוף</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">
              {alertsBySeverity.medium || 0}
            </div>
            <div className="text-xs text-orange-500">בינוני</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {alertsBySeverity.low || 0}
            </div>
            <div className="text-xs text-blue-500">נמוך</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type, alert.category);
            
            return (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg ${getAlertColor(alert.type, alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm leading-tight">
                          {alert.title}
                        </h4>
                        
                        <Badge 
                          className={`text-xs ${getSeverityBadgeColor(alert.severity)}`}
                          variant="outline"
                        >
                          {getSeverityLabel(alert.severity)}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(alert.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        {alert.message}
                      </p>
                      
                      {/* Additional info */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        {alert.project_name && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{alert.project_name}</span>
                          </div>
                        )}
                        
                        {alert.tabar_number && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>תב"ר {alert.tabar_number}</span>
                          </div>
                        )}
                        
                        {alert.formatted_amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{alert.formatted_amount}</span>
                          </div>
                        )}
                        
                        {alert.count && alert.count > 1 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{alert.count} פרויקטים</span>
                          </div>
                        )}
                        
                        {alert.overdue_days && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>איחור {alert.overdue_days} ימים</span>
                          </div>
                        )}
                      </div>
                      
                      {alert.due_date && (
                        <div className="mt-2 text-xs text-gray-500">
                          יעד: {new Date(alert.due_date).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {alert.action_required && (
                    <Button size="sm" variant="outline" className="text-xs">
                      פעולה נדרשת
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              אין התראות המתאימות לסינון הנוכחי
            </p>
          </div>
        )}
        
        {filteredAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              מציג {filteredAlerts.length} מתוך {alerts.length} התראות
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 