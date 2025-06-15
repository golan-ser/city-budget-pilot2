import express from 'express';
import multer from 'multer';
import {
  getAllTabarim,
  getTabarDetails,
  createTabar,
  updateTabar,
  addFundingSource,
  addPermission,
  addDocument,
} from '../controllers/tabarimController.js';
import { extractTextFromPdf } from '../util/pdfOcr.js';
import { parsePermissionText } from '../util/parsePermissionText.js';

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

// שליפת כל התב"רים
router.get('/', getAllTabarim);

// שליפת תב"ר בודד
router.get('/:id', getTabarDetails);

// יצירת תב"ר חדש
router.post('/', upload.none(), createTabar);

// עדכון תב"ר קיים
router.put('/:id', upload.none(), updateTabar);

// הוספת מקור מימון
router.post('/:id/funding', upload.none(), addFundingSource);

// הוספת הרשאה
router.post('/:id/permission', upload.none(), addPermission);

// הוספת מסמכים – כולל כל שדות הקבצים האפשריים
router.post('/:id/document', upload.fields([
  { name: 'permission_file', maxCount: 1 },
  { name: 'approval_file', maxCount: 1 },
  { name: 'extra_file_1', maxCount: 1 },
  { name: 'extra_file_2', maxCount: 1 },
  { name: 'extra_file_3', maxCount: 1 }
]), addDocument);

// העלאת קובץ ל-OCR
router.post('/ocr', upload.single('file'), async (req, res) => {
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
