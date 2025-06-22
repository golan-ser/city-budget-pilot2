import { Router } from 'express';
import {
  getEnhancedTabarimReport,
  getBudgetLinesReport,
  getStatusInformation
} from '../controllers/enhancedReportsController.js';

const router = Router();

// �� דוח תב"רים משופר עם השדות החדשים
router.get('/enhanced-tabarim', getEnhancedTabarimReport);

// 📁 דוח תתי־סעיפים תקציביים
router.get('/budget-lines', getBudgetLinesReport);

// 📚 מידע על סטטוסים
router.get('/status-info', getStatusInformation);

export default router; 