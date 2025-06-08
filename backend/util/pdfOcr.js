import fs from 'fs';
import pdf from 'pdf-parse';
// אפשר למחוק את Tesseract בשלב זה אם אין OCR על תמונות (כרגע לא מממשים OCR על עמודים סרוקים)

export async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const pdfData = await pdf(dataBuffer);
    // אם יש טקסט קריא – מחזיר אותו
    if (pdfData.text && pdfData.text.length > 20) return pdfData.text;
    // אם לא מצא טקסט (כלומר PDF סרוק), מחזיר ריק
    return '';
  } catch (err) {
    // במקרה של שגיאה, מחזיר ריק
    return '';
  }
}
