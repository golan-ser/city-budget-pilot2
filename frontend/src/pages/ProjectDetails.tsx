import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  ArrowRight, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Target,
  Upload,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import AddMilestoneModal from '../components/AddMilestoneModal';
import AddDocumentModal from '../components/AddDocumentModal';
import AddExecutionReportModal from '../components/AddExecutionReportModal';
import ProjectDocuments from '../components/ProjectDocuments';
import UploadDocumentModal from '../components/UploadDocumentModal';

interface Project {
  id: number;
  name: string;
  tabar_number: string;
  status: string;
  department: string;
  year: number;
  total_budget: number;
  used_budget: number;
  remaining_budget: number;
  utilization_percent: number;
  funding_sources: FundingSource[];
  milestones: Milestone[];
  reports: Report[];
  documents: Document[];
  description: string;
  start_date: string;
  end_date: string;
  contacts: Contact[];
}

interface FundingSource {
  id: number;
  source_name: string;
  amount: number;
  percentage: number;
}

interface Milestone {
  id: number;
  title: string;
  due_date: string;
  status: string;
  responsible: string;
  completion_percent: number;
}

interface Report {
  id: number;
  report_date: string;
  amount: number;
  status: string;
  notes: string;
}

interface Document {
  id: number;
  type: string;
  name: string;
  required: boolean;
  upload_date: string | null;
  status: string;
}

interface Contact {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string;
}

