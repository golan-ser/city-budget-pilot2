import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  DollarSign,
  Calendar,
  Users,
  ArrowLeft,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    tabar_number: string;
    status: string;
    department: string;
    year: number;
    total_budget?: number;
    used_budget?: number;
    utilization_percent?: number;
    description?: string;
    last_report_days?: number;
  };
  compact?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, compact = false }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פעיל': return 'bg-green-100 text-green-800';
      case 'בתכנון': return 'bg-blue-100 text-blue-800';
      case 'הסתיים': return 'bg-gray-100 text-gray-800';
      case 'מושהה': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₪0';
    }
    return `₪${amount.toLocaleString()}`;
  };

  const hasAlert = () => {
    const utilizationPercent = project.utilization_percent || 0;
    const lastReportDays = project.last_report_days || 0;
    return lastReportDays > 90 || utilizationPercent > 95;
  };

  // Safe fallbacks for undefined values
  const safeUtilizationPercent = project.utilization_percent || 0;
  const safeTotalBudget = project.total_budget || 0;
  const safeUsedBudget = project.used_budget || 0;
  const safeName = project.name || 'פרויקט ללא שם';
  const safeTabarNumber = project.tabar_number || 'ללא מספר';
  const safeStatus = project.status || 'לא הוגדר';
  const safeDepartment = project.department || 'לא הוגדר';
  const safeYear = project.year || 'לא הוגדר';
  const safeDescription = project.description || 'אין תיאור זמין';

  return (
    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${compact ? 'h-48' : ''}`}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={compact ? "text-base mb-1" : "text-lg mb-1"}>
              {safeName}
            </CardTitle>
            <div className="text-sm text-gray-600 mb-2">{safeTabarNumber}</div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(safeStatus)}>
                {safeStatus}
              </Badge>
              {hasAlert() && (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2" : "space-y-4"}>
        {!compact && (
          <div className="text-sm text-gray-600">
            {safeDescription}
          </div>
        )}
        
        <div className={compact ? "space-y-1" : "space-y-2"}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {safeDepartment}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {safeYear}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(safeTotalBudget)}
            </span>
            <span className={`font-medium ${getUtilizationColor(safeUtilizationPercent)}`}>
              {safeUtilizationPercent}% נוצל
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>התקדמות תקציבית</span>
              <span>{formatCurrency(safeUsedBudget)} / {formatCurrency(safeTotalBudget)}</span>
            </div>
            <Progress value={safeUtilizationPercent} className="h-2" />
          </div>
        </div>
        
        {!compact && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <Eye className="w-4 h-4 ml-2" />
              צפה בפרטים
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/tabar/${project.id}`)}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              תב״ר
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard; 