import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  Users,
  ArrowLeft,
  Eye
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  tabar_number: number;
  year: number;
  ministry: string;
  department: string;
  total_authorized: number;
  utilized: number;
  utilization_percentage: number;
  status: string;
  open_date: string;
  close_date: string;
  permission_number: string;
  municipal_participation: number;
}

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Use the correct backend port (3000) and tabarim endpoint
        const API_URL = '';
        const response = await fetch(`${API_URL}/api/tabarim`, {
          headers: {
            'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Tabarim data received:', data); // Debug log
        console.log('First item details:', data[0]); // Debug log
        console.log('Utilization check:', {
          tabar_101: data.find(t => t.tabar_number === 101),
          all_utilized: data.map(t => ({ number: t.tabar_number, utilized: t.utilized, percentage: t.utilization_percentage }))
        });
        
        // Additional debug for tabar 101 specifically
        const tabar101 = data.find(t => t.tabar_number === 101);
        if (tabar101) {
          console.log('🎯 TABAR 101 DETAILED CHECK:', {
            id: tabar101.id,
            tabar_number: tabar101.tabar_number,
            name: tabar101.name,
            total_authorized: tabar101.total_authorized,
            utilized: tabar101.utilized,
            utilization_percentage: tabar101.utilization_percentage,
            utilized_type: typeof tabar101.utilized,
            percentage_type: typeof tabar101.utilization_percentage
          });
        } else {
          console.log('❌ TABAR 101 NOT FOUND!');
        }
        setProjects(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('שגיאה בטעינת הפרויקטים');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פעיל': return 'bg-green-100 text-green-800';
      case 'בתכנון': return 'bg-blue-100 text-blue-800';
      case 'הסתיים': return 'bg-gray-100 text-gray-800';
      case 'מושהה': return 'bg-red-100 text-red-800';
      case 'אושרה': return 'bg-purple-100 text-purple-800';
      case 'סגור': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tabar_number.toString().includes(searchTerm.toLowerCase()) ||
                         (project.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.ministry || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">טוען פרויקטים...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול פרויקטים</h1>
          <p className="text-gray-600 mt-1">ניהול ומעקב אחר פרויקטים עירוניים</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 ml-2" />
          פרויקט חדש
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="חיפוש לפי שם פרויקט, תב״ר או מחלקה..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">כל הסטטוסים</option>
                <option value="פעיל">פעיל</option>
                <option value="בתכנון">בתכנון</option>
                <option value="הסתיים">הסתיים</option>
                <option value="מושהה">מושהה</option>
                <option value="אושרה">אושרה</option>
                <option value="סגור">סגור</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {error ? (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">לא נמצאו פרויקטים התואמים לחיפוש</div>
          <div className="text-sm text-gray-400 mt-2">
            {projects.length === 0 ? 'אין פרויקטים במערכת' : `מתוך ${projects.length} פרויקטים במערכת`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                    <div className="text-sm text-gray-600 mb-2">תב"ר {project.tabar_number}</div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  {project.ministry} - {project.department || 'לא צוין'}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.department || project.ministry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {project.year}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      תקציב
                    </span>
                    <span className="font-medium">
                      {formatCurrency(project.total_authorized)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>ניצול תקציב</span>
                      <span className={`font-medium ${getUtilizationColor(project.utilization_percentage)}`}>
                        {project.utilization_percentage}%
                      </span>
                    </div>
                    <Progress value={project.utilization_percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>נוצל: {formatCurrency(project.utilized)}</span>
                      <span>יתרה: {formatCurrency(project.total_authorized - project.utilized)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    צפייה
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
