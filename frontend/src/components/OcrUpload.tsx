import express from 'express';
import multer from 'multer';
import { getAllTabarim, getTabarDetails } from '../controllers/tabarimController.js';
import { extractTextFromPdf } from '../util/pdfOcr.js';
import { parsePermissionText } from '../util/parsePermissionText.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// שליפת כל התב"רים
router.get('/', getAllTabarim);

// שליפת תב"ר בודד (כולל סעיפים, תנועות, הרשאות)
router.get('/:id', getTabarDetails);

// ראוט OCR - העלאת קובץ PDF וחילוץ נתונים
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
