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
const upload = multer({ dest: 'uploads/' });

// שליפת כל התב"רים
router.get('/', getAllTabarim);

// שליפת תב"ר בודד (כולל סעיפים, תנועות, הרשאות, מימון, מסמכים)
router.get('/:id', getTabarDetails);

// יצירת תב"ר חדש
router.post('/', createTabar);

// עדכון תב"ר קיים
router.put('/:id', updateTabar);

// הוספת מקור מימון (funding)
router.post('/:id/funding', addFundingSource);

// הוספת הרשאה (permission)
router.post('/:id/permission', addPermission);

// הוספת מסמך (כולל העלאה בפועל)
router.post('/:id/document', upload.single('file'), addDocument);

// העלאת קובץ PDF וחילוץ נתונים (OCR)
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
