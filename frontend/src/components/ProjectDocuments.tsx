import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Printer, 
  Plus,
  FileText,
  Receipt,
  FileCheck,
  Shield,
  Folder
} from 'lucide-react';

interface Document {
  id: string;
  project_id: string;
  type: 'permit' | 'invoice' | 'contract' | 'permission' | 'other';
  title: string;
  date: string;
  supplier?: string;
  amount?: number;
  reported: boolean;
  file_url: string;
  created_at: string;
}

interface DocumentCategory {
  type: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  count: number;
}

interface ProjectDocumentsProps {
  projectId: string;
  onUploadDocument?: (category: string) => void;
  onDocumentsChange?: () => void;
  readonly?: boolean;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ 
  projectId, 
  onUploadDocument,
  onDocumentsChange,
  readonly = false 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // קטגוריות מסמכים עם אייקונים ותיאורים
  const documentCategories: DocumentCategory[] = [
    {
      type: 'permit',
      name: 'אישור תב"ר',
      icon: FileText,
      description: 'טפסים רשמיים של פתיחת/אישור תקציב',
      count: 0
    },
    {
      type: 'invoice',
      name: 'חשבוניות',
      icon: Receipt,
      description: 'מסמכים עם סכומים, ספקים, תאריכים',
      count: 0
    },
    {
      type: 'contract',
      name: 'חוזים',
      icon: FileCheck,
      description: 'הסכמים עם קבלנים/ספקים',
      count: 0
    },
    {
      type: 'permission',
      name: 'הרשאות',
      icon: Shield,
      description: 'מכתבים, טפסים להעברת אחריות/ניהול',
      count: 0
    },
    {
      type: 'other',
      name: 'אחרים',
      icon: Folder,
      description: 'כל מסמך שלא מתאים לקטגוריה לעיל',
      count: 0
    }
  ];

  // טעינת מסמכים מהשרת
  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // פונקציה חדשה שנגישה מבחוץ לרענון המסמכים
  const refreshDocuments = () => {
    fetchDocuments();
    if (onDocumentsChange) {
      onDocumentsChange();
    }
  };

  // חשיפת הפונקציה לרענון מבחוץ
  useEffect(() => {
    // שמירת הפונקציה ב-window כדי שניתן יהיה לקרוא לה מבחוץ
    (window as any).refreshProjectDocuments = refreshDocuments;
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/documents/project/${projectId}`, {
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        }
      });
      if (!response.ok) {
        throw new Error('שגיאה בטעינת מסמכים');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת מסמכים');
    } finally {
      setLoading(false);
    }
  };

  // עיצוב סכום כספי
  const formatMoney = (amount: number): string => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  // עיצוב תאריך
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // קבלת מסמכים לפי קטגוריה
  const getDocumentsByCategory = (categoryType: string): Document[] => {
    return documents.filter(doc => doc.type === categoryType);
  };

  // עדכון ספירת מסמכים בקטגוריות
  const getCategoriesWithCounts = (): DocumentCategory[] => {
    return documentCategories.map(category => ({
      ...category,
      count: getDocumentsByCategory(category.type).length
    }));
  };

  // טיפול בפתיחה/סגירה של קטגוריה
  const toggleCategory = (categoryType: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryType)) {
      newExpanded.delete(categoryType);
    } else {
      newExpanded.add(categoryType);
    }
    setExpandedCategories(newExpanded);
  };

  // צפייה במסמך
  const viewDocument = (document: Document) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      alert('קובץ לא זמין');
    }
  };

  // הדפסת מסמך
  const printDocument = (document: Document) => {
    if (document.file_url) {
      const printWindow = window.open(document.file_url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      alert('קובץ לא זמין להדפסה');
    }
  };

  // העלאת מסמך חדש
  const handleUploadDocument = (categoryType: string) => {
    if (onUploadDocument) {
      onUploadDocument(categoryType);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען מסמכים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" dir="rtl">
        <div className="text-red-800 font-medium">שגיאה בטעינת מסמכים</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={fetchDocuments}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  const categoriesWithCounts = getCategoriesWithCounts();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" dir="rtl">
      {/* כותרת המודול */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">מסמכי הפרויקט</h3>
          <div className="text-sm text-gray-500">
            סה"כ {documents.length} מסמכים
          </div>
        </div>
      </div>

      {/* תוכן המודול */}
      <div className="p-6">
        {categoriesWithCounts.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">אין מסמכים</h4>
            <p className="mt-1 text-sm text-gray-500">התחל בהעלאת המסמך הראשון</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categoriesWithCounts.map((category) => {
              const categoryDocuments = getDocumentsByCategory(category.type);
              const isExpanded = expandedCategories.has(category.type);
              const IconComponent = category.icon;

              return (
                <div key={category.type} className="border border-gray-200 rounded-lg">
                  {/* כותרת הקטגוריה */}
                  <button
                    onClick={() => toggleCategory(category.type)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {category.name}
                          {category.count > 0 && (
                            <span className="mr-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {category.count}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {!readonly && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadDocument(category.type);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          title="העלה מסמך"
                        >
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* תוכן הקטגוריה */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {categoryDocuments.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <div className="text-gray-500 text-sm">אין מסמכים בקטגוריה זו</div>
                          {!readonly && (
                            <button
                              onClick={() => handleUploadDocument(category.type)}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              העלה מסמך ראשון
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {categoryDocuments.map((document) => (
                            <div key={document.id} className="px-4 py-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                {/* מידע המסמך */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-4 space-x-reverse">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        {document.title}
                                      </div>
                                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 mt-1">
                                        <span>{formatDate(document.date)}</span>
                                        {document.supplier && (
                                          <span>{document.supplier}</span>
                                        )}
                                        {document.amount && (
                                          <span className="font-medium text-gray-900">
                                            {formatMoney(document.amount)}
                                          </span>
                                        )}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          document.reported 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {document.reported ? '✅ דווח' : '❌ לא דווח'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* כפתורי פעולה */}
                                <div className="flex items-center space-x-2 space-x-reverse mr-4">
                                  <button
                                    onClick={() => viewDocument(document)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="צפה במסמך"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => printDocument(document)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="הדפס מסמך"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDocuments; 