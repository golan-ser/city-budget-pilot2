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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

interface Document {
  id: string;
  tabar_number: string;
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

interface TabarDocumentsProps {
  tabarId: string | number;
  documents?: any[];
  onUploadDocument?: (category: string) => void;
  onDocumentsChange?: () => void;
  readonly?: boolean;
}

const TabarDocuments: React.FC<TabarDocumentsProps> = ({ 
  tabarId, 
  documents: initialDocuments = [],
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
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${API_ENDPOINTS.TABARIM}/${tabarId}/documents`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tabarId && isOpen) {
      fetchDocuments();
    }
  }, [tabarId, isOpen]);

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
    (window as any).refreshTabarDocuments = refreshDocuments;
  }, []);

  // חישוב מספר המסמכים לכל קטגוריה
  const categoriesWithCounts = documentCategories.map(category => ({
    ...category,
    count: documents.filter(doc => doc.type === category.type).length
  }));

  // פונקציה לפתיחה/סגירה של קטגוריה
  const toggleCategory = (categoryType: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryType)) {
      newExpanded.delete(categoryType);
    } else {
      newExpanded.add(categoryType);
    }
    setExpandedCategories(newExpanded);
  };

  // פונקציה לעיצוב סכום כסף
  const formatMoney = (amount: number | undefined) => {
    if (!amount) return '';
    return `${amount.toLocaleString('he-IL')} ₪`;
  };

  // פונקציה לעיצוב תאריך
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL');
    } catch {
      return dateString;
    }
  };

  // פונקציה להעלאת מסמך
  const handleUploadClick = (categoryType: string) => {
    if (onUploadDocument) {
      onUploadDocument(categoryType);
    }
  };

  // פונקציה לצפייה במסמך
  const handleViewDocument = (document: Document) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  // פונקציה להדפסת מסמך
  const handlePrintDocument = (document: Document) => {
    if (document.file_url) {
      const printWindow = window.open(document.file_url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" dir="rtl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" dir="rtl">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">שגיאה בטעינת המסמכים</h4>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchDocuments}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" dir="rtl">
      {/* כותרת המודול */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">מסמכי התב"ר</h3>
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
              const isExpanded = expandedCategories.has(category.type);
              const categoryDocuments = documents.filter(doc => doc.type === category.type);
              const IconComponent = category.icon;

              return (
                <div key={category.type} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* כותרת הקטגוריה */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleCategory(category.type)}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {category.count}
                      </span>
                      
                      {!readonly && (
                        <div
                          className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick(category.type);
                          }}
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* תוכן הקטגוריה */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {categoryDocuments.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          אין מסמכים בקטגוריה זו
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {categoryDocuments.map((document) => (
                            <div key={document.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {document.title}
                                  </h5>
                                  <div className="mt-1 flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                                    <span>{formatDate(document.date)}</span>
                                    {document.supplier && <span>ספק: {document.supplier}</span>}
                                    {document.amount && <span>{formatMoney(document.amount)}</span>}
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2 space-x-reverse">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      document.reported 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {document.reported ? 'דווח' : 'לא דווח'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => handleViewDocument(document)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="צפייה במסמך"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePrintDocument(document)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                    title="הדפסת מסמך"
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

export default TabarDocuments;