interface DocumentUploadData {
  project_id: string;
  type: string;
  title: string;
  date: string;
  supplier?: string;
  amount?: number;
  reported: boolean;
  file: File;
}

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [executionReports, setExecutionReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('budget');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [uploadDocumentCategory, setUploadDocumentCategory] = useState('');
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch main project data
        const projectResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${id}`, {
          headers: {
            'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
          }
        });
        if (!projectResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch project milestones
        try {
          const milestonesResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/milestones?tabar_number=${id}`, {
            headers: {
              'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
            }
          });
          if (milestonesResponse.ok) {
            const milestonesData = await milestonesResponse.json();
            setMilestones(milestonesData);
          }
        } catch (err) {
          console.log('No milestones found for this project');
        }

        // Fetch project documents
        try {
          const documentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/documents?tabar_number=${id}`, {
            headers: {
              'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
            }
          });
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            setDocuments(documentsData);
          }
        } catch (err) {
          console.log('No documents found for this project');
        }

        // Fetch execution reports
        try {
          const reportsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/execution?tabar_number=${id}`, {
            headers: {
              'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
            }
          });
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            setExecutionReports(reportsData);
          }
        } catch (err) {
          console.log('No execution reports found for this project');
        }

        // Fetch smart analytics
        try {
          const analyticsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/analytics`, {
            headers: {
              'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
            }
          });
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);
            console.log('📊 Analytics loaded:', analyticsData);
          }
        } catch (err) {
          console.log('No analytics available for this project');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('שגיאה בטעינת פרטי הפרויקט');
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פעיל': return 'bg-green-100 text-green-800';
      case 'הסתיים': return 'bg-blue-100 text-blue-800';
      case 'מושהה': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'הושלם': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'בתהליך': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'לא התחיל': return <XCircle className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₪0';
    }
    return `₪${amount.toLocaleString()}`;
  };

  const handleAddMilestone = async (milestoneData: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: JSON.stringify({
          ...milestoneData,
          tabar_number: id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add milestone');
      }

      const newMilestone = await response.json();
      setMilestones(prev => [...prev, newMilestone]);
      setShowAddMilestone(false);
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('שגיאה בהוספת אבן הדרך');
    }
  };

  const openAddMilestoneModal = () => {
    setShowAddMilestone(true);
  };

  const handleAddDocument = async (documentData: FormData) => {
    try {
      documentData.append('tabar_number', id || '');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: documentData,
      });

      if (!response.ok) {
        throw new Error('Failed to add document');
      }

      const newDocument = await response.json();
      setDocuments(prev => [...prev, newDocument]);
      setShowAddDocument(false);
    } catch (error) {
      console.error('Error adding document:', error);
      alert('שגיאה בהוספת המסמך');
    }
  };

  const openAddDocumentModal = () => {
    setShowAddDocument(true);
  };

  const handleAddReport = async (reportData: FormData) => {
    try {
      reportData.append('tabar_number', id || '');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/execution`, {
        method: 'POST',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: reportData,
      });

      if (!response.ok) {
        throw new Error('Failed to add report');
      }

      const newReport = await response.json();
      setExecutionReports(prev => [...prev, newReport]);
      setShowAddReport(false);
    } catch (error) {
      console.error('Error adding report:', error);
      alert('שגיאה בהוספת הדיווח');
    }
  };

  const openAddReportModal = () => {
    setShowAddReport(true);
  };

  // פונקציה חדשה לטיפול בהעלאת מסמכים למודול המתקדם
  const handleUploadDocument = async (documentData: DocumentUploadData) => {
    try {
      const formData = new FormData();
      formData.append('type', documentData.type);
      formData.append('title', documentData.title);
      formData.append('date', documentData.date);
      formData.append('reported', documentData.reported.toString());
      formData.append('file', documentData.file);
      formData.append('tabar_number', id || '');
      
      if (documentData.supplier) {
        formData.append('supplier', documentData.supplier);
      }
      if (documentData.amount) {
        formData.append('amount', documentData.amount.toString());
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/project/${id}`, {
        method: 'POST',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const result = await response.json();
      console.log('Document uploaded successfully:', result);
      
      // עדכון מיידי של רשימת המסמכים
      await refreshDocuments();
      
      // רענון המודול החדש
      if ((window as any).refreshProjectDocuments) {
        (window as any).refreshProjectDocuments();
      }
      
      // סגירת המודל
      setShowUploadDocument(false);
      
      // הודעת הצלחה
      alert('המסמך הועלה בהצלחה!');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`שגיאה בהעלאת המסמך: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
      throw error;
    }
  };

  // פונקציה חדשה לרענון המסמכים
  const refreshDocuments = async () => {
    try {
      // רענון מסמכים מהמודול הישן
      const documentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/documents?tabar_number=${id}`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        }
      });
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
      }
    } catch (err) {
      console.error('Error refreshing documents:', err);
    }
  };

  const openUploadDocumentModal = (category: string) => {
    setUploadDocumentCategory(category);
    setShowUploadDocument(true);
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/export-pdf`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `project-${id}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('שגיאה בייצוא PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/analytics`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <Button onClick={() => navigate('/projects')}>חזור לרשימת הפרויקטים</Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-600 text-xl mb-4">פרויקט לא נמצא</div>
        <Button onClick={() => navigate('/projects')}>חזור לרשימת הפרויקטים</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזור לפרויקטים</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 space-x-reverse mt-2">
              <span className="text-gray-600">תב"ר: {project.tabar_number}</span>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <span className="text-gray-600">{project.department}</span>
              <span className="text-gray-600">שנת {project.year}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button 
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex items-center space-x-2 space-x-reverse"
          >
            {exportingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>מייצא...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>ייצא PDF</span>
              </>
            )}
          </Button>
          <Button onClick={refreshAnalytics} variant="outline">
            רענן נתונים
          </Button>
        </div>
      </div>

      {/* Budget Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>סיכום תקציבי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(project.total_budget)}
              </div>
              <div className="text-sm text-gray-600">תקציב מאושר</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(project.used_budget)}
              </div>
              <div className="text-sm text-gray-600">תקציב מנוצל</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(project.remaining_budget)}
              </div>
              <div className="text-sm text-gray-600">יתרה</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {project.utilization_percent}%
              </div>
              <div className="text-sm text-gray-600">אחוז ניצול</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>התקדמות תקציבית</span>
              <span>{project.utilization_percent}%</span>
            </div>
            <Progress value={project.utilization_percent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="budget">תקציב ומקורות</TabsTrigger>
          <TabsTrigger value="milestones">אבני דרך</TabsTrigger>
          <TabsTrigger value="reports">דיווחים</TabsTrigger>
          <TabsTrigger value="documents">מסמכים</TabsTrigger>
          <TabsTrigger value="general">ניהול כללי</TabsTrigger>
        </TabsList>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>מקורות מימון</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3">מקור</th>
                      <th className="text-right p-3">סכום</th>
                      <th className="text-right p-3">אחוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(project.funding_sources || []).map((source) => (
                      <tr key={source.id} className="border-b">
                        <td className="p-3">{source.source_name}</td>
                        <td className="p-3">{formatCurrency(source.amount)}</td>
                        <td className="p-3">{source.percentage}%</td>
                      </tr>
                    ))}
                    <tr className="border-b-2 border-gray-400 font-bold">
                      <td className="p-3">סה"כ</td>
                      <td className="p-3">{formatCurrency(project.total_budget)}</td>
                      <td className="p-3">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span>תאריך אישור תב"ר:</span>
                  <span>{new Date(project.start_date).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between">
                  <span>מאזן פתיחה:</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>אבני דרך ({milestones.length})</CardTitle>
                <Button size="sm" onClick={openAddMilestoneModal}>
                  הוסף אבן דרך
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>לא הוגדרו אבני דרך לפרויקט זה</p>
                  <Button 
                    className="mt-4" 
                    size="sm"
                    onClick={openAddMilestoneModal}
                  >
                    הוסף אבן דרך ראשונה
                  </Button>
                </div>
              ) : (
                milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getMilestoneStatusIcon(milestone.status)}
                        <h3 className="font-semibold">{milestone.title}</h3>
                      </div>
                      <Badge variant="outline">{milestone.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">תאריך יעד: </span>
                        <span>{milestone.due_date ? new Date(milestone.due_date).toLocaleDateString('he-IL') : 'לא הוגדר'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">אחראי: </span>
                        <span>{milestone.responsible || 'לא הוגדר'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">אחוז ביצוע: </span>
                        <span>{milestone.completion_percent || 0}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={milestone.completion_percent || 0} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>דיווחי ביצוע ({executionReports.length})</CardTitle>
              <Button size="sm" onClick={openAddReportModal}>
                דווח חדש
              </Button>
            </CardHeader>
            <CardContent>
              {executionReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>לא נמצאו דיווחי ביצוע לפרויקט זה</p>
                  <Button className="mt-4" size="sm" onClick={openAddReportModal}>הוסף דיווח ראשון</Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-3">תאריך דיווח</th>
                          <th className="text-right p-3">סכום מדווח</th>
                          <th className="text-right p-3">סטטוס</th>
                          <th className="text-right p-3">הערות</th>
                          <th className="text-right p-3">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executionReports.map((report) => (
                          <tr key={report.id} className="border-b">
                            <td className="p-3">{report.report_date ? new Date(report.report_date).toLocaleDateString('he-IL') : 'לא הוגדר'}</td>
                            <td className="p-3">{formatCurrency(report.amount)}</td>
                            <td className="p-3">
                              <Badge variant={report.status === 'אושר' ? 'default' : 'outline'}>
                                {report.status}
                              </Badge>
                            </td>
                            <td className="p-3">{report.notes || 'אין הערות'}</td>
                            <td className="p-3">
                              <Button size="sm" variant="outline">ערוך</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold">
                      סה"כ סכום מדווח: {formatCurrency(executionReports.reduce((sum, r) => sum + (r.amount || 0), 0))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab - המודול החדש */}
        <TabsContent value="documents">
          <ProjectDocuments
            projectId={id || ''}
            onUploadDocument={openUploadDocumentModal}
            onDocumentsChange={refreshDocuments}
            readonly={false}
          />
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>ניהול כללי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* תיאור הפרויקט */}
              <div>
                <h3 className="font-semibold mb-2">תיאור הפרויקט</h3>
                <p className="text-gray-700">
                  {project?.description || 'לא הוגדר תיאור לפרויקט זה'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* תאריכים */}
                <div>
                  <h3 className="font-semibold mb-2">תאריכים</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>תאריך התחלה:</span>
                      <span>
                        {project?.start_date && project.start_date !== '1970-01-01' 
                          ? new Date(project.start_date).toLocaleDateString('he-IL')
                          : 'לא הוגדר'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>תאריך סיום מתוכנן:</span>
                      <span>
                        {project?.end_date && project.end_date !== '1970-01-01' 
                          ? new Date(project.end_date).toLocaleDateString('he-IL')
                          : 'לא הוגדר'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* נתונים כמותיים */}
                <div>
                  <h3 className="font-semibold mb-2">נתונים כמותיים</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>אבני דרך:</span>
                      <span>{analytics?.activity?.milestones_count || milestones.length} פעילות</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מסמכים:</span>
                      <span>{analytics?.activity?.documents_count || documents.length} קבצים</span>
                    </div>
                    <div className="flex justify-between">
                      <span>דיווחי ביצוע:</span>
                      <span>{analytics?.activity?.reports_count || executionReports.length} דיווחים</span>
                    </div>
                    <div className="flex justify-between">
                      <span>עסקאות:</span>
                      <span>{analytics?.activity?.transactions_count || 0} תנועות</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* אנשי קשר */}
              <div>
                <h3 className="font-semibold mb-2">אנשי קשר</h3>
                <div className="space-y-2">
                  {(project?.contacts || []).length > 0 ? (
                    project.contacts.map((contact) => (
                      <div key={contact.id} className="text-sm">
                        <div className="font-medium">{contact.role}: {contact.name}</div>
                        <div className="text-gray-600">{contact.email} | {contact.phone}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">לא הוגדרו אנשי קשר</div>
                  )}
                </div>
              </div>

              {/* סטטוס תקציב דינמי */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  סטטוס תקציב מתקדם
                </h3>
                <div className="space-y-3">
                  {analytics?.financial && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {analytics.financial.utilization_percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-700">אחוז ניצול</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            ₪{analytics.financial.utilized_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">מנוצל</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-orange-600">
                            ₪{analytics.financial.remaining_budget.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">יתרה</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-700">
                            {analytics.overall_health_score}/100
                          </div>
                          <div className="text-sm text-gray-600">ציון בריאות</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>התקדמות תקציבית</span>
                          <span>{analytics.financial.utilization_percentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={analytics.financial.utilization_percentage} 
                          className={`h-3 ${
                            analytics.financial.utilization_percentage >= 90 ? 'bg-red-100' :
                            analytics.financial.utilization_percentage >= 65 ? 'bg-yellow-100' : 'bg-green-100'
                          }`} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* התראות חכמות */}
              {analytics?.alerts && analytics.alerts.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    התראות חכמות
                  </h3>
                  <div className="space-y-3">
                    {analytics.alerts.map((alert: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddMilestoneModal
        open={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        onSave={handleAddMilestone}
        tabarNumber={id || ''}
      />

      <AddDocumentModal
        open={showAddDocument}
        onClose={() => setShowAddDocument(false)}
        onSave={handleAddDocument}
        tabarNumber={id || ''}
      />

      <AddExecutionReportModal
        open={showAddReport}
        onClose={() => setShowAddReport(false)}
        onSave={handleAddReport}
        tabarNumber={id || ''}
      />

      <UploadDocumentModal
        isOpen={showUploadDocument}
        onClose={() => setShowUploadDocument(false)}
        onUpload={handleUploadDocument}
        projectId={id || ''}
        initialCategory={uploadDocumentCategory}
      />
    </div>
  );
};

export default ProjectDetails; 