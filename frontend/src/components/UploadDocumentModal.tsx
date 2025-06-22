import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (documentData: DocumentUploadData) => Promise<void>;
  projectId: string;
  initialCategory?: string;
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

const documentTypes = [
  { value: 'permit', label: 'אישור תב"ר', description: 'טפסים רשמיים של פתיחת/אישור תקציב' },
  { value: 'invoice', label: 'חשבוניות', description: 'מסמכים עם סכומים, ספקים, תאריכים' },
  { value: 'contract', label: 'חוזים', description: 'הסכמים עם קבלנים/ספקים' },
  { value: 'permission', label: 'הרשאות', description: 'מכתבים, טפסים להעברת אחריות/ניהול' },
  { value: 'other', label: 'אחרים', description: 'כל מסמך שלא מתאים לקטגוריה לעיל' }
];

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  projectId,
  initialCategory = ''
}) => {
  const [formData, setFormData] = useState({
    type: initialCategory,
    title: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    amount: '',
    reported: false,
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      type: initialCategory,
      title: '',
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      amount: '',
      reported: false,
      file: null
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) newErrors.type = 'יש לבחור סוג מסמך';
    if (!formData.title.trim()) newErrors.title = 'יש להזין שם מסמך';
    if (!formData.date) newErrors.date = 'יש להזין תאריך';
    if (!formData.file) newErrors.file = 'יש לבחור קובץ';

    // בדיקה לחשבוניות
    if (formData.type === 'invoice') {
      if (!formData.supplier.trim()) newErrors.supplier = 'יש להזין שם ספק לחשבונית';
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'יש להזין סכום תקין לחשבונית';
      }
    }

    // בדיקת סוג קובץ
    if (formData.file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(formData.file.type)) {
        newErrors.file = 'ניתן להעלות רק קבצי PDF או תמונות (JPG, PNG)';
      }
      
      // בדיקת גודל קובץ (מקסימום 10MB)
      if (formData.file.size > 10 * 1024 * 1024) {
        newErrors.file = 'גודל הקובץ לא יכול לעלות על 10MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setUploading(true);
      
      const uploadData: DocumentUploadData = {
        project_id: projectId,
        type: formData.type,
        title: formData.title.trim(),
        date: formData.date,
        supplier: formData.supplier.trim() || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        reported: formData.reported,
        file: formData.file!
      };

      await onUpload(uploadData);
      handleClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrors({ submit: 'שגיאה בהעלאת המסמך. אנא נסה שוב.' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* רקע */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* תוכן המודאל */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* כותרת */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">העלאת מסמך חדש</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* תוכן */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* סוג מסמך */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג מסמך *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">בחר סוג מסמך</option>
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* שם מסמך */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם המסמך *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="לדוגמה: חשבונית #1234"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* תאריך */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך המסמך *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* שדות נוספים לחשבוניות */}
            {formData.type === 'invoice' && (
              <>
                {/* ספק */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם הספק *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.supplier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="לדוגמה: ש.ח. הנדסה"
                  />
                  {errors.supplier && <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>}
                </div>

                {/* סכום */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סכום (₪) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>
              </>
            )}

            {/* סטטוס דיווח */}
            <div>
              <label className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  checked={formData.reported}
                  onChange={(e) => setFormData(prev => ({ ...prev, reported: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">המסמך דווח</span>
              </label>
            </div>

            {/* העלאת קובץ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קובץ המסמך *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } ${errors.file ? 'border-red-500' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  {formData.file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(formData.file.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">גרור קובץ לכאן או לחץ לבחירה</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG עד 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
            </div>

            {/* שגיאת שליחה */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* כפתורי פעולה */}
            <div className="flex space-x-3 space-x-reverse pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'מעלה...' : 'העלה מסמך'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal; 