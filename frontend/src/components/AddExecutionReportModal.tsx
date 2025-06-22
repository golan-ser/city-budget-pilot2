import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, AlertCircle, Upload, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface AddExecutionReportModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (reportData: FormData) => Promise<void>;
  tabarNumber: string;
}

interface FormErrors {
  report_date?: string;
  amount?: string;
  file?: string;
  notes?: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AddExecutionReportModal: React.FC<AddExecutionReportModalProps> = ({
  open,
  onClose,
  onSave,
  tabarNumber
}) => {
  const [formData, setFormData] = useState({
    report_date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate required fields
    if (!formData.report_date) {
      newErrors.report_date = 'תאריך הדיווח הוא שדה חובה';
    }

    if (!formData.amount) {
      newErrors.amount = 'סכום הדיווח הוא שדה חובה';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'יש להזין סכום חיובי';
      }
    }

    // Validate file if provided
    if (selectedFile) {
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        newErrors.file = 'סוג קובץ לא נתמך. נתמכים: PDF, Word, Excel, תמונות';
      }
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        newErrors.file = 'גודל הקובץ חורג מ-10MB';
      }
    }

    // Validate notes length
    if (formData.notes.length > 500) {
      newErrors.notes = 'הערות לא יכולות להיות יותר מ-500 תווים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, report_date: dateString }));
      setSelectedDate(date);

      // Clear date error
      if (errors.report_date) {
        setErrors(prev => ({ ...prev, report_date: undefined }));
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Clear file error
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: undefined }));
      }
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    handleInputChange('amount', numericValue);
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return '';
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return amount;
    return numericAmount.toLocaleString();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('tabar_number', tabarNumber);
      formDataToSend.append('report_date', formData.report_date);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('status', 'ממתין לאישור');
      formDataToSend.append('created_by', 'משתמש'); // In real app, get from auth
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      await onSave(formDataToSend);
      handleClose();
    } catch (error) {
      console.error('Error saving execution report:', error);
      // Handle error - could show toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      report_date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      notes: ''
    });
    setSelectedFile(null);
    setErrors({});
    setSelectedDate(new Date());
    setIsLoading(false);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('sheet')) return '📊';
    if (file.type.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            דיווח ביצוע תקציבי
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Date */}
          <div className="space-y-2">
            <Label className="text-right block font-medium">
              תאריך דיווח <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    errors.report_date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.report_date && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.report_date}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-right block font-medium">
              סכום שדווח <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn(
                  "text-right pl-10",
                  errors.amount && "border-red-500 focus:border-red-500"
                )}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                ₪
              </div>
            </div>
            {formData.amount && !errors.amount && (
              <div className="text-sm text-gray-600 text-right">
                {formatCurrency(formData.amount)} ₪
              </div>
            )}
            {errors.amount && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.amount}</span>
              </div>
            )}
          </div>

          {/* File Upload (Optional) */}
          <div className="space-y-2">
            <Label className="text-right block font-medium">
              קובץ מצורף (אופציונלי)
            </Label>
            <div className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors",
              errors.file && "border-red-500",
              selectedFile && "border-green-500 bg-green-50"
            )}>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="text-4xl">{getFileIcon(selectedFile)}</div>
                    <div className="font-medium text-green-700">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div className="text-sm text-blue-600">לחץ לבחירת קובץ אחר</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div className="text-lg font-medium">לחץ לבחירת קובץ</div>
                    <div className="text-sm text-gray-600">
                      חשבונית, אישור תשלום, או מסמך תומך אחר
                    </div>
                    <div className="text-xs text-gray-500">
                      PDF, Word, Excel, תמונות (עד 10MB)
                    </div>
                  </div>
                )}
              </label>
            </div>
            {errors.file && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.file}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block font-medium">
              הערות (אופציונלי)
            </Label>
            <Textarea
              id="notes"
              placeholder="לדוגמה: כולל תשלום לספק X על שלב א'"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="text-right min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 text-left">
              {formData.notes.length}/500 תווים
            </div>
            {errors.notes && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.notes}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'שומר...' : 'שמור דיווח'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExecutionReportModal; 