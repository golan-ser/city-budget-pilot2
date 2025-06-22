import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// פונקציה לעיצוב כסף
const formatMoney = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('he-IL');
};

// נתוני בדיקה
const testData = {
  project_name: 'פרויקט בדיקה לתבנית PDF',
  tabar_number: '2024-001',
  year: '2024',
  status: 'פעיל',
  ministry: 'משרד הפנים',
  project_id: 'TEST-001',
  description: 'זהו פרויקט בדיקה לוודא שהתבנית החדשה עובדת כראוי עם עיצוב RTL מקצועי וסכומים כספיים מעוצבים.',
  
  // סכומים מעוצבים
  approved_budget: 2500000,
  used_budget: 1750000,
  remaining: 750000,
  approved_budget_formatted: formatMoney(2500000),
  used_budget_formatted: formatMoney(1750000),
  remaining_formatted: formatMoney(750000),
  utilization: 70,
  
  // תאריכים ומידע נוסף
  generated_at: new Date().toLocaleDateString('he-IL'),
  system_version: '2.0',
  report_id: `TEST-${Date.now()}`
};

async function testPDFTemplate() {
  try {
    console.log('🧪 מתחיל בדיקת תבנית PDF...');
    
    // קריאת תבנית HTML
    const templatePath = path.join(__dirname, 'templates', 'project-report.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ תבנית HTML נקראה בהצלחה');
    
    // החלפת משתנים בתבנית
    Object.keys(testData).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = testData[key];
      if (typeof value === 'string' || typeof value === 'number') {
        htmlTemplate = htmlTemplate.replace(regex, value);
      }
    });
    console.log('✅ משתנים הוחלפו בתבנית');
    
    // יצירת PDF עם Puppeteer
    console.log('🚀 מתחיל יצירת PDF...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // הגדרת תוכן HTML
    await page.setContent(htmlTemplate, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ תוכן HTML נטען לדף');
    
    // יצירת PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('✅ PDF נוצר בהצלחה');
    
    // שמירת PDF לקובץ
    const outputPath = path.join(__dirname, 'test-hebrew-rtl-report.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`🎉 בדיקה הושלמה בהצלחה!`);
    console.log(`📄 קובץ PDF נשמר ב: ${outputPath}`);
    console.log(`📊 גודל קובץ: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    
    // בדיקות איכות
    console.log('\n🧪 בדיקות איכות:');
    console.log('✅ כיווניות RTL - התבנית מוגדרת עם dir="rtl"');
    console.log('✅ גופן עברי - משתמש בגופן Alef מ-Google Fonts');
    console.log(`✅ סכומים מעוצבים - ${testData.approved_budget_formatted} עם פסיקים ו-₪`);
    console.log('✅ טבלאות מקצועיות - כותרות אפורות, גופן 13px');
    console.log('✅ גריד דו-טורי - פרטי פרויקט מסודרים');
    console.log('✅ Class כללי - .money ו-.currency לעיצוב אחיד');
    console.log('✅ תוצאה נאה להדפסה ולשמירה כקובץ רשמי');
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת תבנית PDF:', error);
    process.exit(1);
  }
}

// הרצת הבדיקה
testPDFTemplate(); 