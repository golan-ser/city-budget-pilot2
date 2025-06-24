import express from 'express';
import multer from 'multer';
import {
  getAllTabarim,
  getTabarDetails,
  createTabar,
  updateTabar,
  addTabarItem,
  updateTabarItem,
  deleteTabarItem,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addFundingSource,
  addPermission,
  addDocument,
  exportTabarimPDF,
  getTabarDocuments,
  createTabarDocument,
  updateTabarDocument,
  deleteTabarDocument
} from '../controllers/tabarimController.js';
import { extractTextFromPdf } from '../util/pdfOcr.js';
import { parsePermissionText } from '../util/parsePermissionText.js';
// 🔐 SECURITY: Import authentication middleware
import auth from '../middleware/auth.js';

const router = express.Router();

// הגדרת multer עם אחסון בקבצים
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 🔐 SECURITY: All routes require authentication
// שליפת כל התב"רים
router.get('/', auth, getAllTabarim);

// ייצוא PDF לרשימת תב"רים
router.get('/export-pdf', auth, exportTabarimPDF);

// שליפת תב"ר בודד
router.get('/:id', auth, getTabarDetails);

// יצירת תב"ר חדש
router.post('/', auth, upload.none(), createTabar);

// עדכון תב"ר קיים
router.put('/:id', auth, upload.none(), updateTabar);

// ניהול פריטי תקציב
router.post('/:id/items', auth, upload.none(), addTabarItem);
router.put('/items/:itemId', auth, upload.none(), updateTabarItem);
router.delete('/items/:itemId', auth, deleteTabarItem);

// ניהול תנועות כספיות
router.post('/:id/transactions', auth, upload.none(), addTransaction);
router.put('/transactions/:transactionId', auth, upload.none(), updateTransaction);
router.delete('/transactions/:transactionId', auth, deleteTransaction);

// הוספת מקור מימון
router.post('/:id/funding', auth, upload.none(), addFundingSource);

// הוספת הרשאה
router.post('/:id/permission', auth, upload.none(), addPermission);

// הוספת מסמכים – כולל כל שדות הקבצים האפשריים
router.post('/:id/document', auth, upload.fields([
  { name: 'permission_file', maxCount: 1 },
  { name: 'approval_file', maxCount: 1 },
  { name: 'extra_file_1', maxCount: 1 },
  { name: 'extra_file_2', maxCount: 1 },
  { name: 'extra_file_3', maxCount: 1 }
]), addDocument);

// ניהול מסמכי תב"ר - endpoints חדשים
router.get('/:id/documents', auth, getTabarDocuments);
router.post('/:id/documents', auth, upload.single('file'), createTabarDocument);
router.put('/documents/:documentId', auth, upload.single('file'), updateTabarDocument);
router.delete('/documents/:documentId', auth, deleteTabarDocument);

// העלאת קובץ ל-OCR
router.post('/ocr', auth, upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const text = await extractTextFromPdf(filePath);
    const extracted = parsePermissionText(text);
    res.json(extracted);
  } catch (err) {
    res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

export default router;
