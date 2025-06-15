import fs from 'fs';
import pdf from 'pdf-parse';
import { convert } from 'pdf-poppler';
import Tesseract from 'tesseract.js';
import path from 'path';
import os from 'os';

// פונקציה שממירה PDF לטקסט, ואם אין – עושה OCR
export async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);

  // ננסה לחלץ טקסט "חי" מה-PDF
  try {
    const pdfData = await pdf(dataBuffer);
    if (pdfData.text && pdfData.text.length > 20) return pdfData.text;
  } catch (err) {
    console.warn('pdf-parse error:', err.message);
  }

  // אין טקסט? נריץ OCR על כל עמוד!
  try {
    const outDir = path.join(os.tmpdir(), 'pdf_ocr_' + Date.now());
    fs.mkdirSync(outDir, { recursive: true });

    // המרת כל עמודי ה־PDF לתמונות
    await convert(filePath, {
      format: 'png',
      out_dir: outDir,
      out_prefix: 'page',
      // אפשר להוסיף page: מספר_עמוד כדי לבחור עמוד מסוים
    });

    // אסוף כל קבצי התמונות שנוצרו
    const imageFiles = fs.readdirSync(outDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(outDir, f));

    if (!imageFiles.length) throw new Error("No images were generated from PDF");

    let fullText = '';
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      console.log('🔍 OCR עמוד', i+1, '...');
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'heb+eng',
        { logger: m => (m.status === 'recognizing text') && console.log('OCR', m.progress * 100, '%') }
      );
      fullText += text + '\n\n';
    }

    // ניקוי קבצים זמניים
    imageFiles.forEach(f => fs.unlinkSync(f));
    fs.rmdirSync(outDir);

    return fullText;
  } catch (err) {
    console.error("OCR failed:", err.message);
    return '';
  }
}
