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
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface AddMilestoneModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (milestoneData: MilestoneFormData) => Promise<void>;
  tabarNumber: string;
}

interface MilestoneFormData {
  title: string;
  responsible: string;
  start_date: string;
  due_date: string;
  notes: string;
}

interface FormErrors {
  title?: string;
  responsible?: string;
  start_date?: string;
  due_date?: string;
  dateRange?: string;
  notes?: string;
}

const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  open,
  onClose,
  onSave,
  tabarNumber
}) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    responsible: '',
    start_date: '',
    due_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate required fields
    if (!formData.title.trim()) {
      newErrors.title = 'שם אבן הדרך הוא שדה חובה';
    } else if (formData.title.length > 100) {
      newErrors.title = 'שם אבן הדרך לא יכול להיות יותר מ-100 תווים';
    } else if (/[<>\"'&]/.test(formData.title)) {
      newErrors.title = 'שם אבן הדרך מכיל תווים אסורים';
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'אחראי אבן הדרך הוא שדה חובה';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'תאריך התחלה הוא שדה חובה';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'תאריך סיום הוא שדה חובה';
    }

    // Validate date range
    if (formData.start_date && formData.due_date) {
      const startDateObj = new Date(formData.start_date);
      const endDateObj = new Date(formData.due_date);
      
      if (endDateObj <= startDateObj) {
        newErrors.dateRange = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
      }
    }

    // Validate notes length
    if (formData.notes.length > 500) {
      newErrors.notes = 'הערות לא יכולות להיות יותר מ-500 תווים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof MilestoneFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDateChange = (field: 'start_date' | 'due_date', date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, [field]: dateString }));
      
      if (field === 'start_date') {
        setStartDate(date);
      } else {
        setEndDate(date);
      }

      // Clear date-related errors
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
      if (errors.dateRange) {
        setErrors(prev => ({ ...prev, dateRange: undefined }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error saving milestone:', error);
      // Handle error - could show toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      responsible: '',
      start_date: '',
      due_date: '',
      notes: ''
    });
    setErrors({});
    setStartDate(undefined);
    setEndDate(undefined);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            הוספת אבן דרך
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right block font-medium">
              שם אבן הדרך <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="לדוגמה: קבלת היתר בניה"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={cn(
                "text-right",
                errors.title && "border-red-500 focus:border-red-500"
              )}
              maxLength={100}
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          {/* Responsible Field */}
          <div className="space-y-2">
            <Label htmlFor="responsible" className="text-right block font-medium">
              אחראי אבן הדרך <span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsible"
              placeholder="שם האחראי"
              value={formData.responsible}
              onChange={(e) => handleInputChange('responsible', e.target.value)}
              className={cn(
                "text-right",
                errors.responsible && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.responsible && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.responsible}</span>
              </div>
            )}
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-right block font-medium">
                תאריך התחלה <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !startDate && "text-muted-foreground",
                      errors.start_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.start_date}</span>
                </div>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-right block font-medium">
                תאריך סיום <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !endDate && "text-muted-foreground",
                      errors.due_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => handleDateChange('due_date', date)}
                    disabled={(date) => startDate ? date <= startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.due_date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date Range Error */}
          {errors.dateRange && (
            <div className="flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.dateRange}</span>
            </div>
          )}

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block font-medium">
              הערות (אופציונלי)
            </Label>
            <Textarea
              id="notes"
              placeholder="הערות נוספות על אבן הדרך..."
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMilestoneModal; 